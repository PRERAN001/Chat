import Component from "../components/login-btn";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black font-sans text-zinc-50 overflow-hidden selection:bg-zinc-800 selection:text-white">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black opacity-80" />
      
      {/* Grid Pattern (Optional subtle texture) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <main className="relative z-10 flex w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-20 text-center">
        
        {/* Logo / Brand Name */}
        <div className="flex items-center gap-3 animate-fade-in-down">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-zinc-800 to-black shadow-lg border border-zinc-700/50">
            <svg 
              viewBox="0 0 24 24" 
              width="24" 
              height="24" 
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
          <h1 className="text-2xl font-bold tracking-widest text-zinc-100 uppercase">
            Chat
          </h1>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-5xl font-extrabold tracking-tighter sm:text-6xl/tight md:text-7xl/tight bg-clip-text text-transparent bg-linear-to-b from-white via-zinc-200 to-zinc-600 pb-2">
            Connect instantly. <br /> Communicate freely.
          </h2>
          <p className="max-w-150 text-lg text-zinc-400 sm:text-xl leading-relaxed">
            Experience seamless, secure, and lightning-fast messaging. Join Aura today and stay close to the people who matter most.
          </p>
        </div>

        {/* Call to Action (Login Component) */}
        <div className="mt-4 flex flex-col items-center gap-4 w-full sm:w-auto">
          <div className="p-px rounded-full bg-linear-to-r from-zinc-700 via-zinc-400 to-zinc-700 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-shadow duration-500">
            <div className="bg-black rounded-full px-8 py-2">
               <Component />
            </div>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            By signing in, you agree to our Terms of Service.
          </p>
        </div>
        
        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 w-full max-w-3xl border-t border-zinc-800/80 pt-12">
          
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-xl shadow-inner">
              🔒
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 tracking-wide">End-to-End Secure</h3>
              <p className="text-sm text-zinc-500 mt-1">Your privacy is our priority.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-xl shadow-inner">
              ⚡
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 tracking-wide">Lightning Fast</h3>
              <p className="text-sm text-zinc-500 mt-1">Real-time sync across all devices.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-xl shadow-inner">
              🌙
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 tracking-wide">Immersive Design</h3>
              <p className="text-sm text-zinc-500 mt-1">Beautifully dark, easy on the eyes.</p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}