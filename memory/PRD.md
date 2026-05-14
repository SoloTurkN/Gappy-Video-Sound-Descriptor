# Gappy Describe - Product Requirements Document

## Original Problem Statement
Build a web app named "Gappy Describe" that generates a "video voice description" to comply with WCAG 1.2.3. Features include video upload, AI scene analysis, audio description generation (ElevenLabs), video export, scene editor, project dashboard, auth, Stripe payments, and Canvas LMS LTI integration.

## Current State
**Status:** App fully functional with shared navigation, scene merging, and improved error handling.

### What's Been Implemented
- **Shared Navbar** (Feb 2026): Consistent top navigation across ALL pages (Landing, Login, Signup, Dashboard, Editor, Upload, Pricing, Privacy). Shows Pricing/Login/SignUp when unauthenticated; Pricing/Dashboard/LogOut when authenticated.
- **Scene Merging** (Feb 2026): After detecting scene cuts, consecutive visually similar scenes (e.g., same concert from different camera angles) are automatically merged using HSV histogram correlation. Reduces redundant scene descriptions.
- **Improved Error Handling** (Feb 2026): Upload and analyze steps have separate error messages. Analyze failures redirect to dashboard instead of showing generic error. Auth inactivity timeout increased from 10min to 30min.
- **Landing Page Cleanup** (Feb 2026): "How it Works" section removed per user request.
- **Coming Soon Page**: Available at ComingSoonPage.js for future use.
- **Authentication**: Google OAuth + Email/Password (JWT + httpOnly cookies)
- **Project Dashboard**: List/grid view, folder organization, drag-and-drop, search/filter, usage stats
- **Video Upload**: Language (10 languages), voice (5 voices), description length selectors, transcript/caption checkboxes
- **AI Scene Analysis**: Detects scene cuts, generates AI descriptions via LiteLLM, merges similar consecutive scenes
- **Audio Generation**: ElevenLabs TTS integration with gTTS fallback
- **Video Export**: New video with audio descriptions overlaid (requires FFmpeg)
- **Scene Editor**: Review, edit, delete scenes
- **Stripe Payments**: Free, Creator, Pro, Enterprise tiers with monthly/yearly toggle
- **Transcription & Closed Captioning**: OpenAI Whisper integration
- **Privacy Policy Page**
- **Health Endpoints**: `/api/health` for Kubernetes

## Architecture
```
/app/
├── backend/ (FastAPI + Motor/MongoDB)
│   ├── routes/ (auth.py, payments.py)
│   ├── services/ (transcription.py)
│   ├── auth_helpers.py
│   ├── dependencies.py
│   └── server.py (scene detection, merging, analysis, export)
├── frontend/ (React + React Router)
│   └── src/
│       ├── components/ (Navbar.js - shared navigation)
│       ├── pages/ (ComingSoonPage, Dashboard, Editor, HomePage, Login, Signup, Pricing, Privacy, etc.)
│       ├── context/ (AuthContext.js - 30min timeout)
│       └── App.js
```

## Key Backend Functions
- `detect_scene_cuts()`: Frame difference analysis for scene detection
- `compare_scene_similarity()`: HSV histogram correlation (threshold 0.75)
- `merge_similar_scenes()`: Merges consecutive similar scenes
- `generate_description()`: LLM-powered WCAG audio descriptions
- `generate_audio()`: ElevenLabs TTS with gTTS fallback

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
- Coming Soon page toggle (ComingSoonPage.js ready for reuse)
- UI redesign for all internal pages (Dashboard, Editor, Upload) to match new landing page style

### P3
- Add more languages for description generation
- Video processing queue
- Better error recovery
- Keyboard shortcuts
- Monthly trash cleanup (deferred)

## Test Credentials
- User: `tester1@gappylabs.com` / `GappyTest2024!` (PRO tier)

## Critical Notes
- DO NOT reintroduce custom startup bash scripts
- All API keys must be in .env, never hardcoded
- Scene merging uses HSV histogram comparison with 0.75 correlation threshold
- Auth inactivity timeout is 30 minutes
- FFmpeg not installed in preview — video export won't work in preview
