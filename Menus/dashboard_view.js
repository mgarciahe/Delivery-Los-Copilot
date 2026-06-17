/**
 * =============================================================================
 * CONTROLADOR FRONTEND: dashboard_view.js
 * Propósito: Interactividad, seguridad, llamadas AJAX seguras y render del Dashboard
 * =============================================================================
 */

// --- VALIDACIÓN DE SEGURIDAD ---
const token = localStorage.getItem('provider_token');
const providerInfoRaw = localStorage.getItem('provider_info');

if (!token || !providerInfoRaw) {
    // Si no hay token, redirigir inmediatamente a la pantalla de acceso
    window.location.href = 'login_proveedor.html';
}

const providerInfo = JSON.parse(providerInfoRaw);

// --- ESTADO LOCAL ---
let currentSection = 'menu-section';
let activeModalType = 'add'; // 'add' o 'edit'
const repartidoresSemilla = [
    { nombre: 'Carlos Ruiz', telefono: '7890-1234', vehiculo: 'Motocicleta Honda (Placa: M-5421)' },
    { nombre: 'Sofía Martínez', telefono: '7122-8899', vehiculo: 'Motocicleta Suzuki (Placa: M-9081)' },
    { nombre: 'Jorge Lemus', telefono: '7433-2211', vehiculo: 'Motocicleta Yamaha (Placa: M-3345)' },
    { nombre: 'David Alfaro', telefono: '7088-7766', vehiculo: 'Bicicleta Eléctrica Trek' },
    { nombre: 'Elena Cabrera', telefono: '7922-3344', vehiculo: 'Motocicleta Benelli (Placa: M-8871)' }
];

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar perfil e interfaz
    document.getElementById('provider-name').textContent = providerInfo.nombre;
    
    // Iniciar reloj en tiempo real
    updateLiveDate();
    setInterval(updateLiveDate, 60000);

    // Cargar datos de la sección inicial (Gestionar Menú)
    loadSectionData('menu-section');
    loadPaymentSettings();
});

// --- FECHA EN TIEMPO REAL ---
function updateLiveDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateText = new Date().toLocaleDateString('es-ES', options);
    document.getElementById('live-date').textContent = dateText.charAt(0).toUpperCase() + dateText.slice(1);
}

// --- NAVEGACIÓN Y CAMBIO DE PANELES ---
function showSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => sec.classList.add('hide'));

    // Mostrar sección activa
    const activeSec = document.getElementById(sectionId);
    if (activeSec) {
        activeSec.classList.remove('hide');
    }

    // Cambiar estado en los botones de navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        if (btn.dataset.section === sectionId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Cambiar título de cabecera
    const titles = {
        'menu-section': 'Gestionar Menú',
        'orders-section': 'Pedidos Recibidos',
        'payments-section': 'Métodos de Pago',
        'analytics-section': 'Analíticas'
    };
    document.getElementById('current-section-title').textContent = titles[sectionId] || 'Panel';

    currentSection = sectionId;
    loadSectionData(sectionId);
}

// --- DESPACHO DE CARGA DE SECCIONES ---
function loadSectionData(sectionId) {
    closeAlert();
    switch (sectionId) {
        case 'menu-section':
            loadPlatillos();
            break;
        case 'orders-section':
            loadOrders();
            break;
        case 'payments-section':
            loadPaymentSettings();
            break;
        case 'analytics-section':
            loadAnalytics();
            break;
    }
}

// --- ALERTAS DEL DASHBOARD ---
function showDashboardAlert(msg, isError = false) {
    const alertBox = document.getElementById('dashboard-alert');
    const alertMsg = document.getElementById('dashboard-alert-msg');
    
    alertBox.className = 'alert-box ' + (isError ? 'error' : '');
    alertMsg.textContent = msg;
    alertBox.classList.remove('hide');
    
    // Desvanecer automáticamente en 4 segundos
    setTimeout(closeAlert, 4000);
}

function closeAlert() {
    document.getElementById('dashboard-alert').classList.add('hide');
}

// --- SECCIÓN: GESTIONAR MENÚ (CRUD) ---

// 1. Obtener Platillos
async function loadPlatillos() {
    const tbody = document.getElementById('platillos-tbody');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center" style="padding: 3rem 0;">
                <i class="fa-solid fa-spinner fa-spin fa-2x text-pink" style="margin-bottom: 1rem;"></i>
                <p style="color: var(--text-secondary);">Cargando el menú del restaurante...</p>
            </td>
        </tr>
    `;

    try {
        const response = await fetch('/api/provider/menus', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            renderPlatillosTable(result.data);
        } else {
            showDashboardAlert(result.message || 'Error al consultar platillos.', true);
        }
    } catch (err) {
        console.error(err);
        showDashboardAlert('Error de red al consultar el menú.', true);
    }
}

// 2. Renderizar Tabla
function renderPlatillosTable(platillos) {
    const tbody = document.getElementById('platillos-tbody');
    tbody.innerHTML = '';

    if (platillos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 3rem 0; color: var(--text-secondary);">
                    <i class="fa-solid fa-utensils fa-2x" style="margin-bottom: 1rem; color: rgba(255,255,255,0.15);"></i>
                    <p>No tienes platillos registrados aún en tu menú.</p>
                </td>
            </tr>
        `;
        return;
    }

    platillos.forEach(platillo => {
        const tr = document.createElement('tr');
        
        // Determinar badges de disponibilidad
        const statusBadge = platillo.disponible
            ? '<span class="badge-status active"><i class="fa-solid fa-circle-check"></i> Activo</span>'
            : '<span class="badge-status inactive"><i class="fa-solid fa-circle-minus"></i> Agotado</span>';

        tr.innerHTML = `
            <td class="text-bold">${escapeHtml(platillo.nombre)}</td>
            <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(platillo.descripcion || '')}">
                ${escapeHtml(platillo.descripcion || 'Sin descripción')}
            </td>
            <td><span class="item-cat">${escapeHtml(platillo.categoria)}</span></td>
            <td class="text-bold">$${parseFloat(platillo.precio).toFixed(2)}</td>
            <td>${statusBadge}</td>
            <td>
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button class="btn btn-secondary btn-xs" onclick="openEditPlatillo(${JSON.stringify(platillo).replace(/"/g, '&quot;')})">
                        <i class="fa-solid fa-pen-to-square"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-xs" onclick="deletePlatillo(${platillo.id})">
                        <i class="fa-solid fa-trash-can"></i> Eliminar
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. Crear / Modificar (POST / PUT)
async function handlePlatilloSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('form-platillo-id').value;
    const nombre = document.getElementById('form-nombre').value;
    const descripcion = document.getElementById('form-desc').value;
    const precio = parseFloat(document.getElementById('form-precio').value);
    const categoria = document.getElementById('form-categoria').value;
    const disponible = document.getElementById('form-disponible').checked ? 1 : 0;

    const payload = { nombre, descripcion, precio, categoria, disponible };
    
    let url = '/api/provider/menus';
    let method = 'POST';

    if (activeModalType === 'edit') {
        url = `/api/provider/menus/${id}`;
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showDashboardAlert(result.message || 'Platillo guardado exitosamente.');
            closeModal();
            loadPlatillos();
        } else {
            showDashboardAlert(result.message || 'Error al guardar el platillo.', true);
        }
    } catch (err) {
        console.error(err);
        showDashboardAlert('Error de red al guardar el platillo.', true);
    }
}

// 4. Eliminar Platillo (DELETE)
async function deletePlatillo(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este platillo del menú de forma permanente?')) {
        return;
    }

    try {
        const response = await fetch(`/api/provider/menus/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showDashboardAlert(result.message || 'Platillo eliminado con éxito.');
            loadPlatillos();
        } else {
            showDashboardAlert(result.message || 'Error al eliminar el platillo.', true);
        }
    } catch (err) {
        console.error(err);
        showDashboardAlert('Error de red al eliminar el platillo.', true);
    }
}

// --- MANEJO DE MODAL (MENÚS) ---
function openModal(type) {
    activeModalType = type;
    const modal = document.getElementById('platillo-modal');
    const form = document.getElementById('platillo-form');
    const title = document.getElementById('modal-title');
    const submitBtn = document.getElementById('modal-submit-btn');

    form.reset();
    document.getElementById('form-platillo-id').value = '';

    if (type === 'add') {
        title.textContent = 'Agregar Nuevo Platillo';
        submitBtn.textContent = 'Guardar Platillo';
    }

    modal.classList.remove('hide');
}

function openEditPlatillo(platillo) {
    openModal('edit');
    document.getElementById('modal-title').textContent = 'Editar Platillo';
    document.getElementById('modal-submit-btn').textContent = 'Actualizar Cambios';
    
    document.getElementById('form-platillo-id').value = platillo.id;
    document.getElementById('form-nombre').value = platillo.nombre;
    document.getElementById('form-desc').value = platillo.descripcion || '';
    document.getElementById('form-precio').value = platillo.precio;
    document.getElementById('form-categoria').value = platillo.categoria;
    document.getElementById('form-disponible').checked = !!platillo.disponible;
}

function closeModal() {
    document.getElementById('platillo-modal').classList.add('hide');
}


// --- SECCIÓN: PEDIDOS RECIBIDOS (LISTADO Y CAMBIO DE ESTADO) ---

// 1. Cargar Órdenes
async function loadOrders() {
    const container = document.getElementById('orders-container');
    container.innerHTML = `
        <div class="text-center" style="grid-column: 1 / -1; padding: 4rem 0;">
            <i class="fa-solid fa-circle-notch fa-spin fa-3x text-pink" style="margin-bottom: 1rem;"></i>
            <p style="color: var(--text-secondary);">Consultando órdenes en tiempo real...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/provider/orders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            renderOrders(result.data);
        } else {
            showDashboardAlert(result.message || 'Error al obtener pedidos.', true);
        }
    } catch (err) {
        console.error(err);
        showDashboardAlert('Error de red al consultar pedidos.', true);
    }
}

// 2. Renderizar Pedidos
function renderOrders(pedidos) {
    const container = document.getElementById('orders-container');
    const badge = document.getElementById('orders-badge');
    container.innerHTML = '';

    // Filtrar pedidos activos para el contador de notificación en la barra lateral
    const activosCount = pedidos.filter(p => ['Pendiente', 'Preparando', 'Enviado'].includes(p.estado)).length;
    if (activosCount > 0) {
        badge.textContent = activosCount;
        badge.classList.remove('hide');
    } else {
        badge.classList.add('hide');
    }

    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 4rem 0; color: var(--text-secondary);">
                <i class="fa-solid fa-receipt fa-3x" style="margin-bottom: 1.5rem; color: rgba(255,255,255,0.15);"></i>
                <h3>Bandeja de pedidos vacía</h3>
                <p>Las órdenes que realicen tus clientes aparecerán enlistadas aquí de inmediato.</p>
            </div>
        `;
        return;
    }

    pedidos.forEach(pedido => {
        const card = document.createElement('article');
        card.className = 'order-card';
        
        // Simular Repartidor de forma persistente basado en el ID de la orden
        const repIndex = pedido.id % repartidoresSemilla.length;
        const repartidor = repartidoresSemilla[repIndex];

        // Items HTML
        let itemsHtml = '';
        pedido.items.forEach(item => {
            itemsHtml += `
                <li>
                    <span>${item.cantidad}x ${escapeHtml(item.platillo_nombre)}</span>
                    <span class="text-bold">$${parseFloat(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                </li>
            `;
        });

        // Crear opciones del selector de estado
        const estados = ['Pendiente', 'Preparando', 'Enviado', 'Entregado', 'Cancelado'];
        let selectOptions = '';
        estados.forEach(est => {
            const selected = pedido.estado.toLowerCase() === est.toLowerCase() ? 'selected' : '';
            selectOptions += `<option value="${est}" ${selected}>Marcar como ${est}</option>`;
        });

        const dateFormatted = new Date(pedido.creado_en).toLocaleString('es-ES', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
        });

        card.innerHTML = `
            <div class="order-card-header">
                <h3>Orden #${pedido.id}</h3>
                <span class="order-date">${dateFormatted}</span>
            </div>
            <div class="order-card-body">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="order-status-badge ${pedido.estado.toLowerCase()}">${pedido.estado}</span>
                </div>
                
                <div class="order-client-info">
                    <p><i class="fa-solid fa-user"></i> <strong>Cliente:</strong> ${escapeHtml(pedido.cliente_nombre)}</p>
                    <p><i class="fa-solid fa-phone"></i> <strong>Teléfono:</strong> ${escapeHtml(pedido.telefono_cliente)}</p>
                    <p><i class="fa-solid fa-location-dot"></i> <strong>Entregar en:</strong> ${escapeHtml(pedido.direccion_entrega)}</p>
                </div>

                <ul class="order-items-list">
                    ${itemsHtml}
                </ul>

                <div class="order-total-row">
                    <span>Monto Total</span>
                    <span>$${parseFloat(pedido.total).toFixed(2)}</span>
                </div>

                <!-- Tarjeta del Repartidor Asignado -->
                <div class="delivery-partner-card">
                    <h4><i class="fa-solid fa-motorcycle"></i> Repartidor Asignado</h4>
                    <div class="delivery-info-row">
                        <div class="delivery-avatar">
                            <i class="fa-solid fa-user-ninja"></i>
                        </div>
                        <div class="delivery-meta">
                            <h5>${repartidor.nombre}</h5>
                            <p>${repartidor.vehiculo}</p>
                            <p style="font-size: 0.75rem; color: var(--accent-indigo);"><i class="fa-solid fa-phone" style="font-size: 0.7rem;"></i> ${repartidor.telefono}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="order-actions">
                <select onchange="updateOrderStatus(${pedido.id}, this.value)">
                    ${selectOptions}
                </select>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. Actualizar Estado de Pedido (PUT)
async function updateOrderStatus(pedidoId, nuevoEstado) {
    try {
        const response = await fetch(`/api/provider/orders/${pedidoId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showDashboardAlert(`Pedido #${pedidoId} actualizado a "${nuevoEstado}" exitosamente.`);
            loadOrders(); // Recargar la sección para reflejar cambios y actualizar insignias
        } else {
            showDashboardAlert(result.message || 'Error al actualizar pedido.', true);
        }
    } catch (err) {
        console.error(err);
        showDashboardAlert('Error de red al actualizar estado del pedido.', true);
    }
}


// --- SECCIÓN: MÉTODOS DE PAGO (PERSISTENCIA LOCAL POR PROVEEDOR) ---
function loadPaymentSettings() {
    const key = `payments_settings_${providerInfo.id}`;
    const defaultSettings = { cash: true, card: true, bank: false };
    const settings = JSON.parse(localStorage.getItem(key)) || defaultSettings;

    document.getElementById('pay-cash').checked = settings.cash;
    document.getElementById('pay-card').checked = settings.card;
    document.getElementById('pay-bank').checked = settings.bank;
}

function savePaymentSettings() {
    const key = `payments_settings_${providerInfo.id}`;
    const settings = {
        cash: document.getElementById('pay-cash').checked,
        card: document.getElementById('pay-card').checked,
        bank: document.getElementById('pay-bank').checked
    };

    localStorage.setItem(key, JSON.stringify(settings));
    showDashboardAlert('Configuración de métodos de pago actualizada de inmediato.');
}


// --- SECCIÓN: ANALÍTICAS ---
async function loadAnalytics() {
    try {
        const response = await fetch('/api/provider/analytics', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            renderAnalytics(result.data);
        } else {
            showDashboardAlert(result.message || 'Error al generar analíticas.', true);
        }
    } catch (err) {
        console.error(err);
        showDashboardAlert('Error de red al cargar analíticas.', true);
    }
}

function renderAnalytics(data) {
    const res = data.resumen_general;
    const top = data.top_platillos;

    // Inyectar Métricas Generales
    document.getElementById('metric-revenue').textContent = `$${parseFloat(res.ingresos_totales || 0).toFixed(2)}`;
    document.getElementById('metric-orders').textContent = res.total_pedidos || 0;
    document.getElementById('metric-completed').textContent = res.pedidos_entregados || 0;

    // Calcular Tasa de Cancelación
    const total = res.total_pedidos || 0;
    const cancelados = res.pedidos_cancelados || 0;
    const tasaCancelacion = total > 0 ? ((cancelados / total) * 100).toFixed(1) : 0;
    document.getElementById('metric-canceled').textContent = `${tasaCancelacion}%`;

    // Inyectar Ranking de Platillos
    const list = document.getElementById('top-menus-list');
    list.innerHTML = '';

    if (top.length === 0) {
        list.innerHTML = `
            <li class="text-center" style="padding: 2rem 0; color: var(--text-secondary); display: block;">
                <i class="fa-solid fa-chart-bar fa-2x" style="margin-bottom: 0.8rem; color: rgba(255,255,255,0.1);"></i>
                <p>Aún no hay suficientes ventas registradas para este restaurante.</p>
            </li>
        `;
        return;
    }

    top.forEach((item, index) => {
        const li = document.createElement('li');
        const rankClass = index === 0 ? 'rank-1' : '';

        li.innerHTML = `
            <div class="item-rank-meta">
                <div class="item-rank ${rankClass}">${index + 1}</div>
                <div>
                    <span class="item-name">${escapeHtml(item.platillo_nombre)}</span><br>
                    <span class="item-cat">${escapeHtml(item.categoria)}</span>
                </div>
            </div>
            <div class="item-sales-data">
                <span class="item-sales-qty text-bold">${item.total_unidades_vendidas} vendidos</span><br>
                <span class="item-sales-revenue">Ingreso: $${parseFloat(item.ingresos_totales).toFixed(2)}</span>
            </div>
        `;
        list.appendChild(li);
    });
}


// --- CIERRE DE SESIÓN ---
function handleLogout() {
    if (confirm('¿Deseas cerrar la sesión del portal de proveedores?')) {
        localStorage.removeItem('provider_token');
        localStorage.removeItem('provider_info');
        window.location.href = 'login_proveedor.html';
    }
}

// --- UTILERÍA DE INYECCIÓN SEGURA (PREVENIR XSS) ---
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
