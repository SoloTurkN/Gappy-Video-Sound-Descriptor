# Gappy Describe - Product Requirements Document

## Original Problem Statement
Build a web app named "Gappy Describe" that generates a "video voice description" to comply with WCAG 1.2.3. Features include video upload, AI scene analysis, audio description generation (ElevenLabs), video export, scene editor, project dashboard, auth, Stripe payments, and Canvas LMS LTI integration.

## Current State
**Status:** Coming Soon page live. App in maintenance/development mode.

### What's Been Implemented
- **Coming Soon Page** (Feb 2026): Dark-themed landing page with email signup, animated orbs, gradient branding. Index route (`/`) shows Coming Soon; app routes remain accessible at `/app`, `/login`, `/dashboard`, etc.
- **Authentication**: Google OAuth + Email/Password (JWT-based)
- **Project Dashboard**: List view, folder organization, drag-and-drop, search/filter
- **Video Upload**: Language, voice, description length selectors
- **AI Scene Analysis**: Detects scene cuts, generates AI descriptions
- **Audio Generation**: ElevenLabs TTS integration
- **Video Export**: New video with audio descriptions overlaid
- **Scene Editor**: Review, edit, delete scenes
- **Stripe Payments**: Free, Creator, Pro, Enterprise tiers
- **Transcription & Closed Captioning**: OpenAI Whisper integration
- **Privacy Policy Page**
- **Pricing Page**: Updated tiers
- **Landing Page**: Professional copy
- **Health Endpoints**: `/api/health` for Kubernetes

## Architecture
```
/app/
├── backend/ (FastAPI + Motor/MongoDB)
│   ├── routes/ (auth.py, payments.py)
│   ├── services/ (transcription.py)
│   └── server.py
├── frontend/ (React + React Router)
│   └── src/
│       ├── pages/ (ComingSoonPage, Dashboard, Editor, etc.)
│       ├── context/ (AuthContext.js)
│       └── App.js (ComingSoon as index route)
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
- Re-enable public app (switch Coming Soon back to Landing Page)

### P3
- Add more languages for description generation
- Video processing queue
- Better error recovery
- Keyboard shortcuts
- Monthly trash cleanup (deferred)

## Test Credentials
- User: `tester1@gappylabs.com` / `GappyTest2024!`

## Critical Notes
- DO NOT reintroduce custom startup bash scripts (e.g., `start_with_ffmpeg.sh`)
- All API keys must be in .env, never hardcoded
- The Coming Soon page is at `/`; original landing page moved to `/app`
