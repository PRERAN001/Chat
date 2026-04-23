# Chat

A full-stack real-time chat platform with:

- **Next.js frontend** (`/chat-`)
- **Socket.IO backend** (`/backend`)
- **MongoDB** for persistence
- **NextAuth** login (GitHub + Google)

## Features

- Real-time direct and group messaging
- Server/channel-based chat spaces
- Friend requests and contact management
- Message deletion and file sharing
- 1:1 voice and video calling (WebRTC + Socket signaling)
- OAuth login with profile sync

## Repository Structure

```text
Chat/
├── backend/   # Socket.IO server
└── chat-/     # Next.js web app
```

## Prerequisites

- Node.js 18+
- npm
- MongoDB (local or hosted)

## Environment Variables

### Frontend (`/chat-`)

Create `/home/runner/work/Chat/Chat/chat-/.env.local`:

```env
# MongoDB
mongoo_url=mongodb://localhost:27017/chat-app--
MONGO_DB_NAME=chat-app--

# NextAuth
NEXTAUTH_SECRET=replace-with-a-secure-random-secret
NEXTAUTH_URL=http://localhost:3000

# OAuth
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Realtime socket backend
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Backend (`/backend`)

Create `/home/runner/work/Chat/Chat/backend/.env`:

```env
SOCKET_PORT=3001
CORS_ORIGIN=http://localhost:3000
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=chat-app--
```

## Installation

Install dependencies in both apps:

```bash
cd /home/runner/work/Chat/Chat/chat- && npm install
cd /home/runner/work/Chat/Chat/backend && npm install
```

## Running Locally

Start backend:

```bash
cd /home/runner/work/Chat/Chat/backend
npm run dev
```

Start frontend (in a new terminal):

```bash
cd /home/runner/work/Chat/Chat/chat-
npm run dev
```

Then open `http://localhost:3000`.

## Available Scripts

### Frontend

- `npm run dev` — Start Next.js in development mode
- `npm run build` — Create production build
- `npm run start` — Run production server
- `npm run lint` — Run ESLint

### Backend

- `npm run dev` — Start socket server with file watching
- `npm run start` — Start socket server

## Notes

- The frontend currently references `mongoo_url` (exact variable name) for MongoDB connection.
- If build fails in restricted environments, external font fetching (Google Fonts) may be blocked.
