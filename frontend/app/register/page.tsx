"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.register(email, password);
      try {
        await api.login(email, password);
        router.push("/");
      } catch {
        router.push("/login?registered=1");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "註冊失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6faf7] px-6 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-[#1a5c2a]">碳盤查系統</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">建立帳號</h1>
          <p className="mt-3 text-sm text-gray-500">註冊完成後會自動登入，直接進入系統首頁。</p>
        </div>

        <div className="rounded-3xl border border-[#d6e7d8] bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20"
                placeholder="請設定密碼"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#1a5c2a] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "註冊中..." : "註冊並登入"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            已有帳號？
            <Link href="/login" className="ml-1 font-medium text-[#1a5c2a] hover:underline">
              前往登入
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
