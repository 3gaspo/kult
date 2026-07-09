/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useKult } from "../providers";
import { Mail, Lock, Eye, EyeOff, Film, CircleAlert } from "lucide-react";

export const AuthPage: React.FC = () => {
  const { signIn, signUp, authLoading } = useKult();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[24px] bg-black dark:bg-white flex items-center justify-center overflow-hidden shadow-md">
            <img src="/kult.svg" className="w-12 h-12 object-contain" alt="Kult Logo" referrerPolicy="no-referrer" />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-zinc-500 dark:text-zinc-400">Loading Kult...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-200">
      <div className="w-full max-w-md mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-[24px] bg-black dark:bg-white flex items-center justify-center overflow-hidden shadow-md">
            <img src="/kult.svg" className="w-12 h-12 object-contain" alt="Kult Logo" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mt-4">Kult</h1>
        </div>

        <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[32px] shadow-sm transition-colors duration-200">
          <h2 className="text-xl font-bold tracking-tight mb-6 text-zinc-900 dark:text-zinc-50">
            {isSignUp ? "Create account" : "Sign in"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-400 dark:text-zinc-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium text-base shadow-sm"
                  id="auth-email-input"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-400 dark:text-zinc-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium text-base shadow-sm"
                  id="auth-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 focus:outline-none"
                  id="auth-password-toggle"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
                <CircleAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              id="auth-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              disabled={loading}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              id="auth-switch-mode-btn"
            >
              {isSignUp ? "Already have an account? Sign in" : "New to Kult? Create account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
