<div align="center">

<h1>💬 Chat</h1>

<p><em>Connect instantly. Communicate freely.</em></p>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248?logo=mongodb)](https://mongoosejs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-white?logo=socket.io)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

<div align="center">
<img width="600" height="200" alt="A real-time chat application built with Next js and Socket IO" src="https://github.com/user-attachments/assets/78150d77-242f-4163-8c72-4eefc8caa27d" />
</div>

## Overview

**Chat** is a full-stack, real-time messaging application built with Next.js and Socket.IO. It supports direct messages, group chats, server-based communities with channels, voice and video calls, file sharing, a friends system, tasks, achievements, and status updates — all wrapped in a sleek, dark-themed UI.

---

## Features

| Feature | Description |
|---|---|
| **Secure Authentication** | Sign in with Google or GitHub via NextAuth |
| **Route Protection** | Middleware-based auth guard on all private pages |
| **Real-time Messaging** | Instant DMs and group chats powered by Socket.IO |
| **Message Deletion** | Delete messages in real time across all clients |
| **Group Chats** | Create and manage multi-participant conversations |
| **Communities & Servers** | Discord-style servers with text and voice channels |
| **Voice & Video Calls** | Peer-to-peer calling via WebRTC (simple-peer) |
| **File Sharing** | Send images, videos, and files with upload support |
| **Friends System** | Send, accept, and manage friend requests |
| **Tasks** | Create and track tasks within the app |
| **Achievements** | View per-user achievements |
| **Typing Indicators** | Live "is typing…" feedback |
| **Read Receipts** | Know when your messages have been seen |
| **Emoji Picker** | Full emoji support in messages |
| **Status Updates** | Share and view user status |
| **Dark UI** | Immersive, eye-friendly dark design |

---

## 🛠 Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** — App Router, SSR, API routes
- **[React 19](https://react.dev/)** — UI components
- **[TypeScript 5](https://www.typescriptlang.org/)** — Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Utility-first styling
- **[emoji-picker-react](https://www.npmjs.com/package/emoji-picker-react)** — Emoji picker

### Backend
- **[Socket.IO 4](https://socket.io/)** — Real-time bidirectional communication
- **[simple-peer](https://github.com/feross/simple-peer)** — WebRTC voice & video calls
- **[NextAuth 4](https://next-auth.js.org/)** — OAuth authentication (Google & GitHub)
- **[Mongoose 9](https://mongoosejs.com/)** — MongoDB ODM

### Database
- **[MongoDB](https://www.mongodb.com/)** — Document database

---

## 🗂 Project Structure

```
Chat/
├── backend/                  # Standalone Socket.IO server
│   ├── server.js             # Real-time server (port 3001)
│   └── package.json
└── chat-/                    # Next.js application
    ├── app/
    │   ├── page.tsx              # Landing page
    │   ├── not-found.tsx         # 404 page
    │   ├── signin/               # Sign-in page (Google & GitHub OAuth)
    │   ├── dashboard/            # Main app shell
    │   │   ├── page.tsx          # Chat dashboard (DMs & group chats)
    │   │   ├── calls/            # Voice & video call history
    │   │   ├── communities/      # Communities & servers
    │   │   ├── status/           # User status updates
    │   │   ├── achievements/     # Per-user achievements
    │   │   ├── tasks/            # Task management
    │   │   ├── devtools/         # Developer tools
    │   │   └── prs/              # Private/restricted routes
    │   └── api/                  # Next.js API routes
    │       ├── auth/             # NextAuth configuration
    │       ├── users/            # User management
    │       ├── getcurrentuser/   # Current user lookup
    │       ├── messages/         # Message CRUD
    │       ├── send-messages/    # Send message endpoint
    │       ├── grp_chat/         # Group chat logic
    │       ├── channel/          # Channel management
    │       ├── server/           # Server/community management
    │       ├── friends/          # Friend requests & management
    │       ├── achievements/     # Achievements CRUD
    │       ├── tasks/            # Task CRUD
    │       ├── upload_file/      # File upload
    │       ├── upload_status/    # Status media upload
    │       └── github/           # GitHub integration
    ├── components/
    │   ├── FileMessageUploader.tsx  # File & media upload component
    │   ├── login-btn.jsx            # Login button
    │   └── session-provider.jsx     # NextAuth session wrapper
    ├── lib/
    │   └── db.js                 # MongoDB connection utility
    ├── model/
    │   ├── user.model.js         # User schema
    │   ├── chat.model.js         # Chat schema (DMs & groups)
    │   ├── message.model.js      # Message schema
    │   ├── server.model.js       # Server/community schema
    │   ├── channle.model.js      # Channel schema
    │   ├── status.model.js       # Status schema
    │   ├── friend.model.js       # Friend relationship schema
    │   ├── task.model.js         # Task schema
    │   └── achimvemnts.model.js  # Achievements schema
    ├── middleware.ts             # Auth route protection
    ├── next.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) running locally or a connection URI

### 1. Clone the repository

```bash
git clone https://github.com/PRERAN001/Chat.git
cd Chat
```

### 2. Install dependencies

```bash
# Next.js app
cd chat-
npm install

# Socket.IO server
cd ../backend
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the `chat-/` directory:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/chat-app--
```

Create a `.env` file in the `backend/` directory:

```env
SOCKET_PORT=3001
CORS_ORIGIN=http://localhost:3000
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=chat-app--
```

### 4. Run the Socket.IO server

```bash
cd backend
node server.js
```

### 5. Run the Next.js development server

```bash
cd chat-
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `node server.js` | Start the Socket.IO server (run from `backend/`) |

---

## 🔌 Real-time Events (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `join` | Client → Server | Register user socket |
| `join_context` | Client → Server | Join a chat or channel room |
| `send_message` | Client → Server | Send a message |
| `receive_message` | Server → Client | Deliver a message |
| `delete_message` | Client → Server | Delete a message |
| `receive_message_deleted` | Server → Client | Notify clients of a deleted message |
| `call-user` | Client → Server | Initiate a voice/video call |
| `incoming-call` | Server → Client | Notify the callee |
| `answer-call` | Client → Server | Accept a call |
| `call-accepted` | Server → Client | Notify the caller |
| `end-call` | Client → Server | Terminate a call |

---

## 🗃 Database Models

| Model | Key Fields |
|---|---|
| **User** | `idd`, `name`, `email`, `profilepic` |
| **Chat** | `participants[]`, `isGroup`, `lastMessage` |
| **Message** | `chatId`, `channelId`, `senderId`, `content` (text/image/video/file), `seenBy[]` |
| **Server** | `name`, `owner`, `members[]`, `icon` |
| **Channel** | `serverId`, `name`, `type` (text/voice) |
| **Friend** | `requester`, `recipient`, `status` |
| **Task** | `userId`, `title`, `description`, `status` |
| **Achievement** | `userId`, `title`, `description` |

---

## 🤝 Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

---

## 📄 License

This project is open-source. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/PRERAN001">PRERAN001</a>
</div>
