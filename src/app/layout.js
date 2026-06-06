import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vault.AI Quant Terminal",
  description: "Institutional AI Trading Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="antialiased font-sans overflow-x-hidden">{children}</body>
    </html>
  );
}
