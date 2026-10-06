# Mercado Local

## Ejecutar con XAMPP

1. Copia la carpeta `Practica_laboratorio` a `C:\xampp\htdocs\mercado-local`.
2. Inicia **Apache** desde el panel de control de XAMPP.
3. Abre `http://localhost/mercado-local/` en el navegador.

No requiere instalar dependencias ni una base de datos: es una aplicación HTML5, CSS3 y JavaScript vanilla. El carrito y el último pedido se conservan en el navegador mediante `localStorage`.

### Flujo disponible

- Inicio y búsqueda de productos.
- Catálogo con filtros por categoría.
- Ficha de producto y selección de cantidad.
- Carrito con subtotal, entrega y total claros.
- Pago con etiquetas, validación accesible y revisión sin cargo.
- Confirmación de pedido y perfil con preferencias de texto y alto contraste.

### Verificación rápida de accesibilidad

- Navega con `Tab`, activa controles con `Enter` o `Espacio`, usa `Esc` para volver desde detalle o pago y revisa el foco dorado visible.
- Prueba los formularios de pago vacíos: cada campo muestra un error asociado.
- Comprueba 320 px, 768 px y 1024 px desde las herramientas responsivas del navegador.
- Las imágenes de producto llevan texto alternativo significativo y los mensajes de carrito y pedido usan regiones `aria-live`.

Proyecto de práctica para diseñar e implementar una plataforma de comercio electrónico local centrada en el usuario. La aplicación permite descubrir productos de productores cercanos, revisar su origen y disponibilidad, agregarlos al carrito, revisar el pago y consultar el estado del pedido.

## Prototipo de alta fidelidad

El flujo de compra y el sistema visual están disponibles en Figma:

- [Abrir prototipo Mercado Local](https://www.figma.com/design/wYxdWWhVCHk0f7YSDf7Vnt)

El archivo incluye componentes editables, tokens de color, indicadores de foco visible y el flujo de compra trasladado a escritorio para esta implementación web:

1. Inicio
2. Explorar productos
3. Detalle de producto
4. Carrito
5. Pago seguro
6. Confirmación de pedido
7. Perfil y preferencias de accesibilidad

## Objetivo

Diseñar e implementar una experiencia de compra local clara, accesible y usable en dispositivos móviles y de escritorio. El proyecto busca reducir la incertidumbre sobre productos, costos de entrega y estado del pedido.

## Contexto de uso

La aplicación está dirigida a personas adultas que compran alimentos para su hogar y prefieren productores locales. Las tareas se realizan principalmente desde un teléfono móvil, en periodos breves y con necesidad de completar la compra sin cargos inesperados ni lenguaje técnico.

### Personas de diseño

| Persona | Necesidad | Barreras a validar |
| --- | --- | --- |
| Ana, 32 años, compra semanal | Comprar desde el móvil en menos de diez minutos | Catálogos extensos y costos tardíos |
| Luis, 58 años, comprador de barrio | Leer con comodidad y confiar en el pedido | Texto pequeño, mensajes poco visibles y controles difíciles de pulsar |

Estas personas son hipótesis de diseño. Deben validarse con entrevistas y observación contextual antes de presentarlas como hallazgos de investigación.

## Tareas críticas

| ID | Tarea | Resultado esperado |
| --- | --- | --- |
| T1 | Encontrar miel multifloral local | Llegar a la ficha mediante búsqueda o filtros |
| T2 | Agregar un producto al carrito | Ver la cantidad y el subtotal actualizados |
| T3 | Revisar el costo total | Identificar subtotal, entrega y total antes de pagar |
| T4 | Revisar el pedido sin cargo | Llegar a la revisión de pago con datos validados |
| T5 | Consultar el estado del pedido | Ubicar el pedido y comprender su estado desde Perfil |

## Requisitos priorizados

### Must have

- Buscar y filtrar productos por categoría.
- Mostrar detalle, precio, productor y disponibilidad.
- Agregar productos al carrito y mostrar un resumen de costos.
- Confirmar el pedido con información de entrega.
- Permitir navegación completa por teclado con foco visible.

### Should have

- Preferencias de tamaño de texto y alto contraste.
- Mensajes de validación claros antes de confirmar una acción.

### Could have

- Favoritos.
- Repetir pedidos anteriores.

### Fuera del alcance inicial

- Chat en vivo entre comprador y productor.
- Marketplace multi vendedor avanzado.

## Principios de UX aplicados

| Principio | Aplicación en Mercado Local |
| --- | --- |
| Visibilidad del estado | Progreso de compra, reserva temporal y confirmación explícita |
| Prevención de errores | Validación visible y aviso de que la revisión no realiza un cargo |
| Consistencia | Acciones primarias verdes, tarjetas y radios coherentes |
| Ley de Fitts | Botones principales de al menos 48 px y navegación inferior amplia |
| Ley de Hick Hickman | Filtros limitados y decisiones agrupadas por tarea |
| Reconocimiento antes que recuerdo | Resumen, etiquetas y datos del productor siempre visibles |

## Accesibilidad

La implementación debe cumplir WCAG 2.2 AA y considerar desde el inicio:

- Contraste mínimo de 4.5:1 para texto normal.
- Etiquetas `label` asociadas con campos de formulario.
- Mensajes de error específicos, visibles y asociados al campo correspondiente.
- Texto alternativo significativo para imágenes de producto.
- Navegación con `Tab`, `Enter` y `Esc`.
- Orden de foco lógico y foco visible en todos los elementos interactivos.
- Uso de elementos HTML semánticos antes de añadir ARIA.
- Diseño responsivo para 320 px, 768 px y 1024 px.

## Especificación técnica

La aplicación se implementará con HTML5, CSS3 y JavaScript. La estructura debe separar las vistas de catálogo, detalle, carrito, pago, confirmación y perfil, y conservar el estado mínimo de catálogo, carrito, entrega, pago y pedido.

Se recomienda una estrategia mobile first y componentes reutilizables para botones, campos, tarjetas de producto, mensajes de estado e indicadores de foco.

## Plan de pruebas

Se deben realizar al menos cinco sesiones de usabilidad con personas externas al equipo mediante *thinking aloud*.

| Métrica | Meta |
| --- | --- |
| Tasa de éxito | Igual o superior a 80 % |
| Errores | Máximo 2 por tarea |
| Satisfacción | SUS igual o superior a 68 |
| Esfuerzo cognitivo | No aplica en esta práctica |

La evaluación de accesibilidad debe combinar WAVE, axe DevTools, Lighthouse y pruebas manuales de teclado, zoom al 200 % y lector de pantalla.

## Backlog priorizado

1. Implementar el flujo completo de T1 a T4.
2. Añadir navegación por teclado, foco visible y mensajes de error accesibles.
3. Ejecutar auditorías con WAVE, axe y Lighthouse.
4. Corregir bloqueos hallados en cinco pruebas de usabilidad.
5. Incorporar persistencia del carrito.
6. Evaluar favoritos y repetir pedido después de validar el flujo principal.

## Referencias

- ISO 9241-210:2019. *Human-centred design for interactive systems*.
- W3C. *Web Content Accessibility Guidelines (WCAG) 2.2*.
- Nielsen, J. (1994). *Usability Engineering*.
- Norman, D. A. (2013). *The Design of Everyday Things*.
- Brooke, J. (1996). *SUS: A quick and dirty usability scale*.
