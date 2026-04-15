"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { signOut, useSession } from "next-auth/react";
import EmojiPicker from "emoji-picker-react";
import Peer from "simple-peer";
import FileMessageUploader from "@/components/FileMessageUploader";
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

type FriendRequestItem = {
  _id: string;
  requester?: User;
  recipient?: User;
  status: "pending" | "accepted" | "rejected";
  createdAt?: string;
};

type DiscoverUser = User & {
  relationStatus: "none" | "friends" | "request_sent" | "request_received";
};

type Message = {
  _id: string;
  message: string;
  from: string;
  senderId?: string;
  chatId?: string | null;
  channelId?: string | null;
  createdAt?: string;
  isDeleted?: boolean;
  contentType?: "text" | "file" | "image" | "video";
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  replyTo?: {
    _id?: string;
    text?: string;
    senderId?: string;
    isDeleted?: boolean;
  } | null;
};

type DbMessage = {
  _id?: string;
  senderId: string;
  chatId?: string;
  channelId?: string;
  createdAt?: string;
  isDeleted?: boolean;
  replyTo?: {
    _id?: string;
    senderId?: string;
    isDeleted?: boolean;
    content?: {
      text?: string;
    };
  };
  content?: {
    type?: "text" | "file" | "image" | "video";
    text?: string;
    url?: string;
    fileName?: string;
    mimeType?: string;
  };
};

type ReplyPreview = {
  _id: string;
  senderId?: string;
  text?: string;
  isDeleted?: boolean;
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
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
  const inputmsgref = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<PeerLike | null>(null);
  const usersRef = useRef<User[]>([]);

  const [showEmoji, setShowEmoji] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<FriendRequestItem[]>([]);
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSendingRequestTo, setIsSendingRequestTo] = useState<string | null>(null);
  const [isAcceptingRequestId, setIsAcceptingRequestId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentuser, setcurrentuser] = useState<CurrentUser | null>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyingTo, setReplyingTo] = useState<ReplyPreview | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

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
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const formatMessageTime = (createdAt?: string) => {
    if (!createdAt) return "";
    return new Date(createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const mapDbMessageToUi = (msg: DbMessage): Message => ({
    _id: String(msg._id || crypto.randomUUID()),
    message: msg.content?.text || "",
    from: String(msg.senderId),
    senderId: String(msg.senderId),
    chatId: msg.chatId ? String(msg.chatId) : null,
    channelId: msg.channelId ? String(msg.channelId) : null,
    createdAt: msg.createdAt,
    isDeleted: Boolean(msg.isDeleted),
    contentType: msg.content?.type || "text",
    fileUrl: msg.content?.url || "",
    fileName: msg.content?.fileName || "",
    mimeType: msg.content?.mimeType || "",
    replyTo: msg.replyTo
      ? {
          _id: String(msg.replyTo._id || ""),
          senderId: msg.replyTo.senderId ? String(msg.replyTo.senderId) : undefined,
          isDeleted: Boolean(msg.replyTo.isDeleted),
          text: msg.replyTo.content?.text || "",
        }
      : null,
  });

  const attachStreamToVideo = async (
    element: HTMLVideoElement | null,
    stream: MediaStream,
    muted = false
  ) => {
    if (!element) return;
    element.srcObject = stream;
    element.muted = muted;

    try {
      await element.play();
    } catch (err) {
      console.warn("[CALL] Video play() blocked or delayed:", err);
    }
  };


  
  const cleanupCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setIsCalling(false);
    setCallAccepted(false);
    setIncomingCall(null);
    setCallPeerEmail(null);
  };

  const make_call = async (targetUser: User, withVideo: boolean) => {
    try {
      if (!socketRef.current || !socketRef.current.connected) {
        console.error("[CALL] Socket is not connected; cannot initiate call");
        socketRef.current?.connect();
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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: true,
      });

      if (withVideo && stream.getVideoTracks().length === 0) {
        console.error("[CALL] Video call requested but no video track was captured");
        alert("Camera stream not available. Please check camera permission and try again.");
        return;
      }

      localStreamRef.current = stream;
      void attachStreamToVideo(localVideoRef.current, stream, true);

      setIsVideoCall(withVideo);
      setIsCalling(true);
      setCallAccepted(false);
      setCallPeerEmail(targetUser.email);

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });
      peerRef.current = peer;

      peer.on("signal", (data: unknown) => {
        socketRef.current?.emit("call-user", {
          signalData: data,
          to: targetUser.email,
          from: session?.user?.email,
          name: session?.user?.name,
          isVideo: withVideo,
        });
      });

      peer.on("stream", (remoteStream: MediaStream) => {
        void attachStreamToVideo(remoteVideoRef.current, remoteStream, false);
      });

      peer.on("close", () => {
        cleanupCall();
      });

      peer.on("error", (err: unknown) => {
        console.error("[CALL:ERROR] Peer error:", err);
        cleanupCall();
      });
    } catch (error) {
      console.error("[CALL:ERROR] Failed to start call:", error);
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!incomingCall) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.isVideo,
        audio: true,
      });

      if (incomingCall.isVideo && stream.getVideoTracks().length === 0) {
        console.error("[ANSWER] Video call requested but no video track was captured");
        alert("Camera stream not available. Please check camera permission and try again.");
        return;
      }

      localStreamRef.current = stream;
      void attachStreamToVideo(localVideoRef.current, stream, true);

      setIsVideoCall(incomingCall.isVideo);
      setCallAccepted(true);
      setCallPeerEmail(incomingCall.from);

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
      });
      peerRef.current = peer;

      peer.on("signal", (data: unknown) => {
        socketRef.current?.emit("answer-call", {
          to: incomingCall.from,
          signal: data,
        });
      });

      peer.on("stream", (remoteStream: MediaStream) => {
        void attachStreamToVideo(remoteVideoRef.current, remoteStream, false);
      });

      peer.on("close", () => {
        cleanupCall();
      });

      peer.on("error", (err: unknown) => {
        console.error("[ANSWER:ERROR] Peer error:", err);
        cleanupCall();
      });

      peer.signal(incomingCall.signal);
      setIncomingCall(null);
    } catch (error) {
      console.error("[ANSWER:ERROR] Failed to answer call:", error);
      cleanupCall();
    }
  };

  const endCall = () => {
    const target = callPeerEmail || incomingCall?.from;
    
    if (target) {
      socketRef.current?.emit("end-call", { to: target });
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
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleConnectError = (err: unknown) => {
      setIsSocketConnected(false);
      console.error("[SOCKET] connect_error:", err);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
      setIsSocketConnected(false);
    };
  }, [SOCKET_URL]);

  useEffect(() => {
    if (!socketRef.current || !session?.user?.email || !isSocketConnected) return;
    socketRef.current.emit("join", session.user.email);
  }, [session?.user?.email, isSocketConnected]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    if (!socketRef.current) return;

    const handleIncomingCall = (payload: IncomingCall) => {
      const caller = usersRef.current.find((u) => u.email === payload.from);
      if (caller) {
        setSelectedGroup(null);
        setSelectedUser(caller);
      }
      
      setIncomingCall(payload);
      setIsVideoCall(Boolean(payload.isVideo));
      setIsCalling(false);
    };

    const handleCallAccepted = ({ signal }: { signal: unknown }) => {
      if (!peerRef.current) {
        console.error("[SOCKET:CALL-ACCEPTED] ERROR: peerRef is null, cannot process acceptance signal");
        return;
      }
      setCallAccepted(true);
      setIsCalling(false);
      peerRef.current.signal(signal);
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    socketRef.current.on("incoming-call", handleIncomingCall);
    socketRef.current.on("call-accepted", handleCallAccepted);
    socketRef.current.on("call-ended", handleCallEnded);

    return () => {
      socketRef.current?.off("incoming-call", handleIncomingCall);
      socketRef.current?.off("call-accepted", handleCallAccepted);
      socketRef.current?.off("call-ended", handleCallEnded);
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
      if (!data?._id) return;

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
        selectedUser &&
        !(
          (data.senderId && String(data.senderId) === String(selectedUser._id)) ||
          (data.from && data.from.toLowerCase() === selectedUser.email.toLowerCase())
        )
      ) {
        return;
      }

      const sender = users.find((u) => u.email === data.from);
      const senderId = data.senderId || (sender ? String(sender._id) : data.from);

      setMessages((prev) => {
        if (prev.some((item) => item._id === String(data._id))) {
          return prev;
        }

        return [
          ...prev,
          {
            _id: String(data._id),
            message: data.message,
            from: senderId,
            senderId,
            chatId: incomingChatId,
            channelId: incomingChannelId,
            createdAt: data.createdAt,
            isDeleted: Boolean(data.isDeleted),
            contentType: data.contentType || "text",
            fileUrl: data.fileUrl || "",
            fileName: data.fileName || "",
            mimeType: data.mimeType || "",
            replyTo: data.replyTo
              ? {
                  _id: data.replyTo._id,
                  text: data.replyTo.text,
                  senderId: data.replyTo.senderId,
                  isDeleted: data.replyTo.isDeleted,
                }
              : null,
          },
        ];
      });
    };

    const handleReceiveDeletedMessage = ({ messageId }: { messageId: string }) => {
      if (!messageId) return;

      setMessages((prev) =>
        prev.map((item) =>
          item._id === String(messageId)
            ? { ...item, isDeleted: true, message: "This message was deleted" }
            : item
        )
      );
    };

    socketRef.current.on("receive_message", handleReceive);
    socketRef.current.on("receive_message_deleted", handleReceiveDeletedMessage);

    return () => {
      socketRef.current?.off("receive_message", handleReceive);
      socketRef.current?.off("receive_message_deleted", handleReceiveDeletedMessage);
    };
  }, [selectedUser, selectedGroup, selectedChannel, activeDmChatId, users]);

  useEffect(() => {
    setMessages([]);
    setReplyingTo(null);
    setIsPrPickerOpen(false);
    setPrsError("");
  }, [selectedUser, selectedGroup, selectedChannel]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/friends", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const res = await fetch("/api/friends/requests", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setFriendRequests(Array.isArray(data?.incoming) ? data.incoming : []);
      setSentFriendRequests(Array.isArray(data?.sent) ? data.sent : []);
    } catch (error) {
      console.error("Failed to load friend requests:", error);
    }
  };

  const fetchDiscoverUsers = async (query: string) => {
    try {
      setIsSearchingUsers(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const url = `/api/users/search${params.toString() ? `?${params.toString()}` : ""}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setDiscoverUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const sendFriendRequest = async (recipientId: string) => {
    try {
      setIsSendingRequestTo(recipientId);
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send friend request");
      }

      setNotification({ type: "success", message: "Friend request sent ✅" });
      await Promise.all([fetchFriendRequests(), fetchDiscoverUsers(discoverQuery)]);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to send friend request";
      setNotification({ type: "error", message: errorMsg });
      setTimeout(() => setNotification(null), 3500);
    } finally {
      setIsSendingRequestTo(null);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      setIsAcceptingRequestId(requestId);
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to accept friend request");
      }

      setNotification({ type: "success", message: "Friend request accepted 🎉" });
      await Promise.all([fetchUsers(), fetchFriendRequests(), fetchDiscoverUsers(discoverQuery)]);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to accept friend request";
      setNotification({ type: "error", message: errorMsg });
      setTimeout(() => setNotification(null), 3500);
    } finally {
      setIsAcceptingRequestId(null);
    }
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

  const joinServer = async (serverId: string, userId: string) => {
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
    fetchFriendRequests();
    fetchDiscoverUsers("");
    fetchGroups();
    getcurrentuserinfo();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscoverUsers(discoverQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [discoverQuery]);

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
        const payload: unknown = await res.json();

        const messagesData: DbMessage[] = Array.isArray(payload)
          ? (payload as DbMessage[])
          : Array.isArray((payload as { messages?: DbMessage[] })?.messages)
          ? ((payload as { messages?: DbMessage[] }).messages as DbMessage[])
          : [];

        const mapped: Message[] = messagesData.map((msg: DbMessage) => mapDbMessageToUi(msg));

        setMessages(mapped);

        if (selectedUser && mapped.length > 0) {
          const foundChatId = mapped.find((item) => item.chatId)?.chatId;
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

  const sendMessage = async ({
    text,
    fileUrl,
    fileName,
    mimeType,
  }: {
    text?: string;
    fileUrl?: string;
    fileName?: string;
    mimeType?: string;
  }) => {
    const fromUser = session?.user?.email;
    const trimmedText = text?.trim();

    if (!fromUser || !currentuser?._id) return;
    if (!selectedUser && !selectedGroup && !selectedChannel) return;
    if (!trimmedText && !fileUrl) return;

    const optimisticChatId = selectedGroup?._id || activeDmChatId || null;
    const optimisticChannelId = selectedChannel?._id || null;
    const tempId = `tmp-${crypto.randomUUID()}`;

    const optimisticMessage: Message = {
      _id: tempId,
      message: trimmedText || fileName || "File",
      from: String(currentuser?._id),
      senderId: String(currentuser?._id),
      chatId: optimisticChatId,
      channelId: optimisticChannelId,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      contentType: fileUrl ? "file" : "text",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      mimeType: mimeType || "",
      replyTo: replyingTo
        ? {
            _id: replyingTo._id,
            senderId: replyingTo.senderId,
            text: replyingTo.text,
            isDeleted: replyingTo.isDeleted,
          }
        : null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const payload = selectedChannel?._id
        ? {
            senderEmail: fromUser,
            channelId: selectedChannel._id,
            text: trimmedText,
            fileUrl,
            fileName,
            mimeType,
            replyTo: replyingTo?._id,
          }
        : selectedGroup?._id
        ? {
            senderEmail: fromUser,
            chatId: selectedGroup._id,
            text: trimmedText,
            fileUrl,
            fileName,
            mimeType,
            replyTo: replyingTo?._id,
          }
        : {
            senderEmail: fromUser,
            receiverEmail: selectedUser?.email,
            text: trimmedText,
            fileUrl,
            fileName,
            mimeType,
            replyTo: replyingTo?._id,
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

      const saved = responseData?.message as DbMessage | undefined;
      if (!saved?._id) {
        throw new Error("Message saved but no id returned");
      }

      const normalizedSaved = mapDbMessageToUi(saved);

      setMessages((prev) => prev.map((item) => (item._id === tempId ? normalizedSaved : item)));

      const resolvedChatId =
        selectedGroup?._id || responseData?.chatId || optimisticChatId || null;

      if (selectedUser && responseData?.chatId) {
        setActiveDmChatId(String(responseData.chatId));
      }

      if (!selectedGroup && !selectedChannel && resolvedChatId && resolvedChatId !== optimisticChatId) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === normalizedSaved._id || (m.from === String(currentuser?._id) && m.chatId === optimisticChatId)
              ? { ...m, chatId: resolvedChatId }
              : m
          )
        );
      }

      socketRef.current?.emit("send_message", {
        _id: normalizedSaved._id,
        to: selectedUser?.email,
        message: normalizedSaved.message,
        from: fromUser,
        senderId: String(currentuser?._id),
        chatId: normalizedSaved.chatId,
        channelId: normalizedSaved.channelId,
        createdAt: normalizedSaved.createdAt,
        isDeleted: normalizedSaved.isDeleted,
        contentType: normalizedSaved.contentType,
        fileUrl: normalizedSaved.fileUrl,
        fileName: normalizedSaved.fileName,
        mimeType: normalizedSaved.mimeType,
        replyTo: normalizedSaved.replyTo,
      });

      setReplyingTo(null);
      if (inputmsgref.current) inputmsgref.current.value = "";
    } catch (err) {
      console.error("Send error:", err);
      setMessages((prev) => prev.filter((item) => item._id !== tempId));
      alert(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const sendmsg = async (msgg: string | undefined) => {
    await sendMessage({ text: msgg });
  };

  const sendFileMessage = async (file: {
    fileUrl: string;
    fileName: string;
    mimeType?: string;
  }) => {
    await sendMessage({
      text: file.fileName,
      fileUrl: file.fileUrl,
      fileName: file.fileName,
      mimeType: file.mimeType,
    });
  };

  const startReplyToMessage = (msg: Message) => {
    setReplyingTo({
      _id: msg._id,
      senderId: msg.senderId,
      text: msg.message,
      isDeleted: msg.isDeleted,
    });
    inputmsgref.current?.focus();
  };

  const handleDeleteMessage = async (msg: Message) => {
    const senderEmail = session?.user?.email;
    if (!senderEmail || !msg?._id || msg.isDeleted) return;

    try {
      setDeletingMessageId(msg._id);

      const res = await fetch(`/api/messages/${msg._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ senderEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete message");
      }

      setMessages((prev) =>
        prev.map((item) =>
          item._id === msg._id
            ? { ...item, isDeleted: true, message: "This message was deleted" }
            : item
        )
      );

      if (replyingTo?._id === msg._id) {
        setReplyingTo(null);
      }

      socketRef.current?.emit("delete_message", {
        to: selectedUser?.email,
        messageId: msg._id,
        chatId: msg.chatId,
        channelId: msg.channelId,
      });
    } catch (error) {
      console.error("Delete message error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete message");
    } finally {
      setDeletingMessageId(null);
    }
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

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({ callbackUrl: "/signin" });
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

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
      <div className="h-full w-full max-w-400 bg-zinc-950 shadow-2xl overflow-hidden flex  border-zinc-800/60 relative">
        
        {/* Optional subtle grid background for the whole app (like the landing page) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-size-[14px_24px] pointer-events-none z-0"></div>

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
        <div className="w-[36%] min-w-115 max-w-155 border-r border-zinc-800 flex bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="w-20 shrink-0 border-r border-zinc-800 bg-zinc-950/95 px-2 py-3 flex flex-col items-center gap-5">
            <Link
              href="/dashboard"
              className="grid h-12 w-12 place-items-center rounded-[20px] bg-[linear-gradient(180deg,rgba(88,101,242,0.95),rgba(59,130,246,0.75))] shadow-lg transition hover:scale-105"
              title="Home"
            >
              <span className="text-xl">💬</span>
            </Link>

            {currentuser?._id ? (
              <Link
                href={`/dashboard/achievements/${currentuser._id}`}
                className="grid h-12 w-12 place-items-center rounded-[20px] border border-white/10 bg-black/30 overflow-hidden hover:border-zinc-400 transition"
                title="Open your achievements"
              >
                <Avatar
                  src={currentUserImage}
                  name={session?.user?.name || "You"}
                  size={48}
                  className="w-full h-full object-cover shrink-0"
                />
              </Link>
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-[20px] border border-white/10 bg-black/30 overflow-hidden">
                <Avatar
                  src={currentUserImage}
                  name={session?.user?.name || "You"}
                  size={48}
                  className="w-full h-full object-cover shrink-0"
                />
              </div>
            )}

            <div className="mt-1 h-px w-8 bg-zinc-800" />

            <Link href="/dashboard/status" className="grid h-11 w-11 place-items-center rounded-[18px] bg-white/5 text-lg hover:bg-white/10 transition" title="Status"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M2.44922 14.9702C3.51922 18.4102 6.39923 21.0602 9.97923 21.7902" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M2.05078 10.98C2.56078 5.93 6.82078 2 12.0008 2C17.1808 2 21.4408 5.94 21.9508 10.98" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M14.0098 21.8C17.5798 21.07 20.4498 18.45 21.5398 15.02" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg></Link>
          
            <Link href="/dashboard/devtools" className="grid h-11 w-11 place-items-center rounded-[18px] bg-white/5 text-lg hover:bg-white/10 transition" title="Dev tools">🛠️</Link>

            <button onClick={() => { fetchUsers(); fetchFriendRequests(); fetchDiscoverUsers(discoverQuery); fetchGroups(); fetchServers(); if (selectedServer?._id) fetchChannels(selectedServer._id); }} className="grid h-11 w-11 place-items-center rounded-[18px] bg-white/5 text-lg hover:bg-white/10 transition" title="Refresh"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M19.9381 13C19.979 12.6724 20 12.3387 20 12C20 7.58172 16.4183 4 12 4C9.49942 4 7.26681 5.14727 5.7998 6.94416M4.06189 11C4.02104 11.3276 4 11.6613 4 12C4 16.4183 7.58172 20 12 20C14.3894 20 16.5341 18.9525 18 17.2916M15 17H18V17.2916M5.7998 4V6.94416M5.7998 6.94416V6.99993L8.7998 7M18 20V17.2916" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg></button>
            <button onClick={() => { setShowServerForm((prev) => !prev); setShowChannelForm(false); }} className="grid h-11 w-11 place-items-center rounded-[18px] bg-white/5 text-lg hover:bg-white/10 transition" title={showServerForm ? "Cancel server" : "Create server"}><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M14 21H5C4.06812 21 3.60218 21 3.23463 20.8478C2.74458 20.6448 2.35523 20.2554 2.15224 19.7654C2 19.3978 2 18.9319 2 18C2 17.0681 2 16.6022 2.15224 16.2346C2.35523 15.7446 2.74458 15.3552 3.23463 15.1522C3.60218 15 4.06812 15 5 15H19C19.9319 15 20.3978 15 20.7654 15.1522C21.2554 15.3552 21.6448 15.7446 21.8478 16.2346C22 16.6022 22 17.0681 22 18C22 18.9319 22 19.3978 21.8478 19.7654C21.6448 20.2554 21.2554 20.6448 20.7654 20.8478C20.3978 21 19.9319 21 19 21H18" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round"></path> <path d="M2 12C2 11.0681 2 10.6022 2.15224 10.2346C2.35523 9.74458 2.74458 9.35523 3.23463 9.15224C3.60218 9 4.06812 9 5 9H19C19.9319 9 20.3978 9 20.7654 9.15224C21.2554 9.35523 21.6448 9.74458 21.8478 10.2346C22 10.6022 22 11.0681 22 12C22 12.9319 22 13.3978 21.8478 13.7654C21.6448 14.2554 21.2554 14.6448 20.7654 14.8478C20.3978 15 19.9319 15 19 15H5C4.06812 15 3.60218 15 3.23463 14.8478C2.74458 14.6448 2.35523 14.2554 2.15224 13.7654C2 13.3978 2 12.9319 2 12Z" stroke="#ffffff" strokeWidth="1.5"></path> <path d="M10 3H19C19.9319 3 20.3978 3 20.7654 3.15224C21.2554 3.35523 21.6448 3.74458 21.8478 4.23463C22 4.60218 22 5.06812 22 6C22 6.93188 22 7.39782 21.8478 7.76537C21.6448 8.25542 21.2554 8.64477 20.7654 8.84776C20.3978 9 19.9319 9 19 9H5C4.06812 9 3.60218 9 3.23463 8.84776C2.74458 8.64477 2.35523 8.25542 2.15224 7.76537C2 7.39782 2 6.93188 2 6C2 5.06812 2 4.60218 2.15224 4.23463C2.35523 3.74458 2.74458 3.35523 3.23463 3.15224C3.60218 3 4.06812 3 5 3H6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round"></path> <circle cx="5" cy="12" r="1" fill="#ffffff"></circle> <circle cx="5" cy="6" r="1" fill="#ffffff"></circle> <circle cx="5" cy="18" r="1" fill="#ffffff"></circle> </g></svg></button>
            <button disabled={!selectedServer} onClick={() => { setShowChannelForm((prev) => !prev); setShowServerForm(false); }} className="grid h-11 w-11 place-items-center rounded-[18px] bg-white/5 text-lg hover:bg-white/10 transition disabled:opacity-35" title={showChannelForm ? "Cancel channel" : "Create channel"}>#</button>
            <button onClick={toggleGroupMode} className={`grid h-11 w-11 place-items-center rounded-[18px] text-lg transition ${isGroupMode ? "bg-zinc-100 text-black" : "bg-white/5 hover:bg-white/10"}`} title={isGroupMode ? "Cancel group" : "Make group"}><svg viewBox="0 0 1024 1024" className="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M388.9 597.4c-135.2 0-245.3-110-245.3-245.3s110-245.3 245.3-245.3 245.3 110 245.3 245.3-110.1 245.3-245.3 245.3z m0-405.3c-88.2 0-160 71.8-160 160s71.8 160 160 160 160-71.8 160-160-71.8-160-160-160z" fill="#3688FF"></path><path d="M591.3 981.3H186.5c-76.6 0-138.8-62.3-138.8-138.8V749c0-130.6 106.2-236.9 236.9-236.9h208.8c130.6 0 236.9 106.3 236.9 236.9v93.5c-0.2 76.5-62.4 138.8-139 138.8zM284.5 597.4c-83.6 0-151.5 68-151.5 151.5v93.5c0 29.5 24 53.5 53.5 53.5h404.8c29.5 0 53.5-24 53.5-53.5v-93.5c0-83.6-68-151.5-151.6-151.5H284.5z" fill="#3688FF"></path><path d="M847.2 938.6c-23.6 0-42.7-19.1-42.7-42.7s19.1-42.7 42.7-42.7c29.5 0 53.5-24 53.5-53.5v-93.5c0-83.6-68-151.5-151.6-151.5h-14.3c-19.8 0-37-13.6-41.5-32.9-4.5-19.3 4.8-39.1 22.5-48 54.8-27.3 88.9-82.1 88.9-143.1 0-88.2-71.8-160-160-160-23.6 0-42.7-19.1-42.7-42.7s19.1-42.7 42.7-42.7c135.2 0 245.3 110 245.3 245.3 0 57.8-19.9 111.9-54.9 154.8 88.3 34.6 151 120.6 151 220.9v93.5c0 76.6-62.3 138.8-138.9 138.8z" fill="#5F6379"></path></g></svg></button>

            <div className="mt-auto flex flex-col items-center gap-2 pb-1">
              <button className="grid h-11 w-11 place-items-center rounded-[18px] bg-rose-500/10 text-lg hover:bg-rose-500/20 transition" onClick={handleSignOut} title="Sign out">⎋</button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="h-16 bg-zinc-900/80 px-4 flex items-center justify-between border-b border-zinc-800">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Workspace</p>
                <h2 className="text-sm font-semibold text-zinc-100">Direct Messages</h2>
              </div>
              <div className="text-[11px] text-zinc-500">All your people, organized</div>
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
                placeholder="Search friends"
                className="bg-transparent outline-none text-sm w-full text-zinc-100 placeholder:text-zinc-500"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-transparent overflow-x-auto  scrollbar-thumb-[#888] scrollbar-track-[#222] hover:scrollbar-thumb-[#555] scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <div className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
                Friend Requests
              </div>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                {friendRequests.length}
              </span>
            </div>

            {friendRequests.length === 0 ? (
              <p className="px-4 pb-3 text-xs text-zinc-500">No pending requests.</p>
            ) : (
              friendRequests.map((request) => (
                <div
                  key={request._id}
                  className="mx-3 mb-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <Avatar
                        src={request.requester?.profilepic}
                        name={request.requester?.name || "User"}
                        size={30}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-zinc-100">
                          {request.requester?.name || request.requester?.email || "Unknown User"}
                        </p>
                        <p className="truncate text-[11px] text-zinc-500">sent you a friend request</p>
                      </div>
                    </div>

                    <button
                      onClick={() => acceptFriendRequest(request._id)}
                      disabled={isAcceptingRequestId === request._id}
                      className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-60"
                    >
                      {isAcceptingRequestId === request._id ? "Accepting..." : "Accept"}
                    </button>
                  </div>
                </div>
              ))
            )}

            {sentFriendRequests.length > 0 && (
              <div className="px-4 pb-3 text-[11px] text-zinc-500">
                Sent requests pending: {sentFriendRequests.length}
              </div>
            )}

            <div className="px-4 pt-1 pb-2 text-[11px] font-bold tracking-widest text-blue-400 uppercase">
              Discover Users
            </div>
            <div className="px-3 pb-3">
              <div className="mb-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <input
                  type="text"
                  placeholder="Search users to add"
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                />
              </div>

              {isSearchingUsers ? (
                <p className="px-1 text-xs text-zinc-500">Searching users...</p>
              ) : discoverUsers.length === 0 ? (
                <p className="px-1 text-xs text-zinc-500">No users found.</p>
              ) : (
                <div className="space-y-1">
                  {discoverUsers.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-2"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <Avatar src={item.profilepic} name={item.name} size={28} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-zinc-100">{item.name}</p>
                          <p className="truncate text-[10px] text-zinc-500">{item.email}</p>
                        </div>
                      </div>

                      {item.relationStatus === "friends" ? (
                        <span className="rounded-md bg-zinc-700/60 px-2 py-1 text-[10px] text-zinc-300">Friend</span>
                      ) : item.relationStatus === "request_sent" ? (
                        <span className="rounded-md bg-amber-500/20 px-2 py-1 text-[10px] text-amber-300">Requested</span>
                      ) : item.relationStatus === "request_received" ? (
                        <button
                          onClick={() => {
                            const req = friendRequests.find(
                              (r) => String(r.requester?._id) === String(item._id)
                            );
                            if (req) {
                              acceptFriendRequest(req._id);
                            }
                          }}
                          className="rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/30"
                        >
                          Accept
                        </button>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(item._id)}
                          disabled={isSendingRequestTo === item._id}
                          className="rounded-md border border-blue-500/40 bg-blue-500/20 px-2 py-1 text-[10px] font-semibold text-blue-300 hover:bg-blue-500/30 disabled:opacity-60"
                        >
                          {isSendingRequestTo === item._id ? "Sending..." : "Add"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                                onClick={() => joinServer(String(server._id), String(currentuser?._id))}
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
                <div className="px-4 pt-4 pb-1 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
                    Server Tasks · {selectedServer.name}
                  </div>
                  <Link
                    href={`/dashboard/tasks?serverId=${selectedServer._id}`}
                    className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                  >
                    Open board
                  </Link>
                </div>
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
                      <div className="shrink-0 w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-sm font-semibold shadow-inner">
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
              Friends
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
                <Link
                  href={`/dashboard/achievements/${user._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-zinc-800 hover:border-zinc-500 transition-colors"
                  title={`Open ${user.name}'s achievements`}
                >
                  <Avatar src={user.profilepic} name={user.name} size={48} className="w-full h-full object-cover shrink-0" />
                </Link>

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
                No friends found
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/70 flex items-center justify-start">
            <button
              suppressHydrationWarning
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="hover:bg-rose-500/20 hover:text-rose-300 disabled:opacity-60 px-3 py-1.5 rounded-full text-sm transition-colors"
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
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
                    <Link
                      href={`/dashboard/achievements/${selectedUser._id}`}
                      className="shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-zinc-700 hover:border-zinc-500 transition-colors"
                      title={`Open ${selectedUser.name}'s achievements`}
                    >
                      <Avatar src={selectedUser.profilepic} name={selectedUser.name} size={40} className="w-full h-full object-cover shrink-0" />
                    </Link>
                  ) : selectedChannel ? (
                    <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-sm font-semibold">
                      #
                    </div>
                  ) : (
                    <div className="shrink-0 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-sm font-semibold">
                      {(selectedGroup?.groupname || "G").slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="ml-4 min-w-0">
                    <h2 className="font-semibold text-[16px] text-zinc-100 truncate tracking-wide">
                      {selectedUser?.name || selectedChannel?.name || selectedGroup?.groupname || "Group"}
                    </h2>
                    <p className="text-[12px] text-zinc-400 mt-0.5">
                      {selectedUser
                        ? "online"
                        : selectedChannel
                        ? `#${selectedChannel.name}`
                        : `${selectedGroup?.participants?.length || 0} members`}
                    </p>
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
                        disabled={!isSocketConnected}
                        className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 p-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Voice call"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.98.98 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66a.98.98 0 0 0 .24-1.02A11.36 11.36 0 0 1 8.64 3.99c0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"></path>
                        </svg>
                      </button>

                      <button
                        onClick={() => make_call(selectedUser, true)}
                        disabled={!isSocketConnected}
                        className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 p-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                <div className="absolute right-6 top-20 z-30 w-95 max-h-105 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                    <h3 className="text-sm font-semibold text-zinc-100">Share a Pull Request</h3>
                    <button
                      onClick={loadPrsForSharing}
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="max-h-90 overflow-y-auto p-2">
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
              <div className="flex-1 px-[8%] py-6 overflow-y-auto bg-transparent relative z-10 overflow-x-auto  scrollbar-thumb-[#888] scrollbar-track-[#222] hover:scrollbar-thumb-[#555] scrollbar-thumb-zinc-800">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.from === String(currentuser?._id);
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className="max-w-[65%]">
                          {msg.replyTo && (
                            <div className="mb-1 rounded-xl border border-zinc-800/80 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
                              <p className="mb-0.5 text-[11px] uppercase tracking-wider text-zinc-500">
                                Replying to {msg.replyTo.senderId === String(currentuser?._id) ? "you" : "message"}
                              </p>
                              <p className="truncate text-zinc-400">
                                {msg.replyTo.isDeleted ? "This message was deleted" : msg.replyTo.text || "Original message"}
                              </p>
                            </div>
                          )}

                          <div
                            className={`px-4 py-2.5 rounded-2xl text-[14.5px] leading-relaxed shadow-md ${
                              isMe
                                ? "bg-zinc-100 text-black rounded-tr-sm"
                                : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm"
                            }`}
                          >
                            <div className={`whitespace-pre-wrap wrap-break-word ${msg.isDeleted ? "italic opacity-75" : ""}`}>
                              {msg.contentType === "file" && msg.fileUrl ? (
                                <a
                                  href={msg.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                    isMe
                                      ? "border-zinc-400 bg-zinc-200 text-black hover:bg-zinc-300"
                                      : "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                                  }`}
                                >
                                  <span>📎</span>
                                  <span className="max-w-55 truncate">{msg.fileName || msg.message || "Download file"}</span>
                                </a>
                              ) : (
                                renderMessageContent(msg.message)
                              )}
                            </div>

                            <div className="mt-2 flex items-center justify-end gap-2">
                              {!msg.isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => startReplyToMessage(msg)}
                                  className={`text-[10px] font-medium transition-colors ${
                                    isMe ? "text-zinc-600 hover:text-zinc-800" : "text-zinc-500 hover:text-zinc-300"
                                  }`}
                                >
                                  Reply
                                </button>
                              )}

                              {isMe && !msg.isDeleted && (
                                <button
                                  type="button"
                                  disabled={deletingMessageId === msg._id}
                                  onClick={() => handleDeleteMessage(msg)}
                                  className="text-[10px] font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
                                >
                                  {deletingMessageId === msg._id ? "Deleting..." : "Delete"}
                                </button>
                              )}

                              <span className={`text-[10px] ${isMe ? "text-zinc-500" : "text-zinc-500"}`}>
                                {formatMessageTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="min-h-18 bg-zinc-900/90 backdrop-blur-md px-6 py-3 flex flex-col gap-2 z-20 border-t border-zinc-800">
                {replyingTo && (
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">Replying</p>
                      <p className="truncate text-xs text-zinc-300">
                        {replyingTo.isDeleted ? "This message was deleted" : replyingTo.text || "Original message"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="ml-3 rounded-full px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                {showEmoji && (
                  <div className="absolute bottom-20 left-6 z-30 shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        if (inputmsgref.current) {
                          inputmsgref.current.value += emojiData.emoji;
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

                <FileMessageUploader
                  onUploaded={sendFileMessage}
                  disabled={!selectedUser && !selectedGroup && !selectedChannel}
                />

                <input
                  ref={inputmsgref}
                  placeholder="Message..."
                  className="flex-1 bg-zinc-950 px-5 py-3 text-zinc-100 rounded-full outline-none text-[15px] shadow-inner border border-zinc-800 focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
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

                    <div className="relative bg-zinc-900 min-h-95 flex items-center justify-center">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-105 object-cover ${isVideoCall ? "block" : "hidden"}`}
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
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-zinc-800 to-black shadow-2xl border border-zinc-700/50 mb-6">
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
