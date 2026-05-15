# Gappy Describe - Product Requirements Document

## Original Problem Statement
Build a web app named "Gappy Describe" that generates a "video voice description" to comply with WCAG 1.2.3.

## Current State
**Status:** App fully functional with AI scene merging, manual scene merging in editor, shared navigation, and improved error handling.

### What's Been Implemented
- **Reliable File Downloads + CC Burn-in Fix** (Feb 2026): Replaced fragile `window.open` / Data URI download patterns in EditorPage with unified Blob + `URL.createObjectURL` anchor-click downloads. Fixed backend EXDEV cross-device link error in CC burn-in path (`shutil.move` + same-filesystem captioned output). Trash 'Delete Forever' bulk action verified working E2E. All three previously-failing P0/P1 issues now pass Playwright `expect_download()` tests.
- **Manual Scene Merging in Editor** (Feb 2026): Checkbox-based selection on scene cards with "Merge Scenes" toolbar button. Keeps earliest scene's description/thumbnail, deletes the rest. Backend endpoint: POST /api/scenes/merge.
- **AI-Powered Scene Merging** (Feb 2026): After detecting scene cuts, AI vision (GPT-4o) compares consecutive frames to determine if they're from the same setting/event (e.g., concert from different angles). Falls back to histogram comparison.
- **Shared Navbar** (Feb 2026): Consistent top navigation across ALL pages. Shows Pricing/Login/SignUp when unauthenticated; Pricing/Dashboard/LogOut when authenticated.
- **Landing Page**: Professional design matching brand mockup (no "How It Works" section). Purple (#6A39F5) brand color, dashboard mockup, CTA.
- **Authentication**: Google OAuth + Email/Password (JWT + httpOnly cookies), 30min inactivity timeout
- **Project Dashboard**: List/grid view, folder organization, drag-and-drop, search/filter, usage stats
- **Video Upload**: Language, voice, description length selectors, transcript/caption checkboxes
- **AI Scene Analysis**: Scene detection + AI descriptions via LiteLLM
- **Audio Generation**: ElevenLabs TTS with gTTS fallback
- **Video Export**: FFmpeg-based video with overlaid audio descriptions
- **Scene Editor**: Review, edit, delete, merge scenes
- **Stripe Payments**: Free, Creator, Pro, Enterprise tiers
- **Transcription & Closed Captioning**: OpenAI Whisper
- **Privacy Policy Page**
- **Coming Soon Page**: Available at ComingSoonPage.js

## Architecture
```
/app/
├── backend/ (FastAPI + Motor/MongoDB)
│   ├── routes/ (auth.py, payments.py)
│   ├── services/ (transcription.py)
│   └── server.py (scene detection, AI merging, manual merge API, analysis, export)
├── frontend/ (React + React Router)
│   └── src/
│       ├── components/ (Navbar.js)
│       ├── pages/ (ComingSoon, Dashboard, Editor, HomePage, Landing, Login, Signup, Pricing, Privacy)
│       ├── context/ (AuthContext.js)
│       └── App.js
```

## Key API Endpoints
- POST /api/scenes/merge — Manual scene merging (must be before /scenes/{scene_id} routes)
- POST /api/analyze/{project_id} — AI scene detection + auto-merging
- POST /api/upload — Video upload
- GET /api/projects/{id}/scenes — Get scenes for a project
- PUT /api/scenes/{id} — Update scene description
- DELETE /api/scenes/{id} — Delete a scene

## 3rd Party Integrations
- ElevenLabs (TTS) — User API Key
- OpenAI Whisper (Transcription) — Emergent LLM Key
- LiteLLM/GPT-4o (AI Descriptions + Scene Comparison) — Emergent LLM Key
- Stripe (Payments) — User API Key
- Google OAuth — Emergent-managed keys

## Prioritized Backlog
### P1
- Canvas LMS LTI 1.3 Integration
### P2
- UI redesign for internal pages (Dashboard, Editor, Upload) to match landing page style
- Coming Soon page toggle
### P3
- Add more languages
- Video processing queue
- Keyboard shortcuts
- Monthly trash cleanup (deferred)

## Test Credentials
- User: `tester1@gappylabs.com` / `GappyTest2024!` (PRO tier)

## Critical Notes
- DO NOT reintroduce custom startup bash scripts
- POST /api/scenes/merge MUST be declared before /scenes/{scene_id} routes (FastAPI route ordering)
- AI scene comparison uses GPT-4o vision with histogram pre-filter
- Auth inactivity timeout is 30 minutes
