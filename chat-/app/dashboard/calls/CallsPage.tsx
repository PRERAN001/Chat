export default function CallsPage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-black font-sans flex items-center justify-center  text-zinc-100">
      <div className="h-full w-full max-w-[1600px] bg-zinc-950 shadow-2xl overflow-hidden flex border border-zinc-800/60 relative">
        
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
            <h1 className="text-[20px] font-semibold mb-0.5 tracking-wide">Calls</h1>
          </div>

          {/* Calls List */}
          <div className="flex-1 overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            
            {/* Search/Filter Bar */}
            <div className="px-3 py-2 bg-transparent border-b border-zinc-800">
              <div className="bg-zinc-900 flex items-center px-3 py-2 rounded-xl border border-zinc-800 focus-within:border-zinc-600 transition-colors">
                <span className="text-zinc-500 mr-3 ml-1 text-sm">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search or start new call"
                  className="bg-transparent outline-none text-sm w-full text-zinc-100 placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Section Header */}
            <div className="px-6 py-4">
               <p className="text-zinc-500 text-[11px] font-bold tracking-widest uppercase">RECENT</p>
            </div>

            {/* Mock Call Item 1 (Outgoing Audio) */}
            <div className="flex items-center px-5 py-3 cursor-pointer hover:bg-zinc-900/60 transition-colors">
              <div className="w-[52px] h-[52px] rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner flex-shrink-0">
                <span className="text-sm font-semibold">PS</span>
              </div>
              
              <div className="ml-4 flex-1 border-b border-zinc-800/50 pb-3 pt-1 flex justify-between items-center pr-2">
                <div>
                  <h2 className="text-zinc-100 font-medium text-[16px] leading-5">Preran S</h2>
                  <div className="flex items-center mt-1 text-zinc-500 text-[13px]">
                    {/* Outgoing Arrow (Emerald) */}
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" className="mr-1 text-emerald-400">
                      <path d="M5.4 16.2l-1.6-1.6 7.4-7.4H4.6V5h9.6v9.6h-2.2V8.4z"></path>
                    </svg>
                    <span>today at 11:30 AM</span>
                  </div>
                </div>
                {/* Phone Icon */}
                <div className="text-zinc-400 p-2 hover:bg-zinc-800 hover:text-zinc-200 rounded-full transition-colors">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Mock Call Item 2 (Missed Video) */}
            <div className="flex items-center px-5 py-3 cursor-pointer hover:bg-zinc-900/60 transition-colors">
              <div className="w-[52px] h-[52px] rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner flex-shrink-0">
                <span className="text-sm font-semibold">MW</span>
              </div>
              
              <div className="ml-4 flex-1 border-b border-zinc-800/50 pb-3 pt-1 flex justify-between items-center pr-2">
                <div>
                  <h2 className="text-rose-400 font-medium text-[16px] leading-5">MY WISH</h2>
                  <div className="flex items-center mt-1 text-zinc-500 text-[13px]">
                    {/* Missed Arrow (Rose) */}
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" className="mr-1 text-rose-400">
                      <path d="M14.6 3.8l1.6 1.6-7.4 7.4h6.6v2.2H5.8V5.4h2.2v6.6z"></path>
                    </svg>
                    <span>yesterday at 6:45 PM</span>
                  </div>
                </div>
                {/* Video Icon */}
                <div className="text-zinc-400 p-2 hover:bg-zinc-800 hover:text-zinc-200 rounded-full transition-colors">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Mock Call Item 3 (Incoming Audio) */}
            <div className="flex items-center px-5 py-3 cursor-pointer hover:bg-zinc-900/60 transition-colors">
              <div className="w-[52px] h-[52px] rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner flex-shrink-0">
                <span className="text-sm font-semibold">SD</span>
              </div>
              
              <div className="ml-4 flex-1 border-b border-zinc-800/50 pb-3 pt-1 flex justify-between items-center pr-2">
                <div>
                  <h2 className="text-zinc-100 font-medium text-[16px] leading-5">shashi dhar</h2>
                  <div className="flex items-center mt-1 text-zinc-500 text-[13px]">
                    {/* Incoming Arrow (Emerald rotated) */}
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" className="mr-1 transform rotate-90 text-emerald-400">
                      <path d="M5.4 16.2l-1.6-1.6 7.4-7.4H4.6V5h9.6v9.6h-2.2V8.4z"></path>
                    </svg>
                    <span>Monday at 2:10 PM</span>
                  </div>
                </div>
                {/* Phone Icon */}
                <div className="text-zinc-400 p-2 hover:bg-zinc-800 hover:text-zinc-200 rounded-full transition-colors">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"></path>
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* --- Right Viewer Area --- */}
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm bg-black border-l border-zinc-800 relative z-10">
          
          {/* Abstract Calls Graphic */}
          <div className="mb-10 relative flex items-center justify-center">
             <div className="w-56 h-56 bg-zinc-900/50 rounded-full absolute border border-zinc-800/50"></div>
             <div className="w-40 h-40 bg-zinc-800/30 rounded-full absolute border border-zinc-700/30"></div>
             
             <div className="w-28 h-28 bg-gradient-to-br from-zinc-800 to-black rounded-full relative z-10 flex items-center justify-center shadow-2xl border border-zinc-700/50">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" className="text-zinc-300">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"></path>
                </svg>
             </div>
          </div>
          
          <h2 className="text-[32px] font-bold text-zinc-200 tracking-tight mb-4">Stay Connected</h2>
          <p className="text-[15px] text-zinc-500 text-center max-w-md leading-relaxed">
            Select a contact from your call history to view details, or start a new voice or video call.
          </p>
          
          <div className="mt-12 flex items-center gap-2 text-[12px] font-medium text-zinc-600 uppercase tracking-widest bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
             <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
               <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 3.9a3 3 0 110 6 3 3 0 010-6zM12 17c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"></path>
             </svg>
             End-to-end encrypted
          </div>
        </div>

      </div>
    </div>
  );
}