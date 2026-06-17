/**
 * =============================================================================
 * FRONTEND JS: menu_view.js
 * Propósito: Carga, búsqueda, filtrado y renderizado dinámico de menús
 * =============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const menuGrid = document.getElementById('menu-grid');
    const searchInput = document.getElementById('search-input');
    const categoriesContainer = document.getElementById('categories-container');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Estado local de la aplicación
    let currentCategory = '';
    let searchQuery = '';
    let debounceTimer = null;

    /**
     * Consulta platillos de la API REST filtrados por categoría y búsqueda
     */
    async function fetchPlatillos() {
        showLoadingState();

        try {
            // Construir parámetros de búsqueda
            const params = new URLSearchParams();
            if (currentCategory) params.append('categoria', currentCategory);
            if (searchQuery) params.append('buscar', searchQuery);

            const url = `/api/platillos?${params.toString()}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('No se pudo establecer conexión con el servidor MySQL.');
            }

            const result = await response.json();

            if (result.success && result.data.length > 0) {
                renderPlatillos(result.data);
            } else {
                renderEmptyState();
            }
        } catch (error) {
            console.error('Error al cargar platillos:', error);
            renderErrorState(error.message);
        }
    }

    /**
     * Renderiza las tarjetas de los platillos en el grid
     */
    function renderPlatillos(platillos) {
        menuGrid.innerHTML = '';

        platillos.forEach(platillo => {
            const card = document.createElement('article');
            card.className = 'menu-card';
            
            // Determinar color de semáforo
            const colorClass = platillo.semaforo_color.toLowerCase();
            const colorLabel = getSemaforoLabel(platillo.semaforo_color);

            card.innerHTML = `
                <!-- Barra del Semáforo de Precios -->
                <div class="semaforo-bar ${colorClass}"></div>
                
                <!-- Categoría Badge -->
                <span class="category-badge">${platillo.categoria}</span>

                <div class="card-body">
                    <!-- Info Restaurante y Tiempo -->
                    <div class="card-header-info">
                        <span class="restaurant-tag">
                            <i class="fa-solid fa-store" style="margin-right: 4px;"></i> ${platillo.restaurante_nombre}
                        </span>
                        <span class="delivery-badge">
                            <i class="fa-solid fa-motorcycle"></i> ${platillo.distancia_km} km • ${platillo.tiempo_entrega_min} min
                        </span>
                    </div>

                    <!-- Datos del Platillo -->
                    <h3 class="platillo-title">${platillo.platillo_nombre}</h3>
                    <p class="platillo-desc">${platillo.platillo_descripcion || 'Delicioso platillo preparado con los ingredientes más frescos de la casa.'}</p>

                    <!-- Footer con Precio y Semáforo -->
                    <div class="card-footer">
                        <div class="price-box">
                            <span class="price-label">Precio</span>
                            <span class="price-value">$${parseFloat(platillo.precio).toFixed(2)}</span>
                        </div>
                        <span class="semaforo-tag ${colorClass}">
                            <span class="semaforo-dot ${colorClass}"></span>
                            ${colorLabel}
                        </span>
                    </div>
                </div>
            `;
            menuGrid.appendChild(card);
        });
    }

    /**
     * Devuelve la etiqueta descriptiva del semáforo
     */
    function getSemaforoLabel(color) {
        switch (color.toLowerCase()) {
            case 'verde':
                return 'Económico';
            case 'rojo':
                return 'Exclusivo';
            case 'amarillo':
            default:
                return 'Estándar';
        }
    }

    /**
     * Muestra estado de cargando
     */
    function showLoadingState() {
        menuGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-notch fa-spin fa-3x" style="margin-bottom: 1.5rem; color: var(--accent);"></i>
                <h3>Buscando en el Menú</h3>
                <p>Calculando comparativas de precios de los restaurantes...</p>
            </div>
        `;
    }

    /**
     * Muestra estado sin resultados
     */
    function renderEmptyState() {
        menuGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-utensils fa-3x" style="margin-bottom: 1.5rem; color: var(--text-secondary);"></i>
                <h3>No encontramos platillos</h3>
                <p>Intenta cambiar los términos de tu búsqueda o selecciona otra categoría.</p>
            </div>
        `;
    }

    /**
     * Muestra estado de error
     */
    function renderErrorState(message) {
        menuGrid.innerHTML = `
            <div class="empty-state" style="border-color: rgba(225, 29, 72, 0.3);">
                <i class="fa-solid fa-triangle-exclamation fa-3x" style="margin-bottom: 1.5rem; color: var(--color-rojo);"></i>
                <h3>Error de Conexión</h3>
                <p>${message}</p>
                <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                    ¿Ya ejecutaste el script <code>schema.sql</code> en tu servidor MySQL y configuraste las credenciales en el pool?
                </p>
                <button id="retry-btn" class="filter-btn active" style="margin-top: 1.5rem;">
                    <i class="fa-solid fa-rotate-right"></i> Reintentar
                </button>
            </div>
        `;

        document.getElementById('retry-btn')?.addEventListener('click', fetchPlatillos);
    }

    // --- Manejo de Eventos ---

    // Filtros de Categorías
    categoriesContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        // Cambiar botón activo
        document.querySelector('.filter-btn.active').classList.remove('active');
        btn.classList.add('active');

        // Actualizar categoría y recargar
        currentCategory = btn.dataset.category;
        fetchPlatillos();
    });

    // Búsqueda con Debounce (optimización para no hacer peticiones en cada pulsación)
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        searchQuery = e.target.value.trim();
        
        debounceTimer = setTimeout(() => {
            fetchPlatillos();
        }, 250); // Esperar 250ms tras dejar de escribir
    });

    // Carga inicial
    fetchPlatillos();
});
