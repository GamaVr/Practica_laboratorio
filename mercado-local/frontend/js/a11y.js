/**
 * Utilidades de accesibilidad compartidas por las vistas del frontend.
 * Centralizarlas evita repetir selectores de foco en cada vista dinámica.
 */
window.Accessibility = {
  moveFocusToContent() {
    document.querySelector("#main-content")?.focus({ preventScroll: true });
  },
};
