/**
 * =============================================================================
 * CONTROLLER: riderController.js
 * Propósito: CRUD de repartidores y simulación de asignación/entregas de pedidos
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/repartidor.json');

// Helper to read data
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      const defaultData = {
        nombre: "Juan Carlos Pérez",
        correo: "juan.delivery@copilot.com",
        contrasenia: "password123",
        motocicleta: { marca: "Honda", modelo: "CB190R", placa: "M-4589X", color: "Rojo" },
        licencia: { numero: "0102-150890-101-2", expiracion: "2029-12-31" },
        disponible: false,
        alertasActivas: true,
        gpsActivo: false,
        gananciasAcumuladas: 1250.50,
        puntosAcumulados: 350,
        pedidosHoy: 0,
        pedidoActivo: null,
        historialEntregas: []
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database file in riderController:", err);
    return {};
  }
}

// Helper to write data
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing database file in riderController:", err);
    return false;
  }
}

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

// Start automatic generation simulation
setInterval(() => {
  const data = readData();
  if (data.disponible && data.alertasActivas && !data.pedidoActivo) {
    if (ofertasDisponibles.length < 3) {
      const nuevaOferta = generarOrdenAleatoria();
      ofertasDisponibles.push(nuevaOferta);
      console.log(`[SIMULACIÓN RIDER] Nuevo pedido disponible: ${nuevaOferta.id}`);
    }
  } else {
    if (ofertasDisponibles.length > 0) {
      ofertasDisponibles = [];
      console.log("[SIMULACIÓN RIDER] Ofertas limpiadas debido a inactividad del repartidor.");
    }
  }
}, 10000);

/**
 * GET /api/repartidor
 * Obtiene el estado del repartidor
 */
const getRider = (req, res) => {
  const data = readData();
  res.json(data);
};

/**
 * POST /api/repartidor
 * Actualiza el perfil del repartidor
 */
const updateRider = (req, res) => {
  const data = readData();
  const { nombre, correo, contrasenia, motocicleta, licencia } = req.body;

  if (nombre) data.nombre = nombre;
  if (correo) data.correo = correo;
  if (contrasenia) data.contrasenia = contrasenia;
  if (motocicleta) {
    data.motocicleta = { ...data.motocicleta, ...motocicleta };
  }
  if (licencia) {
    data.licencia = { ...data.licencia, ...licencia };
  }

  if (writeData(data)) {
    res.json({ success: true, data });
  } else {
    res.status(500).json({ success: false, message: "Error al guardar el perfil en el servidor." });
  }
};

/**
 * POST /api/repartidor/disponibilidad
 * Activa/desactiva disponibilidad del repartidor
 */
const toggleDisponibilidad = (req, res) => {
  const data = readData();
  const { disponible } = req.body;

  data.disponible = !!disponible;
  
  if (!data.disponible) {
    ofertasDisponibles = [];
  }

  if (writeData(data)) {
    res.json({ 
      success: true, 
      disponible: data.disponible, 
      message: data.disponible ? "Disponibilidad activada. Buscando pedidos..." : "Disponibilidad desactivada. Excluido del sistema de asignación." 
    });
  } else {
    res.status(500).json({ success: false, message: "Error de servidor al guardar la disponibilidad." });
  }
};

/**
 * POST /api/repartidor/alertas
 * Alterna el estado de alertas activas
 */
const toggleAlertas = (req, res) => {
  const data = readData();
  const { alertasActivas } = req.body;

  data.alertasActivas = !!alertasActivas;
  if (writeData(data)) {
    res.json({ success: true, alertasActivas: data.alertasActivas });
  } else {
    res.status(500).json({ success: false });
  }
};

/**
 * POST /api/repartidor/gps
 * Alterna el estado del GPS
 */
const toggleGps = (req, res) => {
  const data = readData();
  const { gpsActivo } = req.body;

  data.gpsActivo = !!gpsActivo;
  if (writeData(data)) {
    res.json({ success: true, gpsActivo: data.gpsActivo });
  } else {
    res.status(500).json({ success: false });
  }
};

/**
 * GET /api/pedidos/disponibles
 * Obtiene ofertas disponibles para el repartidor
 */
const getDisponibleOrders = (req, res) => {
  const data = readData();
  
  if (!data.disponible) {
    ofertasDisponibles = [];
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
};

/**
 * POST /api/pedidos/simular-oferta
 * Genera y simula una oferta manual
 */
const simularOferta = (req, res) => {
  const data = readData();
  
  if (!data.disponible) {
    return res.status(403).json({ 
      success: false, 
      message: "Aislamiento de Disponibilidad: No se pueden generar ni consultar pedidos si la disponibilidad está desactivada." 
    });
  }

  const nuevaOferta = generarOrdenAleatoria();
  ofertasDisponibles.unshift(nuevaOferta);
  res.json({ success: true, oferta: nuevaOferta });
};

/**
 * POST /api/pedidos/aceptar
 * Acepta un pedido y lo asocia al repartidor
 */
const aceptarPedido = (req, res) => {
  const data = readData();
  const { id } = req.body;

  if (!data.disponible) {
    return res.status(400).json({ success: false, message: "Debe activar su disponibilidad para aceptar pedidos." });
  }
  if (data.pedidoActivo) {
    return res.status(400).json({ success: false, message: "Ya tiene un pedido activo." });
  }

  const index = ofertasDisponibles.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "El pedido ya no está disponible." });
  }

  const pedido = ofertasDisponibles[index];
  data.pedidoActivo = pedido;
  ofertasDisponibles = []; // Limpiar las demás

  if (writeData(data)) {
    res.json({ success: true, pedidoActivo: data.pedidoActivo });
  } else {
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
 * Marca el pedido activo como entregado y acumula ganancias/puntos
 */
const completarPedido = (req, res) => {
  const data = readData();
  
  if (!data.pedidoActivo) {
    return res.status(400).json({ success: false, message: "No hay ningún pedido activo para entregar." });
  }

  const pedido = data.pedidoActivo;
  
  data.gananciasAcumuladas = parseFloat((data.gananciasAcumuladas + pedido.pago).toFixed(2));
  data.puntosAcumulados += pedido.puntos;
  data.pedidosHoy += 1;

  const entrega = {
    id: pedido.id,
    fecha: new Date().toISOString(),
    proveedor: pedido.proveedor,
    cliente: pedido.cliente,
    pago: pedido.pago,
    puntos: pedido.puntos
  };
  
  data.historialEntregas.unshift(entrega);
  data.pedidoActivo = null;

  if (writeData(data)) {
    res.json({ 
      success: true, 
      message: "Entrega completada exitosamente. Proveedor notificado.",
      gananciasAcumuladas: data.gananciasAcumuladas,
      puntosAcumulados: data.puntosAcumulados,
      pedidosHoy: data.pedidosHoy,
      historial: data.historialEntregas
    });
  } else {
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
