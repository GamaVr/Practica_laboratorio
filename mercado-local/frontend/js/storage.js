/**
 * Persistencia local de pedidos con localStorage, sin backend.
 * El historial completo usa `mercado-local-orders`; `app.js` conserva aparte
 * el último pedido en `mercado-local-order` para mostrar su confirmación.
 */
/**
 * Valida, calcula y guarda un pedido. Devuelve el pedido final para mostrar su confirmación.
 * @param {{address: string, city: string, payment: string, items: Array<{productId: number, quantity: number}>}} payload
 * @returns {object} Pedido confirmado y persistido localmente.
 */
function saveOrder(payload) {
  const items = payload.items.map((item) => {
    const product = window.catalogProducts.find((candidate) => candidate.id === Number(item.productId));
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Hay un producto inválido en el pedido.");
    }

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      lineTotal: product.price * quantity,
    };
  });

  if (!payload.address.trim() || !payload.city.trim() || !items.length) {
    throw new Error("Completa los datos obligatorios del pedido.");
  }

  const orders = JSON.parse(localStorage.getItem("mercado-local-orders") || "[]");
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  const shipping = subtotal >= 300 ? 0 : 60;
  const order = {
    id: orders.length + 1,
    code: `ML-${String(2048 + orders.length).padStart(4, "0")}`,
    createdAt: new Date().toISOString(),
    status: "En preparación",
    delivery: "Mañana, de 10:00 a 12:00",
    address: payload.address.trim(),
    city: payload.city.trim(),
    payment: payload.payment || "card",
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
  orders.push(order);
  localStorage.setItem("mercado-local-orders", JSON.stringify(orders));
  return order;
}

/**
 * Cancela un pedido en preparación sin eliminarlo del historial.
 * Sincroniza el último pedido y admite compras de la versión anterior del sitio.
 * @param {string} code Código del pedido que se desea cancelar.
 * @returns {object} Pedido cancelado, con la fecha de cancelación.
 */
function cancelOrder(code) {
  const savedOrders = JSON.parse(localStorage.getItem("mercado-local-orders") || "[]");
  const lastOrder = JSON.parse(localStorage.getItem("mercado-local-order") || "null");
  const orders = savedOrders.length ? savedOrders : (lastOrder ? [lastOrder] : []);
  const index = orders.findIndex((order) => order.code === code);

  if (index === -1) {
    throw new Error("No se encontró el pedido.");
  }

  const order = orders[index];
  if (order.status === "Cancelado") return order;
  if ((order.status || "En preparación") !== "En preparación") {
    throw new Error("Solo puedes cancelar pedidos que estén en preparación.");
  }

  const cancelledOrder = {
    ...order,
    status: "Cancelado",
    cancelledAt: new Date().toISOString(),
  };
  orders[index] = cancelledOrder;
  localStorage.setItem("mercado-local-orders", JSON.stringify(orders));
  if (lastOrder?.code === code) {
    localStorage.setItem("mercado-local-order", JSON.stringify(cancelledOrder));
  }
  return cancelledOrder;
}

// La interfaz delega aquí la creación y la cancelación de pedidos.
window.LocalStore = { saveOrder, cancelOrder };
