/**
 * =============================================================================
 * INTEGRATED SPA JAVASCRIPT: app.js
 * Propósito: Interactividad completa para el Consumidor y el Proveedor (Restaurante)
 * =============================================================================
 */

// --- ESTADO GLOBAL ---
let currentUser = null;
let currentUserToken = null;
let currentProvider = null;
let providerToken = null;

// Filtros y Búsqueda del Cliente
let activeCategory = 'all';
let searchQuery = '';
let currentSort = 'relevant';
let debounceTimer = null;

// Detalle del Platillo seleccionado por el cliente
let selectedMenuItem = null;
let selectedQuantity = 1;

// Simulación de pedido activo del cliente
let activeOrder = null;
let orderSimulationInterval = null;

// Estado del Dashboard del Proveedor
let activeProviderSection = 'p-section-menu';
let activeModalType = 'add'; // 'add' o 'edit'

const repartidoresSemilla = [
    { nombre: 'Carlos Ruiz', telefono: '7890-1234', vehiculo: 'Motocicleta Honda (Placa: M-5421)' },
    { nombre: 'Sofía Martínez', telefono: '7122-8899', vehiculo: 'Motocicleta Suzuki (Placa: M-9081)' },
    { nombre: 'Jorge Lemus', telefono: '7433-2211', vehiculo: 'Motocicleta Yamaha (Placa: M-3345)' },
    { nombre: 'David Alfaro', telefono: '7088-7766', vehiculo: 'Bicicleta Eléctrica Trek' },
    { nombre: 'Elena Cabrera', telefono: '7922-3344', vehiculo: 'Motocicleta Benelli (Placa: M-8871)' }
];

// Fallback images for food categories
const categoryFallbacks = {
    hamburguesa: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
    pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
    sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80",
    postres: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80",
    postre: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80",
    combos: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80",
    antojos: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80"
};

const driverAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
];

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initSessions();
    setupEventListeners();
    fetchPlatillos();
});

// Cargar sesiones persistidas en localStorage
function initSessions() {
    // Cliente
    const savedUser = localStorage.getItem("copilots_user");
    const savedClientToken = localStorage.getItem("copilots_user_token");
    if (savedUser && savedClientToken) {
        currentUser = JSON.parse(savedUser);
        currentUserToken = savedClientToken;
        updateHeaderUI();
    }
    
    // Proveedor
    const savedToken = localStorage.getItem("provider_token");
    const savedInfo = localStorage.getItem("provider_info");
    if (savedToken && savedInfo) {
        providerToken = savedToken;
        currentProvider = JSON.parse(savedInfo);
        document.getElementById("sidebar-provider-name").textContent = currentProvider.nombre;
    }
}

// ==========================================================================
// RUTAS Y VISTAS DE LA SPA
// ==========================================================================
function showView(viewName) {
    const views = {
        'dashboard': document.getElementById("view-dashboard"),
        'auth': document.getElementById("view-auth"),
        'tracker': document.getElementById("view-tracker"),
        'provider-auth': document.getElementById("view-provider-auth"),
        'provider-dashboard': document.getElementById("view-provider-dashboard")
    };

    // Ocultar todas
    Object.keys(views).forEach(key => {
        if (views[key]) views[key].classList.add("hidden");
    });

    // Mostrar activa
    if (views[viewName]) {
        views[viewName].classList.remove("hidden");
    }

    // Gestionar visualización de cabeceras/elementos según el rol activo
    const headerLocation = document.getElementById("header-location");
    const headerActions = document.querySelector(".user-status-wrapper");
    const footer = document.getElementById("app-footer");

    if (viewName === 'provider-dashboard') {
        // En el panel del proveedor ocultamos los controles del cliente en el header
        if (headerLocation) headerLocation.classList.add("hidden");
        if (headerActions) headerActions.classList.add("hidden");
        if (footer) footer.classList.add("hidden");
    } else {
        // En vistas cliente mostramos los elementos correspondientes
        if (headerLocation) headerLocation.classList.remove("hidden");
        if (headerActions) headerActions.classList.remove("hidden");
        if (footer) footer.classList.remove("hidden");
    }

    window.scrollTo(0, 0);

    // Detener la simulación de tracker si se sale de él y ya finalizó
    if (viewName !== 'tracker' && orderSimulationInterval && progressFinished()) {
        clearInterval(orderSimulationInterval);
    }
}

function progressFinished() {
    const progressLine = document.getElementById("route-progress-line");
    return progressLine && progressLine.style.strokeDashoffset === "0";
}

// ==========================================================================
// MANEJADORES DE EVENTOS PRINCIPALES
// ==========================================================================
function setupEventListeners() {
    // Navegación Básica del Header
    document.getElementById("btn-home").addEventListener("click", () => {
        if (currentProvider && !document.getElementById("view-provider-dashboard").classList.contains("hidden")) {
            // Si está en el dashboard del proveedor, se mantiene ahí
            showView("provider-dashboard");
        } else {
            showView("dashboard");
            fetchPlatillos();
        }
    });

    document.getElementById("btn-back-dashboard").addEventListener("click", () => {
        showView("dashboard");
        fetchPlatillos();
    });

    // Botón para acceder al portal de socios (restaurantes)
    document.getElementById("btn-portal-socios").addEventListener("click", () => {
        if (providerToken && currentProvider) {
            showView("provider-dashboard");
            loadProviderSection("p-section-menu");
        } else {
            showView("provider-auth");
            switchProviderAuthTab("login");
        }
    });

    // Botón para acceder al portal de repartidores
    document.getElementById("btn-portal-repartidores").addEventListener("click", () => {
        window.location.href = "/repartidor";
    });

    // Toggles de la vista de autenticación de clientes
    document.getElementById("btn-show-login").addEventListener("click", () => {
        showView("auth");
        switchAuthTab("login");
    });
    document.getElementById("btn-show-register").addEventListener("click", () => {
        showView("auth");
        switchAuthTab("register");
    });

    // Desplegable de perfil del cliente
    document.getElementById("user-avatar-trigger").addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("profile-dropdown").classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
        const dropdown = document.getElementById("profile-dropdown");
        if (dropdown) dropdown.classList.add("hidden");
    });

    // Autenticación de clientes
    document.getElementById("tab-login").addEventListener("click", () => switchAuthTab("login"));
    document.getElementById("tab-register").addEventListener("click", () => switchAuthTab("register"));
    document.getElementById("form-login").addEventListener("submit", handleCustomerLogin);
    document.getElementById("form-register").addEventListener("submit", handleCustomerRegister);
    document.getElementById("btn-logout").addEventListener("click", handleCustomerLogout);
    document.getElementById("btn-go-history").addEventListener("click", () => {
        if (activeOrder) {
            showView("tracker");
        } else {
            showToast("No tienes pedidos activos en curso actualmente.", true);
        }
    });

    // Dirección de Entrega del Cliente
    const selectAddressEl = document.getElementById("select-address");
    selectAddressEl.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "new") {
            const label = prompt("Escribe una etiqueta para la dirección (ej. Gimnasio, Apartamento):");
            if (!label) { selectAddressEl.value = "home"; return; }
            const details = prompt(`Ingresa la dirección detallada para "${label}":`);
            if (!details) { selectAddressEl.value = "home"; return; }
            
            const newOption = document.createElement("option");
            newOption.value = "custom_" + Date.now();
            newOption.textContent = `${label} (${details})`;
            selectAddressEl.insertBefore(newOption, selectAddressEl.lastElementChild);
            selectAddressEl.value = newOption.value;
            showToast(`Dirección agregada: ${newOption.textContent}`);
        } else {
            showToast(`Dirección de entrega actualizada.`);
        }
    });

    // Búsqueda de Platillos con Debounce
    const searchInput = document.getElementById("search-menus");
    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        searchQuery = e.target.value.trim();
        debounceTimer = setTimeout(fetchPlatillos, 300);
    });

    document.getElementById("btn-search-trigger").addEventListener("click", () => {
        searchQuery = searchInput.value.trim();
        fetchPlatillos();
    });

    // Filtros de Categorías
    const categoriesContainer = document.getElementById("categories-container");
    categoriesContainer.addEventListener("click", (e) => {
        const pill = e.target.closest(".filter-pill");
        if (!pill) return;
        
        categoriesContainer.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        
        activeCategory = pill.dataset.category;
        fetchPlatillos();
    });

    // Ordenamiento de Platillos
    document.getElementById("sort-menus").addEventListener("change", (e) => {
        currentSort = e.target.value;
        fetchPlatillos();
    });

    // Acciones del modal de platillo del cliente
    document.getElementById("btn-close-modal").addEventListener("click", closeProductModal);
    document.getElementById("modal-close-overlay").addEventListener("click", closeProductModal);
    document.getElementById("qty-minus").addEventListener("click", () => updateQuantity(-1));
    document.getElementById("qty-plus").addEventListener("click", () => updateQuantity(1));
    document.getElementById("btn-place-order").addEventListener("click", handlePlaceOrder);

    // Autenticación de Proveedores
    document.getElementById("tab-provider-login").addEventListener("click", () => switchProviderAuthTab("login"));
    document.getElementById("tab-provider-register").addEventListener("click", () => switchProviderAuthTab("register"));
    document.getElementById("form-provider-login").addEventListener("submit", handleProviderLogin);
    document.getElementById("form-provider-register").addEventListener("submit", handleProviderRegister);

    // Acciones y Navegación del Dashboard del Proveedor
    const providerNavBtns = document.querySelectorAll(".provider-nav-btn");
    providerNavBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const section = e.currentTarget.dataset.section;
            loadProviderSection(section);
        });
    });

    document.getElementById("btn-provider-exit").addEventListener("click", () => {
        showView("dashboard");
        fetchPlatillos();
    });
    document.getElementById("btn-provider-logout").addEventListener("click", handleProviderLogout);

    // CRUD del Proveedor
    document.getElementById("btn-add-platillo").addEventListener("click", () => openPlatilloModal("add"));
    document.getElementById("btn-close-platillo-modal").addEventListener("click", closePlatilloModal);
    document.getElementById("platillo-modal-overlay").addEventListener("click", closePlatilloModal);
    document.getElementById("btn-cancel-platillo").addEventListener("click", closePlatilloModal);
    document.getElementById("platillo-form").addEventListener("submit", handlePlatilloSubmit);
    document.getElementById("btn-refresh-orders").addEventListener("click", fetchProviderOrders);

    // Toggles de métodos de pago
    document.getElementById("prov-pay-cash").addEventListener("change", savePaymentSettings);
    document.getElementById("prov-pay-card").addEventListener("change", savePaymentSettings);
    document.getElementById("prov-pay-bank").addEventListener("change", savePaymentSettings);
}

// ==========================================================================
// CONTROL DE AUTENTICACIÓN CLIENTE
// ==========================================================================
function switchAuthTab(tab) {
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");

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

async function handleCustomerLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (password.length < 6) {
        showToast("La contraseña debe tener al menos 6 caracteres.", true);
        return;
    }

    try {
        const response = await fetch('/api/customer/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();

        if (response.ok && result.success) {
            currentUser = {
                id: result.cliente.id,
                name: result.cliente.nombre,
                lastname: result.cliente.apellido,
                email: result.cliente.email
            };
            currentUserToken = result.token;
            localStorage.setItem("copilots_user", JSON.stringify(currentUser));
            localStorage.setItem("copilots_user_token", currentUserToken);

            showToast(`¡Bienvenido de vuelta, ${currentUser.name}!`);
            updateHeaderUI();
            e.target.reset();
            showView("dashboard");
        } else {
            showToast(result.message || "Credenciales inválidas.", true);
        }
    } catch (err) {
        console.error(err);
        showToast("Error de red al intentar iniciar sesión.", true);
    }
}

async function handleCustomerRegister(e) {
    e.preventDefault();
    const name = document.getElementById("register-name").value.trim();
    const lastname = document.getElementById("register-lastname").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;

    if (password.length < 6) {
        showToast("La contraseña debe tener al menos 6 caracteres.", true);
        return;
    }

    try {
        const response = await fetch('/api/customer/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: name, apellido: lastname, email, password })
        });
        const result = await response.json();

        if (response.ok && result.success) {
            // Auto login después del registro
            const loginRes = await fetch('/api/customer/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const loginResult = await loginRes.json();

            if (loginRes.ok && loginResult.success) {
                currentUser = {
                    id: loginResult.cliente.id,
                    name: loginResult.cliente.nombre,
                    lastname: loginResult.cliente.apellido,
                    email: loginResult.cliente.email
                };
                currentUserToken = loginResult.token;
                localStorage.setItem("copilots_user", JSON.stringify(currentUser));
                localStorage.setItem("copilots_user_token", currentUserToken);

                showToast(`¡Cuenta creada con éxito! Bienvenido, ${currentUser.name}`);
                updateHeaderUI();
                e.target.reset();
                showView("dashboard");
            }
        } else {
            showToast(result.message || "Error al registrar la cuenta.", true);
        }
    } catch (err) {
        console.error(err);
        showToast("Error de red al intentar registrarse.", true);
    }
}

function handleCustomerLogout() {
    currentUser = null;
    currentUserToken = null;
    localStorage.removeItem("copilots_user");
    localStorage.removeItem("copilots_user_token");
    updateHeaderUI();
    showToast("Sesión cerrada correctamente");
    showView("dashboard");
}

function updateHeaderUI() {
    const anon = document.getElementById("user-anonymous");
    const logged = document.getElementById("user-logged");
    
    if (currentUser) {
        anon.classList.add("hidden");
        logged.classList.remove("hidden");
        
        document.getElementById("profile-fullname").textContent = `${currentUser.name} ${currentUser.lastname}`;
        document.getElementById("profile-email").textContent = currentUser.email;
        document.getElementById("profile-initials").textContent = 
            (currentUser.name.charAt(0) + (currentUser.lastname ? currentUser.lastname.charAt(0) : "")).toUpperCase();
    } else {
        anon.classList.remove("hidden");
        logged.classList.add("hidden");
    }
}

// ==========================================================================
// CONSULTA DE PLATILLOS DESDE MYSQL (CONSUMIDOR)
// ==========================================================================
async function fetchPlatillos() {
    const grid = document.getElementById("menus-grid");
    
    // Mostar loader
    grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 0;">
          <i class="fa-solid fa-circle-notch fa-spin fa-3x" style="margin-bottom: 1.5rem; color: var(--primary);"></i>
          <h3>Buscando en el Menú</h3>
          <p>Consultando platillos y calculando semáforo en tiempo real...</p>
        </div>
    `;

    try {
        const params = new URLSearchParams();
        if (activeCategory && activeCategory !== 'all') {
            params.append('categoria', activeCategory);
        }
        if (searchQuery) {
            params.append('buscar', searchQuery);
        }

        const response = await fetch(`/api/platillos?${params.toString()}`);
        if (!response.ok) {
            throw new Error('No se pudo establecer conexión con el servidor.');
        }

        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            let platillos = result.data;
            
            // Ordenar en frontend
            if (currentSort === 'price-asc') {
                platillos.sort((a, b) => a.price - b.price);
            } else if (currentSort === 'price-desc') {
                platillos.sort((a, b) => b.price - a.price);
            } else if (currentSort === 'time-asc') {
                platillos.sort((a, b) => a.tiempo_entrega_min - b.tiempo_entrega_min);
            } else if (currentSort === 'rating-desc') {
                // Al no tener reviews complejas en base de datos, usamos una calif aleatoria estática basada en el id
                platillos.sort((a, b) => (5 - (b.id % 5)*0.1) - (5 - (a.id % 5)*0.1));
            }

            renderPlatillos(platillos);
        } else {
            renderEmptyState();
        }
    } catch (error) {
        console.error('Error al cargar platillos:', error);
        renderErrorState(error.message);
    }
}

function renderPlatillos(platillos) {
    const grid = document.getElementById("menus-grid");
    grid.innerHTML = '';
    
    document.getElementById("results-count").textContent = `Mostrando ${platillos.length} menús`;

    platillos.forEach(platillo => {
        const card = document.createElement("div");
        card.className = "menu-card";
        
        // Mapeo semáforo
        let colorClass = 'moderate';
        let colorLabel = 'Moderado';
        if (platillo.semaforo_color === 'Verde') {
            colorClass = 'budget';
            colorLabel = 'Económico';
        } else if (platillo.semaforo_color === 'Rojo') {
            colorClass = 'expensive';
            colorLabel = 'Premium';
        }

        const fallbackImg = categoryFallbacks[platillo.categoria.toLowerCase()] || categoryFallbacks['hamburguesa'];

        // Estructura de tarjeta adaptada
        card.innerHTML = `
          <div class="card-image-panel">
            <img src="${fallbackImg}" alt="${platillo.platillo_nombre}" onerror="this.src='${categoryFallbacks['hamburguesa']}'">
            <div class="card-badge-container"></div>
            <div class="card-right-badges">
              <span class="price-tag ${colorClass}">${colorLabel}</span>
            </div>
          </div>
          <div class="card-content" style="padding: 16px;">
            <div class="provider-row" style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span class="provider-tag" style="font-weight:700; color:var(--text-muted);"><i class="fa-solid fa-store"></i> ${platillo.restaurante_nombre}</span>
              <span class="provider-rating-small" style="color:var(--warning); font-weight:700;">
                <i class="fa-solid fa-star"></i> ${(5 - (platillo.id % 5)*0.1).toFixed(1)}
              </span>
            </div>
            <h3 class="food-title" style="font-size:1.15rem; margin-bottom:6px;">${platillo.platillo_nombre}</h3>
            <p class="food-desc-short" style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px; height: 38px; overflow: hidden; text-overflow: ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
              ${platillo.platillo_descripcion || 'Delicioso platillo preparado con los ingredientes más frescos de la casa.'}
            </p>
            <div class="card-footer" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:10px;">
              <div class="price-box">
                <span class="price-current" style="font-weight:800; font-size:1.2rem; color:var(--primary);">Q${parseFloat(platillo.price || platillo.precio).toFixed(2)}</span>
              </div>
              <div class="delivery-meta" style="font-size:0.8rem; color:var(--text-muted); display:flex; gap:8px;">
                <span><i class="fa-solid fa-clock"></i> ${platillo.tiempo_entrega_min} min</span>
                <span><i class="fa-solid fa-motorcycle"></i> ${platillo.distancia_km} km</span>
              </div>
            </div>
          </div>
        `;

        card.addEventListener("click", () => openProductModal(platillo));
        grid.appendChild(card);
    });
}

function renderEmptyState() {
    const grid = document.getElementById("menus-grid");
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 0;">
        <i class="fa-solid fa-cookie-bite empty-icon" style="font-size:3rem; color:var(--text-muted); margin-bottom:1rem;"></i>
        <h3>No encontramos menús</h3>
        <p>Prueba buscando con palabras clave diferentes o seleccionando otra categoría.</p>
      </div>
    `;
    document.getElementById("results-count").textContent = `Mostrando 0 menús`;
}

function renderErrorState(message) {
    const grid = document.getElementById("menus-grid");
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 0; border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: var(--radius-md);">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:var(--danger); margin-bottom:1rem;"></i>
        <h3>Error al Conectar con MySQL</h3>
        <p>${message}</p>
        <button class="btn btn-primary" id="btn-retry-fetch" style="margin-top: 1rem;"><i class="fa-solid fa-rotate"></i> Reintentar</button>
      </div>
    `;
    document.getElementById("btn-retry-fetch")?.addEventListener("click", fetchPlatillos);
}

// ==========================================================================
// MODAL DE DETALLE DEL PRODUCTO Y COMPRA (CLIENTE)
// ==========================================================================
function openProductModal(platillo) {
    selectedMenuItem = platillo;
    selectedQuantity = 1;
    updateQuantityUI();

    const fallbackImg = categoryFallbacks[platillo.categoria.toLowerCase()] || categoryFallbacks['hamburguesa'];
    
    // Completar elementos del modal
    document.getElementById("modal-food-img").src = fallbackImg;
    document.getElementById("modal-food-name").textContent = platillo.platillo_nombre;
    document.getElementById("modal-description").textContent = platillo.platillo_descripcion || 'Preparado con ingredientes premium frescos de temporada.';
    document.getElementById("modal-price").textContent = `Q${parseFloat(platillo.price || platillo.precio).toFixed(2)}`;
    
    // Proveedor
    document.getElementById("modal-provider-name").textContent = platillo.restaurante_nombre;
    document.getElementById("modal-provider-address").textContent = `Distancia: ${platillo.distancia_km} km • Tiempo: ${platillo.tiempo_entrega_min} min`;
    
    const rating = (5 - (platillo.id % 5)*0.1);
    document.getElementById("modal-provider-rating-score").textContent = rating.toFixed(1);
    document.getElementById("modal-provider-reviews-count").textContent = `(${(platillo.id * 7) % 150 + 10} reseñas)`;
    
    // Estrellas
    const stars = document.getElementById("modal-provider-stars");
    stars.innerHTML = '';
    const fullStars = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.innerHTML += `<i class="fa-solid fa-star" style="color:var(--warning);"></i>`;
        } else {
            stars.innerHTML += `<i class="fa-regular fa-star" style="color:var(--text-muted);"></i>`;
        }
    }

    // Reseñas estáticas basadas en el platillo
    const reviewsList = document.getElementById("modal-reviews-list");
    reviewsList.innerHTML = `
      <div class="review-item" style="margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
        <div class="review-user" style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700;">
          <span>Usuario_${platillo.id}</span>
          <span style="color:var(--warning);"><i class="fa-solid fa-star"></i> 5.0</span>
        </div>
        <p class="review-comment" style="font-size:0.8rem; color:var(--text-muted);">"¡Súper recomendado! Muy buen sabor y entrega bastante puntual."</p>
      </div>
    `;

    document.getElementById("product-modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeProductModal() {
    document.getElementById("product-modal").classList.add("hidden");
    document.body.style.overflow = "";
}

function updateQuantity(amount) {
    const next = selectedQuantity + amount;
    if (next >= 1 && next <= 10) {
        selectedQuantity = next;
        updateQuantityUI();
    }
}

function updateQuantityUI() {
    document.getElementById("qty-count").textContent = selectedQuantity;
    if (selectedMenuItem) {
        const price = parseFloat(selectedMenuItem.price || selectedMenuItem.precio);
        document.getElementById("modal-total-price").textContent = `Q${(price * selectedQuantity).toFixed(2)}`;
    }
}

// ==========================================================================
// CONFIRMAR PEDIDO E INSERCIÓN EN MYSQL (TRANSACCIÓN REAL)
// ==========================================================================
async function handlePlaceOrder() {
    if (!currentUser) {
        closeProductModal();
        showToast("Por favor inicia sesión para poder realizar un pedido.", true);
        showView("auth");
        return;
    }

    if (!selectedMenuItem) return;

    const price = parseFloat(selectedMenuItem.price || selectedMenuItem.precio);
    const total = price * selectedQuantity;

    // Obtener dirección del select
    const selectAddress = document.getElementById("select-address");
    const addressText = selectAddress.options[selectAddress.selectedIndex].text;

    // Datos del pedido a enviar
    const orderData = {
        id_restaurante: selectedMenuItem.id_restaurante,
        cliente_nombre: `${currentUser.name} ${currentUser.lastname}`,
        direccion_entrega: addressText,
        telefono_cliente: "502-55551234", // Teléfono estático/simulado
        total: total,
        items: [
            {
                id_platillo: selectedMenuItem.id,
                cantidad: selectedQuantity,
                precio_unitario: price
            }
        ]
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUserToken}`
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            closeProductModal();
            showToast("¡Pedido confirmado y registrado en la base de datos! 🚀");
            
            // Iniciar tracking visual
            activeOrder = {
                orderId: `#COP-${result.pedido_id}`,
                merchantName: selectedMenuItem.restaurante_nombre,
                merchantAddress: selectedMenuItem.direccion || "Dirección de Restaurante",
                eta: `${selectedMenuItem.tiempo_entrega_min} min`,
                step: 1
            };

            showView("tracker");

            // Rellenar datos en el tracker
            document.getElementById("track-order-id").textContent = activeOrder.orderId;
            document.getElementById("track-merchant-name").textContent = activeOrder.merchantName;
            document.getElementById("track-merchant-address").textContent = activeOrder.merchantAddress;
            document.getElementById("track-eta").textContent = activeOrder.eta;
            
            // Repartidor inicial (se actualizará en tiempo real)
            document.getElementById("driver-name").textContent = "Buscando repartidor...";
            document.getElementById("driver-avatar").src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

            startRealOrderTracking(result.pedido_id);
        } else {
            showToast(result.message || "Error al procesar el pedido.", true);
        }
    } catch (err) {
        console.error(err);
        showToast("Error de red al procesar el pedido en MySQL.", true);
    }
}

// Seguimiento real del pedido en base de datos
function startRealOrderTracking(orderId) {
    if (orderSimulationInterval) clearInterval(orderSimulationInterval);

    const steps = [
        document.getElementById("step-1"),
        document.getElementById("step-2"),
        document.getElementById("step-3"),
        document.getElementById("step-4")
    ];

    const progressLine = document.getElementById("route-progress-line");
    const bike = document.getElementById("map-driver-bike");

    progressLine.style.strokeDashoffset = "400";
    bike.setAttribute("transform", "translate(100, 300)");

    steps.forEach((el, index) => {
        if (index === 0) el.classList.add("active");
        else el.classList.remove("active");
    });

    let lastState = 'Pendiente';
    let progressPercent = 0;
    
    // Animación del icono de la moto
    let currentX = 100, currentY = 300;
    let targetX = 100, targetY = 300;
    
    const animateBike = () => {
        if (Math.abs(currentX - targetX) > 0.5 || Math.abs(currentY - targetY) > 0.5) {
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;
            bike.setAttribute("transform", `translate(${currentX}, ${currentY})`);
            requestAnimationFrame(animateBike);
        }
    };

    orderSimulationInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            if (!response.ok) return;
            const data = await response.json();
            
            if (data.success && data.order) {
                const estado = data.order.estado;
                
                // Actualizar info del repartidor si está asignado
                if (data.rider) {
                    document.getElementById("driver-name").textContent = data.rider.nombre;
                    const avatar = driverAvatars[data.order.id % driverAvatars.length];
                    document.getElementById("driver-avatar").src = avatar;
                } else {
                    document.getElementById("driver-name").textContent = "Buscando repartidor...";
                    document.getElementById("driver-avatar").src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
                }

                // Manejo de los estados en la interfaz
                if (estado === 'Pendiente') {
                    steps[0].classList.add("active");
                    steps[1].classList.remove("active");
                    steps[2].classList.remove("active");
                    steps[3].classList.remove("active");
                    progressPercent = 0;
                    document.getElementById("track-eta").textContent = `${data.order.tiempo_entrega_min} min`;
                } else if (estado === 'Preparando') {
                    if (lastState === 'Pendiente') {
                        showToast("¡El restaurante ha comenzado a preparar tu comida!");
                    }
                    steps[0].classList.add("active");
                    steps[1].classList.add("active");
                    steps[2].classList.remove("active");
                    steps[3].classList.remove("active");
                    progressPercent = 33;
                    document.getElementById("track-eta").textContent = `${Math.max(5, data.order.tiempo_entrega_min - 5)} min`;
                } else if (estado === 'Enviado') {
                    if (lastState === 'Pendiente' || lastState === 'Preparando') {
                        showToast("¡El repartidor lleva tu pedido en camino!");
                    }
                    steps[0].classList.add("active");
                    steps[1].classList.add("active");
                    steps[2].classList.add("active");
                    steps[3].classList.remove("active");
                    progressPercent = 66;
                    document.getElementById("track-eta").textContent = "5 min";
                } else if (estado === 'Entregado') {
                    showToast("¡Pedido entregado con éxito! ¡Que disfrutes tu comida!");
                    steps[0].classList.add("active");
                    steps[1].classList.add("active");
                    steps[2].classList.add("active");
                    steps[3].classList.add("active");
                    progressPercent = 100;
                    document.getElementById("track-eta").textContent = "¡Entregado!";
                    clearInterval(orderSimulationInterval);
                    activeOrder = null;
                }
                
                // Mover la moto en el SVG
                const offset = 400 - (400 * (progressPercent / 100));
                progressLine.style.strokeDashoffset = offset;
                
                const t = progressPercent / 100;
                targetX = Math.pow(1 - t, 2) * 100 + 2 * (1 - t) * t * 250 + Math.pow(t, 2) * 400;
                targetY = Math.pow(1 - t, 2) * 300 + 2 * (1 - t) * t * 200 + Math.pow(t, 2) * 100;
                animateBike();

                lastState = estado;
            }
        } catch (e) {
            console.error("Error polling order status:", e);
        }
    }, 3000);
}

// ==========================================================================
// CONTROL DE AUTENTICACIÓN PROVEEDORES (MYSQL SEGURO)
// ==========================================================================
function switchProviderAuthTab(tab) {
    const tabLogin = document.getElementById("tab-provider-login");
    const tabRegister = document.getElementById("tab-provider-register");
    const formLogin = document.getElementById("form-provider-login");
    const formRegister = document.getElementById("form-provider-register");

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

async function handleProviderLogin(e) {
    e.preventDefault();
    const email = document.getElementById("provider-login-email").value.trim();
    const password = document.getElementById("provider-login-password").value;

    try {
        const response = await fetch('/api/provider/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast("¡Inicio de sesión exitoso! Redirigiendo...", false);
            
            providerToken = data.token;
            currentProvider = data.restaurante;
            
            localStorage.setItem('provider_token', data.token);
            localStorage.setItem('provider_info', JSON.stringify(data.restaurante));

            document.getElementById("sidebar-provider-name").textContent = currentProvider.nombre;
            e.target.reset();

            // Ir al panel del proveedor
            setTimeout(() => {
                showView("provider-dashboard");
                loadProviderSection("p-section-menu");
            }, 1000);
        } else {
            showToast(data.message || 'Error en las credenciales del restaurante.', true);
        }
    } catch (err) {
        console.error(err);
        showToast('Error al conectar con el servidor de base de datos.', true);
    }
}

async function handleProviderRegister(e) {
    e.preventDefault();
    const nombre = document.getElementById("provider-reg-name").value.trim();
    const email = document.getElementById("provider-reg-email").value.trim();
    const telefono = document.getElementById("provider-reg-tel").value.trim();
    const direccion = document.getElementById("provider-reg-dir").value.trim();
    const distancia_km = parseFloat(document.getElementById("provider-reg-dist").value);
    const tiempo_entrega_min = parseInt(document.getElementById("provider-reg-time").value);
    const password = document.getElementById("provider-reg-password").value;

    try {
        const response = await fetch('/api/provider/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                direccion,
                telefono,
                email,
                password,
                distancia_km,
                tiempo_entrega_min
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast("¡Comercio registrado con éxito! Inicia sesión para continuar.", false);
            e.target.reset();
            setTimeout(() => {
                switchProviderAuthTab("login");
            }, 1500);
        } else {
            showToast(data.message || 'Error en el registro del comercio.', true);
        }
    } catch (err) {
        console.error(err);
        showToast('Error al conectar con el servidor.', true);
    }
}

function handleProviderLogout() {
    if (confirm("¿Estás seguro de que deseas cerrar sesión del portal de socios?")) {
        providerToken = null;
        currentProvider = null;
        localStorage.removeItem('provider_token');
        localStorage.removeItem('provider_info');
        showToast("Sesión de restaurante cerrada.");
        showView("dashboard");
    }
}

// ==========================================================================
// VISTA PANEL PROVEEDOR (CRUD DE MENÚS, PEDIDOS Y ANALÍTICA)
// ==========================================================================
function loadProviderSection(sectionId) {
    const sections = document.querySelectorAll(".provider-section");
    sections.forEach(sec => sec.classList.add("hidden"));

    const activeSec = document.getElementById(sectionId);
    if (activeSec) activeSec.classList.remove("hidden");

    // Marcar active button en sidebar
    const sidebarBtns = document.querySelectorAll(".provider-nav-btn");
    sidebarBtns.forEach(btn => {
        if (btn.dataset.section === sectionId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Cambiar Título del header del panel
    const titleMap = {
        'p-section-menu': 'Gestionar Menú',
        'p-section-orders': 'Pedidos Recibidos',
        'p-section-payments': 'Métodos de Pago',
        'p-section-analytics': 'Analíticas del Comercio'
    };
    document.getElementById("provider-section-title").textContent = titleMap[sectionId] || "Panel";

    // Actualizar fecha
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateText = new Date().toLocaleDateString('es-ES', options);
    document.getElementById("provider-live-date").textContent = dateText.charAt(0).toUpperCase() + dateText.slice(1);

    activeProviderSection = sectionId;

    // Despachar carga
    if (sectionId === 'p-section-menu') fetchProviderMenus();
    else if (sectionId === 'p-section-orders') fetchProviderOrders();
    else if (sectionId === 'p-section-payments') loadPaymentSettings();
    else if (sectionId === 'p-section-analytics') fetchProviderAnalytics();
}

// 1. GESTIONAR MENÚ (CRUD MYSQL)
async function fetchProviderMenus() {
    const tbody = document.getElementById("provider-platillos-tbody");
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem 0;">
          <i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--primary); margin-bottom: 8px;"></i>
          <p style="color:var(--text-muted);">Consultando el catálogo en la base de datos...</p>
        </td>
      </tr>
    `;

    try {
        const response = await fetch('/api/provider/menus', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${providerToken}` }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            renderProviderMenusTable(result.data);
        } else {
            showProviderAlert(result.message || 'Error al obtener platillos.', true);
        }
    } catch (err) {
        console.error(err);
        showProviderAlert('Error de red al consultar los platillos.', true);
    }
}

function renderProviderMenusTable(platillos) {
    const tbody = document.getElementById("provider-platillos-tbody");
    tbody.innerHTML = '';

    if (platillos.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 3rem 0; color: var(--text-muted);">
              <i class="fa-solid fa-utensils fa-2x" style="margin-bottom: 12px;"></i>
              <p>Tu menú está vacío. Registra tu primer plato haciendo clic en "Agregar Platillo".</p>
            </td>
          </tr>
        `;
        return;
    }

    platillos.forEach(platillo => {
        const tr = document.createElement("tr");

        const availabilityBadge = platillo.disponible 
            ? '<span class="provider-badge available"><i class="fa-solid fa-circle-check" style="margin-right:4px;"></i> Disponible</span>'
            : '<span class="provider-badge unavailable"><i class="fa-solid fa-circle-minus" style="margin-right:4px;"></i> Agotado</span>';

        tr.innerHTML = `
          <td style="font-weight:700;">${escapeHtml(platillo.nombre)}</td>
          <td style="max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(platillo.descripcion || '')}">
            ${escapeHtml(platillo.descripcion || 'Sin descripción')}
          </td>
          <td><span class="legend-tag" style="background:#f1f5f9; color:var(--text-main);">${escapeHtml(platillo.categoria)}</span></td>
          <td style="font-weight:700; color:var(--primary);">Q${parseFloat(platillo.precio).toFixed(2)}</td>
          <td>${availabilityBadge}</td>
          <td style="text-align:center;">
            <div style="display:flex; gap:8px; justify-content:center;">
              <button class="btn btn-outline btn-xs" id="btn-edit-${platillo.id}"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
              <button class="btn btn-danger btn-xs" id="btn-del-${platillo.id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
            </div>
          </td>
        `;

        tbody.appendChild(tr);

        // Event listeners dinámicos
        document.getElementById(`btn-edit-${platillo.id}`).addEventListener("click", () => openEditPlatillo(platillo));
        document.getElementById(`btn-del-${platillo.id}`).addEventListener("click", () => deleteProviderPlatillo(platillo.id));
    });
}

// 2. MODAL GESTIONAR PLATILLOS
function openPlatilloModal(type) {
    activeModalType = type;
    const modal = document.getElementById("platillo-modal");
    const form = document.getElementById("platillo-form");
    
    form.reset();
    document.getElementById("form-platillo-id").value = '';

    if (type === "add") {
        document.getElementById("modal-platillo-title").textContent = "Agregar Nuevo Platillo";
        document.getElementById("modal-submit-btn").textContent = "Guardar Platillo";
    }
    
    modal.classList.remove("hidden");
}

function openEditPlatillo(platillo) {
    openPlatilloModal("edit");
    document.getElementById("modal-platillo-title").textContent = "Editar Platillo";
    document.getElementById("modal-submit-btn").textContent = "Actualizar Cambios";

    document.getElementById("form-platillo-id").value = platillo.id;
    document.getElementById("form-nombre").value = platillo.nombre;
    document.getElementById("form-desc").value = platillo.descripcion || '';
    document.getElementById("form-precio").value = platillo.precio;
    document.getElementById("form-categoria").value = platillo.categoria;
    document.getElementById("form-disponible").checked = !!platillo.disponible;
}

function closePlatilloModal() {
    document.getElementById("platillo-modal").classList.add("hidden");
}

async function handlePlatilloSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("form-platillo-id").value;
    const nombre = document.getElementById("form-nombre").value.trim();
    const descripcion = document.getElementById("form-desc").value.trim();
    const precio = parseFloat(document.getElementById("form-precio").value);
    const categoria = document.getElementById("form-categoria").value;
    const disponible = document.getElementById("form-disponible").checked ? 1 : 0;

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
                'Authorization': `Bearer ${providerToken}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast("Platillo guardado exitosamente.");
            closePlatilloModal();
            fetchProviderMenus();
        } else {
            showProviderAlert(result.message || 'Error al guardar platillo.', true);
        }
    } catch (err) {
        console.error(err);
        showProviderAlert('Error al conectar con la base de datos.', true);
    }
}

async function deleteProviderPlatillo(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar permanentemente este platillo del catálogo de MySQL?")) return;

    try {
        const response = await fetch(`/api/provider/menus/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${providerToken}` }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast("Platillo eliminado con éxito.");
            fetchProviderMenus();
        } else {
            showProviderAlert(result.message || 'No se pudo eliminar el platillo.', true);
        }
    } catch (err) {
        console.error(err);
        showProviderAlert('Error al conectar con la base de datos.', true);
    }
}

// 3. PEDIDOS ENTRANTES (PROVEEDOR)
async function fetchProviderOrders() {
    const container = document.getElementById("provider-orders-container");
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 0;">
        <i class="fa-solid fa-circle-notch fa-spin fa-3x" style="color:var(--primary); margin-bottom: 8px;"></i>
        <p style="color:var(--text-muted);">Consultando pedidos entrantes en tiempo real...</p>
      </div>
    `;

    try {
        const response = await fetch('/api/provider/orders', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${providerToken}` }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            renderProviderOrders(result.data);
        } else {
            showProviderAlert(result.message || 'Error al obtener órdenes.', true);
        }
    } catch (err) {
        console.error(err);
        showProviderAlert('Error de red al consultar pedidos.', true);
    }
}

function renderProviderOrders(pedidos) {
    const container = document.getElementById("provider-orders-container");
    const badge = document.getElementById("sidebar-orders-badge");
    container.innerHTML = '';

    // Pedidos activos (Pendiente, Preparando, Enviado)
    const activeCount = pedidos.filter(p => ['pendiente', 'preparando', 'enviado'].includes(p.estado.toLowerCase())).length;
    if (activeCount > 0) {
        badge.textContent = activeCount;
        badge.classList.remove("hidden");
    } else {
        badge.classList.add("hidden");
    }

    if (pedidos.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 0; color: var(--text-muted);">
            <i class="fa-solid fa-receipt fa-3x" style="margin-bottom: 12px;"></i>
            <h3>Bandeja de pedidos vacía</h3>
            <p>Las órdenes que realicen tus clientes desde la plataforma web aparecerán aquí al instante.</p>
          </div>
        `;
        return;
    }

    pedidos.forEach(pedido => {
        const card = document.createElement("div");
        card.className = "provider-order-card";

        // Mapear Repartidor asignado de forma determinista para la demostración
        const riderIndex = pedido.id % repartidoresSemilla.length;
        const rider = repartidoresSemilla[riderIndex];

        let itemsHtml = '';
        pedido.items.forEach(item => {
            itemsHtml += `
              <li>
                <span>${item.cantidad}x ${escapeHtml(item.platillo_nombre)}</span>
                <span style="font-weight:700;">Q${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
              </li>
            `;
        });

        const estados = ['Pendiente', 'Preparando', 'Enviado', 'Entregado', 'Cancelado'];
        let optionsHtml = '';
        estados.forEach(est => {
            const isSelected = pedido.estado.toLowerCase() === est.toLowerCase() ? 'selected' : '';
            optionsHtml += `<option value="${est}" ${isSelected}>Marcar como ${est}</option>`;
        });

        const timeString = new Date(pedido.creado_en).toLocaleString('es-ES', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
        });

        card.innerHTML = `
          <div class="provider-order-header">
            <span class="provider-order-id">Pedido #${pedido.id}</span>
            <span class="provider-order-date">${timeString}</span>
          </div>
          <div class="provider-order-body">
            <span class="provider-order-status ${pedido.estado.toLowerCase()}">${pedido.estado}</span>
            
            <div class="provider-order-client">
              <p><i class="fa-solid fa-user" style="width: 16px;"></i> <strong>Cliente:</strong> ${escapeHtml(pedido.cliente_nombre)}</p>
              <p><i class="fa-solid fa-phone" style="width: 16px;"></i> <strong>Teléfono:</strong> ${escapeHtml(pedido.telefono_cliente)}</p>
              <p><i class="fa-solid fa-location-dot" style="width: 16px;"></i> <strong>Envío:</strong> ${escapeHtml(pedido.direccion_entrega)}</p>
            </div>

            <ul class="provider-order-items">
              ${itemsHtml}
            </ul>

            <div class="provider-order-total">
              <span>Total Facturado</span>
              <span>Q${parseFloat(pedido.total).toFixed(2)}</span>
            </div>

            <!-- Repartidor del pedido -->
            <div class="provider-rider-card">
              <h4><i class="fa-solid fa-motorcycle"></i> Courier Asignado</h4>
              <div class="provider-rider-row">
                <div class="provider-rider-avatar">
                  <i class="fa-solid fa-user-ninja"></i>
                </div>
                <div class="provider-rider-info">
                  <h5>${rider.nombre}</h5>
                  <p>${rider.vehiculo}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="provider-order-actions">
            <select class="provider-status-select" id="select-status-${pedido.id}">
              ${optionsHtml}
            </select>
          </div>
        `;

        container.appendChild(card);

        // Change status event listener
        document.getElementById(`select-status-${pedido.id}`).addEventListener("change", (e) => {
            updateProviderOrderStatus(pedido.id, e.target.value);
        });
    });
}

async function updateProviderOrderStatus(pedidoId, nuevoEstado) {
    try {
        const response = await fetch(`/api/provider/orders/${pedidoId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${providerToken}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast(`Pedido #${pedidoId} actualizado a "${nuevoEstado}".`);
            fetchProviderOrders();
        } else {
            showProviderAlert(result.message || 'Error al cambiar estado.', true);
        }
    } catch (err) {
        console.error(err);
        showProviderAlert('Error de red al actualizar estado del pedido.', true);
    }
}

// 4. PERSISTENCIA DE MÉTODOS DE PAGO (LOCAL STORAGE INDEPENDIENTE POR PROVEEDOR)
function loadPaymentSettings() {
    if (!currentProvider) return;
    const key = `payments_settings_${currentProvider.id}`;
    const defaultSettings = { cash: true, card: true, bank: false };
    const settings = JSON.parse(localStorage.getItem(key)) || defaultSettings;

    document.getElementById("prov-pay-cash").checked = settings.cash;
    document.getElementById("prov-pay-card").checked = settings.card;
    document.getElementById("prov-pay-bank").checked = settings.bank;
}

function savePaymentSettings() {
    if (!currentProvider) return;
    const key = `payments_settings_${currentProvider.id}`;
    const settings = {
        cash: document.getElementById("prov-pay-cash").checked,
        card: document.getElementById("prov-pay-card").checked,
        bank: document.getElementById("prov-pay-bank").checked
    };

    localStorage.setItem(key, JSON.stringify(settings));
    showToast("Configuración de métodos de pago guardada.");
}

// 5. ANÁLISIS DE VENTAS EN TIEMPO REAL (MYSQL AGGREGATE)
async function fetchProviderAnalytics() {
    try {
        const response = await fetch('/api/provider/analytics', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${providerToken}` }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            renderProviderAnalytics(result.data);
        } else {
            showProviderAlert(result.message || 'Error al generar analíticas.', true);
        }
    } catch (err) {
        console.error(err);
        showProviderAlert('Error de red al consultar métricas.', true);
    }
}

function renderProviderAnalytics(data) {
    const res = data.resumen_general;
    const top = data.top_platillos;

    // Facturación
    document.getElementById("prov-metric-revenue").textContent = `Q${parseFloat(res.ingresos_totales || 0).toFixed(2)}`;
    document.getElementById("prov-metric-orders").textContent = res.total_pedidos || 0;
    document.getElementById("prov-metric-completed").textContent = res.pedidos_entregados || 0;

    // Tasa de cancelación
    const total = res.total_pedidos || 0;
    const cancelados = res.pedidos_cancelados || 0;
    const rate = total > 0 ? ((cancelados / total) * 100).toFixed(1) : 0;
    document.getElementById("prov-metric-canceled").textContent = `${rate}%`;

    // Tabla de top platillos
    const list = document.getElementById("prov-top-menus-list");
    list.innerHTML = '';

    if (top.length === 0) {
        list.innerHTML = `
          <li style="text-align: center; padding: 2rem 0; color: var(--text-muted); display: block;">
            <i class="fa-solid fa-chart-column fa-2x" style="margin-bottom: 8px;"></i>
            <p>No hay suficientes registros de ventas históricas para generar el ranking.</p>
          </li>
        `;
        return;
    }

    top.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "provider-top-item";

        li.innerHTML = `
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:28px; height:28px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem;">
              ${index + 1}
            </div>
            <div>
              <span class="provider-top-name">${escapeHtml(item.platillo_nombre)}</span>
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">${escapeHtml(item.categoria)}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="provider-top-sales" style="font-weight:700;">${item.total_unidades_vendidas} unidades</span>
            <div class="provider-top-revenue">Q${parseFloat(item.ingresos_totales).toFixed(2)}</div>
          </div>
        `;
        list.appendChild(li);
    });
}

// ==========================================================================
// PANELES DE ALERTAS Y TOASTS
// ==========================================================================
function showToast(message, isError = false) {
    const toast = document.getElementById("notification");
    const toastMsg = document.getElementById("toast-message");
    const toastIcon = toast.querySelector(".toast-icon");

    toastMsg.textContent = message;

    if (isError) {
        toastIcon.className = "fa-solid fa-circle-exclamation toast-icon";
        toastIcon.style.color = "var(--danger)";
    } else {
        toastIcon.className = "fa-solid fa-circle-check toast-icon";
        toastIcon.style.color = "var(--success)";
    }

    toast.classList.remove("hidden");
    
    // Ocultar a los 3.5 segundos
    setTimeout(() => {
        toast.classList.add("hidden");
    }, 3500);
}

function showProviderAlert(message, isError = false) {
    const alertBox = document.getElementById("dashboard-alert");
    const alertMsg = document.getElementById("dashboard-alert-msg");
    const alertIcon = alertBox.querySelector(".toast-icon");

    alertMsg.textContent = message;
    
    if (isError) {
        alertBox.style.backgroundColor = "var(--danger)";
        alertIcon.className = "fa-solid fa-circle-exclamation toast-icon";
    } else {
        alertBox.style.backgroundColor = "var(--success)";
        alertIcon.className = "fa-solid fa-circle-check toast-icon";
    }

    alertBox.classList.remove("hidden");

    setTimeout(() => {
        alertBox.classList.add("hidden");
    }, 4000);
}

// ==========================================================================
// UTILERÍA: PREVENIR XSS
// ==========================================================================
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
