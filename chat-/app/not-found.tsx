import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black font-sans relative overflow-hidden selection:bg-zinc-800 selection:text-white p-4">
      
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black opacity-80 z-0" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none z-0"></div>

      {/* Main Container with an efficient gap */}
      <div className="relative z-10 flex flex-col items-center text-center gap-10 sm:gap-12 w-full">
        
        {/* Massive Gradient 404 Area */}
        <div className="flex flex-col items-center select-none">
          <h1 className="text-[7rem] sm:text-[10rem] font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-400 to-zinc-900 leading-none drop-shadow-2xl">
            404
          </h1>
          {/* Subtle underline accent */}
          <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-zinc-500 to-transparent mt-4 rounded-full opacity-50"></div>
        </div>

        {/* Glassmorphic Content Card */}
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/60 rounded-[2rem] p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm sm:max-w-md w-full relative z-20">
          
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-black shadow-inner border border-zinc-700/50">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">
            Lost in the " Chat "void
          </h2>
          
          <p className="text-[15px] text-zinc-500 mb-8 leading-relaxed px-2">
            We couldn't find the page you're looking for. It might have been moved, deleted, or perhaps it never existed.
          </p>

          <Link
            href="/"
            className="group relative flex w-full items-center justify-center gap-3 bg-zinc-100 text-black font-semibold rounded-xl px-4 py-3.5 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all duration-300"
          >
            <svg 
              viewBox="0 0 24 24" 
              width="20" 
              height="20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="transition-transform group-hover:-translate-x-1"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Return to Safety
          </Link>

        </div>
      </div>
    </div>
  );
}