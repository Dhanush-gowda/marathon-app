"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Try admin login first
      const adminRes = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        localStorage.setItem("admin_token", adminData.token);
        localStorage.setItem("user_data", JSON.stringify({ name: "Admin" }));
        toast.success("Welcome, Admin!");
        router.push("/admin/dashboard");
        return;
      }

      if (normalizedEmail === "admin@marathon.com") {
        const adminData = await adminRes.json();
        toast.error(adminData.error || "Admin login failed");
        return;
      }

      // Try user login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid email or password");
        return;
      }
      localStorage.setItem("user_token", data.token);
      localStorage.setItem("user_data", JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push("/");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="relative glass p-6 sm:p-10 max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏃</div>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome Back</h1>
          <p className="text-gray-400 mt-2 text-sm">Sign in to RBA Battle Run Fest</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.trimStart())}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn-primary w-full py-4" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Register now
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
