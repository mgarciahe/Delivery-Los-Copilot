/**
 * =============================================================================
 * CONTROLLER: riderController.js
 * Propósito: CRUD de repartidores y simulación de asignación/entregas de pedidos usando MySQL
 * =============================================================================
 */

const pool = require('../models/db');

// Simulación en memoria eliminada para usar integración real de base de datos.


/**
 * GET /api/repartidor
 * Obtiene el estado del repartidor (requiere autenticación)
 */
const getRider = async (req, res) => {
  try {
    const riderId = req.repartidor.id;
    const [rows] = await pool.query('SELECT * FROM repartidores WHERE id = ?', [riderId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Repartidor no encontrado.' });
    }
    const dbRider = rows[0];

    // Formatear respuesta para el frontend
    const responseData = {
      id: dbRider.id,
      nombre: dbRider.nombre,
      correo: dbRider.correo,
      motocicleta: {
        marca: dbRider.moto_marca || '',
        modelo: dbRider.moto_modelo || '',
        placa: dbRider.moto_placa || '',
        color: dbRider.moto_color || ''
      },
      licencia: {
        numero: dbRider.licencia_numero || '',
        expiracion: dbRider.licencia_expiracion ? dbRider.licencia_expiracion.toISOString().split('T')[0] : ''
      },
      disponible: !!dbRider.disponible,
      alertasActivas: !!dbRider.alertas_activas,
      gpsActivo: !!dbRider.gps_activo,
      gananciasAcumuladas: parseFloat(dbRider.ganancias_acumuladas || 0),
      puntosAcumulados: parseInt(dbRider.puntos_acumulados || 0),
      pedidosHoy: parseInt(dbRider.pedidos_hoy || 0),
      pedidoActivo: dbRider.pedido_activo ? JSON.parse(dbRider.pedido_activo) : null,
      historialEntregas: dbRider.historial_entregas ? JSON.parse(dbRider.historial_entregas) : []
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error en getRider:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/**
 * POST /api/repartidor
 * Actualiza el perfil del repartidor (requiere autenticación)
 */
const updateRider = async (req, res) => {
  try {
    const riderId = req.repartidor.id;
    const { nombre, correo, contrasenia, motocicleta, licencia } = req.body;

    let updateFields = [];
    let queryParams = [];

    if (nombre) { updateFields.push('nombre = ?'); queryParams.push(nombre); }
    if (correo) { updateFields.push('correo = ?'); queryParams.push(correo); }
    if (contrasenia) {
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(contrasenia, 10);
      updateFields.push('password = ?');
      queryParams.push(passwordHash);
    }
    if (motocicleta) {
      if (motocicleta.marca !== undefined) { updateFields.push('moto_marca = ?'); queryParams.push(motocicleta.marca); }
      if (motocicleta.modelo !== undefined) { updateFields.push('moto_modelo = ?'); queryParams.push(motocicleta.modelo); }
      if (motocicleta.placa !== undefined) { updateFields.push('moto_placa = ?'); queryParams.push(motocicleta.placa); }
      if (motocicleta.color !== undefined) { updateFields.push('moto_color = ?'); queryParams.push(motocicleta.color); }
    }
    if (licencia) {
      if (licencia.numero !== undefined) { updateFields.push('licencia_numero = ?'); queryParams.push(licencia.numero); }
      if (licencia.expiracion !== undefined) { updateFields.push('licencia_expiracion = ?'); queryParams.push(licencia.expiracion || null); }
    }

    if (updateFields.length === 0) {
      return res.json({ success: true, message: 'No se enviaron campos para actualizar.' });
    }

    queryParams.push(riderId);
    await pool.query(
      `UPDATE repartidores SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );

    // Obtener los datos actualizados
    const [rows] = await pool.query('SELECT * FROM repartidores WHERE id = ?', [riderId]);
    const dbRider = rows[0];
    const responseData = {
      id: dbRider.id,
      nombre: dbRider.nombre,
      correo: dbRider.correo,
      motocicleta: {
        marca: dbRider.moto_marca || '',
        modelo: dbRider.moto_modelo || '',
        placa: dbRider.moto_placa || '',
        color: dbRider.moto_color || ''
      },
      licencia: {
        numero: dbRider.licencia_numero || '',
        expiracion: dbRider.licencia_expiracion ? dbRider.licencia_expiracion.toISOString().split('T')[0] : ''
      },
      disponible: !!dbRider.disponible,
      alertasActivas: !!dbRider.alertas_activas,
      gpsActivo: !!dbRider.gps_activo,
      gananciasAcumuladas: parseFloat(dbRider.ganancias_acumuladas || 0),
      puntosAcumulados: parseInt(dbRider.puntos_acumulados || 0),
      pedidosHoy: parseInt(dbRider.pedidos_hoy || 0),
      pedidoActivo: dbRider.pedido_activo ? JSON.parse(dbRider.pedido_activo) : null,
      historialEntregas: dbRider.historial_entregas ? JSON.parse(dbRider.historial_entregas) : []
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error en updateRider:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar datos.' });
  }
};

/**
 * POST /api/repartidor/disponibilidad
 * Activa/desactiva disponibilidad del repartidor (requiere autenticación)
 */
const toggleDisponibilidad = async (req, res) => {
  try {
    const riderId = req.repartidor.id;
    const { disponible } = req.body;

    const value = disponible ? 1 : 0;
    await pool.query('UPDATE repartidores SET disponible = ? WHERE id = ?', [value, riderId]);

    res.json({ 
      success: true, 
      disponible: !!disponible, 
      message: disponible ? "Disponibilidad activada. Buscando pedidos..." : "Disponibilidad desactivada. Excluido del sistema de asignación." 
    });
  } catch (error) {
    console.error('Error en toggleDisponibilidad:', error);
    res.status(500).json({ success: false, message: 'Error interno de servidor.' });
  }
};

/**
 * POST /api/repartidor/alertas
 * Alterna el estado de alertas activas (requiere autenticación)
 */
const toggleAlertas = async (req, res) => {
  try {
    const riderId = req.repartidor.id;
    const { alertasActivas } = req.body;

    const value = alertasActivas ? 1 : 0;
    await pool.query('UPDATE repartidores SET alertas_activas = ? WHERE id = ?', [value, riderId]);

    res.json({ success: true, alertasActivas: !!alertasActivas });
  } catch (error) {
    console.error('Error en toggleAlertas:', error);
    res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

/**
 * POST /api/repartidor/gps
 * Alterna el estado del GPS (requiere autenticación)
 */
const toggleGps = async (req, res) => {
  try {
    const riderId = req.repartidor.id;
    const { gpsActivo } = req.body;

    const value = gpsActivo ? 1 : 0;
    await pool.query('UPDATE repartidores SET gps_activo = ? WHERE id = ?', [value, riderId]);

    res.json({ success: true, gpsActivo: !!gpsActivo });
  } catch (error) {
    console.error('Error en toggleGps:', error);
    res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

/**
 * GET /api/pedidos/disponibles
 * Obtiene ofertas disponibles para el repartidor (requiere autenticación)
 */
const getDisponibleOrders = async (req, res) => {
  try {
    const riderId = req.repartidor.id;
    const [rows] = await pool.query('SELECT disponible, pedido_activo FROM repartidores WHERE id = ?', [riderId]);
    if (rows.length === 0 || !rows[0].disponible) {
      return res.json({ 
        disponible: false, 
        ofertas: [], 
        message: "Excluido por no estar disponible." 
      });
    }

    if (rows[0].pedido_activo) {
      return res.json({
        disponible: true,
        ofertas: [],
        message: "Ya tiene un pedido activo."
      });
    }

    // Consultar todos los pedidos con estado 'Pendiente' en la base de datos
    const [orders] = await pool.query(`
      SELECT p.id, p.id_restaurante, p.cliente_nombre, p.direccion_entrega, p.telefono_cliente, p.total, p.creado_en, r.nombre AS restaurante_nombre, r.direccion AS restaurante_direccion
      FROM pedidos p
      JOIN restaurantes r ON p.id_restaurante = r.id
      WHERE p.estado = 'Pendiente'
      ORDER BY p.creado_en DESC
    `);

    const ofertas = [];
    for (const order of orders) {
      // Obtener detalles del pedido
      const [details] = await pool.query(`
        SELECT dp.cantidad, p.nombre AS platillo_nombre
        FROM detalle_pedidos dp
        JOIN platillos p ON dp.id_platillo = p.id
        WHERE dp.id_pedido = ?
      `, [order.id]);

      const detallesList = details.map(d => `${d.cantidad}x ${d.platillo_nombre}`);

      // Mapear coordenadas de restaurantes
      let lat = 14.6133;
      let lng = -90.5353;
      if (order.id_restaurante === 1) { lat = 14.62843; lng = -90.52254; }
      else if (order.id_restaurante === 2) { lat = 14.60212; lng = -90.51342; }
      else if (order.id_restaurante === 3) { lat = 14.61589; lng = -90.53489; }
      else if (order.id_restaurante === 4) { lat = 14.59321; lng = -90.50543; }
      else if (order.id_restaurante === 5) { lat = 14.61000; lng = -90.53000; }

      // Coordenadas simuladas para el cliente
      const clientLat = lat + 0.005 + (order.id % 10) * 0.001;
      const clientLng = lng - 0.005 - (order.id % 10) * 0.001;

      // Calcular ganancias (10% del total + Q15 base)
      const pago = parseFloat((15.00 + parseFloat(order.total) * 0.1).toFixed(2));
      const puntos = Math.floor(pago * 0.5) + 5;

      ofertas.push({
        id: `PED-${order.id}`,
        realOrderId: order.id,
        proveedor: order.restaurante_nombre,
        proveedorDireccion: order.restaurante_direccion || "Dirección del restaurante",
        proveedorCoords: { lat, lng },
        cliente: order.cliente_nombre,
        clienteDireccion: order.direccion_entrega,
        clienteCoords: { lat: clientLat, lng: clientLng },
        detalles: detallesList,
        pago: pago,
        puntos: puntos,
        tiempoSimulado: "15-20 min"
      });
    }

    res.json({ 
      disponible: true, 
      ofertas: ofertas 
    });
  } catch (error) {
    console.error('Error en getDisponibleOrders:', error);
    res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

/**
 * POST /api/pedidos/simular-oferta
 * Genera y simula una oferta manual (requiere autenticación)
 */
/**
 * POST /api/pedidos/simular-oferta
 * Genera y simula una oferta manual creando un pedido real en la BD (requiere autenticación)
 */
const simularOferta = async (req, res) => {
  let connection;
  try {
    const riderId = req.repartidor.id;
    const [riderRows] = await pool.query('SELECT disponible FROM repartidores WHERE id = ?', [riderId]);
    
    if (riderRows.length === 0 || !riderRows[0].disponible) {
      return res.status(403).json({ 
        success: false, 
        message: "Aislamiento de Disponibilidad: No se pueden generar ni consultar pedidos si la disponibilidad está desactivada." 
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Obtener un restaurante activo aleatorio de la BD
    const [restaurants] = await connection.query('SELECT id, nombre, direccion FROM restaurantes WHERE activo = 1');
    if (restaurants.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "No hay restaurantes activos en la base de datos." });
    }
    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];

    // 2. Obtener un platillo aleatorio de ese restaurante
    const [dishes] = await connection.query('SELECT id, nombre, precio FROM platillos WHERE id_restaurante = ? AND disponible = 1', [restaurant.id]);
    if (dishes.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `El restaurante ${restaurant.nombre} no tiene platillos disponibles.` });
    }
    const dish = dishes[Math.floor(Math.random() * dishes.length)];

    // 3. Crear pedido de prueba en la BD
    const clientNames = ["Marcos López", "Sofía Ramírez", "Alejandro Pérez", "Gabriela Estrada", "Juan Carlos Luna"];
    const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
    const clientAddresses = ["Apartamento 5C, Edificio Reforma, Zona 9", "Residenciales El Frutal, Casa 12, Zona 18", "Ruta 4 2-56, Zona 4", "Diagonal 6, 12-40, Zona 10"];
    const clientAddress = clientAddresses[Math.floor(Math.random() * clientAddresses.length)];
    const clientPhone = "5555-" + Math.floor(1000 + Math.random() * 9000);
    const quantity = Math.floor(1 + Math.random() * 3);
    const total = parseFloat((parseFloat(dish.precio) * quantity).toFixed(2));

    const [orderResult] = await connection.query(
      `INSERT INTO pedidos (id_restaurante, cliente_nombre, direccion_entrega, telefono_cliente, total, estado)
       VALUES (?, ?, ?, ?, ?, 'Pendiente')`,
      [restaurant.id, clientName, clientAddress, clientPhone, total]
    );
    const orderId = orderResult.insertId;

    await connection.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_platillo, cantidad, precio_unitario)
       VALUES (?, ?, ?, ?)`,
      [orderId, dish.id, quantity, dish.precio]
    );

    await connection.commit();
    console.log(`[SIMULACIÓN RIDER] Pedido de prueba real creado en base de datos con ID: ${orderId}`);

    res.json({ success: true, message: `Pedido de prueba PED-${orderId} creado en la base de datos.` });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error en simularOferta:', error);
    res.status(500).json({ success: false, message: 'Error interno.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * POST /api/pedidos/aceptar
 * Acepta un pedido y lo asocia al repartidor (requiere autenticación)
 */
/**
 * POST /api/pedidos/aceptar
 * Acepta un pedido y lo asocia al repartidor (requiere autenticación)
 */
const aceptarPedido = async (req, res) => {
  let connection;
  try {
    const riderId = req.repartidor.id;
    const { id } = req.body;

    const realOrderId = id.startsWith('PED-') ? parseInt(id.replace('PED-', '')) : parseInt(id);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Comprobar la disponibilidad y pedido activo del repartidor
    const [riderRows] = await connection.query('SELECT disponible, pedido_activo FROM repartidores WHERE id = ? FOR UPDATE', [riderId]);
    if (riderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Repartidor no encontrado." });
    }
    const rider = riderRows[0];

    if (!rider.disponible) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Debe activar su disponibilidad para aceptar pedidos." });
    }
    if (rider.pedido_activo) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Ya tiene un pedido activo." });
    }

    // Consultar el estado del pedido real en la BD
    const [orderRows] = await connection.query(`
      SELECT p.id, p.id_restaurante, p.cliente_nombre, p.direccion_entrega, p.telefono_cliente, p.total, p.estado, r.nombre AS restaurante_nombre, r.direccion AS restaurante_direccion
      FROM pedidos p
      JOIN restaurantes r ON p.id_restaurante = r.id
      WHERE p.id = ? FOR UPDATE
    `, [realOrderId]);

    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Pedido no encontrado." });
    }

    const order = orderRows[0];
    if (order.estado !== 'Pendiente') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "El pedido ya no está disponible (ya fue tomado o cancelado)." });
    }

    // Obtener los platillos detallados
    const [details] = await connection.query(`
      SELECT dp.cantidad, p.nombre AS platillo_nombre
      FROM detalle_pedidos dp
      JOIN platillos p ON dp.id_platillo = p.id
      WHERE dp.id_pedido = ?
    `, [realOrderId]);

    const detallesList = details.map(d => `${d.cantidad}x ${d.platillo_nombre}`);

    // Mapear coordenadas de restaurantes
    let lat = 14.6133;
    let lng = -90.5353;
    if (order.id_restaurante === 1) { lat = 14.62843; lng = -90.52254; }
    else if (order.id_restaurante === 2) { lat = 14.60212; lng = -90.51342; }
    else if (order.id_restaurante === 3) { lat = 14.61589; lng = -90.53489; }
    else if (order.id_restaurante === 4) { lat = 14.59321; lng = -90.50543; }
    else if (order.id_restaurante === 5) { lat = 14.61000; lng = -90.53000; }

    const clientLat = lat + 0.005 + (order.id % 10) * 0.001;
    const clientLng = lng - 0.005 - (order.id % 10) * 0.001;

    // Calcular ganancias
    const pago = parseFloat((15.00 + parseFloat(order.total) * 0.1).toFixed(2));
    const puntos = Math.floor(pago * 0.5) + 5;

    const pedidoObj = {
      id: `PED-${order.id}`,
      realOrderId: order.id,
      proveedor: order.restaurante_nombre,
      proveedorDireccion: order.restaurante_direccion || "Dirección del restaurante",
      proveedorCoords: { lat, lng },
      cliente: order.cliente_nombre,
      clienteDireccion: order.direccion_entrega,
      clienteCoords: { lat: clientLat, lng: clientLng },
      detalles: detallesList,
      pago: pago,
      puntos: puntos,
      tiempoSimulado: "15-20 min"
    };

    const pedidoStr = JSON.stringify(pedidoObj);

    // Actualizar el estado del pedido y asignar al repartidor
    await connection.query("UPDATE pedidos SET estado = 'Enviado', id_repartidor = ? WHERE id = ?", [riderId, realOrderId]);
    await connection.query('UPDATE repartidores SET pedido_activo = ? WHERE id = ?', [pedidoStr, riderId]);

    await connection.commit();
    res.json({ success: true, pedidoActivo: pedidoObj });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error en aceptarPedido:', error);
    res.status(500).json({ success: false, message: "Error al registrar la aceptación del pedido." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * POST /api/pedidos/rechazar
 * Rechaza/cancela una oferta de pedido
 */
/**
 * POST /api/pedidos/rechazar
 * Rechaza una oferta de pedido (el filtrado principal ahora se hace en el cliente)
 */
const rechazarPedido = (req, res) => {
  res.json({ success: true, message: "Rechazado correctamente." });
};

/**
 * POST /api/pedidos/entregado
 * Marca el pedido activo como entregado y acumula ganancias/puntos (requiere autenticación)
 */
/**
 * POST /api/pedidos/entregado
 * Marca el pedido activo como entregado y acumula ganancias/puntos (requiere autenticación)
 */
const completarPedido = async (req, res) => {
  let connection;
  try {
    const riderId = req.repartidor.id;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT pedido_activo, ganancias_acumuladas, puntos_acumulados, pedidos_hoy, historial_entregas FROM repartidores WHERE id = ? FOR UPDATE', 
      [riderId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Repartidor no encontrado." });
    }
    
    const dbRider = rows[0];
    if (!dbRider.pedido_activo) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "No hay ningún pedido activo para entregar." });
    }

    const pedido = JSON.parse(dbRider.pedido_activo);
    const realOrderId = pedido.realOrderId;

    // Actualizar estado de la orden real en la BD
    await connection.query("UPDATE pedidos SET estado = 'Entregado' WHERE id = ?", [realOrderId]);
    
    const nuevasGanancias = parseFloat((parseFloat(dbRider.ganancias_acumuladas || 0) + parseFloat(pedido.pago || 0)).toFixed(2));
    const nuevosPuntos = parseInt(dbRider.puntos_acumulados || 0) + parseInt(pedido.puntos || 0);
    const nuevosPedidosHoy = parseInt(dbRider.pedidos_hoy || 0) + 1;

    const entrega = {
      id: pedido.id,
      fecha: new Date().toISOString(),
      proveedor: pedido.proveedor,
      cliente: pedido.cliente,
      pago: pedido.pago,
      puntos: pedido.puntos
    };
    
    const historial = dbRider.historial_entregas ? JSON.parse(dbRider.historial_entregas) : [];
    historial.unshift(entrega);
    
    const historialStr = JSON.stringify(historial);

    await connection.query(
      `UPDATE repartidores 
       SET ganancias_acumuladas = ?, puntos_acumulados = ?, pedidos_hoy = ?, historial_entregas = ?, pedido_activo = NULL 
       WHERE id = ?`,
      [nuevasGanancias, nuevosPuntos, nuevosPedidosHoy, historialStr, riderId]
    );

    await connection.commit();

    res.json({ 
      success: true, 
      message: "Entrega completada exitosamente. Proveedor notificado.",
      gananciasAcumuladas: nuevasGanancias,
      puntosAcumulados: nuevosPuntos,
      pedidosHoy: nuevosPedidosHoy,
      historial: historial
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error en completarPedido:', error);
    res.status(500).json({ success: false, message: "Error al actualizar los datos en el servidor." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getRider,
  updateRider,
  toggleDisponibilidad,
  toggleAlertas,
  toggleGps,
  getDisponibleOrders,
  simularOferta,
  aceptarPedido,
  rechazarPedido,
  completarPedido
};
