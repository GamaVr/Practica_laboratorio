# Mercado Local

Aplicación web académica de comercio electrónico local desarrollada únicamente con **HTML5, CSS3 y JavaScript vanilla**. No utiliza Node.js, frameworks, base de datos ni dependencias externas.

Los pedidos, el carrito y la última compra se guardan localmente con `localStorage` en el navegador.

La explicación técnica del flujo, archivos, datos locales y accesibilidad está en [DOCUMENTACION.md](DOCUMENTACION.md).

## Estructura

```text
Mercado_Local/
├── frontend/
│   ├── index.html                # Interfaz principal
│   ├── assets/                   # Fotografías e ilustraciones
│   ├── css/
│   │   ├── styles.css            # Diseño visual y responsivo
│   │   └── accessibility.css     # Foco, contraste y avisos accesibles
│   └── js/
│       ├── catalog.js            # Catálogo local de productos
│       ├── storage.js            # Pedidos y carrito con localStorage
│       ├── auth.js               # Registro, hashes de contraseña y sesión local
│       ├── a11y.js               # Utilidades de accesibilidad
│       └── app.js                # Vistas, filtros, carrito y pago
├── index.html                    # Redirección al frontend para XAMPP
└── README.md
```

## Ejecutar con XAMPP

1. Copia la carpeta del proyecto a `C:\xampp\htdocs\mercado-local`.
2. Inicia **Apache** en el panel de XAMPP.
3. Abre [http://localhost/mercado-local/](http://localhost/mercado-local/).

No debes ejecutar comandos de Node ni iniciar otro servidor. Apache solo sirve los archivos estáticos.

## Funcionalidades

- Búsqueda y filtros por categoría.
- Detalle de producto con fotografías, precio, productor y origen.
- Carrito con actualización de cantidades, subtotal, entrega y total.
- Formulario de pago con validación y pantalla visible de confirmación.
- Historial de pedidos con confirmación de cancelación.
- Opciones de texto grande, alto contraste y modo oscuro.
- Registro de usuarios, inicio y cierre de sesión, con validación de datos y correos duplicados.

Para empezar, abre **Iniciar sesión → Crear cuenta** y registra tus datos. Las cuentas se guardan en este navegador, con contraseñas verificadas mediante hashes PBKDF2 y una sal aleatoria. La sesión se guarda en `sessionStorage`. Este acceso local no protege recursos en un servidor ni separa los pedidos por usuario.

## Accesibilidad y responsividad

- HTML semántico, etiquetas asociadas y mensajes de error accesibles.
- Navegación por `Tab`, activación con `Enter`/espacio y salida con `Esc`.
- Regiones `aria-live`, foco visible y texto alternativo significativo en imágenes.
- Diseño adaptable a 320 px, 768 px y 1024 px.
