"use client";

import { LogIn, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "react-oidc-context";

export default function Home() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Main Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 border border-white/20 shadow-2xl max-w-lg w-full text-center animate-fade-in">
        <div className="flex flex-col items-center space-y-6">
          <Sparkles className="w-16 h-16 text-purple-400 animate-pulse" />
          <h1 className="text-4xl font-bold text-white">PDF Summarizer</h1>
          <p className="text-gray-300 text-base">
            Upload PDFs and get AI-powered summaries — instantly.
          </p>

          {/* Authenticated */}
          {auth.isAuthenticated ? (
            <div className="space-y-6">
              <div className="text-gray-300">
                Welcome,{" "}
                <span className="text-purple-300 font-semibold">
                  {auth.user?.profile.email}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => auth.signoutSilent()}
                  className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/30 text-red-300 px-6 py-3 rounded-xl font-semibold border border-red-500/30 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 w-full">
              <p className="text-gray-400">
                Please sign in to continue and access your AI summaries.
              </p>
              <button
                onClick={() => auth.signinRedirect()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-gray-400 text-sm text-center">
        © {new Date().getFullYear()} PDF Summarizer — Built with ❤️ and AI
      </footer>
    </div>
  );
}
