import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // Impor CSV mengirim baris lewat Server Action; batas bawaan 1 MB terlalu kecil untuk ribuan baris.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
