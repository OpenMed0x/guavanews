import type { NextConfig } from "next";

const legacyInfoSlugs = [
  "help-centre",
  "subscription-sign-up",
  "contact-us",
  "accessibility",
  "terms-and-conditions",
  "privacy-policy",
  "cookie-policy",
  "copyright",
  "newsletter",
  "guava-api-access",
  "corporate-access",
  "job-board",
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@rainbow-me/rainbowkit",
      "wagmi",
      "viem",
      "@tanstack/react-query",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
      { protocol: "http", hostname: "localhost", port: "8000" },
    ],
  },
  async redirects() {
    return legacyInfoSlugs.map((slug) => ({
      source: `/${slug}`,
      destination: `/zh/info/${slug}`,
      permanent: false,
    }));
  },
};

export default nextConfig;
