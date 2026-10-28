import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error("Informe um destino absoluto e novo.");
await mkdir(destination);
const visited = new Set();
const extensions = ["", ".ts", ".tsx", ".js", ".mjs", ".json", ".css", "/index.ts", "/index.tsx"];

function scopePublicAssets(source) {
  return source.replace(/(["'`])\/(favicon\.png|directscal-logo(?:-dark)?\.svg|(?:action-points|initiatives\/avatars)\/[^"'`]+\.(?:svg|png|jpe?g|webp))/g, "$1/demo-static/$2");
}

async function resolveImport(importer, specifier) {
  const base = specifier.startsWith("@/") ? path.join(root, "src", specifier.slice(2)) : specifier.startsWith(".") ? path.resolve(path.dirname(importer), specifier) : null;
  if (!base) return null;
  for (const extension of extensions) {
    const candidate = base + extension;
    try { if ((await stat(candidate)).isFile()) return candidate; } catch {}
  }
  throw new Error(`Import não resolvido: ${specifier} em ${importer}`);
}

async function include(file) {
  if (visited.has(file)) return;
  const relative = path.relative(root, file);
  if (relative.startsWith("..") || /src\/lib\/(auth|supabase|agent|integrations|email)\//.test(relative) || /data-source\.ts$/.test(relative)) {
    throw new Error(`Dependência operacional proibida no pacote demo: ${relative}`);
  }
  visited.add(file);
  const output = path.join(destination, relative);
  await mkdir(path.dirname(output), { recursive: true });
  if (!/\.[cm]?[jt]sx?$/.test(file)) { await cp(file, output); return; }
  const source = await readFile(file, "utf8");
  await writeFile(output, scopePublicAssets(source));
  const imports = [...source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)["']([^"']+)["']/g)].map(match => match[1]);
  for (const specifier of imports) {
    const dependency = await resolveImport(file, specifier);
    if (dependency) await include(dependency);
  }
}

for (const relative of ["src/components/theme-provider.tsx", "src/app/demo/layout.tsx", "src/app/demo/[[...path]]/page.tsx", "src/app/demo/relatorio/download/route.ts", "src/app/demo/ativos/download/[id]/route.ts", "src/app/demo/action-points/download/route.ts"]) await include(path.join(root, relative));
for (const relative of ["package.json", "package-lock.json", "postcss.config.mjs", "eslint.config.mjs", "vitest.config.ts", "tests/unit/demo.test.ts", "src/app/globals.css"]) {
  await mkdir(path.dirname(path.join(destination, relative)), { recursive: true });
  await cp(path.join(root, relative), path.join(destination, relative));
}
for (const relative of ["public/favicon.png", "public/directscal-logo.svg", "public/directscal-logo-dark.svg", "public/action-points", "public/initiatives/avatars"]) {
  const output = path.join(destination, "public/demo-static", path.relative("public", relative));
  await mkdir(path.dirname(output), { recursive: true });
  await cp(path.join(root, relative), output, { recursive: true });
}
await cp(path.join(root, "src/lib/pdf/assets"), path.join(destination, "src/lib/pdf/assets"), { recursive: true });
const layout = (await readFile(path.join(root, "src/app/layout.tsx"), "utf8"))
  .replace(/^import \{ (Analytics|SpeedInsights) \}.*\n/gm, "")
  .replace(/\s*<(Analytics|SpeedInsights) \/>/g, "");
await writeFile(path.join(destination, "src/app/layout.tsx"), scopePublicAssets(layout));
await writeFile(path.join(destination, "src/app/page.tsx"), 'import { redirect } from "next/navigation";\nexport default function Page() { redirect("/demo"); }\n');
const config = JSON.parse(await readFile(path.join(root, "tsconfig.json"), "utf8"));
await writeFile(path.join(destination, "tsconfig.json"), JSON.stringify(config, null, 2));
await writeFile(path.join(destination, "next.config.ts"), 'import type { NextConfig } from "next";\nconst config: NextConfig = { assetPrefix: "/demo-static", outputFileTracingIncludes: { "/demo/relatorio/download": ["./src/lib/pdf/assets/**/*"] }, turbopack: { root: __dirname }, async headers() { return [{ source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] }]; } };\nexport default config;\n');
await writeFile(path.join(destination, "vercel.json"), JSON.stringify({ framework: "nextjs" }));
const packageJson = JSON.parse(await readFile(path.join(destination, "package.json"), "utf8"));
packageJson.name = "demo_directscal";
packageJson.scripts = { dev: "next dev", build: "next build", start: "next start", lint: "eslint", typecheck: "tsc --noEmit", test: "vitest run" };
await writeFile(path.join(destination, "package.json"), JSON.stringify(packageJson, null, 2) + "\n");
const lock = JSON.parse(await readFile(path.join(destination, "package-lock.json"), "utf8"));
lock.name = packageJson.name;
lock.packages[""].name = packageJson.name;
await writeFile(path.join(destination, "package-lock.json"), JSON.stringify(lock, null, 2) + "\n");
await writeFile(path.join(destination, ".gitignore"), "node_modules/\n.next/\n.vercel/\n.env*\ncoverage/\n*.tsbuildinfo\n.DS_Store\n");
await writeFile(path.join(destination, "AGENTS.md"), "# Demo DirectScal\n\nEste repositório contém somente a apresentação fictícia do produto. Antes de editar, leia o CLAUDE.md mais próximo. Preserve os componentes e tokens compartilhados. Não adicionar sessão, Supabase, IA ou integrações reais. Navegação em /demo; arquivos públicos e bundles em /demo-static. Usar a documentação local de Next.js 16 em node_modules/next/dist/docs. Validar com npm run typecheck, npm run lint, npm test e npm run build.\n");
for (const directory of new Set([...visited].map(file => path.dirname(path.relative(root, file))))) {
  const localDoc = path.join(root, directory, "CLAUDE.md");
  let content;
  try { content = await readFile(localDoc, "utf8"); } catch { content = `# ${directory}\n\nComponentes ou contratos da apresentação DirectScal, copiados da fonte compartilhada do produto. Preservar tokens, semântica e pt-BR. Dados e operações reais não pertencem a este repositório.\n`; }
  await writeFile(path.join(destination, directory, "CLAUDE.md"), content);
}
await writeFile(path.join(destination, "demo-manifest.json"), JSON.stringify({ sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(), dirty: execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim().length > 0, files: [...visited].map(file => path.relative(root, file)).sort() }, null, 2));
console.log(JSON.stringify({ destination, sourceFiles: visited.size, routes: ["/", "/demo/[[...path]]", "/demo/relatorio/download", "/demo/ativos/download/[id]", "/demo/action-points/download"] }));
