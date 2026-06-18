// app/layout.jsx
import "./globals.css";

export const metadata = {
  title: "Zentinela IA — ¿Estafa o no? Reenvía el mensaje y lo sabes en segundos",
  description:
    "Zentinela IA lee el mensaje, revisa el link y te dice si es estafa, con la explicación y el consejo. Para estafas de aquí: BCP, Yape, SUNAT, premios. Funciona en WhatsApp.",
  openGraph: {
    title: "Zentinela IA — Tu guardián contra estafas en WhatsApp",
    description:
      "Reenvía el mensaje sospechoso y sabes en segundos si es seguro. Hecho para Latinoamérica.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#F4EBDB" };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
