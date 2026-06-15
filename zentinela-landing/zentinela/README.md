# Zentinela IA — Landing

Landing page de Zentinela IA construida en **Next.js** (App Router), lista para
desplegar en **Vercel**. Incluye un **analizador en vivo** que detecta si un
mensaje/URL es estafa, corriendo como función serverless.

## Qué trae

- Diseño con la identidad de marca: papiro + tinta + Ojo de Horus + pigmentos egipcios.
- `app/page.jsx` — la landing (hero, analizador, cómo funciona, ventajas, planes).
- `app/api/analyze/route.js` — función serverless que analiza el mensaje.
- `lib/analyzer.js` — motor de patrones (detecta URLs falsas, suplantación de BCP/Yape/SUNAT, urgencia, pedidos de datos, premios, paquetería). **Funciona sin ninguna clave.**
- Capa de IA **opcional**: si defines `ANTHROPIC_API_KEY`, suma una lectura semántica encima.

## Probar en tu máquina

Necesitas Node.js 18+.

```bash
npm install
npm run dev
# abre http://localhost:3000
```

## Subir a GitHub (desde la terminal)

```bash
git init
git add .
git commit -m "Zentinela IA landing"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/zentinela-landing.git
git push -u origin main
```

## Desplegar en Vercel

### Opción A — conectar el repo (recomendado, auto-deploy)
1. Entra a https://vercel.com → **Add New → Project**.
2. Importa tu repo `zentinela-landing`.
3. Framework: **Next.js** (lo detecta solo). Dale **Deploy**.
4. Desde ahí, cada `git push` a `main` actualiza la web automáticamente.

### Opción B — desde la terminal con Vercel CLI
```bash
npm i -g vercel
vercel          # primer deploy (preview)
vercel --prod   # publicar a producción
```

## Activar la capa de IA (opcional)

En Vercel: **Project → Settings → Environment Variables** y agrega:

```
ANTHROPIC_API_KEY = tu_clave
```

Vuelve a desplegar. Sin esta variable, el analizador igual funciona con el motor de patrones.

## Cambiar el número de WhatsApp

Está en `app/page.jsx`, constante `WA` (actualmente `51936687271`).
