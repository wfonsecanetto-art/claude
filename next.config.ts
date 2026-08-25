import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Mantém o bundle enxuto: só o que é usado de cada biblioteca entra no build.
    optimizePackageImports: ["lucide-react", "framer-motion"],

    // Server Actions recusam requisições cujo Origin não bate com o Host. Ao
    // abrir o app por um túnel (Codespaces, Gitpod), o host encaminhado é
    // diferente do host interno e todo formulário quebraria sem esta lista.
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "*.app.github.dev",
        "*.githubpreview.dev",
        "*.gitpod.io",
        "*.csb.app",
      ],
    },
  },
};

export default nextConfig;
