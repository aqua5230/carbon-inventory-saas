"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function RegisteredNotice({ onNotice }: { onNotice: (msg: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("registered") === "1") onNotice("帳號已建立，請登入。");
  }, [searchParams, onNotice]);
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.login(email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登入失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6faf7] px-6 py-12">
      <Suspense><RegisteredNotice onNotice={setSuccess} /></Suspense>
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-[#1a5c2a]">碳盤查系統</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">登入帳號</h1>
          <p className="mt-3 text-sm text-gray-500">登入後即可管理公司資料、廠址與碳排放紀錄。</p>
        </div>

        <div className="rounded-3xl border border-[#d6e7d8] bg-white p-8 shadow-sm">
          {success && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20"
                placeholder="請輸入密碼"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#1a5c2a] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "登入中..." : "登入"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            還沒有帳號？
            <Link href="/register" className="ml-1 font-medium text-[#1a5c2a] hover:underline">
              前往註冊
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
