/**
 * Mercado Local - lógica de interfaz.
 *
 * Este archivo controla las vistas de la aplicación, el carrito y los eventos
 * del usuario. No realiza peticiones de red: el catálogo proviene de
 * `catalog.js` y los pedidos se guardan localmente con `storage.js`.
 */

// -----------------------------------------------------------------------------
// Estado y referencias del documento
// -----------------------------------------------------------------------------

const products = window.catalogProducts;
const preferencesStorageKey = "mercado-local-preferences";

/** Estado temporal de la interfaz. El carrito y el último pedido se persisten. */
const state = {
  cart: JSON.parse(localStorage.getItem("mercado-local-cart") || "[]"),
  selectedProduct: 1,
  search: "",
  categories: [],
  lastOrder: JSON.parse(localStorage.getItem("mercado-local-order") || "null"),
};

const app = document.querySelector("#app");
const statusMessage = document.querySelector("#status-message");
const toastMessage = document.querySelector("#toast-message");
const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

let toastTimer;
let registeredEmail = "";

/** El acceso del encabezado muestra la cuenta cuando hay una sesión local. */
function updateAccountLink() {
  document.querySelector("#account-link").textContent = LocalAuth.getSession() ? "Mi cuenta" : "Iniciar sesión";
}

/**
 * Recupera las preferencias visuales elegidas por la persona usuaria.
 * Si el almacenamiento del navegador no está disponible, se usan valores seguros.
 */
function getSavedPreferences() {
  try {
    return JSON.parse(localStorage.getItem(preferencesStorageKey) || "{}");
  } catch {
    return {};
  }
}

/** Aplica una preferencia y la conserva para próximas visitas al sitio. */
function setVisualPreference(name, className, enabled) {
  document.body.classList.toggle(className, enabled);

  const preferences = getSavedPreferences();
  preferences[name] = enabled;
  localStorage.setItem(preferencesStorageKey, JSON.stringify(preferences));
}

/** Restaura las preferencias visuales antes de dibujar la primera vista. */
function restoreVisualPreferences() {
  const preferences = getSavedPreferences();
  document.body.classList.toggle("large-text", Boolean(preferences.largeText));
  document.body.classList.toggle("high-contrast", Boolean(preferences.highContrast));
  document.body.classList.toggle("dark-mode", Boolean(preferences.darkMode));
}

// -----------------------------------------------------------------------------
// Utilidades de datos, mensajes y carrito
// -----------------------------------------------------------------------------

/** Muestra un aviso visible y lo anuncia a tecnologías de asistencia. */
function announce(message) {
  statusMessage.textContent = message;
  toastMessage.textContent = message;
  toastMessage.hidden = false;

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastMessage.hidden = true;
  }, 4500);
}

/** Genera el texto alternativo significativo para la imagen de un producto. */
function productImageAlt(product) {
  const type = product.image ? "Fotografía" : "Ilustración";
  return `${type} de ${product.name} de ${product.producer}`;
}

/** Devuelve la fotografía asignada o la ilustración genérica del catálogo. */
function productImage(product) {
  return product.image || "assets/mercado-producto.svg";
}

/** Busca un producto por su identificador numérico. */
function getProduct(id) {
  return products.find((product) => product.id === Number(id));
}

/** Suma el número de unidades de todas las líneas del carrito. */
function cartQuantity() {
  return state.cart.reduce((quantity, item) => quantity + item.quantity, 0);
}

/** Combina cada línea del carrito con los datos completos de su producto. */
function cartLines() {
  return state.cart
    .map((item) => ({ ...item, product: getProduct(item.id) }))
    .filter((item) => item.product);
}

/** Calcula el importe de los productos antes de la entrega. */
function subtotal() {
  return cartLines().reduce(
    (amount, item) => amount + item.product.price * item.quantity,
    0,
  );
}

/** La entrega es gratuita a partir de $300. */
function shipping() {
  return subtotal() === 0 || subtotal() >= 300 ? 0 : 60;
}

/** Calcula el importe final que se muestra en el resumen de compra. */
function total() {
  return subtotal() + shipping();
}

/** Guarda el carrito actual y actualiza el indicador de la navegación. */
function saveCart() {
  localStorage.setItem("mercado-local-cart", JSON.stringify(state.cart));
  updateCartCount();
}

/** Actualiza el contador del enlace Carrito de la navegación principal. */
function updateCartCount() {
  document.querySelector("#cart-count").textContent = cartQuantity();
}

/** Agrega un producto; si ya existe, aumenta su cantidad. */
function addToCart(id, quantity = 1) {
  const existingLine = state.cart.find((item) => item.id === Number(id));

  if (existingLine) {
    existingLine.quantity += quantity;
  } else {
    state.cart.push({ id: Number(id), quantity });
  }

  saveCart();
  announce(`${getProduct(id).name} se agregó al carrito. Total: ${cartQuantity()} artículos.`);
}

/** Modifica una línea del carrito y conserva los valores mínimos permitidos. */
function updateCartItem(id, action) {
  const item = state.cart.find((line) => line.id === Number(id));
  if (!item) return;

  if (action === "remove") {
    state.cart = state.cart.filter((line) => line.id !== item.id);
  }

  if (action === "increase") {
    item.quantity += 1;
  }

  if (action === "decrease") {
    state.cart = item.quantity > 1
      ? state.cart.map((line) => (
        line.id === item.id ? { ...line, quantity: line.quantity - 1 } : line
      ))
      : state.cart.filter((line) => line.id !== item.id);
  }

  saveCart();
  render();
  announce("Carrito actualizado.");
}

// -----------------------------------------------------------------------------
// Componentes reutilizables
// -----------------------------------------------------------------------------

/** Crea una tarjeta de producto para Inicio o Explorar. */
function productCard(product) {
  return `
    <article class="product-card">
      <img src="${productImage(product)}" alt="${productImageAlt(product)}" />
      <div class="card-body">
        <div>
          <h3>${product.name}</h3>
          <p class="card-meta">${product.producer} · ${product.stock}</p>
        </div>
        <p class="card-meta">${product.description}</p>
        <div class="card-actions">
          <span class="price">${money.format(product.price)}</span>
          <a class="button button-secondary" href="#detalle?id=${product.id}">
            Ver detalle
          </a>
        </div>
      </div>
    </article>
  `;
}

/** Crea el resumen de importes y una acción para avanzar en la compra. */
function summaryCard(label, href, formId = "") {
  const action = formId
    ? `<button class="button button-primary" type="submit" form="${formId}">${label}</button>`
    : `<a class="button button-primary" href="${href}">${label}</a>`;

  return `
    <aside class="summary-card" aria-label="Resumen de compra">
      <h2>Resumen de compra</h2>
      <div class="summary-row">
        <span>Subtotal</span>
        <span>${money.format(subtotal())}</span>
      </div>
      <div class="summary-row">
        <span>Entrega</span>
        <span>${shipping() ? money.format(shipping()) : "Sin costo"}</span>
      </div>
      <div class="summary-row summary-total">
        <span>Total</span>
        <span>${money.format(total())}</span>
      </div>
      <p class="card-meta">El total se muestra antes de confirmar el pedido.</p>
      ${action}
    </aside>
  `;
}

/** Construye un control de cantidad accesible para detalle o carrito. */
function quantityControl({ id, quantity, detail = false, productName = "" }) {
  if (detail) {
    return `
      <div class="quantity-control" aria-label="Seleccionar cantidad">
        <button type="button" data-quantity="decrease" aria-label="Reducir cantidad">−</button>
        <output id="selected-quantity">${quantity}</output>
        <button type="button" data-quantity="increase" aria-label="Aumentar cantidad">+</button>
      </div>
    `;
  }

  return `
    <div class="quantity-control" aria-label="Cantidad de ${productName}">
      <button type="button" data-cart-action="decrease" data-id="${id}" aria-label="Reducir cantidad de ${productName}">−</button>
      <output>${quantity}</output>
      <button type="button" data-cart-action="increase" data-id="${id}" aria-label="Aumentar cantidad de ${productName}">+</button>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Vistas de la aplicación
// -----------------------------------------------------------------------------

/** Renderiza Inicio con productos destacados, búsqueda y acceso al carrito. */
function renderHome() {
  const featuredProducts = products.slice(0, 3).map(productCard).join("");
  const deliveryMessage = subtotal()
    ? (shipping() ? "Entrega local" : "Entrega sin costo")
    : "Agrega productos para comenzar";

  app.innerHTML = `
    <section class="home-top" aria-labelledby="home-title">
      <div>
        <section class="hero">
          <div>
            <p class="eyebrow">De productores cercanos a tu mesa</p>
            <h1 id="home-title">Productos frescos de productores cercanos</h1>
            <p>Compra con origen claro, entrega local y un flujo simple.</p>
            <a class="button button-primary" href="#explorar">Explorar productos</a>
          </div>
          <div class="hero-art" aria-hidden="true">🥕</div>
        </section>

        <form class="search-form" id="home-search" role="search">
          <label class="visually-hidden" for="home-search-input">Buscar productos locales</label>
          <input id="home-search-input" name="q" type="search" placeholder="Buscar productos locales" value="${state.search}" />
          <button class="button button-primary" type="submit">Buscar</button>
        </form>
      </div>

      <aside class="quick-cart" aria-labelledby="quick-cart-title">
        <div>
          <h2 id="quick-cart-title">Tu carrito</h2>
          <p>
            ${cartQuantity()} productos<br />
            Subtotal ${money.format(subtotal())}<br />
            ${deliveryMessage}
          </p>
        </div>
        <a class="button button-secondary" href="#carrito">Ver carrito</a>
      </aside>
    </section>

    <section aria-labelledby="featured-title">
      <div class="section-heading">
        <div>
          <h2 id="featured-title">Destacados esta semana</h2>
          <p class="muted">Precio, productor y disponibilidad visibles antes de comprar.</p>
        </div>
        <a href="#explorar">Ver catálogo completo</a>
      </div>
      <div class="product-grid">${featuredProducts}</div>
    </section>

    <section class="info-grid" aria-label="Beneficios de Mercado Local">
      <article class="info-panel">
        <strong>Origen visible</strong>
        <p>Conoce a quien produce cada artículo.</p>
      </article>
      <article class="info-panel">
        <strong>Costos claros</strong>
        <p>Revisa subtotal, entrega y total antes de pagar.</p>
      </article>
      <article class="info-panel">
        <strong>Compra accesible</strong>
        <p>Controles con foco visible y teclado.</p>
      </article>
    </section>
  `;
}

/** Renderiza el catálogo y aplica filtros en memoria. */
function renderCatalog() {
  const categories = ["Verduras", "Despensa", "Panadería", "Lácteos"];
  const filteredProducts = products.filter((product) => {
    const text = `${product.name} ${product.producer}`.toLowerCase();
    const matchesSearch = text.includes(state.search.toLowerCase());
    const matchesCategory = !state.categories.length || state.categories.includes(product.category);
    return matchesSearch && matchesCategory;
  });

  const categoryFields = categories.map((category) => `
    <label class="filter-option">
      <input type="checkbox" name="category" value="${category}" ${state.categories.includes(category) ? "checked" : ""} />
      ${category}
    </label>
  `).join("");

  const results = filteredProducts.length
    ? filteredProducts.map(productCard).join("")
    : `
      <div class="empty-state">
        <h2>No encontramos productos</h2>
        <p>Prueba otra búsqueda o elimina filtros.</p>
      </div>
    `;

  app.innerHTML = `
    <div class="view-header">
      <div>
        <p class="eyebrow">Catálogo local</p>
        <h1>Explora productos</h1>
        <p class="muted">Filtra por categoría o busca por nombre y productor.</p>
      </div>
    </div>

    <div class="catalog-layout">
      <aside class="filters">
        <form id="catalog-filters">
          <fieldset>
            <legend>Filtrar por categoría</legend>
            ${categoryFields}
          </fieldset>
          <button class="button button-secondary" type="submit">Aplicar filtros</button>
        </form>
      </aside>

      <section aria-label="Resultados del catálogo">
        <form class="search-form" id="catalog-search" role="search">
          <label class="visually-hidden" for="catalog-search-input">Buscar en el catálogo</label>
          <input id="catalog-search-input" name="q" type="search" value="${state.search}" placeholder="Buscar miel, pan, productor…" />
          <button class="button button-primary" type="submit">Buscar</button>
        </form>
        <p aria-live="polite" class="muted">${filteredProducts.length} productos encontrados.</p>
        <div class="product-grid">${results}</div>
      </section>
    </div>
  `;
}

/** Renderiza la ficha de un producto y permite elegir unidades. */
function renderDetail(id) {
  const product = getProduct(id) || products[0];
  state.selectedProduct = product.id;

  app.innerHTML = `
    <p class="breadcrumb">
      <a href="#explorar">Explorar</a> / ${product.category} / ${product.name}
    </p>

    <section class="detail-layout" aria-labelledby="detail-title">
      <div class="detail-image">
        <img src="${productImage(product)}" alt="${productImageAlt(product)}" />
      </div>

      <div>
        <p class="eyebrow">${product.category}</p>
        <h1 id="detail-title">${product.name}</h1>
        <p class="card-meta">${product.producer} · ${product.stock}</p>
        <p>${product.description}</p>
        <p class="price">${money.format(product.price)}</p>

        <div class="origin">
          <strong>Origen y disponibilidad</strong><br />
          ${product.origin}
        </div>

        <div class="purchase-row">
          <div>
            <span class="form-label">Cantidad</span>
            ${quantityControl({ quantity: 1, detail: true })}
          </div>
          <button class="button button-primary" id="add-detail-cart" type="button">
            Agregar al carrito
          </button>
        </div>
      </div>
    </section>
  `;
}

/** Renderiza el carrito; si está vacío, muestra un enlace de regreso al catálogo. */
function renderCart() {
  const lines = cartLines();

  if (!lines.length) {
    app.innerHTML = `
      <section class="empty-state">
        <h1>Tu carrito está vacío</h1>
        <p>Explora productos locales para iniciar una compra.</p>
        <a class="button button-primary" href="#explorar">Explorar productos</a>
      </section>
    `;
    return;
  }

  const lineItems = lines.map((item) => `
    <article class="cart-item">
      <img src="${productImage(item.product)}" alt="${productImageAlt(item.product)}" />
      <div>
        <h2>${item.product.name}</h2>
        <p class="card-meta">${item.product.producer}</p>
        ${quantityControl({
          id: item.id,
          quantity: item.quantity,
          productName: item.product.name,
        })}
      </div>
      <div>
        <strong>${money.format(item.product.price * item.quantity)}</strong><br />
        <button class="remove-button" data-cart-action="remove" data-id="${item.id}" type="button">
          Eliminar
        </button>
      </div>
    </article>
  `).join("");

  app.innerHTML = `
    <div class="view-header">
      <div>
        <p class="eyebrow">Compra actual</p>
        <h1>Mi carrito</h1>
        <p class="muted">Revisa cantidades y costos antes de continuar.</p>
      </div>
    </div>

    <div class="cart-layout">
      <section class="cart-items" aria-label="Productos en el carrito">
        ${lineItems}
      </section>
      ${summaryCard("Continuar al pago", "#pago")}
    </div>
  `;
}

/** Renderiza el formulario de entrega y el resumen antes de confirmar. */
function renderCheckout() {
  if (!cartLines().length) {
    window.location.hash = "#carrito";
    return;
  }

  app.innerHTML = `
    <div class="view-header">
      <div>
        <p class="eyebrow">Paso 2 de 3 · Dirección › Pago › Confirmación</p>
        <h1>Pago seguro</h1>
        <p class="muted">Confirma el pedido para registrar la compra y ver el comprobante.</p>
      </div>
    </div>

    <div class="checkout-layout">
      <form id="checkout-form" class="checkout-form" novalidate>
        <section class="profile-card">
          <h2>Entrega</h2>

          <div>
            <label for="address">Dirección de entrega</label>
            <input id="address" name="address" autocomplete="street-address" aria-describedby="address-error" placeholder="Ej. Av. Vallarta 2450" required />
            <p id="address-error" class="field-error"></p>
          </div>

          <div>
            <label for="city">Ciudad</label>
            <input id="city" name="city" autocomplete="address-level2" value="Puerto Vallarta, JAL" aria-describedby="city-error" required />
            <p id="city-error" class="field-error"></p>
          </div>

          <p class="notice success">Entrega mañana · 10:00 a 12:00</p>
        </section>

        <section class="profile-card">
          <h2>Método de pago</h2>
          <label class="payment-choice">
            <input type="radio" name="payment" value="card" checked />
            Tarjeta terminada en 9021
          </label>
          <p class="card-meta">Pago protegido. Podrás revisar antes de confirmar.</p>
        </section>

        <button class="button button-primary" type="submit">Confirmar pedido</button>
      </form>

      ${summaryCard("Confirmar pedido", "", "checkout-form")}
    </div>
  `;
}

/** Presenta la confirmación del último pedido guardado. */
function renderConfirmation() {
  // Una confirmación antigua no debe anunciar la entrega de un pedido cancelado.
  if (state.lastOrder?.status === "Cancelado") {
    updateNavigation("pedidos");
    renderOrders();
    return;
  }
  const orderCode = state.lastOrder?.code || "ML-2048";
  const delivery = state.lastOrder?.delivery || "Mañana, de 10:00 a 12:00";

  app.innerHTML = `
    <section class="confirmation" aria-labelledby="confirmation-title">
      <div class="confirmation-mark" aria-hidden="true">✓</div>
      <p class="eyebrow">Pedido confirmado</p>
      <h1 id="confirmation-title">Gracias por comprar local</h1>
      <p>
        Tu pedido <strong>#${orderCode}</strong> fue registrado.
        Te avisaremos cuando esté listo para su entrega ${delivery.toLowerCase()}.
      </p>
      <p class="notice success">No necesitas realizar ninguna acción adicional.</p>
      <a class="button button-primary" href="#pedidos">Consultar mi pedido</a>
      <a class="button button-secondary" href="#inicio">Seguir comprando</a>
    </section>
  `;
}

/** Obtiene el historial local y evita duplicar el último pedido visible. */
function getOrders() {
  const savedOrders = JSON.parse(localStorage.getItem("mercado-local-orders") || "[]");

  if (savedOrders.length || !state.lastOrder) {
    return savedOrders;
  }

  return [state.lastOrder];
}

/** Muestra exclusivamente el historial de pedidos registrados. */
function renderOrders() {
  const orders = getOrders();
  const content = orders.length
    ? orders.slice().reverse().map((order) => `
      <article class="order-card">
        <div>
          <p class="eyebrow ${order.status === "Cancelado" ? "order-cancelled" : ""}">${order.status || "En preparación"}</p>
          <h2>Pedido #${order.code}</h2>
          <p class="muted">Registrado el ${new Date(order.createdAt).toLocaleDateString("es-MX")}</p>
        </div>
        <div class="order-summary">
          <strong>${money.format(order.total)}</strong>
          ${order.status === "Cancelado"
            ? `<span class="muted">${order.cancelledAt ? `Cancelado el ${new Date(order.cancelledAt).toLocaleDateString("es-MX")}` : "Pedido cancelado"}</span><span class="muted">Este pedido ya no se entregará.</span>`
            : `<span>Entrega: ${order.delivery}</span>`}
          ${(order.status || "En preparación") === "En preparación"
            ? `<button class="button button-danger" type="button" data-cancel-order="${order.code}" aria-label="Cancelar pedido ${order.code}">Cancelar pedido</button>`
            : ""}
        </div>
      </article>
    `).join("")
    : `
      <section class="empty-state">
        <h2>Aún no tienes pedidos</h2>
        <p>Cuando confirmes una compra, aparecerá aquí.</p>
        <a class="button button-primary" href="#explorar">Explorar productos</a>
      </section>
    `;

  app.innerHTML = `
    <div class="view-header">
      <div>
        <p class="eyebrow">Historial de compras</p>
        <h1>Mis pedidos</h1>
        <p class="muted">Consulta el estado, costo y horario de entrega de tus compras.</p>
      </div>
    </div>

    <section class="orders-list" aria-label="Historial de pedidos">
      ${content}
    </section>

    <dialog id="cancel-order-dialog" class="cancel-order-dialog" aria-labelledby="cancel-order-title" aria-describedby="cancel-order-description">
      <h2 id="cancel-order-title">¿Cancelar este pedido?</h2>
      <p id="cancel-order-description">El pedido <strong id="cancel-order-code"></strong> ya no se entregará. Podrás seguir consultándolo en tu historial.</p>
      <form method="dialog" class="dialog-actions">
        <button class="button button-secondary" autofocus>Conservar pedido</button>
        <button class="button button-danger" id="confirm-cancel-order" type="button">Sí, cancelar pedido</button>
      </form>
    </dialog>
  `;

  // Al cerrar con Esc o con «Conservar pedido», devuelve el foco al botón de origen.
  const dialog = document.querySelector("#cancel-order-dialog");
  dialog.addEventListener("close", () => {
    if (dialog.returnFocus?.isConnected) dialog.returnFocus.focus();
  });
}

/** Abre la confirmación de cancelación del pedido seleccionado. */
function requestOrderCancellation(button) {
  const dialog = document.querySelector("#cancel-order-dialog");
  dialog.dataset.orderCode = button.dataset.cancelOrder;
  dialog.returnFocus = button;
  document.querySelector("#cancel-order-code").textContent = `#${button.dataset.cancelOrder}`;
  dialog.showModal();
}

/** Guarda la cancelación, actualiza el historial y anuncia el resultado. */
function confirmOrderCancellation() {
  const dialog = document.querySelector("#cancel-order-dialog");
  if (!dialog?.open) return;

  try {
    const cancelledOrder = LocalStore.cancelOrder(dialog.dataset.orderCode);
    if (state.lastOrder?.code === cancelledOrder.code) state.lastOrder = cancelledOrder;
    dialog.close();
    renderOrders();
    Accessibility.moveFocusToContent();
    announce(`Pedido #${cancelledOrder.code} cancelado correctamente.`);
  } catch (error) {
    dialog.close();
    announce(`No fue posible cancelar el pedido: ${error.message}`);
  }
}

/** Muestra las opciones personales, actualmente enfocadas en accesibilidad. */
function renderOptions() {
  app.innerHTML = `
    <div class="view-header">
      <div>
        <p class="eyebrow">Preferencias</p>
        <h1>Opciones</h1>
        <p class="muted">Ajusta la visualización para leer con mayor comodidad.</p>
      </div>
    </div>

    <section class="profile-card options-card" aria-label="Opciones de accesibilidad">
      <div class="toggle-row">
        <span>
          <strong>Texto más grande</strong><br />
          <small class="muted">Aumenta la lectura de la interfaz.</small>
        </span>
        <input id="large-text-toggle" type="checkbox" aria-label="Activar texto más grande" />
      </div>
      <div class="toggle-row">
        <span>
          <strong>Alto contraste</strong><br />
          <small class="muted">Refuerza el contraste visual.</small>
        </span>
        <input id="contrast-toggle" type="checkbox" aria-label="Activar alto contraste" />
      </div>
      <div class="toggle-row">
        <span>
          <strong>Modo oscuro</strong><br />
          <small class="muted">Reduce el brillo de la interfaz.</small>
        </span>
        <input id="dark-mode-toggle" type="checkbox" aria-label="Activar modo oscuro" />
      </div>
    </section>
  `;

  document.querySelector("#large-text-toggle").checked = document.body.classList.contains("large-text");
  document.querySelector("#contrast-toggle").checked = document.body.classList.contains("high-contrast");
  document.querySelector("#dark-mode-toggle").checked = document.body.classList.contains("dark-mode");
}

/** Presenta el formulario de acceso o la cuenta de la sesión actual. */
function renderLogin() {
  const session = LocalAuth.getSession();
  if (session) {
    app.innerHTML = `
      <section class="auth-card profile-card" aria-labelledby="account-title">
        <p class="eyebrow">Tu cuenta</p>
        <h1 id="account-title">Sesión iniciada</h1>
        <p class="muted">Bienvenido a Mercado Local.</p>
        <dl class="account-details">
          <div><dt>Nombre</dt><dd id="account-name"></dd></div>
          <div><dt>Correo electrónico</dt><dd id="account-email"></dd></div>
        </dl>
        <div class="auth-actions">
          <a class="button button-primary" href="#pedidos">Mis pedidos</a>
          <button class="button button-secondary" id="logout-button" type="button">Cerrar sesión</button>
        </div>
      </section>
    `;
    document.querySelector("#account-name").textContent = session.name;
    document.querySelector("#account-email").textContent = session.email;
    return;
  }

  app.innerHTML = `
    <section class="auth-card profile-card" aria-labelledby="login-title">
      <p class="eyebrow">Bienvenido de nuevo</p>
      <h1 id="login-title">Iniciar sesión</h1>
      <p class="muted">Ingresa con tu correo y contraseña.</p>
      <form id="login-form" class="auth-form" novalidate>
        <div>
          <label for="login-email">Correo electrónico</label>
          <input id="login-email" name="email" type="email" autocomplete="username" maxlength="254" required aria-describedby="login-email-error" />
          <p id="login-email-error" class="field-error"></p>
        </div>
        <div>
          <label for="login-password">Contraseña</label>
          <input id="login-password" name="password" type="password" autocomplete="current-password" required aria-describedby="login-password-error" />
          <p id="login-password-error" class="field-error"></p>
          <label class="password-toggle"><input type="checkbox" data-password-targets="login-password" /> Mostrar contraseña</label>
        </div>
        <p id="login-error" class="notice error" role="alert" hidden></p>
        <button class="button button-primary" type="submit">Entrar</button>
      </form>
      <p class="auth-switch">¿No tienes cuenta? <a href="#registro">Crear cuenta</a></p>
    </section>
  `;
  document.querySelector("#login-email").value = registeredEmail;
  registeredEmail = "";
}

/** Presenta el registro de una cuenta nueva en este navegador. */
function renderRegister() {
  if (LocalAuth.getSession()) {
    renderLogin();
    return;
  }
  app.innerHTML = `
    <section class="auth-card profile-card" aria-labelledby="register-title">
      <p class="eyebrow">Únete a Mercado Local</p>
      <h1 id="register-title">Crear cuenta</h1>
      <p class="muted">Completa tus datos para registrarte.</p>
      <form id="register-form" class="auth-form" novalidate>
        <div>
          <label for="register-name">Nombre completo</label>
          <input id="register-name" name="name" type="text" autocomplete="name" minlength="2" maxlength="80" required aria-describedby="register-name-error" />
          <p id="register-name-error" class="field-error"></p>
        </div>
        <div>
          <label for="register-email">Correo electrónico</label>
          <input id="register-email" name="email" type="email" autocomplete="username" maxlength="254" required aria-describedby="register-email-error" />
          <p id="register-email-error" class="field-error"></p>
        </div>
        <div>
          <label for="register-password">Contraseña</label>
          <input id="register-password" name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required aria-describedby="register-password-hint register-password-error" />
          <small id="register-password-hint" class="muted">Usa entre 8 y 128 caracteres.</small>
          <p id="register-password-error" class="field-error"></p>
        </div>
        <div>
          <label for="register-confirmPassword">Confirmar contraseña</label>
          <input id="register-confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" maxlength="128" required aria-describedby="register-confirmPassword-error" />
          <p id="register-confirmPassword-error" class="field-error"></p>
          <label class="password-toggle"><input type="checkbox" data-password-targets="register-password register-confirmPassword" /> Mostrar contraseñas</label>
        </div>
        <p id="register-error" class="notice error" role="alert" hidden></p>
        <button class="button button-primary" type="submit">Registrarme</button>
      </form>
      <p class="auth-switch">¿Ya tienes cuenta? <a href="#login">Iniciar sesión</a></p>
    </section>
  `;
}

/** Asocia los errores del acceso o registro con sus campos y enfoca el primero. */
function showAuthFieldErrors(form, errors, prefix) {
  for (const [name, message] of Object.entries(errors)) {
    const field = form.elements[name];
    document.querySelector(`#${prefix}-${name}-error`).textContent = message;
    field.classList.toggle("invalid", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
  }
  const invalidField = form.querySelector(".invalid");
  if (!invalidField) return false;
  invalidField.focus();
  announce("Revisa los campos marcados antes de continuar.");
  return true;
}

/** Valida un registro y vuelve al acceso tras guardar la cuenta local. */
async function submitRegister(form) {
  const submitButton = form.querySelector("[type='submit']");
  if (submitButton.disabled) return;
  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  const confirmation = form.elements.confirmPassword.value;
  const errors = {
    name: name.length < 2 ? "Escribe tu nombre completo (al menos 2 caracteres)." : "",
    email: !email ? "Escribe tu correo electrónico." : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Escribe un correo electrónico válido." : ""),
    password: password.length < 8 || password.length > 128 ? "Usa una contraseña de entre 8 y 128 caracteres." : "",
    confirmPassword: !confirmation ? "Confirma tu contraseña." : (confirmation !== password ? "Las contraseñas no coinciden." : ""),
  };
  const errorNotice = document.querySelector("#register-error");
  errorNotice.hidden = true;
  if (showAuthFieldErrors(form, errors, "register")) return;

  submitButton.disabled = true;
  submitButton.textContent = "Creando cuenta…";
  try {
    const user = await LocalAuth.register(name, email, password);
    form.elements.password.value = "";
    form.elements.confirmPassword.value = "";
    registeredEmail = user.email;
    window.location.hash = "#login";
    announce("Tu cuenta se creó correctamente. Ya puedes iniciar sesión.");
  } catch (error) {
    errorNotice.textContent = error.message;
    errorNotice.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Registrarme";
  }
}

/** Valida los campos de acceso y comunica errores junto a cada campo. */
async function submitLogin(form) {
  const submitButton = form.querySelector("[type='submit']");
  if (submitButton.disabled) return;
  const email = form.elements.email;
  const password = form.elements.password;
  const errors = {
    email: !email.value.trim() ? "Escribe tu correo electrónico." : (email.validity.typeMismatch ? "Escribe un correo electrónico válido." : ""),
    password: !password.value ? "Escribe tu contraseña." : "",
  };
  const errorNotice = document.querySelector("#login-error");
  errorNotice.hidden = true;
  errorNotice.textContent = "";

  if (showAuthFieldErrors(form, errors, "login")) return;

  submitButton.disabled = true;
  submitButton.textContent = "Entrando…";
  try {
    await LocalAuth.login(email.value, password.value);
    password.value = "";
    updateAccountLink();
    window.location.hash = "#inicio";
    announce("Sesión iniciada. Bienvenido a Mercado Local.");
  } catch (error) {
    errorNotice.textContent = error.message;
    errorNotice.hidden = false;
    password.focus();
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Entrar";
  }
}

// -----------------------------------------------------------------------------
// Navegación y renderizado principal
// -----------------------------------------------------------------------------

/** Marca el enlace activo en las navegaciones principal y lateral. */
function updateNavigation(route) {
  document.querySelectorAll("[data-route]").forEach((link) => {
    if (link.dataset.route === route) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

/**
 * Enrutador de la SPA: interpreta el hash de la URL y sustituye el contenido
 * de `#app`. Al terminar, coloca el foco en el contenido para navegación por teclado.
 */
function render() {
  const [route = "inicio", query = ""] = window.location.hash.replace("#", "").split("?");
  const resolvedRoute = route === "perfil" ? "opciones" : route;
  const params = new URLSearchParams(query);

  if (params.get("categoria")) {
    state.categories = [params.get("categoria")];
  }

  updateNavigation(resolvedRoute);
  updateAccountLink();

  const routes = {
    inicio: renderHome,
    explorar: renderCatalog,
    detalle: () => renderDetail(params.get("id")),
    carrito: renderCart,
    pago: renderCheckout,
    confirmacion: renderConfirmation,
    pedidos: renderOrders,
    opciones: renderOptions,
    login: renderLogin,
    registro: renderRegister,
  };

  (routes[resolvedRoute] || renderHome)();
  Accessibility.moveFocusToContent();
  // Los enlaces al pie del acceso deben abrir el siguiente formulario desde arriba.
  if (resolvedRoute === "login" || resolvedRoute === "registro") {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
}

// -----------------------------------------------------------------------------
// Eventos de usuario
// -----------------------------------------------------------------------------

/** Maneja clics de controles que se generan dinámicamente en cada vista. */
document.addEventListener("click", (event) => {
  if (event.target.closest("#logout-button")) {
    LocalAuth.logout();
    render();
    announce("Has cerrado sesión.");
    return;
  }

  const cancelButton = event.target.closest("[data-cancel-order]");
  if (cancelButton) {
    requestOrderCancellation(cancelButton);
    return;
  }

  if (event.target.closest("#confirm-cancel-order")) {
    confirmOrderCancellation();
    return;
  }

  const quantityButton = event.target.closest("[data-quantity]");

  if (quantityButton) {
    const quantityOutput = document.querySelector("#selected-quantity");
    const direction = quantityButton.dataset.quantity === "increase" ? 1 : -1;
    quantityOutput.value = Math.max(1, Number(quantityOutput.value) + direction);
  }

  const addButton = event.target.closest("#add-detail-cart");

  if (addButton) {
    const selectedQuantity = Number(document.querySelector("#selected-quantity").value);
    addToCart(state.selectedProduct, selectedQuantity);
    addButton.textContent = "Agregado al carrito ✓";
  }

  const cartButton = event.target.closest("[data-cart-action]");

  if (cartButton) {
    updateCartItem(cartButton.dataset.id, cartButton.dataset.cartAction);
  }

  if (event.target.matches("#large-text-toggle")) {
    setVisualPreference("largeText", "large-text", event.target.checked);
  }

  if (event.target.matches("#contrast-toggle")) {
    setVisualPreference("highContrast", "high-contrast", event.target.checked);
  }

  if (event.target.matches("#dark-mode-toggle")) {
    setVisualPreference("darkMode", "dark-mode", event.target.checked);
  }
});

/** Muestra u oculta la contraseña sin volver a crear el formulario. */
document.addEventListener("change", (event) => {
  if (event.target.matches("[data-password-targets]")) {
    event.target.dataset.passwordTargets.split(" ").forEach((id) => {
      document.getElementById(id).type = event.target.checked ? "text" : "password";
    });
  }
});

/** Permite salir de detalle o pago mediante la tecla Esc. */
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  // El diálogo nativo gestiona Esc y conserva el pedido sin cambiar de vista.
  if (document.querySelector("#cancel-order-dialog")?.open) return;

  const route = window.location.hash.replace("#", "").split("?")[0];

  if (route === "detalle") {
    window.location.hash = "#explorar";
  } else if (route === "pago") {
    window.location.hash = "#carrito";
  } else {
    document.activeElement?.blur();
    announce("Acción cancelada.");
  }
});

/** Gestiona búsqueda, filtros y confirmación de compra. */
document.addEventListener("submit", (event) => {
  const form = event.target;

  if (form.id === "login-form") {
    event.preventDefault();
    submitLogin(form);
    return;
  }

  if (form.id === "register-form") {
    event.preventDefault();
    submitRegister(form);
    return;
  }

  if (form.id === "home-search" || form.id === "catalog-search") {
    event.preventDefault();
    state.search = new FormData(form).get("q").trim();
    window.location.hash = "#explorar";
    return;
  }

  if (form.id === "catalog-filters") {
    event.preventDefault();
    state.categories = [...new FormData(form).getAll("category")];
    render();
    return;
  }

  if (form.id === "checkout-form") {
    event.preventDefault();

    const valid = validateCheckout(form);
    if (!valid) return;

    const orderPayload = {
      address: form.elements.address.value,
      city: form.elements.city.value,
      payment: form.elements.payment.value,
      items: state.cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
    };

    try {
      state.lastOrder = LocalStore.saveOrder(orderPayload);
      localStorage.setItem("mercado-local-order", JSON.stringify(state.lastOrder));
      state.cart = [];
      saveCart();
      window.location.hash = "#confirmacion";
      announce(`Pedido ${state.lastOrder.code} confirmado.`);
    } catch (error) {
      announce(`No fue posible confirmar el pedido: ${error.message}`);
    }
  }
});

/** Valida los campos obligatorios del pago y mueve el foco al primer error. */
function validateCheckout(form) {
  const requiredFields = ["address", "city"];
  let valid = true;

  requiredFields.forEach((name) => {
    const field = form.elements[name];
    const error = document.querySelector(`#${name}-error`);
    const message = field.value.trim() ? "" : "Este campo es obligatorio.";

    error.textContent = message;
    field.classList.toggle("invalid", Boolean(message));
    valid &&= !message;
  });

  if (!valid) {
    announce("Revisa los campos marcados antes de continuar.");
    form.querySelector(".invalid").focus();
  }

  return valid;
}

// Vuelve a renderizar cada vez que cambia #inicio, #explorar, #carrito, etc.
window.addEventListener("hashchange", render);

// Inicio de la aplicación estática.
restoreVisualPreferences();
updateCartCount();

if (!window.location.hash) {
  window.location.hash = "#inicio";
} else {
  render();
}
