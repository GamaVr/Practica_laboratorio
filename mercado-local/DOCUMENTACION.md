# Documentación técnica — Mercado Local

## Tecnologías y alcance

Mercado Local es una aplicación web estática creada con HTML5, CSS3 y JavaScript vanilla. Apache de XAMPP solamente entrega los archivos; no existe backend, base de datos ni dependencias externas.

Los datos se conservan en el navegador. Por ello, los pedidos no se comparten entre equipos ni navegadores: son una simulación adecuada para la práctica académica.

## Organización del código

| Archivo | Responsabilidad |
| --- | --- |
| `frontend/index.html` | Estructura semántica, navegación, región principal y carga ordenada de scripts. |
| `frontend/css/styles.css` | Diseño, tarjetas, formularios y puntos responsivos. |
| `frontend/css/accessibility.css` | Foco visible, salto al contenido, alto contraste, texto grande y avisos. |
| `frontend/js/catalog.js` | Fuente única del catálogo de productos. |
| `frontend/js/storage.js` | Crea y guarda pedidos en `localStorage`. |
| `frontend/js/auth.js` | Registro local, verificación de contraseñas con PBKDF2 y sesión. |
| `frontend/js/a11y.js` | Utilidad reutilizable para mover el foco al contenido. |
| `frontend/js/app.js` | Estado temporal, renderizado de vistas, carrito, validación y eventos. |

Los scripts se cargan en este orden: `catalog.js`, `storage.js`, `auth.js`, `a11y.js` y `app.js`. Así, la interfaz puede usar el catálogo, la persistencia, el acceso y la utilidad de accesibilidad desde el inicio.

## Registro, inicio y cierre de sesión

El botón **Iniciar sesión** del encabezado abre `#login`. El enlace **Crear cuenta** abre `#registro`, con nombre, correo, contraseña y confirmación. Se validan los campos, la coincidencia de contraseñas, una longitud de 8 a 128 caracteres y los correos duplicados. Al completar el registro se vuelve al acceso con el correo ya escrito.

Las cuentas se guardan en `localStorage` con una sal aleatoria de 16 bytes y un hash PBKDF2-SHA-256 de 210000 iteraciones; no se guardan contraseñas en texto plano. El acceso verifica el hash de la contraseña y permite mostrar u ocultar lo escrito. Ya no existe una cuenta de demostración predeterminada.

Al entrar, el botón pasa a **Mi cuenta**, donde se muestra el nombre y el correo registrados y se puede cerrar sesión. `auth.js` guarda únicamente identificador, nombre y correo en la clave `mercado-local-session` de `sessionStorage`: la sesión sobrevive a una recarga en la pestaña. No se incluyen contraseña, hash ni sal en la sesión.

El registro funciona solo en este navegador. Al ser una aplicación estática, este acceso no protege recursos en un servidor. El carrito y los pedidos siguen asociados al navegador, no a cuentas individuales, y no se borran al cerrar sesión. Para usar las funciones criptográficas nativas abre el sitio en `http://localhost/mercado-local/` (o HTTPS si se publica).

## Datos y persistencia local

| Clave de `localStorage` | Contenido | Cuándo se actualiza |
| --- | --- | --- |
| `mercado-local-cart` | Productos y cantidades del carrito. | Al agregar, aumentar, disminuir o eliminar un artículo. |
| `mercado-local-order` | Último pedido confirmado. | Al confirmar la compra. |
| `mercado-local-orders` | Historial local de pedidos. | Al confirmar cada compra. |
| `mercado-local-users` | Identificador, nombre, correo, sal y hash de contraseña de las cuentas locales. | Al registrar una cuenta. |

`storage.js` calcula el subtotal, la entrega y el total al guardar, por lo que no confía en valores visuales del formulario. La entrega cuesta `$60` si el subtotal es menor de `$300`; a partir de esa cantidad es gratuita.

## Flujo de compra

1. La persona explora el catálogo desde `#inicio` o `#explorar`.
2. Abre un producto con `#detalle?id=<id>` y lo agrega al carrito.
3. En `#carrito` ajusta cantidades y revisa subtotal, entrega y total.
4. En `#pago` completa dirección y ciudad. La validación muestra errores junto a cada campo.
5. `LocalStore.saveOrder()` crea el pedido, lo guarda en el navegador, vacía el carrito y navega a `#confirmacion`.
6. `#pedidos` presenta el historial y `#opciones` las preferencias de lectura.

## Navegación interna

### Cancelación de pedidos

En `#pedidos`, cada compra en preparación muestra **Cancelar pedido**. El diálogo permite conservarla o confirmar la cancelación; también se puede cerrar con `Esc`. `LocalStore.cancelOrder(code)` cambia el estado a `Cancelado`, registra `cancelledAt` y sincroniza el historial y el último pedido. La compra permanece en el historial y deja de mostrar una entrega pendiente. Los pedidos cancelados o con otro estado ya no ofrecen el botón de cancelación.

La cancelación se guarda únicamente en el navegador, como el resto de los pedidos de esta aplicación estática.

La aplicación es de una sola página. `app.js` escucha los cambios del fragmento de URL (`hashchange`) y la función `render()` decide qué vista mostrar. No se recarga la página al navegar entre Inicio, Explorar, Carrito, Pago, Mis pedidos, Opciones e Iniciar sesión.

## Accesibilidad aplicada

- El enlace “Saltar al contenido principal” evita repetir la navegación con teclado.
- Los cambios de carrito y pedido se anuncian mediante una región `aria-live` y un aviso visible.
- Cada imagen lleva texto alternativo específico del producto.
- Los campos tienen `label`, descripciones de error asociadas y foco en el primer error.
- `Tab`, `Enter`/espacio y `Esc` permiten completar y abandonar acciones sin ratón.
- Los estilos responden a 320 px, 768 px y 1024 px. Las preferencias de alto contraste, texto grande y modo oscuro se activan desde Opciones.

## Mantenimiento

- Para agregar un producto, crea un objeto con el mismo formato dentro de `catalog.js`; si tiene fotografía, colócala en `frontend/assets/` y usa su ruta en la propiedad `image`.
- Para restablecer datos de prueba, abre las herramientas del navegador, entra a **Aplicación > Almacenamiento local** y elimina las claves que comienzan con `mercado-local-`.
- Si se cambia el nombre de una ruta o un id de vista, actualiza los enlaces `href="#..."` y el objeto `routes` dentro de `render()`.
