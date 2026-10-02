import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Avaliação offline do agente contra o Supabase e o provedor configurados no
// ambiente (.env.local). Não roda no `npm run test`.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/eval/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/eval/**/*.eval.ts"],
    env: loadEnv("development", process.cwd(), ""),
    fileParallelism: false,
    testTimeout: 20 * 60 * 1000,
  },
});
