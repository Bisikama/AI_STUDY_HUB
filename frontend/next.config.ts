import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bỏ hẳn experimental.turbopack nếu không thực sự cần build cực nhanh ở dev
  // Điều này giúp loại bỏ 90% lỗi "root directory" và "proxy"
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;