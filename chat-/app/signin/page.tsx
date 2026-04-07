"use client";

import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black font-sans relative overflow-hidden selection:bg-zinc-800 selection:text-white p-4">
      
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black opacity-80 z-0" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none z-0"></div>

      {/* Glassmorphic Card */}
      <div className="w-full max-w-sm bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/60 rounded-[2rem] p-8 sm:p-10 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center">
        
        {/* Logo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-black shadow-lg border border-zinc-700/50 mb-6">
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
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">Welcome to Chat</h2>
        <p className="text-sm text-zinc-500 mb-10 max-w-[240px]">
          Sign in to securely connect and message with your network.
        </p>

        {/* Google Sign In Button */}
        <button
          onClick={() => {signIn("google", { callbackUrl: "/dashboard" })}}
          className="group relative flex w-full items-center justify-center gap-3 bg-zinc-100 text-black font-semibold rounded-xl px-4 py-3.5 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-300"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          Continue with Google
        </button>

          <div>--------------------------------</div>

        <button
          onClick={() => {signIn("github", { callbackUrl: "/dashboard" })}}
          className="group relative flex w-full items-center justify-center gap-3 bg-zinc-100 text-black font-semibold rounded-xl px-4 py-3.5 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-300"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          Continue with github
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