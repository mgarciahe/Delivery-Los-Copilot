// ==========================================================================
// MOCK DATA: PROVIDERS & MENUS
// ==========================================================================
const MENUS_DATA = [
  {
    id: 1,
    name: "Burger Clásica con Papas",
    category: "hamburguesa",
    price: 6.99,
    originalPrice: 8.99,
    discount: 22,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
    description: "Medallón de carne de res al grill, lechuga, tomate fresco, cebolla, queso cheddar derretido y aderezo especial. Acompañada de papas fritas crujientes.",
    deliveryTime: "15-25 min",
    deliveryTimeVal: 20,
    distance: "1.2 km",
    provider: {
      name: "Burgers Premium Copilot",
      logo: "fa-hamburger",
      rating: 4.8,
      reviewsCount: 142,
      address: "Av. Reforma 10-25, Zona 10",
      reviews: [
        { user: "Ana R.", score: 5, comment: "La mejor carne al grill de la zona, llega súper caliente." },
        { user: "Luis M.", score: 4.5, comment: "Excelente relación precio/calidad. Las papas son increíbles." }
      ]
    }
  },
  {
    id: 2,
    name: "Burger Especial Doble Queso",
    category: "hamburguesa",
    price: 11.50,
    originalPrice: null,
    discount: null,
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=500&q=80",
    description: "Dos jugosas tortas de carne premium, doble queso cheddar, tocino ahumado crujiente, aros de cebolla y salsa BBQ artesanal.",
    deliveryTime: "20-30 min",
    deliveryTimeVal: 25,
    distance: "1.8 km",
    provider: {
      name: "Burgers Premium Copilot",
      logo: "fa-hamburger",
      rating: 4.8,
      reviewsCount: 142,
      address: "Av. Reforma 10-25, Zona 10",
      reviews: [
        { user: "Pedro G.", score: 5, comment: "La salsa BBQ es de otro mundo. Repetiré seguro." },
        { user: "Sofia T.", score: 4.6, comment: "Muy llenadora y sabrosa. El tocino está en su punto." }
      ]
    }
  },
  {
    id: 3,
    name: "Mega Hamburguesa Monster Trufa",
    category: "hamburguesa",
    price: 16.99,
    originalPrice: 19.99,
    discount: 15,
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=500&q=80",
    description: "Para los amantes del lujo: 250g de carne Wagyu, queso gouda añejo, champiñones salteados, rúcula fresca y una exquisita mayonesa de trufa negra.",
    deliveryTime: "25-35 min",
    deliveryTimeVal: 30,
    distance: "2.4 km",
    provider: {
      name: "Gourmet Burgers Co.",
      logo: "fa-hamburger",
      rating: 4.9,
      reviewsCount: 88,
      address: "Calle de los Artistas 4-12, Zona 14",
      reviews: [
        { user: "Carlos E.", score: 5, comment: "El toque de trufa es espectacular. Vale cada centavo." },
        { user: "Valeria V.", score: 4.8, comment: "De las hamburguesas más gourmet que he probado en la ciudad." }
      ]
    }
  },
  {
    id: 4,
    name: "Pizza Margherita Individual",
    category: "pizza",
    price: 5.50,
    originalPrice: null,
    discount: null,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80",
    description: "Tradicional masa delgada italiana con salsa de tomate pomodoro natural, queso mozzarella fresco, hojas de albahaca y un toque de aceite de oliva extra virgen.",
    deliveryTime: "12-22 min",
    deliveryTimeVal: 17,
    distance: "0.8 km",
    provider: {
      name: "Pizzería Nápoles Express",
      logo: "fa-pizza-slice",
      rating: 4.6,
      reviewsCount: 310,
      address: "Bulevar Los Próceres 18-90, Zona 10",
      reviews: [
        { user: "Mario J.", score: 5, comment: "Masa perfecta, crujiente por fuera y suave por dentro." },
        { user: "Clara S.", score: 4.2, comment: "Súper rápida la entrega. Sabor muy clásico." }
      ]
    }
  },
  {
    id: 5,
    name: "Pizza Peperoni Familiar Suprema",
    category: "pizza",
    price: 13.99,
    originalPrice: 16.99,
    discount: 17,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80",
    description: "Pizza de tamaño familiar con abundante pepperoni americano premium, queso mozzarella elástico de primera y orilla rellena de queso crema.",
    deliveryTime: "22-32 min",
    deliveryTimeVal: 27,
    distance: "1.5 km",
    provider: {
      name: "Pizzería Nápoles Express",
      logo: "fa-pizza-slice",
      rating: 4.6,
      reviewsCount: 310,
      address: "Bulevar Los Próceres 18-90, Zona 10",
      reviews: [
        { user: "Gabriela L.", score: 5, comment: "La orilla con queso crema es espectacular, a los niños les encanta." },
        { user: "Esteban R.", score: 4.5, comment: "Buen tamaño para compartir. Llegó calientita." }
      ]
    }
  },
  {
    id: 6,
    name: "Pizza Premium Prosciutto y Rúcula",
    category: "pizza",
    price: 18.50,
    originalPrice: null,
    discount: null,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
    description: "Fina masa artesanal al horno de leña, Prosciutto di Parma curado, lascas de queso parmesano, rúcula fresca baby e hilos de reducción balsámica.",
    deliveryTime: "30-40 min",
    deliveryTimeVal: 35,
    distance: "3.1 km",
    provider: {
      name: "La Trattoria Copilot",
      logo: "fa-pizza-slice",
      rating: 4.9,
      reviewsCount: 75,
      address: "Avenida Las Américas 15-40, Zona 13",
      reviews: [
        { user: "Francisco H.", score: 5, comment: "El jamón de prosciutto es de excelente calidad. 100% recomendado." },
        { user: "Mónica P.", score: 4.8, comment: "Un manjar absoluto. Presentación impecable y sabor italiano real." }
      ]
    }
  },
  {
    id: 7,
    name: "Sushi Combo Futomaki (10 piezas)",
    category: "sushi",
    price: 7.50,
    originalPrice: 9.99,
    discount: 25,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80",
    description: "Rollo clásico de sushi relleno de salmón fresco, aguacate cremoso, pepino, Philadelphia y cubierto con sésamo negro.",
    deliveryTime: "20-30 min",
    deliveryTimeVal: 25,
    distance: "2.0 km",
    provider: {
      name: "Sushi Master & Wok",
      logo: "fa-fish",
      rating: 4.7,
      reviewsCount: 195,
      address: "Diagonal 6 12-45, Zona 10",
      reviews: [
        { user: "Fernando P.", score: 4.8, comment: "El salmón es súper fresco. El empaque de entrega es excelente." },
        { user: "Carolina D.", score: 4.5, comment: "Muy buen precio para la calidad del sushi." }
      ]
    }
  },
  {
    id: 8,
    name: "Bento Box Wagyū y Tempura Premium",
    category: "sushi",
    price: 24.99,
    originalPrice: null,
    discount: null,
    image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=500&q=80",
    description: "Caja tradicional japonesa que incluye tataki de Wagyū, camarones en tempura crujiente, 4 piezas de Roll California Premium, ensalada wakame y arroz gohan.",
    deliveryTime: "35-45 min",
    deliveryTimeVal: 40,
    distance: "4.2 km",
    provider: {
      name: "Templo Zen Sushi & Sake Bar",
      logo: "fa-fish",
      rating: 4.9,
      reviewsCount: 64,
      address: "Bulevar Rafael Landívar, Paseo Cayalá",
      reviews: [
        { user: "Mauricio L.", score: 5, comment: "Una experiencia gastronómica increíble en casa. Todo empacado a la perfección." },
        { user: "Juliana K.", score: 4.9, comment: "El Wagyu se deshace en la boca. Vale cada centavo gastado." }
      ]
    }
  },
  {
    id: 9,
    name: "Tres Leches de Nutella",
    category: "postre",
    price: 4.99,
    originalPrice: 5.99,
    discount: 16,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80",
    description: "Bizcocho súper húmedo bañado en la tradicional mezcla de tres leches infusionada con crema de cacao y avellanas Nutella, decorado con fresa fresca.",
    deliveryTime: "10-20 min",
    deliveryTimeVal: 15,
    distance: "0.6 km",
    provider: {
      name: "Postres de la Abuela",
      logo: "fa-ice-cream",
      rating: 4.5,
      reviewsCount: 92,
      address: "15 Avenida 8-30, Zona 10",
      reviews: [
        { user: "Rocío G.", score: 5, comment: "Extremadamente dulce y húmedo, perfecto para antojos." },
        { user: "Daniel B.", score: 4.0, comment: "Buen postre, la Nutella le da un toque diferente." }
      ]
    }
  },
  {
    id: 10,
    name: "Cheesecake de Frutos Rojos Premium",
    category: "postre",
    price: 9.50,
    originalPrice: null,
    discount: null,
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=500&q=80",
    description: "Cheesecake estilo New York, horneado lentamente, con base crujiente de galleta de mantequilla, cubierto con una mermelada artesanal de fresas, frambuesas y arándanos silvestres.",
    deliveryTime: "15-25 min",
    deliveryTimeVal: 20,
    distance: "1.1 km",
    provider: {
      name: "Postres de la Abuela",
      logo: "fa-ice-cream",
      rating: 4.5,
      reviewsCount: 92,
      address: "15 Avenida 8-30, Zona 10",
      reviews: [
        { user: "Lucia S.", score: 5, comment: "Mi cheesecake favorito. La consistencia es ideal." },
        { user: "Andrés A.", score: 4.5, comment: "Muy rico, la mermelada se nota que es 100% natural." }
      ]
    }
  }
];

// Delivery drivers list for simulation
const DRIVERS_DATA = [
  { name: "Carlos Gómez", rating: 4.9, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
  { name: "Juan Reyes", rating: 4.8, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
  { name: "Sofia Rodríguez", rating: 4.9, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
  { name: "Esteban Paz", rating: 4.7, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" }
];

// Global Image Fallback Handler for missing/broken Unsplash images
function handleImageError(imgElement, category) {
  imgElement.onerror = null; // Prevent infinite loop

  // High quality alternative food images
  const fallbacks = {
    hamburguesa: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=80",
    pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
    sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80",
    postre: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=500&q=80"
  };

  // Safe SVG base64 placeholders that will always work even without network
  const svgPlaceholders = {
    hamburguesa: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" style="background:%23ffe5d9;"><text x="50%" y="55%" font-size="40" text-anchor="middle">🍔</text></svg>`,
    pizza: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" style="background:%23ffe5d9;"><text x="50%" y="55%" font-size="40" text-anchor="middle">🍕</text></svg>`,
    sushi: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" style="background:%23ffe5d9;"><text x="50%" y="55%" font-size="40" text-anchor="middle">🍣</text></svg>`,
    postre: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" style="background:%23ffe5d9;"><text x="50%" y="55%" font-size="40" text-anchor="middle">🍰</text></svg>`
  };

  imgElement.src = fallbacks[category] || fallbacks['hamburguesa'];

  // Fallback to pure local SVG data URL if the fallback image also fails
  imgElement.onerror = () => {
    imgElement.src = svgPlaceholders[category] || svgPlaceholders['hamburguesa'];
  };
}

// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================
let currentUser = null;
let activeCategory = 'all';
let searchQuery = '';
let currentSort = 'relevant';
let activeOrder = null;
let orderSimulationInterval = null;
let selectedQuantity = 1;
let selectedMenuItem = null;

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initUserSession();
  renderMenus();
  setupEventListeners();
});

// Initialize session from localStorage
function initUserSession() {
  const savedUser = localStorage.getItem("copilots_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateHeaderUI();
  }
}

// ==========================================================================
// DOM SELECTORS & EVENT LISTENERS
// ==========================================================================
function setupEventListeners() {
  // Navigation elements
  document.getElementById("btn-home").addEventListener("click", () => showView("dashboard"));
  document.getElementById("btn-back-dashboard").addEventListener("click", () => showView("dashboard"));

  // Auth view trigger buttons
  document.getElementById("btn-show-login").addEventListener("click", () => {
    showView("auth");
    switchAuthTab("login");
  });
  document.getElementById("btn-show-register").addEventListener("click", () => {
    showView("auth");
    switchAuthTab("register");
  });

  // User Profile Dropdown toggler
  document.getElementById("user-avatar-trigger").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("profile-dropdown").classList.toggle("hidden");
  });

  // Close dropdown on click outside
  document.addEventListener("click", () => {
    document.getElementById("profile-dropdown").classList.add("hidden");
  });

  // Logout
  document.getElementById("btn-logout").addEventListener("click", handleLogout);

  // Auth Form tabs
  document.getElementById("tab-login").addEventListener("click", () => switchAuthTab("login"));
  document.getElementById("tab-register").addEventListener("click", () => switchAuthTab("register"));

  // Forms Submissions
  document.getElementById("form-login").addEventListener("submit", handleLoginSubmit);
  document.getElementById("form-register").addEventListener("submit", handleRegisterSubmit);

  // Address Selector Notification
  const selectAddressEl = document.getElementById("select-address");
  const addresses = {
    home: "Mi Casa (Calle Principal #123)",
    office: "Oficina (Av. Central #456)",
    univ: "Universidad (Campus Norte)"
  };

  selectAddressEl.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "new") {
      const newAddressName = prompt("Escribe un nombre para tu dirección (ej: Gimnasio, Casa de Campo):");
      if (!newAddressName) {
        selectAddressEl.value = Object.keys(addresses)[0];
        return;
      }
      const newAddressDetail = prompt(`Escribe la dirección física para "${newAddressName}":`);
      if (!newAddressDetail) {
        selectAddressEl.value = Object.keys(addresses)[0];
        return;
      }

      const newKey = "custom_" + Date.now();
      addresses[newKey] = `${newAddressName} (${newAddressDetail})`;

      const newOption = document.createElement("option");
      newOption.value = newKey;
      newOption.textContent = addresses[newKey];

      selectAddressEl.insertBefore(newOption, selectAddressEl.lastElementChild);
      selectAddressEl.value = newKey;
      showToast(`Nueva dirección agregada: ${addresses[newKey]}`);
    } else {
      showToast(`Dirección de entrega actualizada a: ${addresses[val]}`);
    }
  });

  // Search Realtime
  const searchInput = document.getElementById("search-menus");
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    renderMenus();
  });

  document.getElementById("btn-search-trigger").addEventListener("click", () => {
    searchQuery = searchInput.value.trim();
    renderMenus();
  });

  // Category Pills
  const categoryPills = document.querySelectorAll(".filter-pill");
  categoryPills.forEach(pill => {
    pill.addEventListener("click", (e) => {
      categoryPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      activeCategory = pill.dataset.category;
      renderMenus();
    });
  });

  // Sorting Selector
  document.getElementById("sort-menus").addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderMenus();
  });

  // Product Modal Action buttons
  document.getElementById("btn-close-modal").addEventListener("click", closeModal);
  document.getElementById("modal-close-overlay").addEventListener("click", closeModal);

  document.getElementById("qty-minus").addEventListener("click", () => updateQuantity(-1));
  document.getElementById("qty-plus").addEventListener("click", () => updateQuantity(1));

  document.getElementById("btn-place-order").addEventListener("click", placeOrder);

  // Profile history click simulation
  document.getElementById("btn-go-history").addEventListener("click", () => {
    if (activeOrder) {
      showView("tracker");
    } else {
      showToast("No tienes pedidos activos en curso actualmente.");
    }
  });
}

// ==========================================================================
// AUTH & SESSION CONTROLLER
// ==========================================================================
function switchAuthTab(tab) {
  const loginTab = document.getElementById("tab-login");
  const registerTab = document.getElementById("tab-register");
  const loginForm = document.getElementById("form-login");
  const registerForm = document.getElementById("form-register");

  if (tab === "login") {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  } else {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  }
}

function handleRegisterSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("register-name").value.trim();
  const lastname = document.getElementById("register-lastname").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;

  if (password.length < 6) {
    showToast("La contraseña debe tener al menos 6 caracteres", true);
    return;
  }

  // Create mock user
  currentUser = { name, lastname, email };
  localStorage.setItem("copilots_user", JSON.stringify(currentUser));

  showToast(`¡Cuenta creada con éxito! Bienvenido, ${name}`);
  updateHeaderUI();

  // Clear forms and show dashboard
  e.target.reset();
  showView("dashboard");
}

function handleLoginSubmit(e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  // Since it's a front-end class project, we accept any valid email with password >= 6
  if (password.length < 6) {
    showToast("Contraseña incorrecta (mínimo 6 caracteres)", true);
    return;
  }

  // Extract name prefix from email or use mock Miguel name if it matches
  let name = "Miguel";
  let lastname = "García";
  if (email.includes("@")) {
    const prefix = email.split("@")[0];
    name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  currentUser = { name, lastname, email };
  localStorage.setItem("copilots_user", JSON.stringify(currentUser));

  showToast(`¡Bienvenido de vuelta, ${name}!`);
  updateHeaderUI();

  e.target.reset();
  showView("dashboard");
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem("copilots_user");
  updateHeaderUI();
  showToast("Sesión cerrada correctamente");
  showView("dashboard");
}

function updateHeaderUI() {
  const anonSection = document.getElementById("user-anonymous");
  const loggedSection = document.getElementById("user-logged");

  if (currentUser) {
    anonSection.classList.add("hidden");
    loggedSection.classList.remove("hidden");

    // Set profile names
    document.getElementById("profile-fullname").textContent = `${currentUser.name} ${currentUser.lastname}`;
    document.getElementById("profile-email").textContent = currentUser.email;

    // Set initials badge
    const initials = (currentUser.name.charAt(0) + currentUser.lastname.charAt(0)).toUpperCase();
    document.getElementById("profile-initials").textContent = initials;
  } else {
    anonSection.classList.remove("hidden");
    loggedSection.classList.add("hidden");
  }
}

// ==========================================================================
// MENUS EXPLORER (DASHBOARD) RENDERING & PRICING
// ==========================================================================
function getPriceSemaphoreClass(price) {
  if (price < 8.00) {
    return 'budget'; // Green
  } else if (price >= 15.00) {
    return 'expensive'; // Red
  } else {
    return 'moderate'; // Orange/Yellow
  }
}

function getPriceSemaphoreText(price) {
  if (price < 8.00) {
    return 'Económico';
  } else if (price >= 15.00) {
    return 'Premium';
  } else {
    return 'Moderado';
  }
}

function renderMenus() {
  const grid = document.getElementById("menus-grid");
  grid.innerHTML = "";

  // 1. Filter data
  let filtered = MENUS_DATA.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.provider.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 2. Sort data
  if (currentSort === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'time-asc') {
    filtered.sort((a, b) => a.deliveryTimeVal - b.deliveryTimeVal);
  } else if (currentSort === 'rating-desc') {
    filtered.sort((a, b) => b.provider.rating - a.provider.rating);
  }

  // Update counter
  document.getElementById("results-count").textContent = `Mostrando ${filtered.length} menús`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-cookie-bite empty-icon"></i>
        <h3>No encontramos menús</h3>
        <p>Prueba buscando con palabras clave diferentes o eliminando filtros.</p>
      </div>
    `;
    return;
  }

  // 3. Render HTML
  filtered.forEach(menu => {
    const semaphoreClass = getPriceSemaphoreClass(menu.price);
    const semaphoreText = getPriceSemaphoreText(menu.price);

    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <div class="card-image-panel">
        <img src="${menu.image}" alt="${menu.name}" onerror="handleImageError(this, '${menu.category}')">
        <div class="card-badge-container">
          ${menu.discount ? `<div class="discount-badge">${menu.discount}% OFF</div>` : ''}
        </div>
        <div class="card-right-badges">
          <span class="price-tag ${semaphoreClass}">${semaphoreText}</span>
        </div>
      </div>
      <div class="card-content">
        <div class="provider-row">
          <span class="provider-tag"><i class="fa-solid fa-store"></i> ${menu.provider.name}</span>
          <span class="provider-rating-small">
            <i class="fa-solid fa-star"></i> ${menu.provider.rating}
          </span>
        </div>
        <h3 class="food-title">${menu.name}</h3>
        <p class="food-desc-short">${menu.description}</p>
        <div class="card-footer">
          <div class="price-box">
            <span class="price-current">Q${menu.price.toFixed(2)}</span>
            ${menu.originalPrice ? `<span class="price-old-line">Q${menu.originalPrice.toFixed(2)}</span>` : ''}
          </div>
          <div class="delivery-meta">
            <span><i class="fa-solid fa-clock"></i> ${menu.deliveryTime}</span>
            <span><i class="fa-solid fa-motorcycle"></i> ${menu.distance}</span>
          </div>
        </div>
      </div>
    `;

    // Click handler to open detail modal
    card.addEventListener("click", () => openProductModal(menu));
    grid.appendChild(card);
  });
}

// ==========================================================================
// DETAILS MODAL CONTROLLER
// ==========================================================================
function openProductModal(menu) {
  selectedMenuItem = menu;
  selectedQuantity = 1;
  updateQuantityUI();

  // Populate basic food info
  const modalImg = document.getElementById("modal-food-img");
  modalImg.src = menu.image;
  modalImg.onerror = function () { handleImageError(this, menu.category); };
  document.getElementById("modal-food-name").textContent = menu.name;
  document.getElementById("modal-description").textContent = menu.description;
  document.getElementById("modal-price").textContent = `Q${menu.price.toFixed(2)}`;

  const discountBadge = document.getElementById("modal-discount-badge");
  const oldPrice = document.getElementById("modal-price-old");
  if (menu.discount) {
    discountBadge.classList.remove("hidden");
    discountBadge.textContent = `${menu.discount}% OFF`;
    oldPrice.classList.remove("hidden");
    oldPrice.textContent = `Q${menu.originalPrice.toFixed(2)}`;
  } else {
    discountBadge.classList.add("hidden");
    oldPrice.classList.add("hidden");
  }

  // Populate provider details
  document.getElementById("modal-provider-name").textContent = menu.provider.name;
  document.getElementById("modal-provider-rating-score").textContent = menu.provider.rating.toFixed(1);
  document.getElementById("modal-provider-reviews-count").textContent = `(${menu.provider.reviewsCount} reseñas)`;
  document.getElementById("modal-provider-address").textContent = menu.provider.address;

  // Star ratings
  const starsContainer = document.getElementById("modal-provider-stars");
  starsContainer.innerHTML = "";
  const fullStars = Math.floor(menu.provider.rating);
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsContainer.innerHTML += `<i class="fa-solid fa-star"></i>`;
    } else {
      starsContainer.innerHTML += `<i class="fa-regular fa-star"></i>`;
    }
  }

  // Reviews list rendering
  const reviewsList = document.getElementById("modal-reviews-list");
  reviewsList.innerHTML = "";
  menu.provider.reviews.forEach(rev => {
    reviewsList.innerHTML += `
      <div class="review-item">
        <div class="review-user">
          <span>${rev.user}</span>
          <span class="stars">${`<i class="fa-solid fa-star"></i>`.repeat(Math.floor(rev.score))}</span>
        </div>
        <p class="review-comment">"${rev.comment}"</p>
      </div>
    `;
  });

  // Open the Modal DOM
  document.getElementById("product-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Disable body scroll
}

function closeModal() {
  document.getElementById("product-modal").classList.add("hidden");
  document.body.style.overflow = ""; // Re-enable body scroll
}

function updateQuantity(amount) {
  const newQty = selectedQuantity + amount;
  if (newQty >= 1 && newQty <= 10) {
    selectedQuantity = newQty;
    updateQuantityUI();
  }
}

function updateQuantityUI() {
  document.getElementById("qty-count").textContent = selectedQuantity;
  if (selectedMenuItem) {
    const total = selectedMenuItem.price * selectedQuantity;
    document.getElementById("modal-total-price").textContent = `Q${total.toFixed(2)}`;
  }
}

// ==========================================================================
// PLACE ORDER & SIMULATION MAP TRACKER
// ==========================================================================
function placeOrder() {
  // Check if authenticated
  if (!currentUser) {
    closeModal();
    showToast("Por favor inicia sesión o crea una cuenta para poder pedir.", true);
    showView("auth");
    return;
  }

  // Create active order status
  const randomDriver = DRIVERS_DATA[Math.floor(Math.random() * DRIVERS_DATA.length)];
  const randomId = Math.floor(10000 + Math.random() * 90000);

  activeOrder = {
    orderId: `#COP-${randomId}`,
    merchantName: selectedMenuItem.provider.name,
    merchantAddress: selectedMenuItem.provider.address,
    eta: selectedMenuItem.deliveryTime,
    driver: randomDriver,
    step: 1
  };

  closeModal();
  showToast("¡Pedido recibido! Redirigiendo al rastreo en vivo...");

  // Transition to Tracker
  showView("tracker");

  // Setup tracker UI
  document.getElementById("track-order-id").textContent = activeOrder.orderId;
  document.getElementById("track-merchant-name").textContent = activeOrder.merchantName;
  document.getElementById("track-merchant-address").textContent = activeOrder.merchantAddress;
  document.getElementById("track-eta").textContent = activeOrder.eta;
  document.getElementById("driver-name").textContent = activeOrder.driver.name;
  document.getElementById("driver-rating").textContent = activeOrder.driver.rating;
  document.getElementById("driver-avatar").src = activeOrder.driver.avatar;

  // Run Simulated map and step transitions
  startTrackerSimulation();
}

function startTrackerSimulation() {
  if (orderSimulationInterval) clearInterval(orderSimulationInterval);

  // Stepper steps
  const steps = [
    document.getElementById("step-1"),
    document.getElementById("step-2"),
    document.getElementById("step-3"),
    document.getElementById("step-4")
  ];

  // Reset SVG elements & Bike position
  const progressLine = document.getElementById("route-progress-line");
  const bike = document.getElementById("map-driver-bike");

  progressLine.style.strokeDashoffset = "400";
  bike.setAttribute("transform", "translate(100, 300)");

  // Reset steps state
  steps.forEach((el, index) => {
    if (index === 0) el.classList.add("active");
    else el.classList.remove("active");
  });

  let progressPercent = 0;
  let simulatedStep = 1;

  orderSimulationInterval = setInterval(() => {
    progressPercent += 2; // Incremental progress (simulating journey)

    // Update SVG Line dashoffset (moving forward)
    const offset = 400 - (400 * (progressPercent / 100));
    progressLine.style.strokeDashoffset = offset;

    // Move bike coordinate on Q-Bezier curve: M 100 300 Q 250 200 400 100
    // Quadratic Bézier curve formula: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    // P0 = (100, 300), P1 = (250, 200), P2 = (400, 100)
    const t = progressPercent / 100;
    const x = Math.pow(1 - t, 2) * 100 + 2 * (1 - t) * t * 250 + Math.pow(t, 2) * 400;
    const y = Math.pow(1 - t, 2) * 300 + 2 * (1 - t) * t * 200 + Math.pow(t, 2) * 100;
    bike.setAttribute("transform", `translate(${x}, ${y})`);

    // Manage steps activation based on percent
    if (progressPercent >= 25 && simulatedStep === 1) {
      simulatedStep = 2;
      steps[1].classList.add("active");
      showToast("¡El restaurante ha comenzado a preparar tu orden!");
    } else if (progressPercent >= 60 && simulatedStep === 2) {
      simulatedStep = 3;
      steps[2].classList.add("active");
      document.getElementById("track-eta").textContent = "5 - 10 min";
      showToast("¡Tu repartidor va en camino con tu comida!");
    } else if (progressPercent >= 100) {
      clearInterval(orderSimulationInterval);
      steps[3].classList.add("active");
      document.getElementById("track-eta").textContent = "¡Entregado!";
      showToast("¡Tu pedido ha sido entregado! ¡Buen provecho!");
    }
  }, 350); // Speed up transition for the demonstration
}

// ==========================================================================
// UTILS / ROUTER / NOTIFICATIONS
// ==========================================================================
function showView(viewName) {
  const views = {
    dashboard: document.getElementById("view-dashboard"),
    auth: document.getElementById("view-auth"),
    tracker: document.getElementById("view-tracker")
  };

  Object.keys(views).forEach(key => {
    if (key === viewName) {
      views[key].classList.remove("hidden");
    } else {
      views[key].classList.add("hidden");
    }
  });

  // Always scroll to top on view changes
  window.scrollTo(0, 0);

  // Stop simulation if going back to dashboard and completed
  if (viewName !== "tracker" && orderSimulationInterval && progressFinished()) {
    clearInterval(orderSimulationInterval);
  }
}

function progressFinished() {
  const progressLine = document.getElementById("route-progress-line");
  return progressLine.style.strokeDashoffset === "0";
}

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

  // Autohide after 3.5s
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3500);
}
