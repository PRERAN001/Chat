"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

export default function SignIn() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      window.location.replace("/dashboard");
    }
  }, [status]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black font-sans relative overflow-hidden selection:bg-zinc-800 selection:text-white p-4">
      
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black opacity-80 z-0" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-size-[14px_24px] pointer-events-none z-0"></div>

      {/* Glassmorphic Card */}
      <div className="w-full max-w-sm bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/60 rounded-4xl p-8 sm:p-10 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center">
        
        {/* Logo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-zinc-800 to-black shadow-lg border border-zinc-700/50 mb-6">
          <svg 
            viewBox="0 0 24 24" 
            width="32" 
            height="32" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-zinc-100"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">Welcome, Developer</h2>
        <p className="text-sm text-zinc-500 mb-10 max-w-60">
          Sign in with GitHub to unlock chat + developer tooling.
        </p>

        <button
          onClick={() => {signIn("github", { callbackUrl: "/dashboard" })}}
          className="group relative flex w-full items-center justify-center gap-3 bg-zinc-100 text-black font-semibold rounded-xl px-4 py-3.5 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-300"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.16c-3.34.73-4.04-1.42-4.04-1.42-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.08 1.84 2.82 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.92 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.44 11.44 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.67 1.64.25 2.86.13 3.16.77.84 1.24 1.92 1.24 3.23 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12 12 0 0 0 12 .5Z" />
          </svg>
          Continue with GitHub
        </button>
        
        {/* Security Note */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-[12px] text-zinc-600 uppercase tracking-widest font-medium">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 3.9a3 3 0 110 6 3 3 0 010-6zM12 17c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"></path>
          </svg>
          Secure Auth
        </div>
      </div>
    </div>
  );
}