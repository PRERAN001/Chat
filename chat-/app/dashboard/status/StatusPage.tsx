"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";



type StatusUser = {
  _id: string;
  name?: string;
  profilepic?: string;
};

type StatusItem = {
  _id?: string;
  userId: StatusUser;
  createdAt?: string;
  mediaUrl?: string;
  content?: {
    type?: string;
    mediaUrl?: string;
    text?: string;
  };
};

type StatusGroup = {
  user: StatusUser;
  statuses: StatusItem[];
};

export default function StatusPage() {
    const [statuses, setStatuses] = useState<StatusGroup[]>([]);
    const [currentUserId, setCurrentUserId] = useState("");
    const [selectedGroup, setSelectedGroup] = useState<StatusGroup | null>(null);
    const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const fetchStatuses = async () => {
      try {
        const res = await fetch("/api/upload_status");
        console.log("ressss",res)
        const data: StatusItem[] = await res.json();
        console.log("dtaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",data)

        const grouped: Record<string, StatusGroup> = {};

        data.forEach((status) => {
          const userId = status.userId?._id;
          if (!userId) return;

          if (!grouped[userId]) {
            grouped[userId] = {
              user: status.userId,
              statuses: [],
            };
          }

          grouped[userId].statuses.push(status);
        });

        const groupedArray = Object.values(grouped);
        setStatuses(groupedArray);
        console.log("📊 Grouped statuses:", groupedArray);
        groupedArray.forEach((group, idx) => {
          console.log(
            `  [${idx}] User: ${group.user.name} (ID: ${group.user._id}) - ${group.statuses.length} status(es)`
          );
          group.statuses.forEach((status, statusIdx) => {
            const media = status.content?.mediaUrl || status.mediaUrl || "no media";
            console.log(
              `      Status ${statusIdx}: ${status.content?.type || "unknown"} - ${media}`
            );
          });
        });
      } catch (err) {
        console.error("Failed to fetch statuses:", err);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/getcurrentuser");
        if (!res.ok) return;
        const data = await res.json();
        setCurrentUserId(String(data?._id || ""));
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };

    useEffect(() => {
      const init = async () => {
        await Promise.all([fetchStatuses(), fetchCurrentUser()]);
      };
      init();
    }, []);

    const formatStatusTime = (dateValue?: string) => {
      if (!dateValue) return "recently";
      const dt = new Date(dateValue);
      return dt.toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      });
    };

    const recentStatuses = statuses.filter(
      (group) => group.user._id !== currentUserId
    );

    const handleSelectGroup = (group: StatusGroup) => {
      console.log("👤 Selected group:", group);
      setSelectedGroup(group);
      setCurrentStatusIndex(0);
    };

    const handleNextStatus = () => {
      if (!selectedGroup) return;
      setCurrentStatusIndex((prev) =>
        prev < selectedGroup.statuses.length - 1 ? prev + 1 : prev
      );
    };

    const handlePrevStatus = () => {
      if (!selectedGroup) return;
      setCurrentStatusIndex((prev) => (prev > 0 ? prev - 1 : prev));
    };

    const currentStatus =
      selectedGroup && selectedGroup.statuses[currentStatusIndex];

    const handleUpload = async (file: File | undefined) => {
    if (!file || !currentUserId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", currentUserId);

    try {
        const res = await fetch("/api/upload_status", {
        method: "POST",
        body: formData
        });

        const data = await res.json();

        console.log("Uploaded:", data);

        fetchStatuses();

    } catch (err) {
        console.error("Upload failed:", err);
    }
    };

  return (
    <div className="h-screen w-full overflow-hidden bg-black font-sans flex items-center justify-center  text-zinc-100">
      <div className="h-full w-full max-w-400 bg-zinc-950 shadow-2xl overflow-hidden flex border-zinc-800/60 relative">
        
        {/* Subtle grid background for the whole app */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-size-[14px_24px] pointer-events-none z-0"></div>

        {/* --- Left Sidebar --- */}
        <div className="w-[32%] min-w-85 max-w-107.5 border-r border-zinc-800 flex flex-col bg-zinc-950/80 backdrop-blur-md z-10">
          
          {/* Header */}
          <div className="h-27 bg-zinc-900/80 flex items-end px-6 pb-4 text-zinc-100 shrink-0 border-b border-zinc-800">
            <a 
              href="/dashboard" 
              className="mr-6 flex items-center hover:bg-zinc-800 p-2 -ml-2 rounded-full transition-colors text-zinc-400 hover:text-zinc-100"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path>
              </svg>
            </a>
            <h1 className="text-[20px] font-semibold mb-0.5 tracking-wide">Status</h1>
          </div>

          {/* Status List */}
          <div className="flex-1 overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            
            {/* My Status */}
            <div
              className="flex items-center px-5 py-4 cursor-pointer hover:bg-zinc-900/60 transition-colors mt-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-13 h-13 rounded-full bg-zinc-800 relative shrink-0 flex items-center justify-center overflow-hidden border border-zinc-700 shadow-inner">
                {/* Default Avatar SVG */}
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="text-zinc-400 mt-2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path>
                </svg>
                {/* Plus Badge */}
                <div className="absolute bottom-0 right-0 bg-zinc-100 text-black rounded-full w-4.5 h-4.5 flex items-center justify-center text-[15px] font-bold border-2 border-zinc-900 leading-none pb-px">
                  +
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h2 className="text-zinc-100 font-medium text-[16px] leading-5">My status</h2>
                <p className="text-zinc-500 text-[13px] mt-1 truncate">
                  {currentUserId ? `Click to add an update` : "Loading user..."}
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />

            {/* Section Header */}
            {recentStatuses.length > 0 && (
              <div className="px-6 py-4 mt-2">
                 <p className="text-zinc-500 text-[11px] font-bold tracking-widest uppercase">RECENT</p>
              </div>
            )}

            {recentStatuses.map((group) => {
              const latest = group.statuses[group.statuses.length - 1];
              const initials = (group.user.name || "U").slice(0, 2).toUpperCase();

              return (
                <div
                  key={group.user._id}
                  className="flex items-center px-5 py-3 cursor-pointer hover:bg-zinc-900/60 transition-colors"
                  onClick={() => handleSelectGroup(group)}
                >
                  {/* Status Ring (Emerald instead of green) */}
                  <Link
                    href={`/dashboard/achievements/${group.user._id}`}
                    onClick={(e) => e.stopPropagation()}
                    title={`Open ${group.user.name || "user"} achievements`}
                    className="w-13 h-13 rounded-full p-0.5 border-2 border-emerald-400 shrink-0"
                  >
                    <div className="w-full h-full rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 overflow-hidden text-sm font-semibold shadow-inner">
                      {group.user.profilepic ? (
                        <Image src={group.user.profilepic} alt={group.user.name || "user"} width={52} height={52} className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                  </Link>
                  <div className="ml-4 flex-1 border-b border-zinc-800/50 pb-3 pt-1">
                    <h2 className="text-zinc-100 font-medium text-[16px] leading-5 truncate">
                      {group.user.name || "Unknown"}
                    </h2>
                    <p className="text-zinc-500 text-[13px] mt-1">
                      {formatStatusTime(latest?.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}

            {recentStatuses.length === 0 && (
              <div className="px-6 pb-6 pt-2 text-zinc-600 text-[14px]">
                No recent status updates.
              </div>
            )}

          </div>
        </div>

        {/* --- Right Viewer Area --- */}
        <div className="flex-1 bg-black flex items-center justify-center flex-col min-w-0 relative z-10 border-l border-zinc-800">
          {selectedGroup && currentStatus ? (
            <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
              
              {/* Blurred Background effect for media */}
              <div 
                className="absolute inset-0 opacity-30 blur-3xl scale-110"
                style={{
                    backgroundImage: `url(${currentStatus.content?.mediaUrl || ""})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
              />

              {/* Status Header (Cinematic gradient) */}
              <div className="absolute top-0 left-0 right-0 z-20 bg-linear-to-b from-black/90 via-black/50 to-transparent pt-6 pb-12 px-6">
                
                {/* Progress Bar */}
                <div className="flex gap-1.5 mb-5 max-w-3xl mx-auto">
                  {selectedGroup.statuses.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full flex-1 overflow-hidden ${
                        i < currentStatusIndex
                          ? "bg-zinc-100"
                          : i === currentStatusIndex
                          ? "bg-zinc-100/80"
                          : "bg-zinc-100/20"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between max-w-3xl mx-auto">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/achievements/${selectedGroup.user._id}`}
                      title={`Open ${selectedGroup.user.name || "user"} achievements`}
                      className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center text-zinc-300 text-sm font-semibold shadow-lg hover:border-zinc-500 transition-colors"
                    >
                      {selectedGroup.user.profilepic ? (
                        <Image src={selectedGroup.user.profilepic} alt={selectedGroup.user.name || "user"} width={44} height={44} className="w-full h-full object-cover" />
                      ) : (
                        selectedGroup.user.name?.slice(0, 2).toUpperCase() || "U"
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-zinc-100 font-semibold tracking-wide truncate text-[16px] drop-shadow-md">
                        {selectedGroup.user.name || "Unknown"}
                      </h3>
                      <p className="text-zinc-300/80 text-[13px] mt-0.5 drop-shadow-md">
                        {formatStatusTime(currentStatus?.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="text-zinc-300 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md p-2 rounded-full transition-all border border-white/10"
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Media Container */}
              <div className="relative w-full h-full flex items-center justify-center z-10 p-4 pb-20 pt-24">
                {currentStatus?.content?.type === "image" ||
                currentStatus?.content?.mediaUrl?.includes("image") ? (
                  <Image
                    src={currentStatus.content?.mediaUrl || ""}
                    alt="Status"
                    width={1200}
                    height={1200}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                ) : currentStatus?.content?.type === "video" ||
                  currentStatus?.content?.mediaUrl?.includes("video") ? (
                  <video
                    src={currentStatus.content?.mediaUrl || ""}
                    autoPlay
                    controls
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="text-zinc-400 text-center bg-zinc-900/50 backdrop-blur-md px-6 py-4 rounded-xl border border-zinc-800">
                    <p className="text-sm">Unable to display media</p>
                  </div>
                )}
              </div>

              {/* Navigation - Left */}
              {currentStatusIndex > 0 && (
                <button
                  onClick={handlePrevStatus}
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-white bg-black/20 hover:bg-black/50 backdrop-blur-md border border-white/10 p-3 rounded-full z-30 transition-all shadow-lg"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              )}

              {/* Navigation - Right */}
              {currentStatusIndex < selectedGroup.statuses.length - 1 && (
                <button
                  onClick={handleNextStatus}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white bg-black/20 hover:bg-black/50 backdrop-blur-md border border-white/10 p-3 rounded-full z-30 transition-all shadow-lg"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-zinc-900 to-black shadow-2xl border border-zinc-800/80 mb-6">
                <svg viewBox="0 0 100 100" width="48" height="48" className="text-zinc-600" fill="currentColor">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="50 15 30 15 40 15" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-[28px] font-bold text-zinc-200 tracking-tight mb-2">View Status</h2>
              <p className="text-[15px] text-zinc-500 max-w-sm text-center">
                Click on a contact in the sidebar to view their latest status updates.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}