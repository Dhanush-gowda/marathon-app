"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{ name: string } | null>(null);
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const userData = localStorage.getItem("user_data");
    if (userData) {
      try { setLoggedInUser(JSON.parse(userData)); } catch { setLoggedInUser(null); }
    } else {
      setLoggedInUser(null);
    }
  }, [pathname]);

  const handleUserLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_data");
    setLoggedInUser(null);
    router.push("/");
  };

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/register", label: "Register" },
    { href: "/route-map", label: "Route Map" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/track", label: "Track" },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/participants", label: "Participants" },
    { href: "/admin/results", label: "Results" },
  ];

  const links = isAdmin ? adminLinks : publicLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAdmin ? "/admin/dashboard" : "/"} className="flex items-center gap-2">
            <span className="text-2xl">🏃</span>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {isAdmin ? "Admin Panel" : "Marathon Manager"}
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!isAdmin && loggedInUser ? (
              <div className="ml-2 flex items-center gap-2">
                <span className="text-sm text-gray-300 truncate max-w-[120px]">{loggedInUser.name}</span>
                <button onClick={handleUserLogout} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-gray-300 hover:bg-white/20 transition-colors">Logout</button>
              </div>
            ) : !isAdmin ? (
              <Link
                href="/login"
                className="ml-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all"
              >
                Sign In
              </Link>
            ) : null}
            {!isAdmin && (
              <Link
                href="/admin/login"
                className="ml-1 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-950/95 backdrop-blur-xl border-b border-white/10 animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!isAdmin && loggedInUser ? (
              <button
                onClick={() => { handleUserLogout(); setMobileOpen(false); }}
                className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-red-400 hover:bg-white/5"
              >
                Logout ({loggedInUser.name})
              </button>
            ) : !isAdmin ? (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center"
              >
                Sign In
              </Link>
            ) : null}
            {!isAdmin && (
              <Link
                href="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl text-base font-medium text-gray-500 hover:text-gray-300"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
