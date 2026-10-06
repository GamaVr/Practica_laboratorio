const products = [
  { id: 1, name: "Canasta verde", producer: "Huerto El Roble", category: "Verduras", price: 185, stock: "Disponible", description: "Selección de hojas verdes cosechadas esta semana.", origin: "Huerto El Roble · 4 km · Cosecha local" },
  { id: 2, name: "Miel multifloral", producer: "Apícola Sierra", category: "Despensa", price: 145, stock: "Disponible", description: "Miel local de temporada, en frasco de 350 g.", origin: "Apícola Sierra · 12 km · Lote M-24" },
  { id: 3, name: "Pan de masa madre", producer: "Horno Luna", category: "Panadería", price: 95, stock: "Disponible", description: "Pan artesanal de fermentación lenta.", origin: "Horno Luna · 3 km · Horneado hoy" },
  { id: 4, name: "Café de altura", producer: "Cooperativa Norte", category: "Despensa", price: 145, stock: "Disponible", description: "Café molido de origen local, tueste medio.", origin: "Cooperativa Norte · 28 km · Comercio justo" },
  { id: 5, name: "Jitomate saladet", producer: "Rancho Sol", category: "Verduras", price: 62, stock: "Disponible", description: "Jitomate fresco para la compra semanal.", origin: "Rancho Sol · 8 km · Cosecha local" },
  { id: 6, name: "Queso fresco", producer: "Lácteos Valle", category: "Lácteos", price: 110, stock: "Disponible", description: "Queso fresco de producción artesanal.", origin: "Lácteos Valle · 18 km · Entrega mañana" },
];

const state = {
  cart: JSON.parse(localStorage.getItem("mercado-local-cart") || "[]"),
  selectedProduct: 1,
  search: "",
  categories: [],
  lastOrder: JSON.parse(localStorage.getItem("mercado-local-order") || "null"),
};

const app = document.querySelector("#app");
const statusMessage = document.querySelector("#status-message");
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

function announce(message) { statusMessage.textContent = message; }
function productImageAlt(product) { return `Ilustración de ${product.name} de ${product.producer}`; }
function getProduct(id) { return products.find((product) => product.id === Number(id)); }
function cartQuantity() { return state.cart.reduce((total, item) => total + item.quantity, 0); }
function cartLines() { return state.cart.map((item) => ({ ...item, product: getProduct(item.id) })).filter((item) => item.product); }
function subtotal() { return cartLines().reduce((total, item) => total + item.product.price * item.quantity, 0); }
function shipping() { return subtotal() === 0 || subtotal() >= 300 ? 0 : 60; }
function total() { return subtotal() + shipping(); }
function saveCart() { localStorage.setItem("mercado-local-cart", JSON.stringify(state.cart)); updateCartCount(); }
function updateCartCount() { document.querySelector("#cart-count").textContent = cartQuantity(); }

function productCard(product) {
  return `<article class="product-card">
    <img src="assets/mercado-producto.svg" alt="${productImageAlt(product)}" />
    <div class="card-body">
      <div><h3>${product.name}</h3><p class="card-meta">${product.producer} · ${product.stock}</p></div>
      <p class="card-meta">${product.description}</p>
      <div class="card-actions"><span class="price">${money.format(product.price)}</span><a class="button button-secondary" href="#detalle?id=${product.id}">Ver detalle</a></div>
    </div>
  </article>`;
}

function renderHome() {
  const featured = products.slice(0, 3).map(productCard).join("");
  app.innerHTML = `<section class="home-top" aria-labelledby="home-title">
    <div>
      <section class="hero"><div><p class="eyebrow">De productores cercanos a tu mesa</p><h1 id="home-title">Productos frescos de productores cercanos</h1><p>Compra con origen claro, entrega local y un flujo simple.</p><a class="button button-primary" href="#explorar">Explorar productos</a></div><div class="hero-art" aria-hidden="true">🥕</div></section>
      <form class="search-form" id="home-search" role="search"><label class="visually-hidden" for="home-search-input">Buscar productos locales</label><input id="home-search-input" name="q" type="search" placeholder="Buscar productos locales" value="${state.search}" /><button class="button button-primary" type="submit">Buscar</button></form>
    </div>
    <aside class="quick-cart" aria-labelledby="quick-cart-title"><div><h2 id="quick-cart-title">Tu carrito</h2><p>${cartQuantity()} productos<br>Subtotal ${money.format(subtotal())}<br>${subtotal() ? (shipping() ? "Entrega local" : "Entrega sin costo") : "Agrega productos para comenzar"}</p></div><a class="button button-secondary" href="#carrito">Ver carrito</a></aside>
  </section>
  <section aria-labelledby="featured-title"><div class="section-heading"><div><h2 id="featured-title">Destacados esta semana</h2><p class="muted">Precio, productor y disponibilidad visibles antes de comprar.</p></div><a href="#explorar">Ver catálogo completo</a></div><div class="product-grid">${featured}</div></section>
  <section class="info-grid" aria-label="Beneficios de Mercado Local"><article class="info-panel"><strong>Origen visible</strong><p>Conoce a quien produce cada artículo.</p></article><article class="info-panel"><strong>Costos claros</strong><p>Revisa subtotal, entrega y total antes de pagar.</p></article><article class="info-panel"><strong>Compra accesible</strong><p>Controles con foco visible y teclado.</p></article></section>`;
}

function renderCatalog() {
  const filtered = products.filter((product) => {
    const matchingText = `${product.name} ${product.producer}`.toLowerCase().includes(state.search.toLowerCase());
    const matchingCategory = !state.categories.length || state.categories.includes(product.category);
    return matchingText && matchingCategory;
  });
  const categories = ["Verduras", "Despensa", "Panadería", "Lácteos"];
  app.innerHTML = `<div class="view-header"><div><p class="eyebrow">Catálogo local</p><h1>Explora productos</h1><p class="muted">Filtra por categoría o busca por nombre y productor.</p></div></div>
  <div class="catalog-layout"><aside class="filters"><form id="catalog-filters"><fieldset><legend>Filtrar por categoría</legend>${categories.map((category) => `<label class="filter-option"><input type="checkbox" name="category" value="${category}" ${state.categories.includes(category) ? "checked" : ""} /> ${category}</label>`).join("")}</fieldset><button class="button button-secondary" type="submit">Aplicar filtros</button></form></aside>
  <section aria-label="Resultados del catálogo"><form class="search-form" id="catalog-search" role="search"><label class="visually-hidden" for="catalog-search-input">Buscar en el catálogo</label><input id="catalog-search-input" name="q" type="search" value="${state.search}" placeholder="Buscar miel, pan, productor…" /><button class="button button-primary" type="submit">Buscar</button></form><p aria-live="polite" class="muted">${filtered.length} productos encontrados.</p><div class="product-grid">${filtered.length ? filtered.map(productCard).join("") : `<div class="empty-state"><h2>No encontramos productos</h2><p>Prueba otra búsqueda o elimina filtros.</p></div>`}</div></section></div>`;
}

function renderDetail(id) {
  const product = getProduct(id) || products[0];
  state.selectedProduct = product.id;
  app.innerHTML = `<p class="breadcrumb"><a href="#explorar">Explorar</a> / ${product.category} / ${product.name}</p><section class="detail-layout" aria-labelledby="detail-title"><div class="detail-image"><img src="assets/mercado-producto.svg" alt="${productImageAlt(product)}" /></div><div><p class="eyebrow">${product.category}</p><h1 id="detail-title">${product.name}</h1><p class="card-meta">${product.producer} · ${product.stock}</p><p>${product.description}</p><p class="price">${money.format(product.price)}</p><div class="origin"><strong>Origen y disponibilidad</strong><br>${product.origin}</div><div class="purchase-row"><div><span class="form-label">Cantidad</span><div class="quantity-control" aria-label="Seleccionar cantidad"><button type="button" data-quantity="decrease" aria-label="Reducir cantidad">−</button><output id="selected-quantity">1</output><button type="button" data-quantity="increase" aria-label="Aumentar cantidad">+</button></div></div><button class="button button-primary" id="add-detail-cart" type="button">Agregar al carrito</button></div></div></section>`;
}

function renderCart() {
  const lines = cartLines();
  app.innerHTML = `<div class="view-header"><div><p class="eyebrow">Compra actual</p><h1>Mi carrito</h1><p class="muted">Revisa cantidades y costos antes de continuar.</p></div></div>${lines.length ? `<div class="cart-layout"><section class="cart-items" aria-label="Productos en el carrito">${lines.map((item) => `<article class="cart-item"><img src="assets/mercado-producto.svg" alt="${productImageAlt(item.product)}" /><div><h2>${item.product.name}</h2><p class="card-meta">${item.product.producer}</p><div class="quantity-control" aria-label="Cantidad de ${item.product.name}"><button type="button" data-cart-action="decrease" data-id="${item.id}" aria-label="Reducir cantidad de ${item.product.name}">−</button><output>${item.quantity}</output><button type="button" data-cart-action="increase" data-id="${item.id}" aria-label="Aumentar cantidad de ${item.product.name}">+</button></div></div><div><strong>${money.format(item.product.price * item.quantity)}</strong><br><button class="remove-button" data-cart-action="remove" data-id="${item.id}" type="button">Eliminar</button></div></article>`).join("")}</section>${summaryCard("Continuar al pago", "#pago")}</div>` : `<section class="empty-state"><h1>Tu carrito está vacío</h1><p>Explora productos locales para iniciar una compra.</p><a class="button button-primary" href="#explorar">Explorar productos</a></section>`}`;
}

function summaryCard(label, href) {
  return `<aside class="summary-card" aria-label="Resumen de compra"><h2>Resumen de compra</h2><div class="summary-row"><span>Subtotal</span><span>${money.format(subtotal())}</span></div><div class="summary-row"><span>Entrega</span><span>${shipping() ? money.format(shipping()) : "Sin costo"}</span></div><div class="summary-row summary-total"><span>Total</span><span>${money.format(total())}</span></div><p class="card-meta">El total se muestra antes de cualquier cargo.</p><a class="button button-primary" href="${href}">${label}</a></aside>`;
}

function renderCheckout() {
  if (!cartLines().length) { window.location.hash = "#carrito"; return; }
  app.innerHTML = `<div class="view-header"><div><p class="eyebrow">Paso 2 de 3 · Dirección › Pago › Confirmación</p><h1>Pago seguro</h1><p class="muted">Este paso permite revisar la información; aún no se realiza ningún cargo.</p></div></div><div class="checkout-layout"><form id="checkout-form" class="checkout-form" novalidate><section class="profile-card"><h2>Entrega</h2><div><label for="address">Dirección de entrega</label><input id="address" name="address" autocomplete="street-address" aria-describedby="address-error" placeholder="Ej. Av. Vallarta 2450" required /><p id="address-error" class="field-error"></p></div><div><label for="city">Ciudad</label><input id="city" name="city" autocomplete="address-level2" value="Puerto Vallarta, JAL" aria-describedby="city-error" required /><p id="city-error" class="field-error"></p></div><p class="notice success">Entrega mañana · 10:00 a 12:00</p></section><section class="profile-card"><h2>Método de pago</h2><label class="payment-choice"><input type="radio" name="payment" value="card" checked /> Tarjeta terminada en 9021</label><p class="card-meta">Pago protegido. Podrás revisar antes de confirmar.</p></section><button class="button button-primary" type="submit">Revisar pedido</button></form>${summaryCard("Revisar pedido", "#pago")}</div>`;
}

function renderConfirmation() {
  app.innerHTML = `<section class="confirmation" aria-labelledby="confirmation-title"><div class="confirmation-mark" aria-hidden="true">✓</div><p class="eyebrow">Pedido confirmado</p><h1 id="confirmation-title">Gracias por comprar local</h1><p>Tu pedido <strong>#ML-2048</strong> fue registrado. Te avisaremos cuando esté listo para su entrega mañana, de 10:00 a 12:00.</p><p class="notice success">No necesitas realizar ninguna acción adicional.</p><a class="button button-primary" href="#perfil">Consultar mi pedido</a> <a class="button button-secondary" href="#inicio">Seguir comprando</a></section>`;
}

function renderProfile() {
  const orderText = state.lastOrder ? "En preparación · Entrega mañana de 10:00 a 12:00" : "Aún no tienes pedidos registrados.";
  app.innerHTML = `<div class="view-header"><div><p class="eyebrow">Tu cuenta</p><h1>Perfil y preferencias</h1><p class="muted">Consulta tu pedido y ajusta la visualización.</p></div></div><div class="profile-grid"><section class="profile-card"><h2>Mi pedido</h2><p><strong>Pedido #ML-2048</strong></p><p class="notice success">${orderText}</p><p class="card-meta">Estado comprensible: preparación, en ruta o entregado.</p></section><section class="profile-card"><h2>Accesibilidad</h2><div class="toggle-row"><span><strong>Texto más grande</strong><br><small class="muted">Aumenta la lectura de la interfaz.</small></span><input id="large-text-toggle" type="checkbox" aria-label="Activar texto más grande" /></div><div class="toggle-row"><span><strong>Alto contraste</strong><br><small class="muted">Refuerza el contraste visual.</small></span><input id="contrast-toggle" type="checkbox" aria-label="Activar alto contraste" /></div></section></div>`;
  document.querySelector("#large-text-toggle").checked = document.body.classList.contains("large-text");
  document.querySelector("#contrast-toggle").checked = document.body.classList.contains("high-contrast");
}

function updateNavigation(route) {
  document.querySelectorAll("[data-route]").forEach((link) => link.toggleAttribute("aria-current", link.dataset.route === route));
}

function render() {
  const [route = "inicio", query = ""] = window.location.hash.replace("#", "").split("?");
  const params = new URLSearchParams(query);
  if (params.get("categoria")) state.categories = [params.get("categoria")];
  updateNavigation(route);
  const routes = { inicio: renderHome, explorar: renderCatalog, detalle: () => renderDetail(params.get("id")), carrito: renderCart, pago: renderCheckout, confirmacion: renderConfirmation, perfil: renderProfile };
  (routes[route] || renderHome)();
  document.querySelector("#main-content").focus({ preventScroll: true });
}

function addToCart(id, quantity = 1) {
  const line = state.cart.find((item) => item.id === Number(id));
  if (line) line.quantity += quantity;
  else state.cart.push({ id: Number(id), quantity });
  saveCart();
  announce(`${getProduct(id).name} se agregó al carrito. Total de artículos: ${cartQuantity()}.`);
}

document.addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const output = document.querySelector("#selected-quantity");
    output.value = Math.max(1, Number(output.value) + (quantityButton.dataset.quantity === "increase" ? 1 : -1));
  }
  const addButton = event.target.closest("#add-detail-cart");
  if (addButton) addToCart(state.selectedProduct, Number(document.querySelector("#selected-quantity").value));
  const cartButton = event.target.closest("[data-cart-action]");
  if (cartButton) {
    const item = state.cart.find((line) => line.id === Number(cartButton.dataset.id));
    if (!item) return;
    if (cartButton.dataset.cartAction === "remove") state.cart = state.cart.filter((line) => line.id !== item.id);
    if (cartButton.dataset.cartAction === "increase") item.quantity += 1;
    if (cartButton.dataset.cartAction === "decrease") item.quantity > 1 ? item.quantity -= 1 : state.cart = state.cart.filter((line) => line.id !== item.id);
    saveCart(); render(); announce("Carrito actualizado.");
  }
  if (event.target.matches("#large-text-toggle")) document.body.classList.toggle("large-text", event.target.checked);
  if (event.target.matches("#contrast-toggle")) document.body.classList.toggle("high-contrast", event.target.checked);
});

// No hay ventanas emergentes: Esc ofrece una salida predecible desde detalle y pago.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const route = window.location.hash.replace("#", "").split("?")[0];
  if (route === "detalle") window.location.hash = "#explorar";
  else if (route === "pago") window.location.hash = "#carrito";
  else {
    document.activeElement?.blur();
    announce("Acción cancelada.");
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "home-search" || event.target.id === "catalog-search") {
    event.preventDefault(); state.search = new FormData(event.target).get("q").trim(); window.location.hash = "#explorar"; return;
  }
  if (event.target.id === "catalog-filters") {
    event.preventDefault(); state.categories = [...new FormData(event.target).getAll("category")]; render(); return;
  }
  if (event.target.id === "checkout-form") {
    event.preventDefault();
    let valid = true;
    ["address", "city"].forEach((name) => {
      const field = event.target.elements[name]; const error = document.querySelector(`#${name}-error`);
      const message = field.value.trim() ? "" : "Este campo es obligatorio.";
      error.textContent = message; field.classList.toggle("invalid", Boolean(message)); valid &&= !message;
    });
    if (!valid) { announce("Revisa los campos marcados antes de continuar."); event.target.querySelector(".invalid").focus(); return; }
    state.lastOrder = { createdAt: new Date().toISOString(), total: total() }; localStorage.setItem("mercado-local-order", JSON.stringify(state.lastOrder)); state.cart = []; saveCart(); window.location.hash = "#confirmacion"; announce("Pedido confirmado.");
  }
});

window.addEventListener("hashchange", render);
updateCartCount();
if (!window.location.hash) window.location.hash = "#inicio";
else render();
