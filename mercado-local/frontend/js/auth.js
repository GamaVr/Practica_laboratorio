/**
 * Registro y acceso locales para la práctica estática, sin servidor.
 * localStorage conserva usuarios y hashes PBKDF2 con una sal aleatoria por cuenta.
 * sessionStorage conserva únicamente los datos públicos de la sesión.
 * Este flujo local no sustituye autenticación ni autorización en un servidor.
 * El carrito y los pedidos existentes siguen perteneciendo al navegador.
 */
window.LocalAuth = (() => {
  const sessionKey = "mercado-local-session";
  const usersKey = "mercado-local-users";
  const iterations = 210000;

  /** Lee las cuentas sin sobrescribir datos si el almacenamiento está dañado. */
  function getUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(usersKey) || "[]");
      if (!Array.isArray(users)) throw new Error();
      return users;
    } catch {
      throw new Error("No se pudieron leer las cuentas guardadas en este navegador.");
    }
  }

  /** Separa los datos de presentación de los datos de verificación. */
  function publicUser(user) {
    return { userId: user.id, name: user.name, email: user.email };
  }

  /** Convierte bytes aleatorios o derivados en texto para su almacenamiento. */
  function toHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  /** Deriva un hash con funciones nativas del navegador; no envía datos a la red. */
  async function hashPassword(password, salt) {
    if (!window.crypto?.subtle) {
      throw new Error("Abre la página desde http://localhost/mercado-local/ para usar el registro.");
    }
    const key = await window.crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"],
    );
    const saltBytes = Uint8Array.from(salt.match(/.{2}/g), (byte) => parseInt(byte, 16));
    const hash = await window.crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" }, key, 256,
    );
    return toHex(new Uint8Array(hash));
  }

  /** Recupera la sesión solo si su usuario sigue registrado en este navegador. */
  function getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
      const user = getUsers().find((candidate) => candidate.id === session?.userId);
      return user ? publicUser(user) : null;
    } catch {
      return null;
    }
  }

  /** Guarda la sesión sin incluir el hash, la sal ni la contraseña. */
  function startSession(user) {
    const session = publicUser(user);
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    return session;
  }

  /** Registra una cuenta local; no almacena contraseñas en texto plano. */
  async function register(name, email, password) {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedName.length < 2 || normalizedName.length > 80) {
      throw new Error("El nombre debe tener entre 2 y 80 caracteres.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      throw new Error("Escribe un correo electrónico válido.");
    }
    if (password.length < 8 || password.length > 128) {
      throw new Error("La contraseña debe tener entre 8 y 128 caracteres.");
    }
    if (getUsers().some((user) => user.email === normalizedEmail)) {
      throw new Error("Este correo ya está registrado. Inicia sesión con tu cuenta.");
    }
    if (!window.crypto?.subtle) {
      throw new Error("Abre la página desde http://localhost/mercado-local/ para usar el registro.");
    }
    const salt = toHex(window.crypto.getRandomValues(new Uint8Array(16)));
    const passwordHash = await hashPassword(password, salt);
    // Relee las cuentas tras la operación asíncrona para no perder otros registros.
    const users = getUsers();
    if (users.some((user) => user.email === normalizedEmail)) {
      throw new Error("Este correo ya está registrado. Inicia sesión con tu cuenta.");
    }
    const user = {
      id: toHex(window.crypto.getRandomValues(new Uint8Array(16))),
      name: normalizedName,
      email: normalizedEmail,
      passwordSalt: salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(usersKey, JSON.stringify([...users, user]));
    return publicUser(user);
  }

  /** Verifica una cuenta registrada y conserva su sesión durante la pestaña. */
  async function login(email, password) {
    const user = getUsers().find((candidate) => candidate.email === email.trim().toLowerCase());
    if (!user || await hashPassword(password, user.passwordSalt) !== user.passwordHash) {
      throw new Error("El correo o la contraseña son incorrectos.");
    }
    return startSession(user);
  }

  /** Cierra la sesión sin borrar el carrito, los pedidos ni las preferencias. */
  function logout() {
    sessionStorage.removeItem(sessionKey);
  }

  return { getSession, register, login, logout };
})();
