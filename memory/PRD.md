# Gappy Describe - Product Requirements Document

## Original Problem Statement
Build a web app named "Gappy Describe" that generates a "video voice description" to comply with WCAG 1.2.3. Features include video upload, AI scene analysis, audio description generation (ElevenLabs), video export, scene editor, project dashboard, auth, Stripe payments, and Canvas LMS LTI integration.

## Current State
**Status:** Coming Soon page live at `/`. App fully functional behind internal routes.

### What's Been Implemented
- **Coming Soon Page** (Feb 2026): Dark-themed landing page with email signup, animated orbs, gradient branding at `/`. Footer: gappylabs.com / gappylabs@gmail.com
- **Authentication**: Google OAuth + Email/Password (JWT + httpOnly cookies)
- **Project Dashboard**: List/grid view, folder organization, drag-and-drop, search/filter, usage stats
- **Video Upload**: Language (10 languages), voice (5 voices), description length selectors, transcript/caption checkboxes
- **AI Scene Analysis**: Detects scene cuts, generates AI descriptions via LiteLLM
- **Audio Generation**: ElevenLabs TTS integration
- **Video Export**: New video with audio descriptions overlaid (requires FFmpeg)
- **Scene Editor**: Review, edit, delete scenes
- **Stripe Payments**: Free, Creator, Pro, Enterprise tiers with monthly/yearly toggle
- **Transcription & Closed Captioning**: OpenAI Whisper integration
- **Privacy Policy Page**
- **Health Endpoints**: `/api/health` for Kubernetes

### Bug Fixed (Feb 2026)
- Fixed test user `tester1@gappylabs.com` missing `id` field in MongoDB causing login failure
- Made login route use `.get()` for robustness against incomplete user documents

## Architecture
```
/app/
├── backend/ (FastAPI + Motor/MongoDB)
│   ├── routes/ (auth.py, payments.py)
│   ├── services/ (transcription.py)
│   ├── auth_helpers.py
│   ├── dependencies.py
│   └── server.py
├── frontend/ (React + React Router)
│   └── src/
│       ├── pages/ (ComingSoonPage, Dashboard, Editor, HomePage, Login, Signup, Pricing, Privacy, etc.)
│       ├── context/ (AuthContext.js)
│       └── App.js (ComingSoon at /, app routes at /login, /dashboard, etc.)
```

## 3rd Party Integrations
- ElevenLabs (TTS) — User API Key
- OpenAI Whisper (Transcription) — Emergent LLM Key
- LiteLLM (AI Generation) — Emergent LLM Key
- Stripe (Payments) — User API Key
- Google OAuth — Emergent-managed keys

## Prioritized Backlog

### P1
- Canvas LMS LTI 1.3 Integration

### P2
- Re-enable public app (switch Coming Soon back to Landing Page when ready)

### P3
- Add more languages for description generation
- Video processing queue
- Better error recovery
- Keyboard shortcuts
- Monthly trash cleanup (deferred)

## Test Credentials
- User: `tester1@gappylabs.com` / `GappyTest2024!` (PRO tier)

## Critical Notes
- DO NOT reintroduce custom startup bash scripts (e.g., `start_with_ffmpeg.sh`)
- All API keys must be in .env, never hardcoded
- Coming Soon page at `/`; original landing page at `/app`
- FFmpeg not installed in preview — video export won't work in preview but will in production
