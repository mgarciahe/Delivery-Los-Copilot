/**
 * =============================================================================
 * BACKEND: menus_backend.js
 * Rol: Desarrollador Backend Senior
 * Tecnología: Node.js, Express, MySQL (mysql2/promise)
 * Propósito: API REST para la sección de Menús y administración del Proveedor
 * =============================================================================
 */

// Cargar variables de entorno (soporta tanto ejecución directa como montaje modular)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('./auth_middleware'); // Middleware de validación JWT (auth_middleware.js)

const router = express.Router();
const PORT = process.env.PORT || 3000;

// Configuración de la conexión a MySQL usando Pool de Conexiones (Best Practice)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'delivery_los_copilot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ Pool de conexiones de MySQL inicializado correctamente en menus_backend.');
    
    // Probar conexión de inmediato de forma asíncrona para diagnosticar errores de credenciales/puerto/servicio
    (async () => {
        try {
            const connection = await pool.getConnection();
            console.log('✅ Conexión de prueba a MySQL establecida con éxito.');
            connection.release();
        } catch (dbError) {
            console.error('❌ ERROR CRÍTICO al conectar con MySQL en el arranque:');
            console.error('Mensaje:', dbError.message);
            console.error('Código de error:', dbError.code);
            console.error('Asegúrate de que el servidor MySQL local esté encendido y que las credenciales en .env sean correctas.');
        }
    })();
} catch (error) {
    console.error('❌ Error al inicializar el pool de conexiones de MySQL:', error.message);
}

/**
 * =============================================================================
 * ENDPOINTS PÚBLICOS (CONSUMIDOS POR CLIENTES)
 * =============================================================================
 */

/**
 * API: Obtener todos los restaurantes activos
 * GET /api/restaurantes
 */
router.get('/api/restaurantes', async (req, res) => {
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
 */
router.get('/api/platillos', async (req, res) => {
    try {
        const { buscar, categoria } = req.query;
        let queryParams = [];

        let sql = `
            SELECT 
                p.id,
                p.nombre AS platillo_nombre,
                p.descripcion AS platillo_descripcion,
                CAST(p.precio AS DECIMAL(10,2)) AS precio,
                p.categoria,
                p.disponible,
                r.nombre AS restaurante_nombre,
                r.distancia_km,
                r.tiempo_entrega_min,
                CASE 
                    WHEN p.precio = lims.min_precio THEN 'Verde'
                    WHEN p.precio = lims.max_precio THEN 'Rojo'
                    ELSE 'Amarillo'
                END AS semaforo_color
            FROM platillos p
            INNER JOIN restaurantes r ON p.id_restaurante = r.id
            INNER JOIN (
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


/**
 * =============================================================================
 * ENDPOINTS DEL PROVEEDOR (REGISTRO Y AUTENTICACIÓN)
 * =============================================================================
 */

/**
 * API: Registro de Restaurantes (Proveedores)
 * POST /api/provider/register
 */
router.post('/api/provider/register', async (req, res) => {
    const { nombre, direccion, telefono, email, password, distancia_km, tiempo_entrega_min } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, email y password son obligatorios.'
        });
    }

    try {
        const [existing] = await pool.query('SELECT id FROM restaurantes WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado por otro restaurante.'
            });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const dist = distancia_km !== undefined ? distancia_km : (Math.random() * 5).toFixed(1);
        const tiempo = tiempo_entrega_min !== undefined ? tiempo_entrega_min : Math.floor(Math.random() * 30) + 10;

        const [result] = await pool.query(
            `INSERT INTO restaurantes (nombre, direccion, telefono, email, password, distancia_km, tiempo_entrega_min, activo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [nombre, direccion || null, telefono || null, email, passwordHash, dist, tiempo]
        );

        res.status(201).json({
            success: true,
            message: 'Restaurante registrado exitosamente.',
            data: {
                id: result.insertId,
                nombre,
                email,
                distancia_km: dist,
                tiempo_entrega_min: tiempo
            }
        });
    } catch (error) {
        console.error('❌ Error en el registro de restaurante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al procesar el registro.'
        });
    }
});

/**
 * API: Inicio de Sesión de Proveedores (Generación de JWT)
 * POST /api/provider/login
 */
router.post('/api/provider/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y password son campos requeridos.'
        });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, email, password, activo FROM restaurantes WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas. Correo electrónico o contraseña incorrectos.'
            });
        }

        const restaurante = rows[0];

        if (!restaurante.activo) {
            return res.status(403).json({
                success: false,
                message: 'Este restaurante se encuentra inactivo. Contacte al administrador.'
            });
        }

        const match = await bcrypt.compare(password, restaurante.password);
        if (!match) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas. Correo electrónico o contraseña incorrectos.'
            });
        }

        const jwtSecret = process.env.JWT_SECRET || 'super_secret_key_de_delivery_copilot_2026';
        const token = jwt.sign(
            { id: restaurante.id, nombre: restaurante.nombre, email: restaurante.email },
            jwtSecret,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            message: 'Autenticación exitosa.',
            token,
            restaurante: {
                id: restaurante.id,
                nombre: restaurante.nombre,
                email: restaurante.email
            }
        });
    } catch (error) {
        console.error('❌ Error en el login de restaurante:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor durante el inicio de sesión.'
        });
    }
});


/**
 * =============================================================================
 * ENDPOINTS SEGUROS DE ADMINISTRACIÓN DE MENÚS (MULTI-TENANCY)
 * =============================================================================
 */

/**
 * API: Obtener platillos del propio restaurante (Protegido)
 * GET /api/provider/menus
 */
router.get('/api/provider/menus', auth, async (req, res) => {
    const id_restaurante = req.proveedor.id;

    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, descripcion, CAST(precio AS DECIMAL(10,2)) AS precio, categoria, disponible FROM platillos WHERE id_restaurante = ? ORDER BY creado_en DESC',
            [id_restaurante]
        );
        
        const platillosMapeados = rows.map(row => ({
            ...row,
            disponible: !!row.disponible
        }));

        res.json({ success: true, data: platillosMapeados });
    } catch (error) {
        console.error('Error al obtener platillos del proveedor:', error);
        res.status(500).json({ success: false, message: 'Error interno al consultar platillos.' });
    }
});

/**
 * API: Crear Platillo (Menú)
 * POST /api/provider/menus
 */
router.post('/api/provider/menus', auth, async (req, res) => {
    const { nombre, descripcion, precio, categoria, disponible } = req.body;
    const id_restaurante = req.proveedor.id;

    if (!nombre || precio === undefined || !categoria) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, precio y categoria son obligatorios.'
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO platillos (id_restaurante, nombre, descripcion, precio, categoria, disponible) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id_restaurante, nombre, descripcion || null, precio, categoria, disponible !== undefined ? disponible : 1]
        );

        res.status(201).json({
            success: true,
            message: 'Platillo agregado al menú correctamente.',
            data: {
                id: result.insertId,
                id_restaurante,
                nombre,
                descripcion,
                precio,
                categoria,
                disponible: disponible !== undefined ? !!disponible : true
            }
        });
    } catch (error) {
        console.error('Error al insertar platillo:', error);
        res.status(500).json({ success: false, message: 'Error interno al registrar el platillo.' });
    }
});

/**
 * API: Modificar Platillo (Menú)
 * PUT /api/provider/menus/:id
 */
router.put('/api/provider/menus/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, categoria, disponible } = req.body;
    const id_restaurante = req.proveedor.id; // Extraído del token JWT

    if (!nombre || precio === undefined || !categoria) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, precio y categoria son obligatorios.'
        });
    }

    try {
        // Validación obligatoria de que el platillo pertenezca al restaurante autenticado (seguridad entre proveedores)
        const [result] = await pool.query(
            `UPDATE platillos 
             SET nombre = ?, descripcion = ?, precio = ?, categoria = ?, disponible = ? 
             WHERE id = ? AND id_restaurante = ?`,
            [nombre, descripcion || null, precio, categoria, disponible !== undefined ? disponible : 1, id, id_restaurante]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Platillo no encontrado o no autorizado para realizar modificaciones en este restaurante.'
            });
        }

        res.json({
            success: true,
            message: 'Platillo modificado exitosamente.',
            data: { id, nombre, descripcion, precio, categoria, disponible: !!disponible }
        });
    } catch (error) {
        console.error('Error al modificar platillo:', error);
        res.status(500).json({ success: false, message: 'Error interno al modificar el platillo.' });
    }
});

/**
 * API: Eliminar Platillo (Menú)
 * DELETE /api/provider/menus/:id
 */
router.delete('/api/provider/menus/:id', auth, async (req, res) => {
    const { id } = req.params;
    const id_restaurante = req.proveedor.id; // Extraído del token JWT

    try {
        // Validación obligatoria de que el platillo pertenezca al restaurante autenticado (seguridad entre proveedores)
        const [result] = await pool.query(
            'DELETE FROM platillos WHERE id = ? AND id_restaurante = ?',
            [id, id_restaurante]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Platillo no encontrado o no autorizado para ser eliminado por este restaurante.'
            });
        }

        res.json({
            success: true,
            message: 'Platillo eliminado del menú exitosamente.'
        });
    } catch (error) {
        console.error('Error al eliminar platillo:', error);
        res.status(500).json({ success: false, message: 'Error interno al eliminar el platillo.' });
    }
});


/**
 * =============================================================================
 * ENDPOINTS SEGUROS DE PEDIDOS Y REPORTES ANALÍTICOS (PROVEEDOR)
 * =============================================================================
 */

/**
 * API: Listar pedidos recibidos por el restaurante autenticado
 * GET /api/provider/orders
 */
router.get('/api/provider/orders', auth, async (req, res) => {
    const id_restaurante = req.proveedor.id;

    try {
        const sql = `
            SELECT 
                p.id AS pedido_id, 
                p.cliente_nombre, 
                p.direccion_entrega, 
                p.telefono_cliente, 
                CAST(p.total AS DECIMAL(10,2)) AS total, 
                p.estado, 
                p.creado_en,
                dp.id AS detalle_id, 
                dp.cantidad, 
                CAST(dp.precio_unitario AS DECIMAL(10,2)) AS precio_unitario,
                pl.nombre AS platillo_nombre
            FROM pedidos p
            LEFT JOIN detalle_pedidos dp ON p.id = dp.id_pedido
            LEFT JOIN platillos pl ON dp.id_platillo = pl.id
            WHERE p.id_restaurante = ?
            ORDER BY p.creado_en DESC
        `;

        const [rows] = await pool.query(sql, [id_restaurante]);

        const ordenesMap = {};

        rows.forEach(row => {
            if (!ordenesMap[row.pedido_id]) {
                ordenesMap[row.pedido_id] = {
                    id: row.pedido_id,
                    cliente_nombre: row.cliente_nombre,
                    direccion_entrega: row.direccion_entrega,
                    telefono_cliente: row.telefono_cliente,
                    total: row.total,
                    estado: row.estado,
                    creado_en: row.creado_en,
                    items: []
                };
            }

            if (row.detalle_id) {
                ordenesMap[row.pedido_id].items.push({
                    id: row.detalle_id,
                    platillo_nombre: row.platillo_nombre,
                    cantidad: row.cantidad,
                    precio_unitario: row.precio_unitario
                });
            }
        });

        const dataResponse = Object.values(ordenesMap);

        res.json({
            success: true,
            data: dataResponse
        });
    } catch (error) {
        console.error('Error al obtener pedidos del proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al consultar pedidos.'
        });
    }
});

/**
 * API: Actualizar estado de un pedido (Protegido)
 * PUT /api/provider/orders/:id/status
 */
router.put('/api/provider/orders/:id/status', auth, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const id_restaurante = req.proveedor.id;

    const estadosValidos = ['Pendiente', 'Preparando', 'Enviado', 'Entregado', 'Cancelado'];
    if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({
            success: false,
            message: `Estado no válido. Los estados permitidos son: ${estadosValidos.join(', ')}`
        });
    }

    try {
        const [result] = await pool.query(
            'UPDATE pedidos SET estado = ? WHERE id = ? AND id_restaurante = ?',
            [estado, id, id_restaurante]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado o no autorizado para actualizar.'
            });
        }

        res.json({
            success: true,
            message: 'Estado del pedido actualizado exitosamente.',
            data: { id, estado }
        });
    } catch (error) {
        console.error('Error al actualizar estado del pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al actualizar el estado.'
        });
    }
});

/**
 * API: Reporte analítico del proveedor (Platillos más vendidos)
 * GET /api/provider/analytics
 */
router.get('/api/provider/analytics', auth, async (req, res) => {
    const id_restaurante = req.proveedor.id;

    try {
        const sqlPlatillos = `
            SELECT 
                pl.id AS platillo_id,
                pl.nombre AS platillo_nombre,
                pl.categoria,
                CAST(SUM(dp.cantidad) AS UNSIGNED) AS total_unidades_vendidas,
                CAST(SUM(dp.cantidad * dp.precio_unitario) AS DECIMAL(10,2)) AS ingresos_totales,
                COUNT(DISTINCT p.id) AS cantidad_pedidos
            FROM detalle_pedidos dp
            INNER JOIN platillos pl ON dp.id_platillo = pl.id
            INNER JOIN pedidos p ON dp.id_pedido = p.id
            WHERE pl.id_restaurante = ? AND p.estado != 'Cancelado'
            GROUP BY pl.id, pl.nombre, pl.categoria
            ORDER BY total_unidades_vendidas DESC
        `;

        const sqlGlobal = `
            SELECT 
                CAST(SUM(total) AS DECIMAL(10,2)) AS ingresos_totales,
                COUNT(id) AS total_pedidos,
                COUNT(CASE WHEN estado = 'Entregado' THEN 1 END) AS pedidos_entregados,
                COUNT(CASE WHEN estado = 'Cancelado' THEN 1 END) AS pedidos_cancelados
            FROM pedidos 
            WHERE id_restaurante = ?
        `;

        const [platillosRows] = await pool.query(sqlPlatillos, [id_restaurante]);
        const [globalRows] = await pool.query(sqlGlobal, [id_restaurante]);

        res.json({
            success: true,
            data: {
                resumen_general: globalRows[0] || { ingresos_totales: 0, total_pedidos: 0, pedidos_entregados: 0, pedidos_cancelados: 0 },
                top_platillos: platillosRows
            }
        });
    } catch (error) {
        console.error('Error al generar analítica del proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al procesar el reporte analítico.'
        });
    }
});


// Exportar el módulo router para integración central
module.exports = router;

// --- SOPORTE DE ARRANQUE AUTÓNOMO ---
if (require.main === module) {
    const app = express();
    app.use(express.json());
    
    app.use(express.static(path.join(__dirname)));
    app.use('/', router);
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'menu.html'));
    });

    app.listen(PORT, () => {
        console.log(`🚀 Servidor autónomo de pruebas iniciado exitosamente.`);
        console.log(`🔗 Accede a: http://localhost:${PORT}`);
    });
}
