import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

import NebulaBackground from "@/components/NebulaBackground";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AstralBridge | A2A Registry",
  description: "Cosmic control center for autonomous agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased min-h-screen bg-void-black text-foreground`}
      >
        <NebulaBackground />
        <div className="flex min-h-screen relative z-10">
          <Sidebar />
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto h-screen">
            <div className="max-w-7xl mx-auto p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}


