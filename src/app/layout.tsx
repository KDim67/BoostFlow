'use client';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from 'next/navigation';
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FirebaseProvider } from "@/lib/firebase/FirebaseProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith('/platform-admin');

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <FirebaseProvider>
          {!isAdminPanel && <Navbar />}
          <main className={isAdminPanel ? "" : "flex-grow pt-16 md:pt-20"}>
            {children}
          </main>
          {!isAdminPanel && <Footer />}
        </FirebaseProvider>
      </body>
    </html>
  );
}
