"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import EmojiPicker from "emoji-picker-react";
import Peer from "simple-peer";
import mongoose from "mongoose";
type CurrentUser = {
  _id?: string;
  picture?: string;
  profilepic?: string;
};

type User = {
  _id: string;
  email: string;
  name: string;
  status?: string;
  profilepic?: string;
};

type Message = {
  message: string;
  from: string;
  senderId?: string;
  chatId?: string | null;
  channelId?: string | null;
};

type DbMessage = {
  senderId: string;
  chatId?: string;
  channelId?: string;
  content?: {
    text?: string;
  };
};

type GroupParticipant = {
  _id: string;
  name?: string;
  email?: string;
  profilepic?: string;
};

type GroupChat = {
  _id: string;
  groupname?: string;
  isGroup?: boolean;
  participants: GroupParticipant[];
  updatedAt?: string;
};

type ServerItem = {
  _id: string;
  name: string;
  members?: string[];
};

type ChannelItem = {
  _id: string;
  name: string;
  serverId: string;
  type?: "text" | "voice";
};

type IncomingCall = {
  from: string;
  name?: string;
  signal: unknown;
  isVideo: boolean;
};

type GithubPR = {
  id: number;
  title: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
};

type PeerLike = {
  destroy: () => void;
  signal: (data: unknown) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
};

const extractPR = (url: string) => {
  const parts = url.split("/");
  return {
    owner: parts[3],
    repo: parts[4],
    prNumber: parts[6],
  };
};

const Avatar = ({
  src,
  name,
  size = 40,
  className = "",
}: {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
}) => {
  const [imgError, setImgError] = useState(false);
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const showImage = Boolean(src) && !imgError;

  return (
    <div
      className={`rounded-full overflow-hidden bg-[#dfe5e7] flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={name || "avatar"}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-[#54656f] text-sm font-semibold">{initial}</span>
      )}
    </div>
  );
};



const Page = () => {
  const inputmsgref = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<PeerLike | null>(null);
  const usersRef = useRef<User[]>([]);

  const [showEmoji, setShowEmoji] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentuser, setcurrentuser] = useState<CurrentUser | null>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  const currentUserImage = currentuser?.picture ?? currentuser?.profilepic;
  const { data: session } = useSession();

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("My Group Chat");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerItem | null>(null);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(null);
  const [showServerForm, setShowServerForm] = useState(false);
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [serverName, setServerName] = useState("");
  const [channelName, setChannelName] = useState("");
  const [isCreatingServer, setIsCreatingServer] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [activeDmChatId, setActiveDmChatId] = useState<string | null>(null);

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callPeerEmail, setCallPeerEmail] = useState<string | null>(null);
  const [isPrPickerOpen, setIsPrPickerOpen] = useState(false);
  const [shareablePrs, setShareablePrs] = useState<GithubPR[]>([]);
  const [isPrsLoading, setIsPrsLoading] = useState(false);
  const [prsError, setPrsError] = useState("");
  const [isSendingPrId, setIsSendingPrId] = useState<number | null>(null);
  const [joiningServerId, setJoiningServerId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [availableServers, setAvailableServers] = useState<ServerItem[]>([]);
  const [serverSearchTerm, setServerSearchTerm] = useState("");
  const [showBrowseServers, setShowBrowseServers] = useState(false);
  const [isSearchingServers, setIsSearchingServers] = useState(false);


  
  const cleanupCall = () => {
    console.log("[CLEANUP] Starting call cleanup");
    
    if (peerRef.current) {
      console.log("[CLEANUP] Destroying peer connection");
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      console.log("[CLEANUP] Stopping local media tracks");
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("[CLEANUP] Stopping track:", track.kind);
        track.stop();
      });
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      console.log("[CLEANUP] Clearing local video element");
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      console.log("[CLEANUP] Clearing remote video element");
      remoteVideoRef.current.srcObject = null;
    }

    setIsCalling(false);
    setCallAccepted(false);
    setIncomingCall(null);
    setCallPeerEmail(null);
    console.log("[CLEANUP] Call cleanup completed");
  };

  const make_call = async (targetUser: User, withVideo: boolean) => {
    try {
      if (!socketRef.current || !socketRef.current.connected) {
        console.error("[CALL] Socket is not connected; cannot initiate call");
        alert("Socket is not connected yet. Please wait a moment and try again.");
        return;
      }

      if (!session?.user?.email) {
        console.error("[CALL] Missing current user email in session");
        return;
      }

      if (!targetUser?.email) {
        console.error("[CALL] Missing target user email");
        return;
      }

      console.log("[CALL] Initiating call to:", targetUser.email, "with video:", withVideo);
      console.log("[CALL] Current user session:", session?.user?.email);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: true,
      });
      console.log("[CALL] Got media stream - video:", withVideo, "audio: true");

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log("[CALL] Attached stream to local video element");
      }

      setIsVideoCall(withVideo);
      setIsCalling(true);
      setCallAccepted(false);
      setCallPeerEmail(targetUser.email);
      console.log("[CALL] Updated call states - isCalling: true, videoCall:", withVideo);

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });
      peerRef.current = peer;
      console.log("[CALL] Created peer object with initiator: true");

      peer.on("signal", (data: unknown) => {
        console.log("[CALL:SIGNAL] Peer generated signal, emitting call-user to backend");
        console.log("[CALL:SIGNAL] Target user:", targetUser.email);
        console.log("[CALL:SIGNAL] From:", session?.user?.email);
        socketRef.current?.emit("call-user", {
          signalData: data,
          to: targetUser.email,
          from: session?.user?.email,
          name: session?.user?.name,
          isVideo: withVideo,
        });
      });

      peer.on("stream", (remoteStream: MediaStream) => {
        console.log("[CALL:STREAM] Received remote stream with", remoteStream.getTracks().length, "tracks");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          console.log("[CALL:STREAM] Attached remote stream to video element");
        }
      });

      peer.on("close", () => {
        console.log("[CALL:CLOSE] Peer connection closed");
        cleanupCall();
      });

      peer.on("error", (err: unknown) => {
        console.error("[CALL:ERROR] Peer error:", err);
        cleanupCall();
      });

      console.log("[CALL] Caller setup complete, waiting for peer signal");
    } catch (error) {
      console.error("[CALL:ERROR] Failed to start call:", error);
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!incomingCall) {
      console.log("[ANSWER] No incoming call to answer");
      return;
    }

    try {
      console.log("[ANSWER] Answering incoming call from:", incomingCall.from);
      console.log("[ANSWER] Call type - Video:", incomingCall.isVideo, "Audio: true");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.isVideo,
        audio: true,
      });
      console.log("[ANSWER] Got media stream successfully");

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log("[ANSWER] Attached stream to local video element");
      }

      setIsVideoCall(incomingCall.isVideo);
      setCallAccepted(true);
      setCallPeerEmail(incomingCall.from);
      console.log("[ANSWER] Updated call states - callAccepted: true");

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
      });
      peerRef.current = peer;
      console.log("[ANSWER] Created peer object with initiator: false (responder mode)");

      peer.on("signal", (data: unknown) => {
        console.log("[ANSWER:SIGNAL] Peer generated signal, emitting answer-call to backend");
        console.log("[ANSWER:SIGNAL] Sending signal back to caller:", incomingCall.from);
        socketRef.current?.emit("answer-call", {
          to: incomingCall.from,
          signal: data,
        });
      });

      peer.on("stream", (remoteStream: MediaStream) => {
        console.log("[ANSWER:STREAM] Received remote stream from caller with", remoteStream.getTracks().length, "tracks");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          console.log("[ANSWER:STREAM] Attached remote stream to video element");
        }
      });

      peer.on("close", () => {
        console.log("[ANSWER:CLOSE] Peer connection closed");
        cleanupCall();
      });

      peer.on("error", (err: unknown) => {
        console.error("[ANSWER:ERROR] Peer error:", err);
        cleanupCall();
      });

      console.log("[ANSWER] Signaling peer with incoming SDP offer");
      peer.signal(incomingCall.signal);
      setIncomingCall(null);
      console.log("[ANSWER] Answer setup complete, awaiting peer connection");
    } catch (error) {
      console.error("[ANSWER:ERROR] Failed to answer call:", error);
      cleanupCall();
    }
  };

  const endCall = () => {
    const target = callPeerEmail || incomingCall?.from;
    console.log("[END-CALL] Ending call");
    console.log("[END-CALL] Target user:", target);
    console.log("[END-CALL] Call peer email:", callPeerEmail);
    console.log("[END-CALL] Incoming call from:", incomingCall?.from);
    
    if (target) {
      console.log("[END-CALL] Emitting end-call event to backend for target:", target);
      socketRef.current?.emit("end-call", { to: target });
      console.log("[END-CALL] End-call event emitted");
    } else {
      console.log("[END-CALL] No target found, skipping backend notification");
    }
    
    cleanupCall();
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      setSelectedUsers((prev) => prev.filter((u) => u !== id));
    }
  };


  const makegrp_chat = async () => {
    if (!currentuser?._id) {
      alert("Current user not loaded yet. Please try again.");
      return;
    }

    if (selectedUsers.length < 2) {
      alert("Please select at least 2 users to create a group.");
      return;
    }

    const participants = [String(currentuser._id), ...selectedUsers];

    try {
      setIsCreatingGroup(true);
      const response = await fetch("/api/grp_chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupName: groupName.trim() || "My Group Chat",
          participants,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create group chat");
      }

      setSelectedUsers([]);
      setIsGroupMode(false);
      setGroupName("My Group Chat");
      await fetchGroups();
      alert("Group created successfully ✅");
      console.log("Created group chat:", data);
    } catch (err) {
    console.error("Group chat creation error:", err);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const toggleGroupMode = () => {
    setIsGroupMode((prev) => !prev);
    setSelectedUsers([]);
  }

  useEffect(() => {
    socketRef.current = io("http://localhost:3001");

    socketRef.current.on("connect", () => {
      console.log("[SOCKET] Connected to signaling server:", socketRef.current?.id);
    });

    socketRef.current.on("disconnect", (reason: string) => {
      console.log("[SOCKET] Disconnected from signaling server. Reason:", reason);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current || !session?.user?.email) return;
    console.log("[SOCKET] Emitting join for user:", session.user.email);
    socketRef.current.emit("join", session.user.email);
  }, [session]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    if (!socketRef.current) return;

    const handleIncomingCall = (payload: IncomingCall) => {
      console.log("[SOCKET:INCOMING-CALL] Received incoming call event");
      console.log("[SOCKET:INCOMING-CALL] From:", payload.from);
      console.log("[SOCKET:INCOMING-CALL] Caller name:", payload.name);
      console.log("[SOCKET:INCOMING-CALL] Video call:", payload.isVideo);
      
      const caller = usersRef.current.find((u) => u.email === payload.from);
      if (caller) {
        console.log("[SOCKET:INCOMING-CALL] Found caller in users list:", caller.name);
        setSelectedGroup(null);
        setSelectedUser(caller);
      } else {
        console.log("[SOCKET:INCOMING-CALL] Caller not found in users list");
      }
      
      setIncomingCall(payload);
      setIsVideoCall(Boolean(payload.isVideo));
      setIsCalling(false);
      console.log("[SOCKET:INCOMING-CALL] Incoming call state updated, ready to answer");
    };

    const handleCallAccepted = ({ signal }: { signal: unknown }) => {
      console.log("[SOCKET:CALL-ACCEPTED] Call was accepted by remote user");
      if (!peerRef.current) {
        console.error("[SOCKET:CALL-ACCEPTED] ERROR: peerRef is null, cannot process acceptance signal");
        return;
      }
      console.log("[SOCKET:CALL-ACCEPTED] Signaling peer with acceptance SDP answer");
      setCallAccepted(true);
      setIsCalling(false);
      peerRef.current.signal(signal);
      console.log("[SOCKET:CALL-ACCEPTED] Peer signaling complete");
    };

    const handleCallEnded = () => {
      console.log("[SOCKET:CALL-ENDED] Remote user ended the call");
      cleanupCall();
    };

    socketRef.current.on("incoming-call", handleIncomingCall);
    socketRef.current.on("call-accepted", handleCallAccepted);
    socketRef.current.on("call-ended", handleCallEnded);
    console.log("[SOCKET] Registered call event listeners: incoming-call, call-accepted, call-ended");

    return () => {
      socketRef.current?.off("incoming-call", handleIncomingCall);
      socketRef.current?.off("call-accepted", handleCallAccepted);
      socketRef.current?.off("call-ended", handleCallEnded);
      console.log("[SOCKET] Unregistered call event listeners");
    };
  }, []);

  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    const handleReceive = (data: Message) => {
      const incomingChannelId = data.channelId ? String(data.channelId) : null;
      const incomingChatId = data.chatId ? String(data.chatId) : null;
      const activeChatId = selectedGroup?._id || activeDmChatId || null;

      if (selectedChannel?._id) {
        if (!incomingChannelId || incomingChannelId !== selectedChannel._id) {
          return;
        }
      } else if (incomingChannelId) {
        return;
      } else if (incomingChatId && activeChatId && incomingChatId !== activeChatId) {
        return;
      }

      if (
        !selectedGroup &&
        !selectedChannel &&
        selectedUser?.email &&
        data.from &&
        data.from !== selectedUser.email
      ) {
        return;
      }

      const sender = users.find((u) => u.email === data.from);
      const senderId = data.senderId || (sender ? String(sender._id) : data.from);

      setMessages((prev) => [
        ...prev,
        {
          message: data.message,
          from: senderId,
          senderId,
          chatId: incomingChatId,
          channelId: incomingChannelId,
        },
      ]);
    };

    const handleTyping = ({ from }: { from: string }) => {
      if (!selectedUser || from !== selectedUser.email || selectedChannel) return;
      setIsOtherUserTyping(true);
    };

    const handleStopTyping = ({ from }: { from: string }) => {
      if (!selectedUser || from !== selectedUser.email || selectedChannel) return;
      setIsOtherUserTyping(false);
    };

    socketRef.current.on("receive_message", handleReceive);
    socketRef.current.on("typing", handleTyping);
    socketRef.current.on("stop_typing", handleStopTyping);

    return () => {
      socketRef.current?.off("receive_message", handleReceive);
      socketRef.current?.off("typing", handleTyping);
      socketRef.current?.off("stop_typing", handleStopTyping);
    };
  }, [selectedUser, selectedGroup, selectedChannel, activeDmChatId, users]);

  useEffect(() => {
    setMessages([]);
    setIsOtherUserTyping(false);
    setIsPrPickerOpen(false);
    setPrsError("");
  }, [selectedUser, selectedGroup, selectedChannel]);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/grp_chat");
      if (!res.ok) return;
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  };

  const fetchServers = async (userId?: string) => {
    const uid = userId || currentuser?._id;
    if (!uid) return;

    try {
      const res = await fetch(`/api/server/users?userId=${uid}`);
      if (!res.ok) return;
      const data = await res.json();
      setServers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load servers:", error);
    }
  };

  const fetchChannels = async (serverId: string) => {
    try {
      const res = await fetch(`/api/channel/server?serverId=${serverId}`);
      if (!res.ok) return;
      const data = await res.json();
      setChannels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load channels:", error);
    }
  };

  const fetchAvailableServers = async (search?: string) => {
    try {
      setIsSearchingServers(true);
      const url = new URL("/api/server", window.location.origin);
      if (search) {
        url.searchParams.set("search", search);
      }
      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data = await res.json();
      setAvailableServers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load available servers:", error);
    } finally {
      setIsSearchingServers(false);
    }
  };

  const createServer = async () => {
    if (!serverName.trim() || !currentuser?._id) return;

    try {
      setIsCreatingServer(true);
      const res = await fetch("/api/server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: serverName.trim(),
          userId: currentuser._id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create server");
      }

      setServerName("");
      setShowServerForm(false);
      await fetchServers(String(currentuser._id));
    } catch (error) {
      console.error("Failed to create server:", error);
    } finally {
      setIsCreatingServer(false);
    }
  };

  const joinServer = async (serverId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) => {
    try {
      setJoiningServerId(String(serverId));
      
      const res = await fetch("/api/server/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          serverId: String(serverId),
          userId: String(userId)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to join server");
      }

      await fetchServers(String(userId));
      setNotification({
        type: 'success',
        message: 'Successfully joined the server! 🎉'
      });
      
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to join server";
      setNotification({
        type: 'error',
        message: errorMsg
      });
      console.error("Join server error:", err);
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setJoiningServerId(null);
    }
  };
  const createChannel = async () => {
    if (!channelName.trim() || !selectedServer?._id) return;

    try {
      setIsCreatingChannel(true);
      const res = await fetch("/api/channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: channelName.trim(),
          serverId: selectedServer._id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create channel");
      }

      setChannelName("");
      setShowChannelForm(false);
      await fetchChannels(selectedServer._id);
    } catch (error) {
      console.error("Failed to create channel:", error);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const getcurrentuserinfo = async () => {
    const res = await fetch("/api/getcurrentuser");
    const data = await res.json();
    setcurrentuser(data ?? {});
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
    getcurrentuserinfo();
  }, []);

  useEffect(() => {
    if (!currentuser?._id) return;

    const loadServersForUser = async () => {
      try {
        const res = await fetch(`/api/server/users?userId=${currentuser._id}`);
        if (!res.ok) return;
        const data = await res.json();
        setServers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load servers:", error);
      }
    };

    loadServersForUser();
  }, [currentuser?._id]);

  useEffect(() => {
    const currentEmail = session?.user?.email;
    if (!currentEmail) return;

    if (!selectedUser && !selectedGroup && !selectedChannel) return;

    const loadMessages = async () => {
      try {
        let endpoint = "";
        if (selectedChannel?._id) {
          endpoint = `/api/messages?channelId=${selectedChannel._id}`;
        } else if (selectedGroup?._id) {
          endpoint = `/api/messages?chatId=${selectedGroup._id}`;
        } else if (selectedUser?.email) {
          endpoint = `/api/messages?user1=${currentEmail}&user2=${selectedUser.email}`;
        }

        if (!endpoint) return;

        const res = await fetch(endpoint);
        const data = await res.json();

        const mapped = data.map((msg: DbMessage) => ({
          message: msg.content?.text || "",
          from: String(msg.senderId),
          senderId: String(msg.senderId),
          chatId: msg.chatId ? String(msg.chatId) : null,
          channelId: msg.channelId ? String(msg.channelId) : null,
        }));

        setMessages(mapped);

        if (selectedUser && mapped.length > 0) {
          const foundChatId = mapped.find((item: Message) => item.chatId)?.chatId;
          setActiveDmChatId(foundChatId || null);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };

    loadMessages();
  }, [selectedUser, selectedGroup, selectedChannel, session?.user?.email]);

  useEffect(() => {
    if (!socketRef.current) return;

    if (selectedChannel?._id) {
      socketRef.current.emit("join_context", { channelId: selectedChannel._id });
    } else if (selectedGroup?._id) {
      socketRef.current.emit("join_context", { chatId: selectedGroup._id });
    } else if (activeDmChatId) {
      socketRef.current.emit("join_context", { chatId: activeDmChatId });
    }
  }, [selectedChannel?._id, selectedGroup?._id, activeDmChatId]);

  useEffect(() => {
    if (!showBrowseServers) return;

    const delaySearch = setTimeout(() => {
      fetchAvailableServers(serverSearchTerm);
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [serverSearchTerm, showBrowseServers]);

  const sendmsg = async (msgg: string | undefined) => {
    const fromUser = session?.user?.email;

    if (!msgg || !fromUser || !currentuser?._id) return;
    if (!selectedUser && !selectedGroup && !selectedChannel) return;

    const optimisticChatId = selectedGroup?._id || activeDmChatId || null;
    const optimisticChannelId = selectedChannel?._id || null;

    setMessages((prev) => [
      ...prev,
      {
        message: msgg,
        from: String(currentuser?._id),
        senderId: String(currentuser?._id),
        chatId: optimisticChatId,
        channelId: optimisticChannelId,
      },
    ]);

    try {
      const payload = selectedChannel?._id
        ? {
            senderEmail: fromUser,
            channelId: selectedChannel._id,
            text: msgg,
          }
        : selectedGroup?._id
        ? {
            senderEmail: fromUser,
            chatId: selectedGroup._id,
            text: msgg,
          }
        : {
            senderEmail: fromUser,
            receiverEmail: selectedUser?.email,
            text: msgg,
          };

      const response = await fetch("/api/send-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error || "Failed to send message");
      }

      const resolvedChatId =
        selectedGroup?._id || responseData?.chatId || optimisticChatId || null;
      const resolvedChannelId = selectedChannel?._id || responseData?.channelId || null;

      if (selectedUser && responseData?.chatId) {
        setActiveDmChatId(String(responseData.chatId));
      }

      if (selectedUser?.email) {
        socketRef.current?.emit("stop_typing", {
          to: selectedUser.email,
          from: fromUser,
        });
      }

      socketRef.current?.emit("send_message", {
        to: selectedUser?.email,
        message: msgg,
        from: fromUser,
        senderId: String(currentuser?._id),
        chatId: resolvedChatId,
        channelId: resolvedChannelId,
      });
    } catch (err) {
      console.error("Send error:", err);
    }

    if (inputmsgref.current) inputmsgref.current.value = "";
  };

  const loadPrsForSharing = async () => {
    try {
      setIsPrsLoading(true);
      setPrsError("");

      const res = await fetch("/api/github/prs", { cache: "no-store" });
      if (!res.ok) {
        let message = "Failed to fetch pull requests";
        try {
          const data = await res.json();
          if (data?.error) {
            message = data.error;
          }
        } catch {
          // keep default message
        }
        throw new Error(message);
      }

      const data = await res.json();
      setShareablePrs(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load pull requests";
      setPrsError(message);
      setShareablePrs([]);
    } finally {
      setIsPrsLoading(false);
    }
  };

  const handleTogglePrPicker = async () => {
    const shouldOpen = !isPrPickerOpen;
    setIsPrPickerOpen(shouldOpen);
    if (shouldOpen) {
      await loadPrsForSharing();
    }
  };

  const sharePrInChat = async (pr: GithubPR) => {
    if (!selectedUser && !selectedGroup && !selectedChannel) return;

    setIsSendingPrId(pr.id);
    const { owner, repo, prNumber } = extractPR(pr.html_url);
    await sendmsg(
      `🚀 PR #${prNumber} (${owner}/${repo})\n${pr.title}\n${pr.html_url}`
    );
    setIsSendingPrId(null);
    setIsPrPickerOpen(false);
  };

  const renderMessageContent = (content: string) => {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlPattern);

    return parts.map((part, index) => {
      if (/^https?:\/\/[^\s]+$/.test(part)) {
        return (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="break-all text-blue-400 underline decoration-blue-400/60 underline-offset-4 hover:text-blue-300"
          >
            {part}
          </a>
        );
      }

      return <span key={`${part}-${index}`}>{part}</span>;
    });
  };

  const handleTypingChange = (value: string) => {
    const fromUser = session?.user?.email;
    if (!selectedUser || !fromUser) return;

    if (!value.trim()) {
      socketRef.current?.emit("stop_typing", {
        to: selectedUser.email,
        from: fromUser,
      });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      return;
    }

    socketRef.current?.emit("typing", {
      to: selectedUser.email,
      from: fromUser,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", {
        to: selectedUser.email,
        from: fromUser,
      });
    }, 900);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser, isOtherUserTyping]);

  const filteredUsers = users.filter((user) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-screen w-full overflow-hidden bg-black font-sans flex items-center justify-center  text-zinc-100">
      <div className="h-full w-full max-w-[1600px] bg-zinc-950 shadow-2xl overflow-hidden flex  border-zinc-800/60 relative">
        
        {/* Optional subtle grid background for the whole app (like the landing page) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none z-0"></div>

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-6 left-6 z-50 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'bg-red-500/20 text-red-300 border border-red-500/40'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="shrink-0">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="shrink-0">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              )}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* --- Sidebar --- */}
        <div className="w-[32%] min-w-[390px] max-w-[430px] border-r border-zinc-800 flex flex-col bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="h-16 bg-zinc-900/80 px-4 flex items-center justify-between border-b border-zinc-800">
            
            {/* Wrapped Profile Pic to prevent flex-squishing */}
            <div className="shrink-0 w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center border border-zinc-700/50">
              <Avatar
                src={currentUserImage}
                name={session?.user?.name || "You"}
                size={40}
                className="w-full h-full object-cover shrink-0"
              />
            </div>

            <div
              className="flex items-center gap-1 text-zinc-400 overflow-x-auto whitespace-nowrap scrollbar-thin"
              suppressHydrationWarning
            >
              <Link
                href="/dashboard"
                className="hover:bg-zinc-800 hover:text-zinc-100 px-3 py-1.5 rounded-full text-sm transition-colors"
              >
                Chats
              </Link>
              <Link
                href="/dashboard/status"
                className="hover:bg-zinc-800 hover:text-zinc-100 px-3 py-1.5 rounded-full text-sm transition-colors"
              >
                Status
              </Link>
              <Link
                href="/dashboard/calls"
                className="hover:bg-zinc-800 hover:text-zinc-100 px-3 py-1.5 rounded-full text-sm transition-colors"
              >
                Calls
              </Link>
              <Link
                href="/dashboard/communities"
                className="hover:bg-zinc-800 hover:text-zinc-100 px-3 py-1.5 rounded-full text-sm transition-colors"
              >
                Communities
              </Link>
              <button
                suppressHydrationWarning
                className="hover:bg-zinc-800 hover:text-zinc-100 px-3 py-1.5 rounded-full text-sm transition-colors"
                onClick={() => {
                  fetchUsers();
                  fetchGroups();
                  fetchServers();
                  if (selectedServer?._id) {
                    fetchChannels(selectedServer._id);
                  }
                }}
              >
                Refresh
              </button>

              <button
                suppressHydrationWarning
                className="hover:bg-zinc-800 hover:text-zinc-100 px-3 py-1.5 rounded-full text-sm transition-colors"
                onClick={() => {
                  setShowServerForm((prev) => !prev);
                  setShowChannelForm(false);
                }}
              >
                {showServerForm ? "Cancel Server" : "Create Server"}
              </button>

              <button
                suppressHydrationWarning
                disabled={!selectedServer}
                className="hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50 px-3 py-1.5 rounded-full text-sm transition-colors"
                onClick={() => {
                  setShowChannelForm((prev) => !prev);
                  setShowServerForm(false);
                }}
              >
                {showChannelForm ? "Cancel Channel" : "Create Channel"}
              </button>

              <button
                suppressHydrationWarning
                className={`px-3 py-1.5 rounded-full text-sm transition-colors font-medium ${
                  isGroupMode
                    ? "bg-zinc-100 text-black hover:bg-zinc-300"
                    : "hover:bg-zinc-800 hover:text-zinc-100"
                }`}
                onClick={toggleGroupMode}
              >
                {isGroupMode ? "Cancel Group" : "Make Group"}
              </button>
            </div>
          </div>

          {isGroupMode && (
            <div className="px-3 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2">
                
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  className="flex-1 bg-zinc-950 px-3 py-2 rounded-lg text-sm outline-none border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 transition-colors"
                />
                <button
                  suppressHydrationWarning
                  onClick={makegrp_chat}
                  disabled={isCreatingGroup || selectedUsers.length < 2}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-100 text-black disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-400 transition-colors"
                >
                  {isCreatingGroup ? "Creating..." : `Create (${selectedUsers.length})`}
                </button>
              </div>
              <p className="text-[12px] text-zinc-500 mt-2 ml-1">
                Select at least 2 users to create a group chat.
              </p>
            </div>
          )}

          {showServerForm && (
            <div className="px-3 py-3 border-b border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Server name"
                  className="flex-1 bg-zinc-950 px-3 py-2 rounded-lg text-sm outline-none border border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                />
                <button
                  onClick={createServer}
                  disabled={isCreatingServer || !serverName.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-400 text-black disabled:opacity-50"
                >
                  {isCreatingServer ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          )}

          {showChannelForm && selectedServer && (
            <div className="px-3 py-3 border-b border-zinc-800 bg-zinc-900/40">
              <div className="mb-2 text-xs text-zinc-400">in {selectedServer.name}</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Channel name"
                  className="flex-1 bg-zinc-950 px-3 py-2 rounded-lg text-sm outline-none border border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                />
                <button
                  onClick={createChannel}
                  disabled={isCreatingChannel || !channelName.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-400 text-black disabled:opacity-50"
                >
                  {isCreatingChannel ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          )}

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
                placeholder="Search or start new chat"
                className="bg-transparent outline-none text-sm w-full text-zinc-100 placeholder:text-zinc-500"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {/* My Servers Section */}
            {servers.length > 0 && (
              <>
                <div className="px-4 pt-4 pb-1 text-[11px] font-bold tracking-widest text-indigo-400 uppercase">
                  My Servers
                </div>
                {servers.map((server) => (
                  <div
                    key={server._id}
                    onClick={() => {
                      setSelectedServer(server);
                      setSelectedUser(null);
                      setSelectedGroup(null);
                      setSelectedChannel(null);
                      setActiveDmChatId(null);
                      fetchChannels(server._id);
                      setShowBrowseServers(false);
                    }}
                    className={`flex items-center px-4 py-2.5 cursor-pointer transition-colors ${
                      selectedServer?._id === server._id ? "bg-zinc-800/80" : "hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs font-bold">
                      {server.name?.slice(0, 1).toUpperCase() || "S"}
                    </div>
                    <div className="ml-3 min-w-0">
                      <p className="truncate text-sm text-zinc-100 font-medium">{server.name}</p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Browse Servers Section */}
            <>
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
                  Browse Servers
                </div>
                <button
                  onClick={() => {
                    setShowBrowseServers(!showBrowseServers);
                    if (!showBrowseServers) {
                      fetchAvailableServers();
                    }
                  }}
                  className="text-xs text-emerald-400/60 hover:text-emerald-400 transition-colors"
                >
                  {showBrowseServers ? "Hide" : "Show"}
                </button>
              </div>

              {showBrowseServers && (
                <div className="px-3 py-2 mb-2">
                  <div className="bg-zinc-900/60 flex items-center px-3 py-2 rounded-lg border border-zinc-800 focus-within:border-emerald-600 transition-colors gap-2">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 shrink-0">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search servers..."
                      className="bg-transparent outline-none text-sm w-full text-zinc-100 placeholder:text-zinc-500"
                      value={serverSearchTerm}
                      onChange={(e) => setServerSearchTerm(e.target.value)}
                    />
                  </div>

                  {isSearchingServers && (
                    <div className="px-3 py-3 text-sm text-zinc-400 text-center">
                      Searching...
                    </div>
                  )}

                  {!isSearchingServers && availableServers.length === 0 && (
                    <div className="px-3 py-3 text-sm text-zinc-500 text-center">
                      {serverSearchTerm ? "No servers found" : "No servers available"}
                    </div>
                  )}

                  {!isSearchingServers && availableServers.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                      {availableServers.map((server) => {
                        const isMember = server.members?.includes(String(currentuser?._id));
                        return (
                          <div
                            key={server._id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors border border-zinc-800/50"
                          >
                            <div className="flex items-center min-w-0 flex-1">
                              <div className="shrink-0 w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-bold">
                                {server.name?.slice(0, 1).toUpperCase() || "S"}
                              </div>
                              <div className="ml-2 min-w-0 flex-1">
                                <p className="truncate text-xs text-zinc-100 font-medium">{server.name}</p>
                                <p className="truncate text-xs text-zinc-500">
                                  {server.members?.length || 0} members
                                </p>
                              </div>
                            </div>

                            {isMember ? (
                              <button
                                disabled
                                className="ml-2 shrink-0 px-2 py-1 rounded-md text-xs font-semibold bg-zinc-700/50 text-zinc-400 cursor-default"
                              >
                                Joined
                              </button>
                            ) : (
                              <button
                                onClick={() => joinServer(server._id as any, currentuser?._id as any)}
                                disabled={joiningServerId === String(server._id)}
                                className="ml-2 shrink-0 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
                              >
                                {joiningServerId === String(server._id) ? "Joining..." : "Join"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>

            {selectedServer && channels.length > 0 && (
              <>
                <div className="px-4 pt-4 pb-1 text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
                  Channels · {selectedServer.name}
                </div>
                {channels.map((channel) => (
                  <div
                    key={channel._id}
                    onClick={() => {
                      setSelectedChannel(channel);
                      setSelectedUser(null);
                      setSelectedGroup(null);
                      setActiveDmChatId(null);
                    }}
                    className={`flex items-center px-4 py-2.5 cursor-pointer transition-colors ${
                      selectedChannel?._id === channel._id ? "bg-zinc-800/80" : "hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="text-zinc-500 mr-2">#</div>
                    <p className="truncate text-sm text-zinc-100">{channel.name}</p>
                  </div>
                ))}
              </>
            )}

            {groups.length > 0 && (
              <>
                <div className="px-4 pt-4 pb-1 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                  Groups
                </div>
                {groups.map((group) => {
                  const memberCount = group.participants?.length || 0;
                  const initials = (group.groupname || "G").slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={group._id}
                      onClick={() => {
                        setSelectedUser(null);
                        setSelectedGroup(group);
                        setSelectedChannel(null);
                        setActiveDmChatId(null);
                      }}
                      className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                        selectedGroup?._id === group._id
                          ? "bg-zinc-800/80"
                          : "hover:bg-zinc-900/60"
                      }`}
                    >
                      <div className="shrink-0 w-[48px] h-[48px] rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-sm font-semibold shadow-inner">
                        {initials}
                      </div>

                      <div className="ml-4 flex-1 min-w-0 border-b border-zinc-800/50 pb-3 pt-1">
                        <div className="flex justify-between items-center gap-2">
                          <h3 className="font-medium text-[16px] text-zinc-100 truncate">
                            {group.groupname || "Unnamed Group"}
                          </h3>
                        </div>
                        <p className="text-[13px] text-zinc-500 truncate mt-0.5">
                          {memberCount} members
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <div className="px-4 pt-4 pb-1 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              Chats
            </div>

            {filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  if (isGroupMode) return;
                  setSelectedGroup(null);
                  setSelectedChannel(null);
                  setSelectedUser(user);
                  setActiveDmChatId(null);
                }}
                className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                  selectedUser?._id === user._id
                    ? "bg-zinc-800/80"
                    : "hover:bg-zinc-900/60"
                }`}
              >
                {isGroupMode && (
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={(e) => handleSelect(user._id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="mr-3 h-4 w-4 accent-zinc-100 rounded border-zinc-700 bg-zinc-900"
                  />
                )}
                <div className="shrink-0 w-[48px] h-[48px] rounded-full overflow-hidden flex items-center justify-center border border-zinc-800">
                  <Avatar src={user.profilepic} name={user.name} size={48} className="w-full h-full object-cover shrink-0" />
                </div>

                <div className="ml-4 flex-1 min-w-0 border-b border-zinc-800/50 pb-3 pt-1">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-medium text-[16px] text-zinc-100 truncate">
                      {user.name}
                    </h3>
                    <span className="text-[11px] text-emerald-400 shrink-0 font-medium tracking-wide uppercase">Online</span>
                  </div>
                  <p className="text-[13px] text-zinc-500 truncate mt-0.5">Tap to chat</p>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="p-8 text-sm text-zinc-600 text-center flex flex-col items-center">
                 <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                 </svg>
                 No chats found
              </div>
            )}
          </div>
        </div>

        {/* --- Chat Window --- */}
        <div className="flex-1 flex flex-col bg-black min-w-0 border-l border-zinc-800 z-10 relative">
          {selectedUser || selectedGroup || selectedChannel ? (
            <>
              {/* Header */}
              <div className="h-16 bg-zinc-900/80 backdrop-blur-md px-6 flex items-center justify-between border-b border-zinc-800 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="flex items-center min-w-0 cursor-pointer">
                  {selectedUser ? (
                    <div className="shrink-0 w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center border border-zinc-700">
                      <Avatar src={selectedUser.profilepic} name={selectedUser.name} size={40} className="w-full h-full object-cover shrink-0" />
                    </div>
                  ) : selectedChannel ? (
                    <div className="shrink-0 w-[40px] h-[40px] rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-sm font-semibold">
                      #
                    </div>
                  ) : (
                    <div className="shrink-0 w-[40px] h-[40px] rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-sm font-semibold">
                      {(selectedGroup?.groupname || "G").slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="ml-4 min-w-0">
                    <h2 className="font-semibold text-[16px] text-zinc-100 truncate tracking-wide">
                      {selectedUser?.name || selectedChannel?.name || selectedGroup?.groupname || "Group"}
                    </h2>
                    {selectedUser && isOtherUserTyping ? (
                      <div className="flex items-center gap-1 text-[12px] text-emerald-400 font-medium mt-0.5">
                        <span>typing...</span>
                      </div>
                    ) : (
                      <p className="text-[12px] text-zinc-400 mt-0.5">
                        {selectedUser
                          ? "online"
                          : selectedChannel
                          ? `#${selectedChannel.name}`
                          : `${selectedGroup?.participants?.length || 0} members`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    suppressHydrationWarning
                    onClick={handleTogglePrPicker}
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-200 border border-zinc-700 hover:bg-zinc-800 transition-colors"
                    title="Share GitHub pull request"
                  >
                    {isPrPickerOpen ? "Close PRs" : "Share PR"}
                  </button>

                  {selectedUser && (
                    <>
                      <button
                        onClick={() => make_call(selectedUser, false)}
                        className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 p-2 rounded-full transition-colors"
                        title="Voice call"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.98.98 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66a.98.98 0 0 0 .24-1.02A11.36 11.36 0 0 1 8.64 3.99c0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"></path>
                        </svg>
                      </button>

                      <button
                        onClick={() => make_call(selectedUser, true)}
                        className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 p-2 rounded-full transition-colors"
                        title="Video call"
                      >
                        <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"></path>
                        </svg>
                      </button>
                    </>
                  )}

                  <div className="text-zinc-400 text-xl cursor-pointer hover:bg-zinc-800 hover:text-zinc-100 px-3 py-1 rounded-full transition-colors">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {isPrPickerOpen && (
                <div className="absolute right-6 top-20 z-30 w-[380px] max-h-[420px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                    <h3 className="text-sm font-semibold text-zinc-100">Share a Pull Request</h3>
                    <button
                      onClick={loadPrsForSharing}
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto p-2">
                    {isPrsLoading && (
                      <p className="px-2 py-4 text-sm text-zinc-400">Loading PRs...</p>
                    )}

                    {!isPrsLoading && prsError && (
                      <p className="px-2 py-4 text-sm text-red-400">{prsError}</p>
                    )}

                    {!isPrsLoading && !prsError && shareablePrs.length === 0 && (
                      <p className="px-2 py-4 text-sm text-zinc-500">No pull requests found.</p>
                    )}

                    {!isPrsLoading &&
                      !prsError &&
                      shareablePrs.map((pr) => (
                        <button
                          key={pr.id}
                          onClick={() => sharePrInChat(pr)}
                          disabled={isSendingPrId === pr.id}
                          className="mb-1 w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-left transition hover:bg-zinc-800/80 disabled:opacity-60"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Image
                              src={pr.user.avatar_url}
                              alt={pr.user.login}
                              width={22}
                              height={22}
                              className="rounded-full"
                            />
                            <span className="text-xs text-zinc-400">{pr.user.login}</span>
                          </div>
                          <p className="line-clamp-2 text-sm font-medium text-zinc-100">{pr.title}</p>
                          <p className="mt-2 text-xs text-blue-400">
                            {isSendingPrId === pr.id ? "Sharing..." : "Send this PR"}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Chat Area */}
              <div className="flex-1 px-[8%] py-6 overflow-y-auto bg-transparent relative z-10 scrollbar-thin scrollbar-thumb-zinc-800">
                <div className="space-y-3">
                  {messages.map((msg, i) => {
                    const isMe = msg.from === String(currentuser?._id);
                    return (
                      <div
                        key={i}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`px-4 py-2.5 rounded-2xl max-w-[65%] text-[14.5px] leading-relaxed shadow-md ${
                            isMe
                              ? "bg-zinc-100 text-black rounded-tr-sm"
                              : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">
                            {renderMessageContent(msg.message)}
                          </div>
                          <span className={`float-right text-[10px] ml-4 mt-2 ${isMe ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            12:00
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="min-h-[72px] bg-zinc-900/90 backdrop-blur-md px-6 py-3 flex items-center gap-3 z-20 border-t border-zinc-800">
                {showEmoji && (
                  <div className="absolute bottom-20 left-6 z-30 shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        if (inputmsgref.current) {
                          inputmsgref.current.value += emojiData.emoji;
                          handleTypingChange(inputmsgref.current.value);
                        }
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded-full p-2.5 transition-colors"
                  aria-label="Toggle emoji picker"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </button>

                <button className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded-full p-2.5 transition-colors">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                </button>

                <input
                  ref={inputmsgref}
                  placeholder="Message..."
                  className="flex-1 bg-zinc-950 px-5 py-3 text-zinc-100 rounded-full outline-none text-[15px] shadow-inner border border-zinc-800 focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                  onChange={(e) => handleTypingChange(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && sendmsg(inputmsgref.current?.value)
                  }
                />

                <button
                  className="text-zinc-900 bg-zinc-100 hover:bg-zinc-300 rounded-full p-3 transition-colors ml-1"
                  onClick={() => sendmsg(inputmsgref.current?.value)}
                >
                  <svg viewBox="0 0 24 24" height="20" width="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <line x1="22" y1="2" x2="11" y2="13"></line>
                     <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>

              {(incomingCall || isCalling || callAccepted) && (
                <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
                  <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                      <h3 className="text-zinc-100 font-semibold">
                        {incomingCall
                          ? `${incomingCall.name || incomingCall.from} is calling...`
                          : callAccepted
                          ? `In ${isVideoCall ? "video" : "voice"} call`
                          : `Calling ${selectedUser?.name || "user"}...`}
                      </h3>
                      <span className="text-xs text-zinc-400">
                        {isVideoCall ? "Video" : "Audio"}
                      </span>
                    </div>

                    <div className="relative bg-zinc-900 min-h-[380px] flex items-center justify-center">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-[420px] object-cover ${isVideoCall ? "block" : "hidden"}`}
                      />

                      {!isVideoCall && (
                        <div className="text-zinc-300 text-sm">Voice call in progress...</div>
                      )}

                      <video
                        ref={localVideoRef}
                        muted
                        autoPlay
                        playsInline
                        className={`absolute bottom-4 right-4 w-36 h-24 rounded-lg border border-zinc-700 bg-black object-cover ${
                          isVideoCall ? "block" : "hidden"
                        }`}
                      />
                    </div>

                    <div className="px-5 py-4 border-t border-zinc-800 flex items-center justify-center gap-3">
                      {incomingCall && !callAccepted ? (
                        <>
                          <button
                            onClick={answerCall}
                            className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                          >
                            Accept
                          </button>
                          <button
                            onClick={endCall}
                            className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={endCall}
                          className="px-5 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                        >
                          End Call
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm bg-black relative z-10">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-black shadow-2xl border border-zinc-700/50 mb-6">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h2 className="text-[32px] font-bold text-zinc-200 tracking-tight mb-2">Chat</h2>
              <p className="text-[15px] text-zinc-500 max-w-sm text-center">
                Select a conversation from the sidebar or start a new one.
              </p>
              <div className="mt-12 flex items-center gap-2 text-[12px] font-medium text-zinc-600 uppercase tracking-widest bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
                 <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 3.9a3 3 0 110 6 3 3 0 010-6zM12 17c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"></path></svg>
                 End-to-end encrypted
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
