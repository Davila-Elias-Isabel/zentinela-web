// lib/analyzer.js
// Motor de patrones de Zentinela IA.
// Funciona 100% sin claves: detecta URLs falsas, suplantación de marcas
// y señales de estafa típicas de Latinoamérica. La IA (route.js) es un
// refuerzo opcional encima de esto.

// Dominios oficiales que reconocemos como legítimos (Perú + comunes).
const DOMINIOS_OFICIALES = new Set([
  "viabcp.com", "bcp.com.pe",
  "yape.com.pe", "yape.pe",
  "interbank.pe", "interbank.com.pe",
  "bbva.pe", "bbva.com.pe",
  "scotiabankperu.com", "scotiabank.com.pe",
  "bn.com.pe",
  "sunat.gob.pe", "gob.pe", "reniec.gob.pe", "sunarp.gob.pe",
  "falabella.com.pe", "plazavea.com.pe", "ripley.com.pe",
  "claro.com.pe", "movistar.com.pe", "entel.pe",
  "mercadolibre.com.pe", "mercadopago.com.pe",
  "whatsapp.com", "wa.me",
]);

// Marca -> dominios oficiales. Si el mensaje nombra la marca pero el link
// NO vive en su dominio oficial, es suplantación.
const MARCAS = [
  { nombre: "BCP", claves: ["bcp", "banco de credito", "banco de crédito", "viabcp"], oficiales: ["viabcp.com", "bcp.com.pe"] },
  { nombre: "Yape", claves: ["yape"], oficiales: ["yape.com.pe", "yape.pe", "viabcp.com"] },
  { nombre: "Interbank", claves: ["interbank"], oficiales: ["interbank.pe", "interbank.com.pe"] },
  { nombre: "BBVA", claves: ["bbva"], oficiales: ["bbva.pe", "bbva.com.pe"] },
  { nombre: "Scotiabank", claves: ["scotiabank"], oficiales: ["scotiabankperu.com", "scotiabank.com.pe"] },
  { nombre: "SUNAT", claves: ["sunat"], oficiales: ["sunat.gob.pe"] },
  { nombre: "RENIEC", claves: ["reniec"], oficiales: ["reniec.gob.pe"] },
  { nombre: "Falabella", claves: ["falabella"], oficiales: ["falabella.com.pe"] },
  { nombre: "Mercado Libre / Mercado Pago", claves: ["mercado libre", "mercadolibre", "mercado pago", "mercadopago"], oficiales: ["mercadolibre.com.pe", "mercadopago.com.pe"] },
];

const ACORTADORES = new Set([
  "bit.ly", "cutt.ly", "tinyurl.com", "is.gd", "t.co", "goo.gl",
  "ow.ly", "rb.gy", "shorturl.at", "acortar.link", "rebrand.ly", "lnkd.in",
]);

// TLDs baratos muy usados para phishing.
const TLDS_RIESGO = new Set([
  "xyz", "top", "click", "online", "site", "live", "shop", "icu",
  "info", "biz", "club", "fun", "link", "rest", "monster", "cyou", "cfd",
]);

const PALABRAS_URGENCIA = [
  "urgente", "inmediato", "ahora mismo", "24 horas", "48 horas",
  "bloquea", "bloqueada", "bloqueado", "suspendida", "suspendido",
  "vencida", "vencido", "última oportunidad", "ultima oportunidad",
  "antes de que", "expira", "caduca", "penalidad", "multa",
];

const PALABRAS_DATOS = [
  "clave", "contraseña", "contrasena", "código", "codigo", "otp",
  "cvv", "pin", "número de tarjeta", "numero de tarjeta", "tarjeta",
  "verifica tus datos", "verificar tus datos", "actualiza tus datos",
  "confirma tu identidad", "ingresa tus datos", "valida tu cuenta",
  "token", "clave digital",
];

const PALABRAS_PREMIO = [
  "ganaste", "ganador", "felicidades", "felicitaciones", "premio",
  "sorteo", "bono", "regalo", "gratis", "reclama", "reclamar",
  "has sido seleccionado", "fuiste seleccionado",
];

const PALABRAS_DINERO = [
  "deposita", "depósito", "deposito", "transfiere", "transferencia",
  "adelanto", "pago por adelantado", "comisión", "comision",
  "envíame", "enviame", "yapea", "yapeame", "yapéame",
  "paga", "pagar", "abona", "cancela el monto",
];

const PALABRAS_PAQUETERIA = [
  "paquete", "encomienda", "retenido", "aduana", "courier",
  "envío pendiente", "envio pendiente", "casillero", "tu pedido está",
];

function normaliza(t) {
  return (t || "").toLowerCase();
}

function contiene(texto, lista) {
  const t = normaliza(texto);
  return lista.filter((w) => t.includes(w));
}

// Extrae URLs aunque vengan sin http (ej: bcp-seguro.net/verificar).
function extraeUrls(texto) {
  const re =
    /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)<>"']*)?)/gi;
  const crudas = texto.match(re) || [];
  const vistos = new Set();
  const urls = [];
  for (let u of crudas) {
    if (!/^https?:\/\//i.test(u)) u = "http://" + u;
    try {
      const parsed = new URL(u);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (!host.includes(".")) continue;
      const clave = host + parsed.pathname;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      urls.push({ raw: u, host, parsed });
    } catch (_) {}
  }
  return urls;
}

function dominioRaiz(host) {
  const partes = host.split(".");
  if (partes.length <= 2) return host;
  // Maneja .com.pe, .gob.pe, .org.pe, etc.
  const dosNiveles = ["com", "gob", "org", "net", "edu", "pe"];
  const ult = partes[partes.length - 1];
  const penult = partes[partes.length - 2];
  if (ult.length === 2 && dosNiveles.includes(penult)) {
    return partes.slice(-3).join(".");
  }
  return partes.slice(-2).join(".");
}

function esOficial(host) {
  const raiz = dominioRaiz(host);
  return DOMINIOS_OFICIALES.has(raiz) || DOMINIOS_OFICIALES.has(host);
}

// Analiza una sola URL y devuelve estado + razones.
function analizaUrl(item, texto) {
  const { host, parsed } = item;
  const raiz = dominioRaiz(host);
  const razones = [];
  let puntos = 0;

  if (esOficial(host)) {
    return { url: item.raw, host, estado: "oficial", puntos: 0, razones: ["Dominio oficial reconocido."] };
  }

  // ¿IP en vez de dominio?
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    razones.push("Usa una dirección IP en lugar de un nombre de sitio.");
    puntos += 3;
  }

  // Punycode / homoglifos
  if (host.includes("xn--")) {
    razones.push("Dominio con caracteres disfrazados (posible imitación visual).");
    puntos += 3;
  }

  // Acortador
  if (ACORTADORES.has(raiz)) {
    razones.push("Link acortado: esconde el destino real.");
    puntos += 2;
  }

  // TLD barato
  const tld = host.split(".").pop();
  if (TLDS_RIESGO.has(tld)) {
    razones.push(`Termina en .${tld}, una extensión muy usada por sitios falsos.`);
    puntos += 1;
  }

  // Suplantación: el texto nombra una marca, pero el link no es suya.
  for (const marca of MARCAS) {
    const nombrada = contiene(texto, marca.claves).length > 0;
    const linkMencionaMarca = marca.claves.some((c) => host.includes(c.replace(/\s+/g, "")));
    const enDominioOficial = marca.oficiales.includes(raiz);
    if ((nombrada || linkMencionaMarca) && !enDominioOficial) {
      razones.push(`Dice ser ${marca.nombre}, pero el link no es su sitio oficial.`);
      puntos += 4;
      break;
    }
  }

  // Lookalike: marca + guión/sufijo (bcp-seguro, yape-premios, sunat-pago)
  if (/(bcp|yape|sunat|interbank|bbva|scotia|reniec|falabella)[-_.]/i.test(host)) {
    razones.push("Imita el nombre de una marca conocida con palabras añadidas.");
    puntos += 2;
  }

  // Subdominios excesivos (banco.seguro.verificar.algo.com)
  if (host.split(".").length >= 4) {
    razones.push("Demasiados subdominios: técnica común para confundir.");
    puntos += 1;
  }

  // @ en la URL u otros trucos
  if (item.raw.includes("@")) {
    razones.push("La dirección contiene un “@”, truco para ocultar el destino real.");
    puntos += 2;
  }

  let estado = "sospechoso";
  if (puntos >= 4) estado = "peligroso";
  else if (puntos === 0) {
    estado = "desconocido";
    razones.push("No es un sitio oficial conocido. Trátalo con cuidado.");
  }

  return { url: item.raw, host, estado, puntos, razones };
}

// Punto de entrada del motor de patrones.
export function analizarMensaje(texto) {
  texto = (texto || "").trim();
  if (!texto) {
    return {
      ok: false,
      error: "Pega un mensaje para analizar.",
    };
  }

  const urls = extraeUrls(texto).map((u) => analizaUrl(u, texto));

  const senales = [];
  let score = 0;

  const urg = contiene(texto, PALABRAS_URGENCIA);
  if (urg.length) { senales.push("Urgencia o amenaza (presión para que actúes rápido)."); score += 2; }

  const datos = contiene(texto, PALABRAS_DATOS);
  if (datos.length) { senales.push("Te piden datos sensibles (clave, código, tarjeta)."); score += 3; }

  const premio = contiene(texto, PALABRAS_PREMIO);
  if (premio.length) { senales.push("Promesa de premio, bono o algo gratis."); score += 2; }

  const dinero = contiene(texto, PALABRAS_DINERO);
  if (dinero.length) { senales.push("Te piden depositar, transferir o pagar dinero."); score += 2; }

  const paqueteria = contiene(texto, PALABRAS_PAQUETERIA);
  if (paqueteria.length) { senales.push("Supuesto problema con un paquete o envío (estafa de paquetería)."); score += 1; }

  // URLs aportan al score global.
  for (const u of urls) {
    if (u.estado === "peligroso") score += 4;
    else if (u.estado === "sospechoso") score += 2;
    else if (u.estado === "desconocido") score += 1;
  }

  // Marca suplantada explícita = empuja a alto.
  const haySuplantacion = urls.some((u) =>
    u.razones.some((r) => r.includes("no es su sitio oficial") || r.includes("Dice ser"))
  );
  if (haySuplantacion) score += 2;

  let riesgo = "BAJO";
  if (score >= 6) riesgo = "ALTO";
  else if (score >= 3) riesgo = "MEDIO";

  const esEstafa = riesgo !== "BAJO";

  // Consejo accionable.
  let consejo;
  if (riesgo === "ALTO") {
    consejo = "No hagas clic ni respondas. No entregues ningún dato. Bloquea el número y, si era tu banco, contáctalo por su app o número oficial.";
  } else if (riesgo === "MEDIO") {
    consejo = "Desconfía. Verifica por el canal oficial antes de hacer nada y no abras los links que te enviaron.";
  } else {
    consejo = "No vemos señales claras de estafa, pero ante la duda confirma por un canal oficial. Nunca compartas claves ni códigos.";
  }

  return {
    ok: true,
    motor: "patrones",
    riesgo,
    esEstafa,
    score,
    veredicto: esEstafa
      ? (haySuplantacion ? "Probable estafa · suplantación de marca" : "Probable estafa")
      : "Sin señales claras de estafa",
    senales,
    urls,
    consejo,
  };
}

export const _internals = { extraeUrls, dominioRaiz, esOficial };
