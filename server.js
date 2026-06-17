const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'repartidor.json');

// Helper to read data
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // Create folder and write default if somehow missing
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
    console.error("Error reading database file:", err);
    return {};
  }
}

// Helper to write data
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing to database file:", err);
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
  const pago = parseFloat((15 + Math.random() * 25).toFixed(2)); // Pago de 15 a 40
  const puntos = Math.floor(10 + Math.random() * 20); // Puntos de 10 a 30

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

// Periodically generate dynamic orders for availability tests (only stays in memory)
setInterval(() => {
  const data = readData();
  // Regla de Negocio: Solo si el repartidor está disponible y tiene alertas activas se agregan ofertas
  if (data.disponible && data.alertasActivas && !data.pedidoActivo) {
    if (ofertasDisponibles.length < 3) { // Max 3 ofertas pendientes
      const nuevaOferta = generarOrdenAleatoria();
      ofertasDisponibles.push(nuevaOferta);
      console.log(`[SIMULACIÓN] Nuevo pedido generado para repartidor disponible: ${nuevaOferta.id}`);
    }
  } else {
    // Si no está disponible, se limpian las ofertas para cumplir estrictamente el aislamiento
    if (ofertasDisponibles.length > 0) {
      ofertasDisponibles = [];
      console.log("[SIMULACIÓN] Ofertas limpiadas debido a inactividad o repartidor no disponible (Aislamiento de Disponibilidad)");
    }
  }
}, 10000); // Intenta simular cada 10 segundos

// API endpoint to trigger a manual simulation (for demonstration purposes)
app.post('/api/pedidos/simular-oferta', (req, res) => {
  const data = readData();
  
  // Regla de Negocio: Validar disponibilidad
  if (!data.disponible) {
    return res.status(403).json({ 
      success: false, 
      message: "Aislamiento de Disponibilidad: No se pueden generar ni consultar pedidos si la disponibilidad está desactivada." 
    });
  }

  const nuevaOferta = generarOrdenAleatoria();
  ofertasDisponibles.unshift(nuevaOferta); // Poner al inicio
  res.json({ success: true, oferta: nuevaOferta });
});

// GET repartidor state
app.get('/api/repartidor', (req, res) => {
  const data = readData();
  res.json(data);
});

// POST update repartidor profile info
app.post('/api/repartidor', (req, res) => {
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
});

// POST toggle disponibilidad
app.post('/api/repartidor/disponibilidad', (req, res) => {
  const data = readData();
  const { disponible } = req.body;

  data.disponible = !!disponible;
  
  // Limpiar ofertas si pasa a no disponible (Aislamiento de disponibilidad)
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
});

// POST toggle alertas
app.post('/api/repartidor/alertas', (req, res) => {
  const data = readData();
  const { alertasActivas } = req.body;

  data.alertasActivas = !!alertasActivas;
  if (writeData(data)) {
    res.json({ success: true, alertasActivas: data.alertasActivas });
  } else {
    res.status(500).json({ success: false });
  }
});

// POST toggle gps
app.post('/api/repartidor/gps', (req, res) => {
  const data = readData();
  const { gpsActivo } = req.body;

  data.gpsActivo = !!gpsActivo;
  if (writeData(data)) {
    res.json({ success: true, gpsActivo: data.gpsActivo });
  } else {
    res.status(500).json({ success: false });
  }
});

// GET active offers (Aislamiento de disponibilidad)
app.get('/api/pedidos/disponibles', (req, res) => {
  const data = readData();
  
  // Regla de Negocio: Si está disponible en FALSE, no se devuelven ofertas y se vacía cualquier caché
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
});

// POST aceptar pedido
app.post('/api/pedidos/aceptar', (req, res) => {
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
  
  // Remover de ofertas disponibles y limpiar la cola para enfocarse en este pedido
  ofertasDisponibles = [];

  if (writeData(data)) {
    res.json({ success: true, pedidoActivo: data.pedidoActivo });
  } else {
    res.status(500).json({ success: false, message: "Error al registrar la aceptación del pedido." });
  }
});

// POST cancelar/rechazar oferta
app.post('/api/pedidos/rechazar', (req, res) => {
  const { id } = req.body;
  ofertasDisponibles = ofertasDisponibles.filter(o => o.id !== id);
  res.json({ success: true, ofertas: ofertasDisponibles });
});

// POST finalizar pedido (notificar al proveedor que ha sido entregado)
app.post('/api/pedidos/entregado', (req, res) => {
  const data = readData();
  
  if (!data.pedidoActivo) {
    return res.status(400).json({ success: false, message: "No hay ningún pedido activo para entregar." });
  }

  const pedido = data.pedidoActivo;
  
  // Agregar ganancias y puntos
  data.gananciasAcumuladas = parseFloat((data.gananciasAcumuladas + pedido.pago).toFixed(2));
  data.puntosAcumulados += pedido.puntos;
  data.pedidosHoy += 1;

  // Registrar en historial
  const entrega = {
    id: pedido.id,
    fecha: new Date().toISOString(),
    proveedor: pedido.proveedor,
    cliente: pedido.cliente,
    pago: pedido.pago,
    puntos: pedido.puntos
  };
  
  data.historialEntregas.unshift(entrega);
  
  // Resetear pedido activo
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
});

// Fallback to client-side routing / index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`Servidor de Repartidor activo en el puerto ${PORT}`);
  console.log(`URL local: http://localhost:${PORT}`);
  console.log(`Aislamiento de disponibilidad activo.`);
  console.log(`=========================================`);
});
