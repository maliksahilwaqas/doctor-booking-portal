import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Falls back to the general Supabase storage domain when no project
      // URL is set yet (e.g. at first build, before .env.local is filled in).
      { protocol: "https", hostname: supabaseHostname ?? "*.supabase.co" },
    ],
  },
};

export default nextConfig;
