# Gappy Describe - Invention Disclosure Report

## Application Overview
**Name:** Gappy Describe  
**Purpose:** AI-powered video accessibility platform that generates WCAG 1.2.3 compliant audio descriptions, transcripts, and closed captions for videos.

---

## CHRONOLOGY OF INVENTION

### Idea First Conceived
**Approximate Date:** December 2025

### Location
**Where Invention Was Conceived:** Remote development environment using Emergent Labs cloud-based development platform (Kubernetes containerized environment)

### Development Timeline
1. **Initial Concept** - Web application to make videos accessible with AI-powered audio descriptions
2. **Core Feature Development** - Scene detection, AI description generation, text-to-speech integration
3. **User Management** - Authentication, subscription tiers, payment integration
4. **Advanced Features** - Transcript generation, closed captioning (SRT/VTT), caption embedding
5. **Production Deployment** - Kubernetes-based deployment with custom domain support

### Disclosure Status
**Has the Invention Been Disclosed?** The application has been deployed to production at `describe.gappylabs.com` and is publicly accessible.

---

## FUNDING SOURCES

### Materials, Equipment, and Development Resources

| Resource | Provider | Purpose |
|----------|----------|---------|
| Cloud Development Environment | Emergent Labs | Kubernetes container hosting, development tools |
| MongoDB Atlas | MongoDB, Inc. | Cloud database hosting |
| AI/ML APIs | OpenAI | Vision API (GPT-4o) for scene description, Whisper for transcription |
| Text-to-Speech | ElevenLabs | High-quality voice synthesis for audio descriptions |
| Payment Processing | Stripe | Subscription billing and payment handling |
| Domain/DNS | GoDaddy | Domain registration for `gappylabs.com` |

---

## EXTERNAL RESOURCES

### Agreements and Tools Involved

| Resource Type | Provider/Tool | Purpose |
|--------------|---------------|---------|
| AI/ML Services | OpenAI GPT-4o Vision | Scene analysis and description generation |
| AI/ML Services | OpenAI Whisper | Speech-to-text transcription |
| AI/ML Services | Emergent LLM Integration Library | Unified API access to AI models |
| TTS Service | ElevenLabs API | Text-to-speech audio generation |
| Payment Gateway | Stripe | Subscription payment processing |
| Authentication | Emergent Auth API | OAuth and session management |
| Cloud Infrastructure | Emergent Deployment Platform | Kubernetes hosting |
| Database | MongoDB Atlas | Document database |

### Software Libraries and Frameworks
- **Backend:** FastAPI (Python), Motor (MongoDB async driver), OpenCV, FFmpeg
- **Frontend:** React, React Router, Axios
- **AI Integration:** `emergentintegrations` library (proprietary Emergent Labs library)

---

## DETAILED DESCRIPTION OF THE INVENTION

### 1. Problem Statement
Video content is inaccessible to users with visual impairments. WCAG 2.1 Level AA requires audio descriptions (WCAG 1.2.3) that describe visual information in videos. Creating these descriptions manually is time-consuming and expensive.

### 2. Invention Summary
Gappy Describe is an automated platform that:
1. **Analyzes videos** using computer vision to detect scene changes
2. **Generates descriptions** using AI vision models to describe visual content
3. **Converts to speech** using high-quality text-to-speech synthesis
4. **Creates accessible output** by pausing video on scene transitions and inserting audio descriptions
5. **Generates transcripts and captions** from original video audio using speech recognition

### 3. Technical Architecture

#### Backend Components (`/app/backend/`)
```
server.py              - Main FastAPI application
├── Scene Detection    - OpenCV-based frame difference analysis
├── AI Description     - GPT-4o Vision API integration
├── Audio Generation   - ElevenLabs TTS with gTTS fallback
├── Video Export       - FFmpeg-based video processing
├── Transcription      - OpenAI Whisper integration
└── Caption Generation - SRT/VTT format generation
```

#### Frontend Components (`/app/frontend/src/`)
```
pages/
├── LandingPage.js     - Marketing/landing page
├── HomePage.js        - Video upload interface
├── EditorPage.js      - Scene editor with preview
├── Dashboard.js       - Project management
├── PricingPage.js     - Subscription plans
└── PaymentSuccessPage.js - Payment confirmation
```

### 4. Key Technical Innovations

#### 4.1 Automated Scene Detection
- Uses frame-by-frame difference analysis with configurable threshold
- Detects visual transitions to identify scene boundaries
- Extracts key frames for AI analysis

#### 4.2 AI-Powered Description Generation
- Integrates GPT-4o Vision model for scene understanding
- Generates WCAG-compliant descriptions in multiple languages
- Supports configurable description length (1, 2, or 5 sentences)

#### 4.3 Extended Pause Audio Description
- Pauses video at scene transitions
- Inserts AI-generated audio description
- Resumes video playback automatically
- Maintains synchronization between video and audio

#### 4.4 Transcript and Caption Generation
- Extracts audio from video using FFmpeg
- Transcribes using OpenAI Whisper with timestamp granularity
- Generates SRT and VTT caption formats
- Supports embedding captions directly in exported video

### 5. Supported Features

| Feature | Description |
|---------|-------------|
| Video Upload | MP4, AVI, MOV format support |
| Scene Detection | Automatic visual transition detection |
| AI Descriptions | GPT-4o powered visual descriptions |
| Multi-language | 10 languages supported |
| Voice Selection | 5 high-quality ElevenLabs voices |
| Transcript | Full video transcription |
| Closed Captions | SRT and VTT format export |
| Video Export | MP4, AVI, MOV with embedded descriptions |

### 6. Subscription Model

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 2 videos/month, 3 min max |
| Creator | $15/month | 20 videos/month, 10 min max |
| Pro | $49/month | 50 videos/month, 20 min max |
| Enterprise | Custom | Usage-based, negotiated |

### 7. API Endpoints

#### Core Functionality
- `POST /api/upload` - Upload video with options
- `POST /api/analyze/{project_id}` - Analyze and generate descriptions
- `POST /api/export/{project_id}` - Export accessible video

#### Transcript/Caption
- `POST /api/transcribe/{project_id}` - Generate transcript
- `GET /api/transcript/{project_id}` - Get transcript data
- `GET /api/captions/{project_id}/{format}` - Download SRT/VTT/TXT

#### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/oauth/google` - Google OAuth

#### Payments
- `GET /api/payments/packages` - Get subscription plans
- `POST /api/payments/checkout` - Create Stripe session
- `GET /api/payments/status/{session_id}` - Check payment

### 8. Database Schema

**Projects Collection:**
```json
{
  "id": "uuid",
  "video_path": "string",
  "original_filename": "string",
  "user_email": "string",
  "status": "uploaded|processing|analyzed|completed",
  "language": "en",
  "voice_id": "string",
  "generate_transcript": "boolean",
  "generate_captions": "boolean",
  "transcript_text": "string",
  "transcript_srt": "string",
  "transcript_vtt": "string"
}
```

**Scenes Collection:**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "frame_number": "int",
  "timestamp": "float",
  "description": "string",
  "audio_path": "string",
  "duration": "float"
}
```

---

## CLAIMS OF NOVELTY

1. **Automated WCAG-compliant audio description generation** using AI vision models
2. **Extended pause technique** for inserting descriptions at scene transitions
3. **Integrated transcript and caption generation** from video audio
4. **Multi-format caption export** (SRT, VTT, embedded) from single transcription
5. **Subscription-based SaaS model** for video accessibility services

---

## PRODUCTION DEPLOYMENT

**Domain:** https://describe.gappylabs.com  
**Platform:** Emergent Labs Kubernetes Infrastructure  
**Database:** MongoDB Atlas  
**SSL:** Automatic via Emergent deployment

---

*Report Generated: December 2025*
*Version: 1.0*
