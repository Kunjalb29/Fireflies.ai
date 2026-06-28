# MeetMind 🧠✨

MeetMind is an open-source, self-hosted AI-powered meeting intelligence platform—a robust alternative to Fireflies.ai. It automatically processes meeting transcripts to generate concise summaries, action items, meeting chapters, and sentiment analysis, helping teams capture every detail and keep projects moving forward.

---

## 🚀 Key Features

*   **📊 Meeting Dashboard**: High-level analytics of your meetings, total duration, and pending action items.
*   **🎙️ Interactive Transcripts**: Searchable transcripts with speaker identification, timestamps, audio-player synchronization, and color-coded text highlighting.
*   **🤖 AI Summaries & Chapters**: Comprehensive overviews, key takeaways, and structured chapters with direct links to audio timestamps.
*   **✅ Action Items Management**: Centralized task board to track, assign, edit, prioritize, and check off action items across all meetings.
*   **🔍 Global Search**: Fast search across meeting titles, transcripts, and action items with keyboard shortcuts (`⌘K` / `Ctrl+K`).
*   **📥 Multi-format Export**: Download meeting summaries and transcripts in PDF, Markdown, or Plain Text.
*   **🌓 Sleek UI/UX**: Fully responsive interface featuring a modern dark/light mode, built with glassmorphic elements and micro-animations.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS & Framer Motion (for animations)
*   **State Management**: Zustand (UI and audio player state)
*   **Data Fetching**: TanStack Query (React Query)
*   **Icons**: Lucide React

### Backend
*   **Framework**: FastAPI (Python 3.10+)
*   **Database**: SQLite with SQLAlchemy (asyncio) & aiosqlite
*   **AI Integration**: Anthropic Claude API (with local mock fallback for development)
*   **Settings**: Pydantic v2

---

## 📂 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (meetings, summaries, transcripts, action_items, etc.)
│   │   ├── db/              # Database session config & seed scripts
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic validation schemas
│   │   └── services/        # AI summary generation (Claude client)
│   ├── main.py              # Application entry point & CORS configuration
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── app/                 # Next.js App Router (pages & layouts)
    ├── components/          # Reusable UI components (Sidebar, SearchModal, ActionItemCard, etc.)
    ├── lib/                 # API client services, hooks, and helper utilities
    ├── store/               # Zustand state stores
    └── tailwind.config.ts   # Tailwind CSS design tokens
```

---

## 🚦 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+)
*   [Python](https://www.python.org/) (v3.10+)

---

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables:
    Create a `.env` file in the `backend/` directory:
    ```env
    ANTHROPIC_API_KEY=your-api-key-here  # Optional: local mock data is used if left blank
    DATABASE_URL=sqlite+aiosqlite:///./meetmind.db
    CORS_ORIGINS=http://localhost:3000
    ```
5.  Seed the database with sample meetings (optional but recommended):
    ```bash
    python -m app.db.seed
    ```
6.  Start the FastAPI server:
    ```bash
    uvicorn main:app --reload
    ```
    The API will be available at [http://localhost:8000](http://localhost:8000). You can view the interactive API documentation at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    Create a `.env.local` file in the `frontend/` directory:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be running at [http://localhost:3000](http://localhost:3000).

---

## 🐳 Building for Production

### Frontend Build
To create an optimized production build of the Next.js application:
```bash
cd frontend
npm run build
npm run start
```

### Backend Deployment
Run the FastAPI application without reload flags and with multiple workers behind a reverse proxy (e.g., Nginx):
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
