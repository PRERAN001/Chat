export default function CommunitiesPage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-black font-sans flex items-center justify-center  text-zinc-100">
      <div className="h-full w-full max-w-[1600px] bg-zinc-950 shadow-2xl overflow-hidden flex   border-zinc-800/60 relative">
        
        {/* Subtle grid background for the whole app */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none z-0"></div>

        {/* --- Left Sidebar --- */}
        <div className="w-[32%] min-w-[340px] max-w-[430px] border-r border-zinc-800 flex flex-col bg-zinc-950/80 backdrop-blur-md z-10">
          
          {/* Header */}
          <div className="h-[108px] bg-zinc-900/80 flex items-end px-6 pb-4 text-zinc-100 shrink-0 border-b border-zinc-800">
            <a 
              href="/dashboard" 
              className="mr-6 flex items-center hover:bg-zinc-800 p-2 -ml-2 rounded-full transition-colors text-zinc-400 hover:text-zinc-100"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path>
              </svg>
            </a>
            <h1 className="text-[20px] font-semibold mb-0.5 tracking-wide">Communities</h1>
          </div>

          {/* Communities List */}
          <div className="flex-1 overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            
            {/* New Community Action */}
            <div className="flex items-center px-5 py-4 cursor-pointer hover:bg-zinc-900/60 transition-colors mt-2">
              <div className="w-[52px] h-[52px] rounded-xl bg-zinc-800 relative flex-shrink-0 flex items-center justify-center overflow-visible border border-zinc-700 shadow-inner">
                {/* Community Icon */}
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="text-zinc-400 mt-1">
                  <path d="M12 12.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm0 1.5c-2.33 0-7 1.17-7 3.5V19h14v-1.5c0-2.33-4.67-3.5-7-3.5z"></path>
                </svg>
                {/* Plus Badge */}
                <div className="absolute bg-zinc-100 rounded-full w-[20px] h-[20px] flex items-center justify-center right-[-6px] bottom-[-6px] border-2 border-zinc-900 shadow-sm">
                    <span className="text-black text-[16px] leading-none font-bold mb-[2px] ml-[1px]">+</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h2 className="text-zinc-100 text-[16px] font-medium leading-5">New community</h2>
              </div>
            </div>

            <div className="border-b border-zinc-800/50 mx-5 my-2"></div>

            {/* Mock Community Item */}
            <div className="flex items-center px-5 py-3 cursor-pointer hover:bg-zinc-900/60 transition-colors">
              <div className="w-[52px] h-[52px] rounded-xl bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-zinc-700 shadow-inner">
                <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" className="text-zinc-400">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path>
                </svg>
              </div>
              <div className="ml-4 flex-1 border-b border-zinc-800/50 pb-3 pt-1">
                <h2 className="text-zinc-100 font-medium text-[16px] leading-5">Tech Meetups</h2>
              </div>
            </div>

          </div>
        </div>

        {/* --- Right Viewer Area --- */}
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm bg-black border-l border-zinc-800 relative z-10">
          
          {/* Abstract Communities Graphic */}
          <div className="mb-10 relative flex items-center justify-center">
             <div className="w-40 h-40 bg-zinc-900/50 rounded-full absolute border border-zinc-800/50"></div>
             <div className="w-24 h-24 bg-zinc-800/30 rounded-full absolute -ml-28 mt-10 border border-zinc-700/30"></div>
             <div className="w-24 h-24 bg-zinc-800/30 rounded-full absolute ml-28 mt-10 border border-zinc-700/30"></div>
             
             <div className="w-28 h-28 bg-gradient-to-br from-zinc-800 to-black rounded-full relative z-10 flex items-center justify-center shadow-2xl border border-zinc-700/50">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
             </div>
          </div>
          
          <h2 className="text-[32px] font-bold text-zinc-200 tracking-tight mb-4">Introducing Communities</h2>
          <p className="text-[15px] text-zinc-500 text-center max-w-md leading-relaxed">
            Easily organize your related groups and send announcements. Now, your communities, like neighborhoods or schools, can have their own space.
          </p>
          <button className="mt-10 px-8 py-3 bg-zinc-100 text-black rounded-full font-semibold shadow-lg hover:bg-zinc-300 transition-colors">
            Start your community
          </button>
        </div>

      </div>
    </div>
  );
}