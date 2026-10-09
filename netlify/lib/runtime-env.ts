export function runtimeValue(name: string): string {
  const runtime = globalThis as typeof globalThis & {
    Netlify?: { env: { get: (key: string) => string | undefined } };
  };
  return (runtime.Netlify?.env.get(name) ?? process.env[name] ?? "").trim();
}
