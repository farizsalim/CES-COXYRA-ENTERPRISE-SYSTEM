import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "COXYRA ENTERPRISE SYSTEM",
  description: "Sistem informasi sumber daya manusia COXYRA ENTERPRISE SYSTEM.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased scheme-light">
      <body
        className={`${geistSans.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
