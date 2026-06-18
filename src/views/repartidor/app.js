// Global App State
let map = null;
let driverMarker = null;
let supplierMarker = null;
let clientMarker = null;
let routeLine = null;

let isPollingOffers = false;
let pollingInterval = null;
let currentActiveOrder = null;
let localDisponibilidad = false;
let localGPS = false;
let localAlertas = true;
let knownOfferIds = new Set();
let rejectedOfferIds = new Set();

// Default Map Settings (Guatemala City area, matches coordinate mocks)
const DEFAULT_LAT = 14.6133;
const DEFAULT_LNG = -90.5353;
const DEFAULT_ZOOM = 13;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  setupEventListeners();
  checkAuth();
});

/* ==========================================================================
   AUTHENTICATION CHECK & SWITCH STATE
   ========================================================================== */
function checkAuth() {
  const token = localStorage.getItem('rider_token');
  const viewAuth = document.getElementById('view-rider-auth');
  const dashboard = document.querySelector('.dashboard-container');
  const headerStatus = document.querySelector('.header-status');
  const profileWrapper = document.querySelector('.header-profile-wrapper');

  if (token) {
    viewAuth.classList.add('hidden');
    dashboard.classList.remove('hidden');
    headerStatus.classList.remove('hidden');
    profileWrapper.classList.remove('hidden');
    loadDriverProfile();
  } else {
    viewAuth.classList.remove('hidden');
    dashboard.classList.add('hidden');
    headerStatus.classList.add('hidden');
    profileWrapper.classList.add('hidden');
    if (isPollingOffers) {
      clearInterval(pollingInterval);
      isPollingOffers = false;
    }
  }
}

function switchRiderAuthTab(tab) {
  const tabLogin = document.getElementById("tab-rider-login");
  const tabRegister = document.getElementById("tab-rider-register");
  const formLogin = document.getElementById("form-rider-login");
  const formRegister = document.getElementById("form-rider-register");

  if (tab === "login") {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    formLogin.classList.remove("hidden");
    formRegister.classList.add("hidden");
  } else {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    formRegister.classList.remove("hidden");
    formLogin.classList.add("hidden");
  }
}

function handleRiderLogin(e) {
  e.preventDefault();
  const email = document.getElementById("rider-login-email").value.trim();
  const password = document.getElementById("rider-login-password").value;

  fetch('/api/rider/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('rider_token', data.token);
        localStorage.setItem('rider_info', JSON.stringify(data.repartidor));
        alert("¡Inicio de sesión exitoso!");
        checkAuth();
      } else {
        alert(data.message || "Credenciales incorrectas.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error de conexión al iniciar sesión.");
    });
}

function handleRiderRegister(e) {
  e.preventDefault();
  const nombre = document.getElementById("rider-reg-name").value.trim();
  const correo = document.getElementById("rider-reg-email").value.trim();
  const password = document.getElementById("rider-reg-password").value;
  
  const marca = document.getElementById("rider-reg-moto-marca").value.trim();
  const modelo = document.getElementById("rider-reg-moto-modelo").value.trim();
  const placa = document.getElementById("rider-reg-moto-placa").value.trim();
  const color = document.getElementById("rider-reg-moto-color").value.trim();
  
  const lic_num = document.getElementById("rider-reg-licencia-num").value.trim();
  const lic_exp = document.getElementById("rider-reg-licencia-exp").value;

  const payload = {
    nombre,
    correo,
    password,
    motocicleta: { marca, modelo, placa, color },
    licencia: { numero: lic_num, expiracion: lic_exp }
  };

  fetch('/api/rider/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("¡Registro exitoso! Por favor inicia sesión.");
        switchRiderAuthTab("login");
        document.getElementById("rider-login-email").value = correo;
        e.target.reset();
      } else {
        alert(data.message || "Error al registrarse.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error de conexión al registrarse.");
    });
}

function logoutRider() {
  localStorage.removeItem('rider_token');
  localStorage.removeItem('rider_info');
  
  // Clear map markers
  if (driverMarker && map) map.removeLayer(driverMarker);
  if (supplierMarker && map) map.removeLayer(supplierMarker);
  if (clientMarker && map) map.removeLayer(clientMarker);
  if (routeLine && map) map.removeLayer(routeLine);
  
  checkAuth();
}

/* ==========================================================================
   MAP IMPLEMENTATION (LEAFLET.JS)
   ========================================================================== */
function initMap() {
  try {
    map = L.map('map-container', {
      zoomControl: true,
      attributionControl: false
    }).setView([DEFAULT_LAT, DEFAULT_LNG], DEFAULT_ZOOM);

    // Load Dark CartoDB Tiles (Premium visual style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    console.log("Leaflet map initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Leaflet Map. Using simulated layout.", err);
    document.getElementById('map-container').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);flex-direction:column;gap:10px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;color:var(--accent-orange)"></i>
        <span>Error al cargar mapa interactivo. Funcionando en modo offline.</span>
      </div>`;
  }
}

// Update Map markers based on active order and GPS state
function updateMapMarkers() {
  if (!map) return;

  // Clear existing layers
  if (driverMarker) map.removeLayer(driverMarker);
  if (supplierMarker) map.removeLayer(supplierMarker);
  if (clientMarker) map.removeLayer(clientMarker);
  if (routeLine) map.removeLayer(routeLine);

  const mapOverlay = document.getElementById('map-instructions');
  
  // 1. If GPS is Active, show Driver Marker
  if (localGPS) {
    let driverLat = DEFAULT_LAT;
    let driverLng = DEFAULT_LNG;

    if (currentActiveOrder) {
      driverLat = currentActiveOrder.proveedorCoords.lat - 0.005;
      driverLng = currentActiveOrder.proveedorCoords.lng + 0.003;
    }

    const driverIcon = L.divIcon({
      html: '<div class="custom-map-pin pin-driver-glow"><i class="fa-solid fa-motorcycle"></i></div>',
      className: 'leaflet-custom-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map)
      .bindPopup("<b>Tú (Repartidor)</b><br>Buscando ruta de entrega");
  }

  // 2. If Active Order, show Supplier and Customer markers
  if (currentActiveOrder) {
    const sCoords = currentActiveOrder.proveedorCoords;
    const cCoords = currentActiveOrder.clienteCoords;

    const supplierIcon = L.divIcon({
      html: '<div class="custom-map-pin pin-supplier-glow"><i class="fa-solid fa-shop"></i></div>',
      className: 'leaflet-custom-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const clientIcon = L.divIcon({
      html: '<div class="custom-map-pin pin-client-glow"><i class="fa-solid fa-house-user"></i></div>',
      className: 'leaflet-custom-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    supplierMarker = L.marker([sCoords.lat, sCoords.lng], { icon: supplierIcon }).addTo(map)
      .bindPopup(`<b>Proveedor: ${currentActiveOrder.proveedor}</b><br>${currentActiveOrder.proveedorDireccion}`);
    
    clientMarker = L.marker([cCoords.lat, cCoords.lng], { icon: clientIcon }).addTo(map)
      .bindPopup(`<b>Cliente: ${currentActiveOrder.cliente}</b><br>${currentActiveOrder.clienteDireccion}`);

    if (localGPS) {
      const driverLat = driverMarker.getLatLng().lat;
      const driverLng = driverMarker.getLatLng().lng;
      
      routeLine = L.polyline([
        [driverLat, driverLng],
        [sCoords.lat, sCoords.lng],
        [cCoords.lat, cCoords.lng]
      ], {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(map);

      mapOverlay.innerHTML = `<i class="fa-solid fa-route" style="color:var(--accent-green)"></i> Ruta de entrega trazada. Recoge en <b>${currentActiveOrder.proveedor}</b>.`;
      mapOverlay.classList.add('info-active');

      const group = new L.featureGroup([driverMarker, supplierMarker, clientMarker]);
      map.fitBounds(group.getBounds().pad(0.15));
    } else {
      routeLine = L.polyline([
        [sCoords.lat, sCoords.lng],
        [cCoords.lat, cCoords.lng]
      ], {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.8,
        dashArray: '5, 5'
      }).addTo(map);

      mapOverlay.innerHTML = `<i class="fa-solid fa-location-arrow" style="color:var(--accent-orange)"></i> Activa el <b>GPS</b> para ver tu ubicación respecto al restaurante.`;
      mapOverlay.classList.remove('info-active');

      const group = new L.featureGroup([supplierMarker, clientMarker]);
      map.fitBounds(group.getBounds().pad(0.15));
    }
  } else {
    mapOverlay.innerHTML = localGPS 
      ? `<i class="fa-solid fa-location-dot" style="color:var(--accent-green)"></i> GPS Activado. Esperando asignación de ruta...` 
      : `<i class="fa-solid fa-route"></i> Activa el GPS y tu disponibilidad para trazar la ruta de entrega.`;
    mapOverlay.classList.remove('info-active');

    if (driverMarker) {
      map.setView(driverMarker.getLatLng(), DEFAULT_ZOOM);
    } else {
      map.setView([DEFAULT_LAT, DEFAULT_LNG], DEFAULT_ZOOM);
    }
  }
}

/* ==========================================================================
   BACKEND SYNC & PROFILE LOAD
   ========================================================================== */
function loadDriverProfile() {
  const token = localStorage.getItem('rider_token');
  if (!token) return logoutRider();

  fetch('/api/repartidor', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => {
      if (res.status === 401 || res.status === 403) {
        throw new Error('Unauthorized');
      }
      return res.json();
    })
    .then(data => {
      // Sync local control states
      localDisponibilidad = data.disponible;
      localGPS = data.gpsActivo;
      localAlertas = data.alertasActivas;
      currentActiveOrder = data.pedidoActivo;

      // Update Toggles Checkboxes
      document.getElementById('toggle-disponibilidad').checked = localDisponibilidad;
      document.getElementById('toggle-alertas').checked = localAlertas;
      document.getElementById('toggle-gps').checked = localGPS;

      // Update Profile UI texts
      document.getElementById('nav-driver-name').innerText = data.nombre;
      
      const vehicleDesc = data.motocicleta.marca ? `${data.motocicleta.marca} ${data.motocicleta.modelo}` : 'Moto';
      const vehiclePlate = data.motocicleta.placa ? ` - ${data.motocicleta.placa}` : '';
      document.getElementById('nav-driver-vehicle').innerText = `${vehicleDesc}${vehiclePlate}`;
      document.getElementById('card-moto-desc').innerText = vehicleDesc;
      document.getElementById('card-moto-placa').innerText = data.motocicleta.placa || 'N/A';
      document.getElementById('card-moto-color').innerText = data.motocicleta.color || 'N/A';
      document.getElementById('card-licencia-num').innerText = data.licencia.numero || 'N/A';
      document.getElementById('card-licencia-exp').innerText = data.licencia.expiracion || 'N/A';

      // Update Header Badges
      updateBadgeState();

      // Update stats counters
      updateStatsUI(data.gananciasAcumuladas, data.puntosAcumulados, data.pedidosHoy);

      // Populate Modal Edit inputs
      document.getElementById('form-nombre').value = data.nombre;
      document.getElementById('form-correo').value = data.correo;
      document.getElementById('form-contrasenia').value = ''; // Don't prefill password
      document.getElementById('form-moto-marca').value = data.motocicleta.marca || '';
      document.getElementById('form-moto-modelo').value = data.motocicleta.modelo || '';
      document.getElementById('form-moto-placa').value = data.motocicleta.placa || '';
      document.getElementById('form-moto-color').value = data.motocicleta.color || '';
      document.getElementById('form-licencia-num').value = data.licencia.numero || '';
      document.getElementById('form-licencia-exp').value = data.licencia.expiracion || '';

      // Render Active Order if exists
      renderActiveOrder();

      // Render completed deliveries history
      renderHistory(data.historialEntregas);

      // Start/Stop Polling depending on state
      startOrStopPolling();
      
      // Update markers
      updateMapMarkers();
    })
    .catch(err => {
      console.error("Error loading driver data:", err);
      logoutRider();
    });
}

function updateBadgeState() {
  const badgeDispo = document.getElementById('badge-disponibilidad');
  const badgeGPS = document.getElementById('badge-gps');
  const dispoDesc = document.getElementById('dispo-desc');
  const gpsDesc = document.getElementById('gps-desc');
  const btnSim = document.getElementById('btn-manual-sim');

  if (localDisponibilidad) {
    badgeDispo.className = 'status-badge status-online';
    badgeDispo.innerHTML = '<span class="status-dot"></span><span class="status-text">Disponible</span>';
    dispoDesc.innerText = "Activo - Buscando entregas...";
    btnSim.style.display = currentActiveOrder ? 'none' : 'inline-flex';
  } else {
    badgeDispo.className = 'status-badge status-offline';
    badgeDispo.innerHTML = '<span class="status-dot"></span><span class="status-text">No Disponible</span>';
    dispoDesc.innerText = "Apagado - No recibes ofertas";
    btnSim.style.display = 'none';
  }

  if (localGPS) {
    badgeGPS.className = 'status-badge status-gps-on';
    badgeGPS.innerHTML = '<i class="fa-solid fa-location-dot"></i><span>GPS Activo</span>';
    gpsDesc.innerText = "Ubicación en tiempo real activa";
  } else {
    badgeGPS.className = 'status-badge status-gps-off';
    badgeGPS.innerHTML = '<i class="fa-solid fa-location-dot"></i><span>GPS Inactivo</span>';
    gpsDesc.innerText = "Ubicación simulada desactivada";
  }
}

function updateStatsUI(ganancias, puntos, totalHoy) {
  document.getElementById('stat-ganancias').innerText = `$${parseFloat(ganancias).toFixed(2)}`;
  document.getElementById('stat-puntos').innerText = puntos;
  document.getElementById('stat-pedidos').innerText = totalHoy;
}

/* ==========================================================================
   ORDER FLOW MANAGEMENT
   ========================================================================== */

function renderActiveOrder() {
  const placeholder = document.getElementById('order-placeholder');
  const details = document.getElementById('order-details-content');
  const placeholderTitle = document.getElementById('placeholder-title');
  const placeholderSubtitle = document.getElementById('placeholder-subtitle');

  if (currentActiveOrder) {
    placeholder.classList.add('hidden');
    details.classList.remove('hidden');

    document.getElementById('active-order-id').innerText = currentActiveOrder.id;
    document.getElementById('order-supplier-name').innerText = currentActiveOrder.proveedor;
    document.getElementById('order-supplier-addr').innerText = currentActiveOrder.proveedorDireccion;
    document.getElementById('order-client-name').innerText = currentActiveOrder.cliente;
    document.getElementById('order-client-addr').innerText = currentActiveOrder.clienteDireccion;
    document.getElementById('order-payment').innerText = `$${parseFloat(currentActiveOrder.pago).toFixed(2)}`;
    document.getElementById('order-points').innerText = `+${currentActiveOrder.puntos} pts`;
    document.getElementById('order-time').innerText = currentActiveOrder.tiempoSimulado;

    const listUl = document.getElementById('order-items-ul');
    listUl.innerHTML = '';
    currentActiveOrder.detalles.forEach(item => {
      const li = document.createElement('li');
      li.innerText = item;
      listUl.appendChild(li);
    });

    document.getElementById('btn-manual-sim').style.display = 'none';
  } else {
    details.classList.add('hidden');
    placeholder.classList.remove('hidden');

    if (localDisponibilidad) {
      placeholderTitle.innerText = "Buscando Ofertas de Pedidos...";
      placeholderSubtitle.innerText = "Los proveedores locales te están asignando entregas en tu zona.";
      placeholder.querySelector('.status-search-icon').className = "fa-solid fa-circle-notch fa-spin status-search-icon";
      document.getElementById('btn-manual-sim').style.display = 'inline-flex';
    } else {
      placeholderTitle.innerText = "Panel Fuera de Línea";
      placeholderSubtitle.innerText = "Activa tu disponibilidad para empezar a recibir alertas de pedidos de los proveedores.";
      placeholder.querySelector('.status-search-icon').className = "fa-solid fa-power-off status-search-icon";
      document.getElementById('btn-manual-sim').style.display = 'none';
    }
  }
}

function startOrStopPolling() {
  if (localDisponibilidad && !currentActiveOrder) {
    if (!isPollingOffers) {
      isPollingOffers = true;
      pollOffers(); // Poll immediately
      pollingInterval = setInterval(pollOffers, 4000); // Poll every 4s
      console.log("Started polling available orders from backend.");
    }
  } else {
    if (isPollingOffers) {
      clearInterval(pollingInterval);
      isPollingOffers = false;
      console.log("Stopped polling available orders.");
    }
    renderOffersList([]);
  }
}

function pollOffers() {
  const token = localStorage.getItem('rider_token');
  if (!token) return;

  fetch('/api/pedidos/disponibles', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.disponible) {
        renderOffersList([]);
        return;
      }
      renderOffersList(data.ofertas);
    })
    .catch(err => console.error("Error polling offers:", err));
}

function renderOffersList(ofertas) {
  const container = document.getElementById('offers-list-container');
  
  // Filtrar ofertas rechazadas localmente
  const activeOfertas = (ofertas || []).filter(o => !rejectedOfferIds.has(o.id));
  
  if (activeOfertas.length === 0) {
    container.innerHTML = `
      <div class="no-offers">
        <i class="fa-solid fa-bell-slash"></i>
        <p>No hay ofertas disponibles</p>
      </div>`;
    knownOfferIds.clear();
    return;
  }

  let hasNewOffer = false;
  activeOfertas.forEach(o => {
    if (!knownOfferIds.has(o.id)) {
      hasNewOffer = true;
      knownOfferIds.add(o.id);
    }
  });

  if (hasNewOffer && localAlertas) {
    playAlertSound();
  }

  container.innerHTML = '';

  activeOfertas.forEach(o => {
    const card = document.createElement('div');
    card.className = 'offer-item';
    card.innerHTML = `
      <div class="offer-pulse-border"></div>
      <div class="offer-header">
        <span>OFERTA ENTRANTE</span>
        <span>ID: ${o.id}</span>
      </div>
      <div class="offer-restaurant"><i class="fa-solid fa-shop"></i> ${o.proveedor}</div>
      <div class="offer-address">${o.proveedorDireccion}</div>
      <div class="offer-meta">
        <span class="offer-payment-lbl">$${parseFloat(o.pago).toFixed(2)}</span>
        <span class="offer-puntos-lbl">+${o.puntos} Pts</span>
        <span class="text-muted"><i class="fa-regular fa-clock"></i> ${o.tiempoSimulado}</span>
      </div>
      <div class="offer-actions">
        <button class="btn btn-secondary btn-reject" onclick="rechazarOferta('${o.id}')">Rechazar</button>
        <button class="btn btn-primary btn-accept" onclick="aceptarOferta('${o.id}')">Aceptar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function playAlertSound() {
  const audio = document.getElementById('audio-alert');
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.log("Sound autoplay blocked by browser policy. Interrupted audio alert."));
  }
}

function playSuccessSound() {
  const audio = document.getElementById('audio-success');
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.log("Sound autoplay blocked. Success audio alert."));
  }
}

// Global scope functions for dynamic HTML button binding
window.aceptarOferta = function(id) {
  const token = localStorage.getItem('rider_token');
  fetch('/api/pedidos/aceptar', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ id })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        currentActiveOrder = data.pedidoActivo;
        knownOfferIds.clear();
        startOrStopPolling();
        renderActiveOrder();
        updateMapMarkers();
      } else {
        alert(data.message || "No se pudo aceptar la oferta.");
      }
    })
    .catch(err => console.error("Error accepting order:", err));
};

window.rechazarOferta = function(id) {
  const token = localStorage.getItem('rider_token');
  rejectedOfferIds.add(id);
  knownOfferIds.delete(id);
  
  fetch('/api/pedidos/rechazar', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ id })
  })
    .then(() => {
      pollOffers(); // Refresh list
    })
    .catch(err => {
      console.error("Error rejecting order on server:", err);
      pollOffers();
    });
};

// Complete Delivery (Notify Provider)
function completeActiveDelivery() {
  if (!currentActiveOrder) return;
  const token = localStorage.getItem('rider_token');

  fetch('/api/pedidos/entregado', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        playSuccessSound();
        alert("¡Entrega Exitosa! El proveedor ha sido notificado del cierre de pedido.");
        
        currentActiveOrder = null;
        updateStatsUI(data.gananciasAcumuladas, data.puntosAcumulados, data.pedidosHoy);
        renderHistory(data.historial);
        renderActiveOrder();
        startOrStopPolling();
        updateMapMarkers();
      } else {
        alert(data.message || "Error al completar el pedido.");
      }
    })
    .catch(err => console.error("Error completing order:", err));
}

// Render history
function renderHistory(historial) {
  const container = document.getElementById('history-list-container');
  if (!historial || historial.length === 0) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:120px;color:var(--text-muted);font-size:0.8rem;">
        No has realizado entregas hoy.
      </div>`;
    return;
  }

  container.innerHTML = '';
  historial.forEach(item => {
    const date = new Date(item.fecha);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-item-left">
        <span class="history-store">${item.proveedor}</span>
        <span class="history-client"><i class="fa-solid fa-user"></i> ${item.cliente}</span>
        <span class="history-time"><i class="fa-regular fa-clock"></i> Entregado a las ${timeStr}</span>
      </div>
      <div class="history-item-right">
        <span class="history-pago">+$${parseFloat(item.pago).toFixed(2)}</span>
        <span class="history-puntos">+${item.puntos} Pts</span>
      </div>
    `;
    container.appendChild(div);
  });
}

/* ==========================================================================
   EVENT LISTENERS & PROFILE SUBMIT
   ========================================================================== */
function setupEventListeners() {
  
  // Rider Authentication View Tab switching
  document.getElementById('tab-rider-login').addEventListener('click', () => switchRiderAuthTab('login'));
  document.getElementById('tab-rider-register').addEventListener('click', () => switchRiderAuthTab('register'));

  // Rider forms submission
  document.getElementById('form-rider-login').addEventListener('submit', handleRiderLogin);
  document.getElementById('form-rider-register').addEventListener('submit', handleRiderRegister);

  // Rider logout trigger
  document.getElementById('btn-rider-logout').addEventListener('click', logoutRider);

  // Toggle Availability
  document.getElementById('toggle-disponibilidad').addEventListener('change', (e) => {
    const checked = e.target.checked;
    const token = localStorage.getItem('rider_token');
    fetch('/api/repartidor/disponibilidad', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ disponible: checked })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localDisponibilidad = data.disponible;
          updateBadgeState();
          renderActiveOrder();
          startOrStopPolling();
          updateMapMarkers();
        }
      })
      .catch(err => console.error("Error setting availability:", err));
  });

  // Toggle Alerts
  document.getElementById('toggle-alertas').addEventListener('change', (e) => {
    const checked = e.target.checked;
    const token = localStorage.getItem('rider_token');
    fetch('/api/repartidor/alertas', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ alertasActivas: checked })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localAlertas = data.alertasActivas;
        }
      })
      .catch(err => console.error("Error setting alerts:", err));
  });

  // Toggle GPS
  document.getElementById('toggle-gps').addEventListener('change', (e) => {
    const checked = e.target.checked;
    const token = localStorage.getItem('rider_token');
    fetch('/api/repartidor/gps', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ gpsActivo: checked })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localGPS = data.gpsActivo;
          updateBadgeState();
          updateMapMarkers();
        }
      })
      .catch(err => console.error("Error setting GPS:", err));
  });

  // Complete Active Delivery Button
  document.getElementById('btn-complete-delivery').addEventListener('click', () => {
    completeActiveDelivery();
  });

  // Modal Profile open/close triggers
  const modal = document.getElementById('profile-modal');
  const openBtnMini = document.getElementById('open-profile-btn');
  const editTrigger = document.getElementById('edit-profile-trigger');
  const closeBtn = document.getElementById('close-profile-btn');

  const openModal = () => modal.classList.remove('hidden');
  const closeModal = () => modal.classList.add('hidden');

  openBtnMini.addEventListener('click', openModal);
  editTrigger.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Profile Form Submission
  document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const token = localStorage.getItem('rider_token');

    const payload = {
      nombre: document.getElementById('form-nombre').value,
      correo: document.getElementById('form-correo').value,
      motocicleta: {
        marca: document.getElementById('form-moto-marca').value,
        modelo: document.getElementById('form-moto-modelo').value,
        placa: document.getElementById('form-moto-placa').value,
        color: document.getElementById('form-moto-color').value
      },
      licencia: {
        numero: document.getElementById('form-licencia-num').value,
        expiracion: document.getElementById('form-licencia-exp').value
      }
    };

    const newPass = document.getElementById('form-contrasenia').value.trim();
    if (newPass) {
      payload.contrasenia = newPass;
    }

    fetch('/api/repartidor', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          closeModal();
          loadDriverProfile();
          alert("Datos actualizados correctamente.");
        } else {
          alert("No se pudo guardar la información.");
        }
      })
      .catch(err => console.error("Error updating profile:", err));
  });

  // Manual simulation helper button event
  document.getElementById('btn-manual-sim').addEventListener('click', () => {
    const token = localStorage.getItem('rider_token');
    fetch('/api/pedidos/simular-oferta', { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          pollOffers();
        } else {
          alert(data.message);
        }
      })
      .catch(err => console.error("Error simulating offer:", err));
  });
}
