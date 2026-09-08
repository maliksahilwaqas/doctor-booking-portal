import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Archivo } from "next/font/google";
import "./globals.css";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getDoctorProfile } from "@/lib/data/profile";
import { ACCENT_THEMES } from "@/lib/calc/accents";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Doctor Booking",
  description: "Book an appointment token online.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = isSupabaseConfigured() ? await getDoctorProfile() : null;
  const theme = ACCENT_THEMES[profile?.accent ?? "blue"];

  const accentVars = {
    "--accent": theme.accent,
    "--accent-700": theme.accent700,
    "--accent-600": theme.accent600,
    "--accent-200": theme.accent200,
    "--accent-100": theme.accent100,
    "--accent-400": theme.accent400,
  } as CSSProperties;

  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`} style={accentVars}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">{children}</body>
    </html>
  );
}
