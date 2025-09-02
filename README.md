# CodePals 👩‍💻🤖 — Pair Programming with AI + People

CodePals is a real-time collaborative coding platform that matches learners with fellow devs or an AI programming buddy. Built for students, educators, and self-learners, CodePals enhances coding fluency through live pair sessions, intelligent code feedback, and project-based practice.

## 🌟 Features

- 🔁 Real-time collaborative code editor (like Replit)
- 🤖 GPT-powered AI partner for solo practice
- 📊 AI code review with line-by-line suggestions
- 🔍 Matchmaking via ML (skill level, timezone, language)
- 🧠 Post-session NLP summaries
- 🔐 Anonymous mode, persistent sessions

## 💻 Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 15, React, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, WebSocket (Socket.IO) |
| AI/NLP | Z.ai Web Dev SDK, GPT-4 |
| Database | Prisma ORM with SQLite |
| Authentication | NextAuth.js |
| State Management | Zustand, TanStack Query |

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/codepals-ai-collab.git
cd codepals-ai-collab

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application running.

## 📄 License

MIT

## 🙌 Contributing

Pull requests welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 🎯 MVP Feature Roadmap

### 🥇 Phase 1: Core MVP (Weeks 1–2)
- [x] Real-time collaborative code editor (Socket.IO)
- [x] GPT-4 powered AI coding partner
- [x] Manual matchmaking (skill, language)
- [ ] Firebase Auth (Email/Google)
- [x] Basic session tracking (join/leave/code updates)

### 🥈 Phase 2: Smart Add-ons (Weeks 3–4)
- [x] AI Code Review + Line-by-Line comments
- [ ] NLP Summary (after session ends)
- [ ] Session replay + code history
- [ ] Dark mode toggle
- [ ] User profiles (tech stack tags, timezone, XP level)

### 🥉 Phase 3: Optional Premium Layer
- [ ] AI voice explanation via Text-to-Speech
- [ ] Community leaderboard & streaks
- [ ] Feedback/rating system for partners

## 🤝 Powered by Z.ai

This project is built with [Z.ai](https://chat.z.ai) - your AI assistant for intelligent code generation and development assistance.

---

Built with ❤️ for the developer community. Supercharged by [Z.ai](https://chat.z.ai) 🚀
