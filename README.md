# Video Voice Description Generator

A web application that automatically generates WCAG 1.2.3 Level A compliant audio descriptions for videos. The app uses AI-powered scene detection and vision analysis to create accessible video content.

## Features

- **Video Upload**: Drag-and-drop or browse to upload videos (MP4, AVI, MOV formats)
- **AI Scene Detection**: Automatic detection of scene cuts using frame difference analysis
- **Vision Analysis**: OpenAI GPT-4o analyzes each scene to generate WCAG-compliant descriptions
- **Text-to-Speech**: Optional OpenAI TTS for audio narration generation
- **Scene Editor**: Review and edit AI-generated descriptions
- **Audio Preview**: Play generated audio descriptions for each scene
- **Export**: Prepare video data for export with audio descriptions

## Tech Stack

### Backend
- **FastAPI**: Python web framework
- **MongoDB**: Database for projects and scenes
- **OpenCV**: Video processing and scene detection
- **emergentintegrations**: AI vision analysis (OpenAI GPT-4o)
- **OpenAI TTS**: Text-to-speech generation (optional)

### Frontend
- **React**: UI framework
- **Lucide React**: Icons
- **Sonner**: Toast notifications
- **Tailwind CSS**: Styling

## API Configuration

### Emergent LLM Key (Included)
The app uses the Emergent LLM Key for:
- ✅ OpenAI GPT-4o vision analysis
- ✅ Scene description generation

### Text-to-Speech Options

**Default: gTTS (Google Text-to-Speech)**
- ✅ Free and open-source
- ✅ No API key required
- ✅ Works out of the box
- Good quality natural-sounding voice

**Optional: OpenAI TTS (Premium)**
To use premium OpenAI TTS voices:
1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Add it to `backend/.env`:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Restart the backend server

The app automatically uses OpenAI TTS when the key is available, otherwise falls back to gTTS.

### Video Export Formats
- **MP4** (H.264): Best compatibility, recommended for web
- **AVI**: High quality, larger file size
- **MOV** (QuickTime): Best for Apple devices and Final Cut Pro

## Usage

### 1. Upload Video
- Visit the homepage
- Drag and drop a video file or click "Browse Files"
- Click "Upload and Analyze"

### 2. Scene Analysis
The app will automatically:
- Detect scene cuts in the video
- Extract key frames from each scene
- Generate WCAG-compliant descriptions using AI vision
- Create audio narrations (if TTS is configured)

### 3. Edit Descriptions
- Review AI-generated descriptions in the editor
- Click "Edit" to modify any description
- Click "Save" to regenerate audio with the new text
- Click "Play Audio" to preview the narration

### 4. Export
- Click "Export Video" to prepare the final output
- Scene data with descriptions and audio files are ready for video assembly

## WCAG Compliance

The app generates audio descriptions that comply with **WCAG 1.2.3 Audio Description or Media Alternative (Prerecorded) Level A**:

- Descriptions focus on important visual information
- Actions, settings, and scene changes are described
- Concise narration (designed for ~15 seconds per scene)
- Clear and accessible language
