import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/omdx/*/relatorio": ["./src/lib/pdf/assets/**/*"],
    "/relatorios/exemplo-acme/download": ["./src/lib/pdf/assets/**/*"],
    "/demo/relatorio/download": ["./src/lib/pdf/assets/**/*"],
  },
  // Fixa a raiz do workspace no projeto. Sem isto, o Turbopack detectava um
  // package-lock.json solto em ~/ e inferia a pasta HOME como raiz, passando a
  // rastrear/cachear a home inteira — o cache de dev crescia para vários GB e
  // travava máquinas com pouca RAM.
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
