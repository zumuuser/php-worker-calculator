import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHP Worker Calculator — How Many Workers Do You Need?",
  description:
    "Free, open-source calculator that analyzes your website and calculates exactly how many PHP workers you need. Supports WordPress, WooCommerce, membership sites, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
