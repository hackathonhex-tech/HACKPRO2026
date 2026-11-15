import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

// Font definitions with local fallback
const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  title: "HACKPRO - Hackathon Platform",
  description: "HACKPRO - Next-gen Hackathon Management Platform",
  icons: {
    icon: [
      { url: "/hackpro-icon.png" },
    ],
    shortcut: "/hackpro-icon.png",
    apple: "/hackpro-icon.png",
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
