// app/page.jsx
"use client";

import { useState } from "react";

const WA = "https://wa.me/51936687271?text=Hola%20Zentinela";

// Marca de Zentinela (escudo Ojo de Horus). Usa el logo real sin fondo.
function EyeMark({ size = 34, src = "/mark.png", className = "eyemark", style }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ height: size, width: "auto", display: "block", ...style }}
    />
  );
}

const EJEMPLOS = [
  "Hola, soy del BCP. Su cuenta será bloqueada en 24 horas. Verifique sus datos aquí: http://bcp-seguro.net/verificar",
  "¡Felicidades! Ganaste S/.2000 de Yape. Reclama tu premio en yape-premios.click ahora.",
  "Hola Rocío, confirmando la reunión de mañana a las 10am en la oficina. Saludos.",
];

function Verdict({ data }) {
  const r = data.riesgo;
  const tieneUrls = data.urls && data.urls.length > 0;
  return (
    <div className="verdict">
      <div className={`verdict-top r-${r}`}>
        <span className={`verdict-badge r-${r}`}>RIESGO {r}</span>
        <span className="verdict-title">{data.veredicto}</span>
      </div>
      <div className="verdict-body">
        {data.explicacionIA && (
          <div className="vsection">
            <h4>Lectura de la IA</h4>
            <p style={{ color: "var(--muted)", fontSize: 14.5 }}>{data.explicacionIA}</p>
          </div>
        )}

        {data.senales.length > 0 && (
          <div className="vsection">
            <h4>Señales detectadas</h4>
            <ul>
              {data.senales.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {tieneUrls && (
          <div className="vsection">
            <h4>Links en el mensaje</h4>
            {data.urls.map((u, i) => (
              <div key={i}>
                <div className="url-row">
                  <span className={`url-tag t-${u.estado}`}>
                    {u.estado === "oficial" ? "oficial" : u.estado}
                  </span>
                  <span>{u.host}</span>
                </div>
                {u.razones?.length > 0 && (
                  <ul style={{ margin: "2px 0 8px" }}>
                    {u.razones.map((rz, j) => (
                      <li key={j} style={{ fontSize: 13.5 }}>{rz}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="advice">{data.consejo}</div>

        <span className="ia-note">
          ⚙︎ Motor: {data.motor === "patrones+ia" ? "patrones + IA" : "patrones"}
        </span>
      </div>
    </div>
  );
}

export default function Page() {
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  async function analizar() {
    if (!texto.trim() || cargando) return;
    setCargando(true);
    setError(null);
    setResultado(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mensaje: texto }),
      });
      const data = await r.json();
      if (!data.ok) setError(data.error || "No se pudo analizar.");
      else setResultado(data);
    } catch (_) {
      setError("Hubo un problema de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="#top">
            <EyeMark size={30} /> <span className="word">Zentinela IA</span>
          </a>
          <div className="nav-links">
            <a href="#demo">Analizar</a>
            <a href="#como">Cómo funciona</a>
            <a href="#features">Por qué</a>
            <a href="#planes">Planes</a>
          </div>
          <div className="nav-right">
            <a className="btn btn-primary" href="#demo">Probar gratis</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <img src="/mark.png" alt="" aria-hidden="true" className="hero-watermark" />
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">Antiestafas con IA · WhatsApp</span>
            <h1>
              ¿Estafa o no?<br />
              Reenvía el mensaje y lo sabes en <span className="accent">segundos</span>.
            </h1>
            <p className="lede">
              Zentinela IA lee el mensaje, revisa el link y te dice si es seguro,
              con la explicación y el consejo. Entiende las estafas de aquí: falso
              BCP, Yape, SUNAT, premios y pedidos sospechosos.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="#demo">Analizar un mensaje</a>
              <a className="btn btn-wa" href={WA} target="_blank" rel="noreferrer">
                Hablar con el bot
              </a>
            </div>
            <div className="trust">
              <div>
                <div className="n">+70%</div>
                <div className="l">de estafas llegan por WhatsApp</div>
              </div>
              <div>
                <div className="n">3 s</div>
                <div className="l">o menos en darte el veredicto</div>
              </div>
              <div>
                <div className="n safe">0</div>
                <div className="l">mensajes guardados</div>
              </div>
            </div>
          </div>

          {/* ANALIZADOR — elemento firma */}
          <div className="scanner" id="demo">
            <div className="scanner-head">
              <EyeMark size={20} stroke={3} /> Zentinela IA
              <span className="live">Análisis en vivo</span>
            </div>
            <div className={`scanner-body ${cargando ? "scanning" : ""}`}>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Pega aquí el mensaje sospechoso que te llegó…"
              />
              <div className="scanner-actions">
                <button
                  className="btn btn-primary"
                  onClick={analizar}
                  disabled={cargando || !texto.trim()}
                  style={{ opacity: cargando || !texto.trim() ? 0.6 : 1 }}
                >
                  {cargando ? "Analizando…" : "Analizar mensaje"}
                </button>
              </div>

              <div className="chips">
                {EJEMPLOS.map((ej, i) => (
                  <button key={i} className="chip" onClick={() => { setTexto(ej); setResultado(null); }}>
                    Ejemplo {i + 1}
                  </button>
                ))}
              </div>

              {error && (
                <div className="advice" style={{ borderLeftColor: "var(--danger)" }}>{error}</div>
              )}
              {resultado && <Verdict data={resultado} />}

              <p className="privacy">
                Se procesa en el servidor y no se almacena. Esto es una demo; para
                protección continua, usa el bot en WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* CÓMO FUNCIONA */}
      <section id="como">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Cómo funciona</span>
            <h2>Tres pasos. Sin instalar nada.</h2>
            <p>Directo desde WhatsApp, en el chat que ya usas todos los días.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="num">1</div>
              <h3>Te llega algo raro</h3>
              <p>Un link extraño, un “premio”, alguien que dice ser tu banco o te apura para que actúes ya.</p>
            </div>
            <div className="step">
              <div className="num">2</div>
              <h3>Lo reenvías a Zentinela</h3>
              <p>Copias el mensaje y lo mandas al bot. No descargas nada ni creas cuenta.</p>
            </div>
            <div className="step">
              <div className="num">3</div>
              <h3>Recibes el veredicto</h3>
              <p>En segundos sabes si es seguro o estafa, por qué, y qué hacer al respecto.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Por qué Zentinela</span>
            <h2>Seguridad pensada para el día a día latino</h2>
            <p>No es un antivirus genérico: entiende cómo estafan aquí.</p>
          </div>
          <div className="features">
            <div className="feature"><div className="ico">🔗</div><h3>Revisa el link, no solo el texto</h3><p>Detecta dominios falsos que imitan al BCP, Yape o SUNAT, links acortados y direcciones disfrazadas.</p></div>
            <div className="feature"><div className="ico">🤖</div><h3>Doble motor</h3><p>Reglas de patrones + IA semántica como refuerzo. Si una falla, la otra responde igual.</p></div>
            <div className="feature"><div className="ico">🌎</div><h3>Hecho para Latinoamérica</h3><p>Reconoce el falso BCP, premios de Yape, supuestos cobros de SUNAT y pedidos grandes sospechosos.</p></div>
            <div className="feature"><div className="ico">📚</div><h3>Te explica y te educa</h3><p>Cada veredicto trae el porqué y un consejo claro, para que aprendas a reconocerlas solo.</p></div>
            <div className="feature"><div className="ico">🔒</div><h3>No guardamos tus mensajes</h3><p>Analizamos y respondemos. Tu mensaje no se almacena.</p></div>
            <div className="feature"><div className="ico">📱</div><h3>Cero instalación</h3><p>Vive en WhatsApp. Nada de apps nuevas ni configuraciones.</p></div>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Planes</span>
            <h2>Empieza gratis, crece cuando quieras</h2>
            <p>Sin contratos. Protección desde el primer mensaje.</p>
          </div>
          <div className="plans">
            <div className="plan">
              <h3>Gratis</h3>
              <div className="price">S/.0</div>
              <ul>
                <li>20 análisis por día</li>
                <li>Bot de WhatsApp</li>
                <li>Detección de estafas comunes</li>
                <li>Tips de seguridad</li>
              </ul>
              <a className="btn btn-ghost" href={WA} target="_blank" rel="noreferrer">Comenzar gratis</a>
            </div>
            <div className="plan pop">
              <span className="tag">★ Popular</span>
              <h3>Familia</h3>
              <div className="price">S/.25 <small>/mes</small></div>
              <ul>
                <li>Análisis ilimitados</li>
                <li>Protección DNS en el celular</li>
                <li>Panel familiar</li>
                <li>3 dispositivos protegidos</li>
                <li>Alertas en tiempo real</li>
              </ul>
              <a className="btn btn-primary" href={WA} target="_blank" rel="noreferrer">Elegir plan</a>
            </div>
            <div className="plan">
              <h3>Empresa</h3>
              <div className="price">S/.50 <small>/mes</small></div>
              <ul>
                <li>Todo lo de Familia</li>
                <li>6 dispositivos protegidos</li>
                <li>Soporte prioritario</li>
                <li>Reportes mensuales</li>
                <li>Capacitación para tu equipo</li>
              </ul>
              <a className="btn btn-ghost" href={WA} target="_blank" rel="noreferrer">Contactar</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="final">
        <div className="wrap">
          <img src="/logo.png" alt="Zentinela IA" className="final-logo" />
          <h2>La próxima estafa ya está en camino. Adelántate.</h2>
          <p>Manda un mensaje sospechoso y Zentinela te dice si es seguro. Gratis.</p>
          <a className="btn btn-wa" href={WA} target="_blank" rel="noreferrer" style={{ padding: "15px 28px" }}>
            Probar Zentinela IA gratis
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <a className="brand" href="#top"><EyeMark size={28} /> <span className="word">Zentinela IA</span></a>
              <p style={{ marginTop: 12, maxWidth: "28em", fontSize: 14.5 }}>
                Tu guardián digital contra estafas en WhatsApp. Análisis con IA,
                hecho para Latinoamérica.
              </p>
            </div>
            <div>
              <h4>Navegación</h4>
              <a href="#como">Cómo funciona</a>
              <a href="#demo">Analizar</a>
              <a href="#features">Por qué Zentinela</a>
              <a href="#planes">Planes</a>
            </div>
            <div>
              <h4>Contacto</h4>
              <a href={WA} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
              <a href="mailto:rociodavilaelias@gmail.com">Correo</a>
            </div>
          </div>
          <div className="foot-bottom">
            <EyeMark size={16} stroke={3} className="eyemark glyph" />
            © {new Date().getFullYear()} Zentinela IA — La mirada que protege lo invisible
          </div>
        </div>
      </footer>
    </>
  );
}
