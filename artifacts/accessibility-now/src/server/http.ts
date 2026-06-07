import { NextResponse } from "next/server";
import { getDatabaseUrl } from "./cloudflare";
import { createDb } from "@workspace/db";

export function prepareRequestDb() {
  const url = getDatabaseUrl();
  if (url) {
    process.env.DATABASE_URL = url;
  }
}

export function requestDb() {
  prepareRequestDb();
  return createDb(process.env.DATABASE_URL);
}

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonErr(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  return (await req.json()) as T;
}
