import type { Metadata } from "next";
import { Kalam, Patrick_Hand } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["700"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Job Hunter AI",
  description: "Your AI-powered job hunting assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${kalam.variable} ${patrickHand.variable}`}
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 md:p-10 pt-20 md:pt-10 max-w-5xl mx-auto w-full">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
