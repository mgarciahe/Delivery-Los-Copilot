/**
 * =============================================================================
 * BACKEND: menus_backend.js
 * Rol: Desarrollador Backend Senior
 * Tecnología: Node.js, Express, MySQL (mysql2/promise)
 * Propósito: API REST para la sección de Menús con cálculo de semáforo de precios
 * =============================================================================
 */

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la conexión a MySQL usando Pool de Conexiones (Best Practice)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Coloca tu contraseña de MySQL aquí
    database: process.env.DB_NAME || 'delivery_los_copilot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ Pool de conexiones de MySQL inicializado correctamente.');
} catch (error) {
    console.error('❌ Error al inicializar el pool de conexiones de MySQL:', error.message);
}

// Middleware
app.use(express.json());
// Servir archivos estáticos del frontend (HTML, CSS, JS cliente)
app.use(express.static(path.join(__dirname)));

/**
 * API: Obtener todos los restaurantes
 * GET /api/restaurantes
 */
app.get('/api/restaurantes', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, direccion, telefono, distancia_km, tiempo_entrega_min, activo FROM restaurantes WHERE activo = 1 ORDER BY nombre ASC'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener restaurantes:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al consultar restaurantes.' });
    }
});

/**
 * API: Obtener platillos con cálculo de semáforo de precios por categoría
 * GET /api/platillos
 * Parámetros opcionales de búsqueda:
 *  - buscar: Filtra por coincidencia en nombre del platillo
 *  - categoria: Filtra por categoría exacta (combos, antojos, postres)
 */
app.get('/api/platillos', async (req, res) => {
    try {
        const { buscar, categoria } = req.query;
        let queryParams = [];

        // Consulta SQL Avanzada y Optimizado por el DBA:
        // 1. Obtiene los límites (mínimos y máximos) de precio de platillos por cada categoría de forma ultra eficiente (gracias al índice idx_categoria_precio).
        // 2. Hace un JOIN con la tabla de platillos y restaurantes para mapear los registros y calcular el color del semáforo.
        // 3. Aplica filtros dinámicos si se especifican (búsqueda o categoría).
        let sql = `
            SELECT 
                p.id,
                p.nombre AS platillo_nombre,
                p.descripcion AS platillo_descripcion,
                -- Convertimos a número en JS para evitar floats flotantes si es necesario, 
                -- pero el tipo DECIMAL de MySQL garantiza la precisión exacta en la base de datos.
                CAST(p.precio AS DECIMAL(10,2)) AS precio,
                p.categoria,
                p.disponible,
                r.nombre AS restaurante_nombre,
                r.distancia_km,
                r.tiempo_entrega_min,
                CASE 
                    WHEN p.precio = lims.min_precio THEN 'Verde' -- Más accesible
                    WHEN p.precio = lims.max_precio THEN 'Rojo'  -- Más caro
                    ELSE 'Amarillo'                              -- Intermedio
                END AS semaforo_color
            FROM platillos p
            INNER JOIN restaurantes r ON p.id_restaurante = r.id
            INNER JOIN (
                -- Subconsulta optimizada que agrupa por categoría para obtener límites
                SELECT 
                    categoria, 
                    MIN(precio) AS min_precio, 
                    MAX(precio) AS max_precio 
                FROM platillos 
                WHERE disponible = 1
                GROUP BY categoria
            ) lims ON p.categoria = lims.categoria
            WHERE p.disponible = 1 AND r.activo = 1
        `;

        if (buscar) {
            sql += ` AND (p.nombre LIKE ? OR p.descripcion LIKE ?)`;
            queryParams.push(`%${buscar}%`, `%${buscar}%`);
        }

        if (categoria) {
            sql += ` AND p.categoria = ?`;
            queryParams.push(categoria);
        }

        sql += ` ORDER BY p.categoria ASC, p.precio ASC`;

        const [rows] = await pool.query(sql, queryParams);
        
        // Mapeo nativo de tipos booleanos (TINYINT(1) -> Boolean en JS por el driver)
        // El driver mysql2 mapea automáticamente campos TINYINT(1) como booleanos (true/false) o números (1/0).
        // Nos aseguramos de forzar el mapeo booleano si es necesario.
        const platillosMapeados = rows.map(row => ({
            ...row,
            disponible: !!row.disponible
        }));

        res.json({ success: true, data: platillosMapeados });
    } catch (error) {
        console.error('Error al obtener platillos:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al consultar platillos.' });
    }
});

// Ruta por defecto para servir el frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'menu.html'));
});

// Inicializar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`💡 Para probar el backend con MySQL, asegúrate de haber ejecutado schema.sql en tu base de datos.`);
});

module.exports = app; // Exportable para testing
