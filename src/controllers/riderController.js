/**
 * =============================================================================
 * CONTROLLER: riderController.js
 * Propósito: CRUD de repartidores y simulación de asignación/entregas de pedidos usando MySQL
 * =============================================================================
 */

const pool = require('../models/db');

// Simulated active offers pool
let ofertasDisponibles = [];

// Helper to generate a random order
function generarOrdenAleatoria() {
  const restaurantes = [
    { nombre: "Pizzería La Toscana", lat: 14.62843, lng: -90.52254, dir: "Calle Real 4-12, Zona 10" },
    { nombre: "Burgers & Beers", lat: 14.60212, lng: -90.51342, dir: "Avenida Reforma 12-45, Zona 9" },
    { nombre: "Tacos El Pastorcito", lat: 14.61589, lng: -90.53489, dir: "Diagonal 6, 10-22, Zona 10" },
    { nombre: "Sushi Roll Masters", lat: 14.59321, lng: -90.50543, dir: "Bulevar Los Próceres 18-90, Zona 10" }
  ];
  const clientes = [
    { nombre: "Carlos Mendoza", lat: 14.63245, lng: -90.51876, dir: "Apartamento 4B, Edificio Las Pilas, Zona 4" },
    { nombre: "Ana Sofía Gómez", lat: 14.60876, lng: -90.52543, dir: "Condominio El Encanto, Casa 15, Zona 14" },
    { nombre: "Luis Fernando Ortiz", lat: 14.62012, lng: -90.50123, dir: "Residenciales Alamedas, Calle 3, Zona 15" }
  ];
  const itemsLista = [
    ["1x Pizza Familiar Margherita", "2x Refrescos de Lata"],
    ["2x Doble Bacon Burger", "1x Papas Fritas Grandes", "1x Shake de Fresa"],
    ["5x Tacos al Pastor con Queso", "1x Horchata Grande"],
    ["1x Combo Premium Sushi (18 piezas)", "1x Té Frío de Limón"]
  ];

  const idxRes = Math.floor(Math.random() * restaurantes.length);
  const idxCli = Math.floor(Math.random() * clientes.length);
  const idxItem = Math.floor(Math.random() * itemsLista.length);
  const pago = parseFloat((15 + Math.random() * 25).toFixed(2));
  const puntos = Math.floor(10 + Math.random() * 20);

  const randId = "ORD-" + Math.floor(100 + Math.random() * 900);

  return {
    id: randId,
    proveedor: restaurantes[idxRes].nombre,
    proveedorDireccion: restaurantes[idxRes].dir,
    proveedorCoords: { lat: restaurantes[idxRes].lat, lng: restaurantes[idxRes].lng },
    cliente: clientes[idxCli].nombre,
    clienteDireccion: clientes[idxCli].dir,
    clienteCoords: { lat: clientes[idxCli].lat, lng: clientes[idxCli].lng },
    detalles: itemsLista[idxItem],
    pago: pago,
    puntos: puntos,
    tiempoSimulado: "20-25 min"
  };
}

// Start automatic generation simulation using DB active riders checks
setInterval(async () => {
  try {
    const [activeRiders] = await pool.query(
      "SELECT id FROM repartidores WHERE disponible = 1 AND alertas_activas = 1 AND pedido_activo IS NULL"
    );
    if (activeRiders.length > 0) {
      if (ofertasDisponibles.length < 3) {
        const nuevaOferta = generarOrdenAleatoria();
        ofertasDisponibles.push(nuevaOferta);
        console.log(`[SIMULACIÓN RIDER] Nuevo pedido disponible: ${nuevaOferta.id}`);
      }
    } else {
      if (ofertasDisponibles.length > 0) {
        ofertasDisponibles = [];
        console.log("[SIMULACIÓN RIDER] Ofertas limpiadas debido a inactividad de repartidores.");
      }
    }
  } catch (err) {
    console.error("[SIMULACIÓN RIDER] Error in simulator loop:", err.message);
  }
}, 10000);

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
    const [rows] = await pool.query('SELECT disponible FROM repartidores WHERE id = ?', [riderId]);
    if (rows.length === 0 || !rows[0].disponible) {
      return res.json({ 
        disponible: false, 
        ofertas: [], 
        message: "Excluido por no estar disponible." 
      });
    }

    res.json({ 
      disponible: true, 
      ofertas: ofertasDisponibles 
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
const simularOferta = async (req, res) => {
  try {
    const riderId = req.repartidor.id;
    const [rows] = await pool.query('SELECT disponible FROM repartidores WHERE id = ?', [riderId]);
    
    if (rows.length === 0 || !rows[0].disponible) {
      return res.status(403).json({ 
        success: false, 
        message: "Aislamiento de Disponibilidad: No se pueden generar ni consultar pedidos si la disponibilidad está desactivada." 
      });
    }

    const nuevaOferta = generarOrdenAleatoria();
    ofertasDisponibles.unshift(nuevaOferta);
    res.json({ success: true, oferta: nuevaOferta });
  } catch (error) {
    console.error('Error en simularOferta:', error);
    res.status(500).json({ success: false, message: 'Error interno.' });
  }
};

/**
 * POST /api/pedidos/aceptar
 * Acepta un pedido y lo asocia al repartidor (requiere autenticación)
 */
const aceptarPedido = async (req, res) => {
  try {
    const riderId = req.repartidor.id;
    const { id } = req.body;

    const [rows] = await pool.query('SELECT disponible, pedido_activo FROM repartidores WHERE id = ?', [riderId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Repartidor no encontrado." });
    }
    const rider = rows[0];

    if (!rider.disponible) {
      return res.status(400).json({ success: false, message: "Debe activar su disponibilidad para aceptar pedidos." });
    }
    if (rider.pedido_activo) {
      return res.status(400).json({ success: false, message: "Ya tiene un pedido activo." });
    }

    const index = ofertasDisponibles.findIndex(o => o.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "El pedido ya no está disponible." });
    }

    const pedido = ofertasDisponibles[index];
    const pedidoStr = JSON.stringify(pedido);

    await pool.query('UPDATE repartidores SET pedido_activo = ? WHERE id = ?', [pedidoStr, riderId]);
    ofertasDisponibles = []; // Limpiar las demás

    res.json({ success: true, pedidoActivo: pedido });
  } catch (error) {
    console.error('Error en aceptarPedido:', error);
    res.status(500).json({ success: false, message: "Error al registrar la aceptación del pedido." });
  }
};

/**
 * POST /api/pedidos/rechazar
 * Rechaza/cancela una oferta de pedido
 */
const rechazarPedido = (req, res) => {
  const { id } = req.body;
  ofertasDisponibles = ofertasDisponibles.filter(o => o.id !== id);
  res.json({ success: true, ofertas: ofertasDisponibles });
};

/**
 * POST /api/pedidos/entregado
 * Marca el pedido activo como entregado y acumula ganancias/puntos (requiere autenticación)
 */
const completarPedido = async (req, res) => {
  try {
    const riderId = req.repartidor.id;

    const [rows] = await pool.query(
      'SELECT pedido_activo, ganancias_acumuladas, puntos_acumulados, pedidos_hoy, historial_entregas FROM repartidores WHERE id = ?', 
      [riderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Repartidor no encontrado." });
    }
    
    const dbRider = rows[0];
    if (!dbRider.pedido_activo) {
      return res.status(400).json({ success: false, message: "No hay ningún pedido activo para entregar." });
    }

    const pedido = JSON.parse(dbRider.pedido_activo);
    
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

    await pool.query(
      `UPDATE repartidores 
       SET ganancias_acumuladas = ?, puntos_acumulados = ?, pedidos_hoy = ?, historial_entregas = ?, pedido_activo = NULL 
       WHERE id = ?`,
      [nuevasGanancias, nuevosPuntos, nuevosPedidosHoy, historialStr, riderId]
    );

    res.json({ 
      success: true, 
      message: "Entrega completada exitosamente. Proveedor notificado.",
      gananciasAcumuladas: nuevasGanancias,
      puntosAcumulados: nuevosPuntos,
      pedidosHoy: nuevosPedidosHoy,
      historial: historial
    });
  } catch (error) {
    console.error('Error en completarPedido:', error);
    res.status(500).json({ success: false, message: "Error al actualizar los datos en el servidor." });
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
