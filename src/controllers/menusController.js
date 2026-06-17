/**
 * =============================================================================
 * CONTROLLER: menusController.js
 * Propósito: Consultas públicas de restaurantes, platillos y creación de pedidos
 * =============================================================================
 */

const pool = require('../models/db');

/**
 * GET /api/restaurantes
 * Obtiene la lista de restaurantes activos
 */
const getRestaurantes = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, nombre, direccion, telefono, distancia_km, tiempo_entrega_min, activo FROM restaurantes WHERE activo = 1 ORDER BY nombre ASC'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener restaurantes:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al consultar restaurantes.' });
    }
};

/**
 * GET /api/platillos
 * Obtiene la lista de platillos disponibles con semáforo de precios por categoría
 */
const getPlatillos = async (req, res) => {
    try {
        const { buscar, categoria } = req.query;
        let queryParams = [];

        // Consulta SQL con cálculo en tiempo real de semáforo comparativo
        let sql = `
            SELECT 
                p.id,
                p.nombre AS platillo_nombre,
                p.descripcion AS platillo_descripcion,
                CAST(p.precio AS DECIMAL(10,2)) AS precio,
                p.categoria,
                p.disponible,
                p.id_restaurante,
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
};

/**
 * POST /api/orders
 * Crea un nuevo pedido del cliente en la base de datos (con sus detalles)
 */
const createOrder = async (req, res) => {
    const { id_restaurante, cliente_nombre, direccion_entrega, telefono_cliente, total, items } = req.body;

    if (!id_restaurante || !cliente_nombre || !direccion_entrega || !telefono_cliente || !total || !items || !items.length) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos del pedido (incluyendo al menos un platillo) son requeridos.'
        });
    }

    let connection;
    try {
        // Obtener conexión para transacciones
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Insertar cabecera del pedido
        const [orderResult] = await connection.query(
            `INSERT INTO pedidos (id_restaurante, cliente_nombre, direccion_entrega, telefono_cliente, total, estado)
             VALUES (?, ?, ?, ?, ?, 'Pendiente')`,
            [id_restaurante, cliente_nombre, direccion_entrega, telefono_cliente, total]
        );

        const pedido_id = orderResult.insertId;

        // 2. Insertar detalles del pedido
        for (const item of items) {
            const { id_platillo, cantidad, precio_unitario } = item;
            if (!id_platillo || !cantidad || precio_unitario === undefined) {
                throw new Error('Datos de item incorrectos.');
            }
            await connection.query(
                `INSERT INTO detalle_pedidos (id_pedido, id_platillo, cantidad, precio_unitario)
                 VALUES (?, ?, ?, ?)`,
                [pedido_id, id_platillo, cantidad, precio_unitario]
            );
        }

        await connection.commit();
        res.status(201).json({
            success: true,
            message: 'Pedido registrado correctamente en la base de datos.',
            pedido_id: pedido_id
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al registrar pedido en base de datos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al registrar el pedido en la base de datos.'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    getRestaurantes,
    getPlatillos,
    createOrder
};
