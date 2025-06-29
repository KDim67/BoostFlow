'use client';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FirebaseProvider } from "@/lib/firebase/FirebaseProvider";
import LayoutWrapper from "@/components/LayoutWrapper";

// Configure primary sans-serif font with CSS variable for global access
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Configure monospace font for code blocks and technical content
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});



/**
 * Root layout component that wraps all pages in the application
 * Provides global styling, font configuration, and essential providers
 * @param children - The page content to be rendered
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Apply font variables to the entire document
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        {/* Firebase authentication and database provider */}
        <FirebaseProvider>
          {/* Application-wide layout wrapper with navigation and common UI */}
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </FirebaseProvider>
      </body>
    </html>
  );
}
