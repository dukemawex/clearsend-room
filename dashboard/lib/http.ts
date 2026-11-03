import { NextResponse } from "next/server";

export function fail(e: unknown) {
  const err = e as Error & { status?: number };
  const status = typeof err.status === "number" ? err.status : 500;
  return NextResponse.json({ ok: false, error: err.message ?? String(e) }, { status });
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export function bad(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

export const str = (v: unknown, name: string, max = 2000) => {
  if (typeof v !== "string" || !v.trim()) bad(`${name} is required`);
  return (v as string).trim().slice(0, max);
};
