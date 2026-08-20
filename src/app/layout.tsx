import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { GeoProvider } from "@/hooks/use-geolocation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fora & Flora — Catálogo de pontos de coleta",
  description:
    "Catalogue árvores frutíferas, flores e ervas ao seu redor. Marque locais, compartilhe com amigos e descubra pontos de coleta perto de você.",
  keywords: [
    "frutas",
    "flores",
    "ervas",
    "coleta",
    "mapa",
    "geolocalização",
    "foraging",
    "plantas",
  ],
  authors: [{ name: "Fora & Flora" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Fora & Flora",
    description: "Catálogo colaborativo de pontos de coleta de frutas, flores e ervas.",
    siteName: "Fora & Flora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fora & Flora",
    description: "Catálogo colaborativo de pontos de coleta de frutas, flores e ervas.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#022c22" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <GeoProvider>
          {children}
          <SonnerToaster
            richColors
            position="top-center"
            toastOptions={{
              style: {
                marginTop: "env(safe-area-inset-top)",
              },
            }}
          />
          <Toaster />
        </GeoProvider>
      </body>
    </html>
  );
}
