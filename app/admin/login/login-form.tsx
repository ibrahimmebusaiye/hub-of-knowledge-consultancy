"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) { setError(body?.error?.message ?? "Login failed. Please try again."); setLoading(false); return; }
    router.replace("/admin"); router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>Email address<input name="email" type="email" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" minLength={10} autoComplete="current-password" required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in securely"}</button>
    </form>
  );
}
