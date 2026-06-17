/**
 * =============================================================================
 * CONTROLLER: providerController.js
 * Propósito: CRUD de platos, gestión de pedidos y analítica del Restaurante (Proveedor)
 * =============================================================================
 */

const pool = require('../models/db');

/**
 * GET /api/provider/menus
 * Obtiene los platos del restaurante autenticado
 */
const getProviderMenus = async (req, res) => {
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
};

/**
 * POST /api/provider/menus
 * Crea un nuevo platillo para el restaurante
 */
const createProviderMenu = async (req, res) => {
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
};

/**
 * PUT /api/provider/menus/:id
 * Modifica un platillo existente del restaurante autenticado
 */
const updateProviderMenu = async (req, res) => {
    const { id } = req.params;
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
};

/**
 * DELETE /api/provider/menus/:id
 * Elimina un platillo del restaurante autenticado
 */
const deleteProviderMenu = async (req, res) => {
    const { id } = req.params;
    const id_restaurante = req.proveedor.id;

    try {
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
};

/**
 * GET /api/provider/orders
 * Obtiene los pedidos recibidos por el restaurante autenticado
 */
const getProviderOrders = async (req, res) => {
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
                    total: parseFloat(row.total),
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
                    precio_unitario: parseFloat(row.precio_unitario)
                });
            }
        });

        res.json({
            success: true,
            data: Object.values(ordenesMap)
        });
    } catch (error) {
        console.error('Error al obtener pedidos del proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al consultar pedidos.'
        });
    }
};

/**
 * PUT /api/provider/orders/:id/status
 * Actualiza el estado de un pedido (Pendiente, Preparando, Enviado, Entregado, Cancelado)
 */
const updateProviderOrderStatus = async (req, res) => {
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
};

/**
 * GET /api/provider/analytics
 * Reporte analítico de ventas y platillos del restaurante autenticado
 */
const getProviderAnalytics = async (req, res) => {
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
};

module.exports = {
    getProviderMenus,
    createProviderMenu,
    updateProviderMenu,
    deleteProviderMenu,
    getProviderOrders,
    updateProviderOrderStatus,
    getProviderAnalytics
};
