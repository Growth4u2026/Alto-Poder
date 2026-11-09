import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alta · Growth4u",
  description: "Sua sócia de negócios digital, com o método da Laís Lucena.",
  appleWebApp: { capable: true, title: "Alta", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#7b3fbf",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
