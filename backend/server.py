from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Depends, Form, Request
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import cv2
import numpy as np
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import asyncio
import json
import shutil
import subprocess

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import dependencies (must be after ROOT_DIR and load_dotenv)
import sys
sys.path.insert(0, str(ROOT_DIR))
from dependencies import get_current_user

# MongoDB connection - use get() with fallback for deployment compatibility
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'gappy_describe')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Get API key from environment
API_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Define Models
class SceneData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    frame_number: int
    timestamp: float
    thumbnail_path: str
    description: str = ""
    audio_path: str = ""
    duration: float = 0.0

class ProjectData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_path: str
    original_filename: str
    user_email: str = ""  # Email of user who created the project
    status: str = "uploaded"  # uploaded, processing, analyzed, completed, error
    total_scenes: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    folder: str = "all"  # Folder/category: "all", "recent", "trash", or custom
    trashed_at: Optional[datetime] = None  # When moved to trash
    duration: Optional[float] = None  # Video duration in seconds
    export_format: Optional[str] = None  # Last export format used
    language: str = "en"  # Language for AI descriptions
    voice_id: Optional[str] = None  # ElevenLabs voice ID for TTS
    description_length: str = "1"  # Number of sentences: "1", "2", or "5"
    # Transcript and caption options
    generate_transcript: bool = False  # Generate transcript from original audio
    generate_captions: bool = False  # Generate closed captions (SRT/VTT)
    embed_captions: bool = False  # Embed captions in exported video
    transcript_text: Optional[str] = None  # Generated transcript text
    transcript_srt: Optional[str] = None  # SRT format captions
    transcript_vtt: Optional[str] = None  # VTT format captions

class SceneUpdate(BaseModel):
    description: str

class ProjectCreate(BaseModel):
    video_path: str
    original_filename: str

class ProjectUpdate(BaseModel):
    folder: Optional[str] = None
    original_filename: Optional[str] = None

class BulkActionRequest(BaseModel):
    project_ids: List[str]
    action: str  # "move_to_folder", "move_to_trash", "restore", "delete_permanent"
    folder: Optional[str] = None

class UsageData(BaseModel):
    user_email: str
    month: str  # Format: YYYY-MM
    videos_uploaded: int = 0
    subscription_tier: str = "free"  # free, pro, enterprise

# Subscription tier limits
TIER_LIMITS = {
    "free": {
        "max_videos_per_month": 3,
        "max_video_duration_seconds": 300,  # 5 minutes
        "allowed_formats": ["mp4"],
        "name": "Free"
    },
    "pro": {
        "max_videos_per_month": 50,
        "max_video_duration_seconds": None,  # Unlimited
        "allowed_formats": ["mp4", "avi", "mov"],
        "name": "Pro"
    },
    "enterprise": {
        "max_videos_per_month": None,  # Unlimited
        "max_video_duration_seconds": None,  # Unlimited
        "allowed_formats": ["mp4", "avi", "mov"],
        "name": "Enterprise"
    }
}

# Helper functions
async def get_or_create_usage(user_email: str, subscription_tier: str = "free") -> dict:
    """Get or create usage record for current month"""
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    usage = await db.usage.find_one(
        {"user_email": user_email, "month": current_month},
        {"_id": 0}
    )
    
    if not usage:
        usage = {
            "user_email": user_email,
            "month": current_month,
            "videos_uploaded": 0,
            "subscription_tier": subscription_tier
        }
        await db.usage.insert_one(usage)
    
    return usage


async def check_upload_allowed(user_email: str, video_duration: float) -> tuple[bool, str]:
    """
    Check if user is allowed to upload based on their subscription tier
    Returns (allowed: bool, reason: str)
    """
    # Get user's subscription tier
    user = await db.users.find_one({"email": user_email}, {"_id": 0})
    if not user:
        return False, "User not found"
    
    subscription_tier = user.get("subscription_tier", "free")
    tier_config = TIER_LIMITS.get(subscription_tier, TIER_LIMITS["free"])
    
    # Get current month's usage
    usage = await get_or_create_usage(user_email, subscription_tier)
    
    # Check video count limit
    max_videos = tier_config["max_videos_per_month"]
    if max_videos is not None and usage["videos_uploaded"] >= max_videos:
        return False, f"Monthly limit reached. Your {tier_config['name']} plan allows {max_videos} videos per month."
    
    # Check video duration limit
    max_duration = tier_config["max_video_duration_seconds"]
    if max_duration is not None and video_duration > max_duration:
        max_minutes = max_duration // 60
        return False, f"Video too long. Your {tier_config['name']} plan allows videos up to {max_minutes} minutes."
    
    return True, "Upload allowed"


async def increment_usage(user_email: str, subscription_tier: str = "free"):
    """Increment video upload count for current month"""
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    # Get user's current tier
    user = await db.users.find_one({"email": user_email}, {"_id": 0})
    if user:
        subscription_tier = user.get("subscription_tier", "free")
    
    await db.usage.update_one(
        {"user_email": user_email, "month": current_month},
        {
            "$inc": {"videos_uploaded": 1},
            "$set": {"subscription_tier": subscription_tier}
        },
        upsert=True
    )
def detect_scene_cuts(video_path: str, threshold: float = 30.0):
    """Detect scene cuts in video using frame difference analysis"""
    cap = cv2.VideoCapture(video_path)
    scenes = []
    prev_frame = None
    frame_number = 0
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if prev_frame is not None:
            # Calculate frame difference
            diff = cv2.absdiff(gray, prev_frame)
            mean_diff = np.mean(diff)
            
            # If difference is above threshold, it's a scene cut
            if mean_diff > threshold:
                timestamp = frame_number / fps
                scenes.append({
                    'frame_number': frame_number,
                    'timestamp': timestamp,
                    'frame': frame
                })
        else:
            # Always include first frame
            scenes.append({
                'frame_number': 0,
                'timestamp': 0.0,
                'frame': frame
            })
        
        prev_frame = gray
        frame_number += 1
    
    cap.release()
    return scenes


def compare_scene_similarity(frame_a, frame_b, threshold: float = 0.75) -> bool:
    """
    Quick pre-filter using color histogram correlation.
    Returns True if scenes share a very similar color palette.
    Used to skip AI comparison for obviously identical frames.
    """
    try:
        size = (128, 128)
        a = cv2.resize(frame_a, size)
        b = cv2.resize(frame_b, size)
        
        hsv_a = cv2.cvtColor(a, cv2.COLOR_BGR2HSV)
        hsv_b = cv2.cvtColor(b, cv2.COLOR_BGR2HSV)
        
        h_bins, s_bins = 50, 60
        hist_size = [h_bins, s_bins]
        ranges = [0, 180, 0, 256]
        channels = [0, 1]
        
        hist_a = cv2.calcHist([hsv_a], channels, None, hist_size, ranges)
        hist_b = cv2.calcHist([hsv_b], channels, None, hist_size, ranges)
        
        cv2.normalize(hist_a, hist_a, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist_b, hist_b, 0, 1, cv2.NORM_MINMAX)
        
        similarity = cv2.compareHist(hist_a, hist_b, cv2.HISTCMP_CORREL)
        return similarity >= threshold
    except Exception as e:
        logging.warning(f"Histogram comparison failed: {e}")
        return False


async def ai_compare_scenes(frame_a, frame_b) -> bool:
    """
    Use AI vision to determine if two frames are from the same continuous
    scene/event/setting (e.g., same concert from different angles, same
    sunset from different perspectives). Returns True if they should be merged.
    """
    try:
        llm_provider = os.environ.get('LLM_PROVIDER', 'openai')
        llm_model = os.environ.get('LLM_MODEL', 'gpt-4o')
        
        b64_a = frame_to_base64(frame_a)
        b64_b = frame_to_base64(frame_b)
        
        chat = LlmChat(
            api_key=API_KEY,
            session_id=f"merge_{uuid.uuid4()}",
            system_message="You determine whether two video frames are from the same continuous scene, event, or setting. Respond with ONLY 'YES' or 'NO'. Answer YES if they show the same location, event, or setting from different angles or moments. Answer NO if they show clearly different locations or unrelated content."
        ).with_model(llm_provider, llm_model)
        
        image_a = ImageContent(image_base64=b64_a)
        image_b = ImageContent(image_base64=b64_b)
        
        user_message = UserMessage(
            text="Are these two frames from the same scene, event, or setting? Reply ONLY 'YES' or 'NO'.",
            file_contents=[image_a, image_b]
        )
        
        response = await chat.send_message(user_message)
        answer = response.strip().upper()
        
        is_same = answer.startswith("YES")
        logging.info(f"AI scene comparison: {answer} -> {'merge' if is_same else 'keep separate'}")
        return is_same
    except Exception as e:
        logging.warning(f"AI scene comparison failed: {e}, falling back to histogram")
        return compare_scene_similarity(frame_a, frame_b)


async def merge_similar_scenes(scenes: list) -> list:
    """
    Merge consecutive scenes that are from the same setting/event.
    Uses AI vision to understand semantic similarity (e.g., same concert
    from different camera angles, same sunset from different perspectives).
    Falls back to histogram comparison if AI is unavailable.
    """
    if len(scenes) <= 1:
        return scenes
    
    merged = [scenes[0]]
    
    for i in range(1, len(scenes)):
        current = scenes[i]
        last_merged = merged[-1]
        
        # First try quick histogram check - if very similar, merge immediately
        if compare_scene_similarity(last_merged['frame'], current['frame']):
            logging.info(f"Merging scene at {current['timestamp']:.1f}s (histogram match)")
            continue
        
        # Use AI to check semantic similarity
        should_merge = await ai_compare_scenes(last_merged['frame'], current['frame'])
        
        if should_merge:
            logging.info(f"Merging scene at {current['timestamp']:.1f}s with scene at {last_merged['timestamp']:.1f}s (AI: same setting)")
        else:
            merged.append(current)
    
    if len(merged) < len(scenes):
        logging.info(f"Scene merging: {len(scenes)} scenes reduced to {len(merged)} scenes")
    
    return merged

def frame_to_base64(frame):
    """Convert OpenCV frame to base64 string"""
    _, buffer = cv2.imencode('.jpg', frame)
    return base64.b64encode(buffer).decode('utf-8')

def get_ffmpeg_path() -> str:
    """Get FFmpeg path from imageio_ffmpeg (bundled with moviepy). No system install needed."""
    try:
        import imageio_ffmpeg
        path = imageio_ffmpeg.get_ffmpeg_exe()
        if os.path.exists(path):
            return path
    except Exception:
        pass
    
    # Fallback to system FFmpeg
    ffmpeg_path = shutil.which('ffmpeg')
    if ffmpeg_path:
        return ffmpeg_path
    
    raise FileNotFoundError("FFmpeg binary not found. Please install moviepy: pip install moviepy")


async def generate_description(frame_base64: str, language: str = "en", num_sentences: str = "1") -> str:
    """Generate WCAG-compliant audio description for a frame in specified language"""
    try:
        llm_provider = os.environ.get('LLM_PROVIDER', 'openai')
        llm_model = os.environ.get('LLM_MODEL', 'gpt-4o')
        
        # Language-specific instructions
        language_names = {
            "en": "English", "es": "Spanish", "fr": "French", "de": "German",
            "it": "Italian", "pt": "Portuguese", "ru": "Russian", "ja": "Japanese",
            "zh": "Chinese", "ar": "Arabic"
        }
        lang_name = language_names.get(language, "English")
        
        # Description length instructions
        length_instructions = {
            "1": "ONE SHORT SENTENCE (under 10 words)",
            "2": "TWO SENTENCES (total under 20 words)",
            "5": "FIVE SENTENCES (total under 50 words)"
        }
        length_instruction = length_instructions.get(num_sentences, "ONE SHORT SENTENCE (under 10 words)")
        
        chat = LlmChat(
            api_key=API_KEY,
            session_id=f"scene_{uuid.uuid4()}",
            system_message=f"You are an expert at creating WCAG 1.2.3 Level AA compliant audio descriptions. Provide {length_instruction} in {lang_name} describing the visual information. Be direct and concise."
        ).with_model(llm_provider, llm_model)
        
        image_content = ImageContent(image_base64=frame_base64)
        
        user_message = UserMessage(
            text=f"Describe this scene in {length_instruction} in {lang_name}. Focus on the most important visual elements.",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        return response.strip()
    except Exception as e:
        logging.error(f"Error generating description: {e}")
        return "Scene description unavailable."

async def generate_audio(text: str, output_path: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> float:
    """Generate audio from text using ElevenLabs TTS with gTTS fallback"""
    try:
        import httpx
        from mutagen.mp3 import MP3
        
        elevenlabs_api_key = os.environ.get('ELEVENLABS_API_KEY', '')
        
        if not elevenlabs_api_key:
            logging.warning("ElevenLabs API key not found, using gTTS fallback")
            return await generate_audio_gtts(text, output_path)
        
        logging.info(f"Attempting ElevenLabs TTS with voice {voice_id}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": elevenlabs_api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            )
            
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                
                logging.info("ElevenLabs TTS successful")
                
                # Calculate audio duration
                try:
                    audio = MP3(output_path)
                    return audio.info.length
                except Exception:
                    word_count = len(text.split())
                    return (word_count / 150) * 60
            else:
                logging.warning(f"ElevenLabs TTS failed: {response.status_code} - {response.text}")
                logging.info("Falling back to gTTS")
                return await generate_audio_gtts(text, output_path)
                
    except Exception as e:
        logging.error(f"ElevenLabs error: {e}, falling back to gTTS")
        return await generate_audio_gtts(text, output_path)

async def generate_audio_gtts(text: str, output_path: str) -> float:
    """Fallback audio generation using gTTS"""
    try:
        from gtts import gTTS
        from mutagen.mp3 import MP3
        
        logging.info("Using gTTS for audio generation")
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(output_path)
        
        # Calculate audio duration
        try:
            audio = MP3(output_path)
            return audio.info.length
        except Exception:
            word_count = len(text.split())
            return (word_count / 150) * 60
    except Exception as e:
        logging.error(f"gTTS generation error: {e}")
        # Return estimated duration even if generation fails
        word_count = len(text.split())
        return (word_count / 150) * 60

# Routes
@api_router.get("/")
async def root():
    return {"message": "Video Voice Description API"}

@api_router.get("/languages")
async def get_languages():
    """Get available languages for description generation"""
    languages = [
        {"code": "en", "name": "English"},
        {"code": "es", "name": "Spanish"},
        {"code": "fr", "name": "French"},
        {"code": "de", "name": "German"},
        {"code": "it", "name": "Italian"},
        {"code": "pt", "name": "Portuguese"},
        {"code": "ru", "name": "Russian"},
        {"code": "ja", "name": "Japanese"},
        {"code": "zh", "name": "Chinese (Mandarin)"},
        {"code": "ar", "name": "Arabic"}
    ]
    return {"languages": languages}

@api_router.get("/voices")
async def get_voices():
    """Get pre-selected high-quality voices from ElevenLabs"""
    voices = [
        {
            "voice_id": "21m00Tcm4TlvDq8ikWAM",
            "name": "Rachel",
            "description": "Calm, clear, professional female voice",
            "gender": "female"
        },
        {
            "voice_id": "AZnzlk1XvdvUeBnXmlld",
            "name": "Domi",
            "description": "Confident, strong female voice",
            "gender": "female"
        },
        {
            "voice_id": "EXAVITQu4vr4xnSDxMaL",
            "name": "Bella",
            "description": "Soft, warm female voice",
            "gender": "female"
        },
        {
            "voice_id": "ErXwobaYiN019PkySvjV",
            "name": "Antoni",
            "description": "Clear, well-rounded male voice",
            "gender": "male"
        },
        {
            "voice_id": "VR6AewLTigWG4xSOukaG",
            "name": "Arnold",
            "description": "Deep, authoritative male voice",
            "gender": "male"
        }
    ]
    return {"voices": voices}

@api_router.get("/usage")
async def get_usage(current_user: dict = Depends(get_current_user)):
    """Get current user's subscription and usage info"""
    user_email = current_user["email"]
    subscription_tier = current_user.get("subscription_tier", "free")
    
    # Get current month's usage
    usage = await get_or_create_usage(user_email, subscription_tier)
    
    # Get tier config
    tier_config = TIER_LIMITS.get(subscription_tier, TIER_LIMITS["free"])
    
    return {
        "subscription_tier": subscription_tier,
        "tier_name": tier_config["name"],
        "videos_uploaded": usage["videos_uploaded"],
        "max_videos": tier_config["max_videos_per_month"],
        "max_duration_seconds": tier_config["max_video_duration_seconds"],
        "allowed_formats": tier_config["allowed_formats"],
        "month": usage["month"]
    }

@api_router.post("/upload", response_model=ProjectData)
async def upload_video(
    file: UploadFile = File(...), 
    language: str = Form("en"),
    voice_id: str = Form(...),
    description_length: str = Form("1"),
    generate_transcript: bool = Form(False),
    generate_captions: bool = Form(False),
    embed_captions: bool = Form(False),
    current_user: dict = Depends(get_current_user)
):
    """Upload a video file with language, voice, description length, and transcript/caption options (requires authentication)"""
    try:
        # Generate unique filename
        project_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        video_filename = f"{project_id}{file_extension}"
        video_path = UPLOADS_DIR / video_filename
        
        # Save uploaded file temporarily to check duration
        with open(video_path, 'wb') as f:
            shutil.copyfileobj(file.file, f)
        
        # Get video duration
        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        video_duration = frame_count / fps if fps > 0 else 0
        cap.release()
        
        # Check if upload is allowed
        allowed, reason = await check_upload_allowed(current_user["email"], video_duration)
        if not allowed:
            # Delete the uploaded file
            os.remove(video_path)
            raise HTTPException(status_code=403, detail=reason)
        
        # Create project in database with user tracking
        project = ProjectData(
            id=project_id,
            video_path=str(video_path),
            original_filename=file.filename,
            user_email=current_user["email"],
            folder="all",
            duration=video_duration,
            language=language,
            voice_id=voice_id,
            description_length=description_length,
            generate_transcript=generate_transcript,
            generate_captions=generate_captions,
            embed_captions=embed_captions
        )
        
        doc = project.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        if doc.get('trashed_at'):
            doc['trashed_at'] = doc['trashed_at'].isoformat()
        
        await db.projects.insert_one(doc)
        
        # Increment usage counter
        await increment_usage(current_user["email"])
        
        return project
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error uploading video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/analyze/{project_id}")
async def analyze_video(project_id: str, current_user: dict = Depends(get_current_user)):
    """Analyze video for scene cuts and generate descriptions (requires authentication)"""
    try:
        # Get project and verify ownership
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify user owns this project
        if project.get("user_email") != current_user["email"]:
            raise HTTPException(status_code=403, detail="You don't have permission to access this project")
        
        # Update status
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"status": "processing"}}
        )
        
        video_path = project['video_path']
        
        # Detect scenes
        raw_scenes = detect_scene_cuts(video_path)
        
        # Merge consecutive similar scenes (e.g., same concert from different angles)
        scenes = await merge_similar_scenes(raw_scenes)
        
        # Create project directory for thumbnails and audio
        project_dir = UPLOADS_DIR / project_id
        project_dir.mkdir(exist_ok=True)
        
        # Process each scene
        scene_docs = []
        for i, scene in enumerate(scenes):
            try:
                # Save thumbnail
                thumbnail_path = project_dir / f"frame_{i}.jpg"
                cv2.imwrite(str(thumbnail_path), scene['frame'])
                
                # Generate description
                frame_base64 = frame_to_base64(scene['frame'])
                language = project.get('language', 'en')
                description_length = project.get('description_length', '1')
                description = await generate_description(frame_base64, language, description_length)
                
                # Generate audio
                audio_path = project_dir / f"audio_{i}.mp3"
                voice_id = project.get('voice_id', '21m00Tcm4TlvDq8ikWAM')  # Default to Rachel
                duration = await generate_audio(description, str(audio_path), voice_id)
                
                # Create scene document
                scene_data = SceneData(
                    project_id=project_id,
                    frame_number=scene['frame_number'],
                    timestamp=scene['timestamp'],
                    thumbnail_path=str(thumbnail_path),
                    description=description,
                    audio_path=str(audio_path),
                    duration=duration
                )
                
                scene_doc = scene_data.model_dump()
                scene_docs.append(scene_doc)
            except Exception as scene_err:
                logging.error(f"Error processing scene {i}: {scene_err}")
                # Continue with remaining scenes instead of failing entirely
                continue
        
        # Save scenes to database
        if scene_docs:
            await db.scenes.insert_many(scene_docs)
        
        # Update project
        await db.projects.update_one(
            {"id": project_id},
            {
                "$set": {
                    "status": "analyzed",
                    "total_scenes": len(scene_docs),
                    "scenes_before_merge": len(raw_scenes),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Auto-trigger transcription if requested during upload
        transcript_result = None
        if project.get("generate_transcript") or project.get("generate_captions"):
            try:
                logging.info(f"Auto-generating transcript for project {project_id}")
                from services.transcription import process_video_transcription
                
                language = project.get("language", "en")
                transcript_text, srt_content, vtt_content = await process_video_transcription(
                    video_path, language
                )
                
                if transcript_text:
                    await db.projects.update_one(
                        {"id": project_id},
                        {"$set": {
                            "transcript_text": transcript_text,
                            "transcript_srt": srt_content,
                            "transcript_vtt": vtt_content,
                        }}
                    )
                    transcript_result = {
                        "has_transcript": True,
                        "has_srt": srt_content is not None,
                        "has_vtt": vtt_content is not None
                    }
                    logging.info(f"Transcription complete for project {project_id}")
                else:
                    logging.warning(f"Transcription returned empty for project {project_id}")
                    transcript_result = {"has_transcript": False}
            except Exception as te:
                logging.error(f"Transcription failed for project {project_id}: {te}")
                transcript_result = {"has_transcript": False, "error": str(te)}
        
        return {
            "status": "success",
            "total_scenes": len(scene_docs),
            "scenes_detected": len(raw_scenes),
            "scenes_merged": len(raw_scenes) - len(scenes),
            "transcription": transcript_result
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error analyzing video: {e}")
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"status": "error", "error_message": str(e)}}
        )
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# Transcription endpoints
@api_router.post("/transcribe/{project_id}")
async def transcribe_video(project_id: str, current_user: dict = Depends(get_current_user)):
    """Generate transcript and captions for a video (requires authentication)"""
    try:
        from services.transcription import process_video_transcription
        
        # Get project and verify ownership
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_email") != current_user["email"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        video_path = project.get("video_path")
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        language = project.get("language", "en")
        
        # Process transcription
        transcript_text, srt_content, vtt_content = await process_video_transcription(
            video_path, language
        )
        
        if not transcript_text:
            raise HTTPException(status_code=500, detail="Transcription failed")
        
        # Update project with transcript data
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {
                "transcript_text": transcript_text,
                "transcript_srt": srt_content,
                "transcript_vtt": vtt_content,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "success": True,
            "transcript_text": transcript_text,
            "has_srt": srt_content is not None,
            "has_vtt": vtt_content is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error transcribing video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/transcript/{project_id}")
async def get_transcript(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get transcript data for a project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.get("user_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "transcript_text": project.get("transcript_text"),
        "has_srt": project.get("transcript_srt") is not None,
        "has_vtt": project.get("transcript_vtt") is not None
    }


@api_router.get("/captions/{project_id}/{format}")
async def download_captions(
    project_id: str, 
    format: str,
    current_user: dict = Depends(get_current_user)
):
    """Download captions in SRT or VTT format"""
    if format not in ["srt", "vtt", "txt"]:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'srt', 'vtt', or 'txt'")
    
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.get("user_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if format == "srt":
        content = project.get("transcript_srt")
        media_type = "application/x-subrip"
        filename = f"{project.get('original_filename', 'captions')}.srt"
    elif format == "vtt":
        content = project.get("transcript_vtt")
        media_type = "text/vtt"
        filename = f"{project.get('original_filename', 'captions')}.vtt"
    else:  # txt
        content = project.get("transcript_text")
        media_type = "text/plain"
        filename = f"{project.get('original_filename', 'transcript')}.txt"
    
    if not content:
        raise HTTPException(status_code=404, detail=f"No {format.upper()} content available. Generate transcript first.")
    
    from fastapi.responses import Response
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@api_router.get("/projects", response_model=List[ProjectData])
async def get_projects(folder: str = "all", search: str = None, current_user: dict = Depends(get_current_user)):
    """Get all projects for the current user, optionally filtered by folder and search"""
    from datetime import timedelta
    
    # Build query
    query = {"user_email": current_user["email"]}
    
    # Filter by folder
    if folder == "all":
        query["folder"] = {"$ne": "trash"}
    elif folder == "recent":
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        query["folder"] = {"$ne": "trash"}
        query["created_at"] = {"$gte": seven_days_ago}
    else:
        query["folder"] = folder
    
    # Search filter
    if search:
        query["original_filename"] = {"$regex": search, "$options": "i"}
    
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for project in projects:
        if isinstance(project.get('created_at'), str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project.get('updated_at'), str):
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])
        if isinstance(project.get('trashed_at'), str):
            project['trashed_at'] = datetime.fromisoformat(project['trashed_at'])
    
    return projects

@api_router.get("/projects/{project_id}", response_model=ProjectData)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get project by ID (only if user owns it)"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify user owns this project
    if project.get("user_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="You don't have permission to access this project")
    
    if isinstance(project.get('created_at'), str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    if isinstance(project.get('updated_at'), str):
        project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    
    return project

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    """Update project metadata (e.g., rename)"""
    try:
        # Get project and verify ownership
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify user owns this project
        if project.get("user_email") != current_user["email"]:
            raise HTTPException(status_code=403, detail="You don't have permission to update this project")
        
        # Update allowed fields
        allowed_fields = {"original_filename"}
        update_dict = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if update_dict:
            update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.projects.update_one(
                {"id": project_id},
                {"$set": update_dict}
            )
        
        return {"success": True, "message": "Project updated successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Delete project and all associated data"""
    try:
        # Get project and verify ownership
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify user owns this project
        if project.get("user_email") != current_user["email"]:
            raise HTTPException(status_code=403, detail="You don't have permission to delete this project")
        
        # Delete project files
        video_path = project.get("video_path")
        if video_path and os.path.exists(video_path):
            os.remove(video_path)
        
        # Delete exported files
        project_dir = UPLOADS_DIR / project_id
        if project_dir.exists():
            import shutil
            shutil.rmtree(project_dir)
        
        # Delete scenes from database
        await db.scenes.delete_many({"project_id": project_id})
        
        # Delete project from database
        await db.projects.delete_one({"id": project_id})
        
        return {"success": True, "message": "Project deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

@api_router.put("/projects/{project_id}/move")
async def move_project_to_folder(project_id: str, update: ProjectUpdate, current_user: dict = Depends(get_current_user)):
    """Move project to a folder/category"""
    try:
        # Verify user owns this project
        project = await db.projects.find_one({"id": project_id, "user_email": current_user["email"]}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        update_data = {}
        if update.folder is not None:
            update_data["folder"] = update.folder
            if update.folder == "trash":
                update_data["trashed_at"] = datetime.now(timezone.utc)
            else:
                update_data["trashed_at"] = None
        
        if update.original_filename is not None:
            update_data["original_filename"] = update.original_filename
        
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        await db.projects.update_one(
            {"id": project_id},
            {"$set": update_data}
        )
        
        return {"success": True, "message": "Project updated successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/projects/bulk-action")
async def bulk_action(request: BulkActionRequest, current_user: dict = Depends(get_current_user)):
    """Perform bulk actions on multiple projects"""
    try:
        user_email = current_user["email"]
        
        # Verify all projects belong to user
        projects = await db.projects.find({
            "id": {"$in": request.project_ids},
            "user_email": user_email
        }, {"_id": 0}).to_list(100)
        
        if len(projects) != len(request.project_ids):
            raise HTTPException(status_code=403, detail="Some projects not found or unauthorized")
        
        if request.action == "move_to_folder":
            if not request.folder:
                raise HTTPException(status_code=400, detail="Folder name required")
            
            await db.projects.update_many(
                {"id": {"$in": request.project_ids}},
                {"$set": {
                    "folder": request.folder,
                    "trashed_at": None,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            
        elif request.action == "move_to_trash":
            await db.projects.update_many(
                {"id": {"$in": request.project_ids}},
                {"$set": {
                    "folder": "trash",
                    "trashed_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            
        elif request.action == "restore":
            await db.projects.update_many(
                {"id": {"$in": request.project_ids}},
                {"$set": {
                    "folder": "all",
                    "trashed_at": None,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            
        elif request.action == "delete_permanent":
            # Only allow permanent deletion of trashed items
            for project in projects:
                if project.get("folder") != "trash":
                    raise HTTPException(status_code=400, detail="Can only permanently delete trashed items")
                
                # Delete files
                video_path = project.get("video_path")
                if video_path and os.path.exists(video_path):
                    os.remove(video_path)
                
                project_dir = UPLOADS_DIR / project["id"]
                if project_dir.exists():
                    shutil.rmtree(project_dir)
                
                # Delete scenes
                await db.scenes.delete_many({"project_id": project["id"]})
            
            # Delete projects
            await db.projects.delete_many({"id": {"$in": request.project_ids}})
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        return {"success": True, "message": f"Bulk action '{request.action}' completed", "count": len(request.project_ids)}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in bulk action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/folders")
async def get_folders(current_user: dict = Depends(get_current_user)):
    """Get all folders/categories with project counts"""
    try:
        user_email = current_user["email"]
        
        # Get all projects for this user
        projects = await db.projects.find({"user_email": user_email}, {"_id": 0, "folder": 1}).to_list(1000)
        
        # Count projects by folder
        folder_counts = {}
        for project in projects:
            folder = project.get("folder", "all")
            folder_counts[folder] = folder_counts.get(folder, 0) + 1
        
        # Get total and recent counts
        from datetime import timedelta
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        
        total_count = len([p for p in projects if p.get("folder") != "trash"])
        recent_count = len(await db.projects.find({
            "user_email": user_email,
            "folder": {"$ne": "trash"},
            "created_at": {"$gte": seven_days_ago}
        }, {"_id": 0}).to_list(1000))
        
        trash_count = folder_counts.get("trash", 0)
        
        folders = [
            {"id": "all", "name": "All Projects", "count": total_count, "icon": "folder"},
            {"id": "recent", "name": "Recent", "count": recent_count, "icon": "clock"},
            {"id": "trash", "name": "Trash", "count": trash_count, "icon": "trash"}
        ]
        
        # Add custom folders
        custom_folders = set([f for f in folder_counts.keys() if f not in ["all", "recent", "trash"]])
        for folder_id in sorted(custom_folders):
            folders.append({
                "id": folder_id,
                "name": folder_id.replace("_", " ").title(),
                "count": folder_counts[folder_id],
                "icon": "folder"
            })
        
        return {"folders": folders}
        
    except Exception as e:
        logger.error(f"Error getting folders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/projects/{project_id}/scenes", response_model=List[SceneData])
async def get_scenes(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get all scenes for a project (only if user owns it)"""
    # Verify user owns this project
    project = await db.projects.find_one({"id": project_id, "user_email": current_user["email"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or you don't have permission")
    
    scenes = await db.scenes.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    return scenes

@api_router.post("/scenes/merge")
async def merge_scenes(request: Request, current_user: dict = Depends(get_current_user)):
    """Merge multiple scenes into one, keeping the first scene's description and thumbnail."""
    try:
        body = await request.json()
        scene_ids = body.get("scene_ids", [])
        
        if len(scene_ids) < 2:
            raise HTTPException(status_code=400, detail="At least 2 scenes are required to merge")
        
        # Fetch all scenes and verify ownership
        scenes_to_merge = []
        for sid in scene_ids:
            scene = await db.scenes.find_one({"id": sid}, {"_id": 0})
            if not scene:
                raise HTTPException(status_code=404, detail=f"Scene {sid} not found")
            scenes_to_merge.append(scene)
        
        # Verify all scenes belong to the same project
        project_ids = set(s["project_id"] for s in scenes_to_merge)
        if len(project_ids) > 1:
            raise HTTPException(status_code=400, detail="All scenes must belong to the same project")
        
        project_id = scenes_to_merge[0]["project_id"]
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project or project.get("user_email") != current_user["email"]:
            raise HTTPException(status_code=403, detail="You don't have permission to modify these scenes")
        
        # Sort by timestamp to keep the earliest scene
        scenes_to_merge.sort(key=lambda s: s.get("timestamp", 0))
        
        # Keep the first scene (earliest timestamp), delete the rest
        keep_scene = scenes_to_merge[0]
        delete_scenes = scenes_to_merge[1:]
        
        # Delete the merged-away scenes and their files
        project_dir = UPLOADS_DIR / project_id
        for scene in delete_scenes:
            if scene.get("audio_path"):
                audio_file = project_dir / Path(scene["audio_path"]).name
                if audio_file.exists():
                    os.remove(str(audio_file))
            if scene.get("thumbnail_path"):
                thumb_file = project_dir / Path(scene["thumbnail_path"]).name
                if thumb_file.exists():
                    os.remove(str(thumb_file))
            await db.scenes.delete_one({"id": scene["id"]})
        
        # Update project total_scenes count
        remaining = await db.scenes.count_documents({"project_id": project_id})
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"total_scenes": remaining}}
        )
        
        return {
            "status": "success",
            "kept_scene_id": keep_scene["id"],
            "deleted_count": len(delete_scenes),
            "remaining_scenes": remaining
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error merging scenes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/scenes/{scene_id}")
async def update_scene(scene_id: str, update: SceneUpdate, current_user: dict = Depends(get_current_user)):
    """Update scene description and regenerate audio (requires authentication)"""
    try:
        # Get scene
        scene = await db.scenes.find_one({"id": scene_id}, {"_id": 0})
        if not scene:
            raise HTTPException(status_code=404, detail="Scene not found")
        
        # Verify user owns the project this scene belongs to
        project = await db.projects.find_one({"id": scene["project_id"]}, {"_id": 0})
        if not project or project.get("user_email") != current_user["email"]:
            raise HTTPException(status_code=403, detail="You don't have permission to edit this scene")
        
        # Regenerate audio with new description
        audio_path = scene['audio_path']
        voice_id = project.get('voice_id', '21m00Tcm4TlvDq8ikWAM')  # Default to Rachel
        duration = await generate_audio(update.description, audio_path, voice_id)
        
        # Update scene
        await db.scenes.update_one(
            {"id": scene_id},
            {
                "$set": {
                    "description": update.description,
                    "duration": duration
                }
            }
        )
        
        return {"status": "success", "duration": duration}
    except Exception as e:
        logging.error(f"Error updating scene: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/scenes/{scene_id}")
async def delete_scene(scene_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a scene (requires authentication)"""
    try:
        # Get scene
        scene = await db.scenes.find_one({"id": scene_id}, {"_id": 0})
        if not scene:
            raise HTTPException(status_code=404, detail="Scene not found")
        
        # Verify user owns the project this scene belongs to
        project = await db.projects.find_one({"id": scene["project_id"]}, {"_id": 0})
        if not project or project.get("user_email") != current_user["email"]:
            raise HTTPException(status_code=403, detail="You don't have permission to delete this scene")
        
        # Delete scene files if they exist
        project_dir = UPLOADS_DIR / scene["project_id"]
        if scene.get("audio_path"):
            audio_file = project_dir / Path(scene["audio_path"]).name
            if audio_file.exists():
                os.remove(audio_file)
        
        if scene.get("thumbnail_path"):
            thumb_file = project_dir / Path(scene["thumbnail_path"]).name
            if thumb_file.exists():
                os.remove(thumb_file)
        
        # Delete scene from database
        await db.scenes.delete_one({"id": scene_id})
        
        # Update project total_scenes count
        remaining_scenes = await db.scenes.count_documents({"project_id": scene["project_id"]})
        await db.projects.update_one(
            {"id": scene["project_id"]},
            {"$set": {"total_scenes": remaining_scenes}}
        )
        
        return {"status": "success", "message": "Scene deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error deleting scene: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/thumbnail/{project_id}/{filename}")
async def get_thumbnail(project_id: str, filename: str):
    """Serve thumbnail image"""
    file_path = UPLOADS_DIR / project_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(file_path)

@api_router.get("/audio/{project_id}/{filename}")
async def get_audio(project_id: str, filename: str, current_user: dict = Depends(get_current_user)):
    """Serve audio file (requires authentication)"""
    # Verify user owns this project
    project = await db.projects.find_one({"id": project_id, "user_email": current_user["email"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    file_path = UPLOADS_DIR / project_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(file_path, media_type="audio/mpeg")

class ExportRequest(BaseModel):
    format: str = "mp4"  # mp4, avi, mov
    embed_captions: bool = False

@api_router.post("/export/{project_id}")
async def export_video(project_id: str, export_req: ExportRequest, current_user: dict = Depends(get_current_user)):
    """Export final video with audio descriptions (requires authentication)"""
    try:
        import tempfile
        
        # Check if export format is allowed for user's subscription tier
        subscription_tier = current_user.get("subscription_tier", "free")
        tier_config = TIER_LIMITS.get(subscription_tier, TIER_LIMITS["free"])
        
        if export_req.format not in tier_config["allowed_formats"]:
            allowed_str = ", ".join(tier_config["allowed_formats"]).upper()
            raise HTTPException(
                status_code=403, 
                detail=f"Format {export_req.format.upper()} not available in your {tier_config['name']} plan. Allowed formats: {allowed_str}"
            )
        
        # Get project and verify ownership
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify user owns this project
        if project.get("user_email") != current_user["email"]:
            raise HTTPException(status_code=403, detail="You don't have permission to export this project")
        
        scenes = await db.scenes.find({"project_id": project_id}, {"_id": 0}).sort("frame_number").to_list(1000)
        
        if not scenes:
            raise HTTPException(status_code=400, detail="No scenes found")
        
        video_path = project['video_path']
        output_format = export_req.format.lower()
        
        # Validate format
        if output_format not in ['mp4', 'avi', 'mov']:
            raise HTTPException(status_code=400, detail="Format must be mp4, avi, or mov")
        
        # Create output filename
        output_filename = f"exported_{project_id}.{output_format}"
        output_path = Path(f"/tmp/{output_filename}")
        project_dir = UPLOADS_DIR / project_id
        
        # Get bundled FFmpeg path (from moviepy/imageio_ffmpeg)
        try:
            ffmpeg_path = get_ffmpeg_path()
            logger.info(f"Using FFmpeg at: {ffmpeg_path}")
        except FileNotFoundError as e:
            logger.error(f"FFmpeg not found: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail="Video processing libraries are not properly installed. Please contact support."
            )
        
        # Get video properties
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        video_duration = total_frames / fps
        cap.release()
        
        # Create segments for each scene
        segment_files = []
        concat_file = Path(f"/tmp/concat_list_{project_id}.txt")
        
        for i, scene in enumerate(scenes):
            # Calculate scene boundaries
            scene_start_time = scene['timestamp']
            
            # End time is either the next scene's timestamp or video end
            if i < len(scenes) - 1:
                scene_end_time = scenes[i + 1]['timestamp']
            else:
                scene_end_time = video_duration
            
            # Full segment duration (the actual video length for this scene)
            full_segment_duration = scene_end_time - scene_start_time
            
            # Skip if segment is too short
            if full_segment_duration < 0.1:
                continue
            
            # Audio description duration
            audio_duration = scene['duration'] if scene['duration'] > 0 else 2.0
            
            # Step 1: Create still frame video with audio description (first frame paused)
            still_output = Path(f"/tmp/still_{project_id}_{i}.mp4")
            
            still_cmd = [
                ffmpeg_path, "-y",
                "-loop", "1",
                "-i", scene['thumbnail_path'],
                "-i", scene['audio_path'],
                "-c:v", "libx264",
                "-t", str(audio_duration),
                "-pix_fmt", "yuv420p",
                "-vf", f"fps={fps},scale=trunc(iw/2)*2:trunc(ih/2)*2",
                "-c:a", "aac",
                "-b:a", "128k",
                "-ar", "44100",
                "-ac", "1",
                "-shortest",
                "-preset", "fast",
                str(still_output)
            ]
            
            result = subprocess.run(still_cmd, capture_output=True, text=True, timeout=180)
            if result.returncode != 0:
                logging.error(f"Still frame creation error: {result.stderr}")
                continue
            
            segment_files.append(str(still_output))
            
            # Step 2: Extract FULL video segment with SILENT audio track
            # This plays the entire scene from start to end (or next scene)
            # We add silent audio so concatenation maintains continuous audio stream
            video_segment_output = Path(f"/tmp/segment_{project_id}_{i}.mp4")
            
            segment_cmd = [
                ffmpeg_path, "-y",
                "-ss", str(scene_start_time),
                "-i", video_path,
                "-f", "lavfi",
                "-i", "anullsrc=channel_layout=mono:sample_rate=44100",
                "-t", str(full_segment_duration),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-b:a", "128k",
                "-ar", "44100",
                "-ac", "1",
                "-shortest",
                "-preset", "fast",
                str(video_segment_output)
            ]
            
            result = subprocess.run(segment_cmd, capture_output=True, text=True, timeout=180)
            if result.returncode != 0:
                logging.error(f"Segment extraction error: {result.stderr}")
                continue
            
            segment_files.append(str(video_segment_output))
            
            logging.info(f"Scene {i+1}: Still={audio_duration}s + Video={full_segment_duration}s = Total={audio_duration + full_segment_duration}s")
        
        # Create concat file
        with open(concat_file, 'w') as f:
            for segment in segment_files:
                f.write(f"file '{segment}'\n")
        
        # Concatenate all segments using concat protocol
        # This properly handles audio/video synchronization
        
        # Set codec based on format
        codec_args = []
        if output_format == "mp4":
            codec_args = ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-ar", "44100"]
        elif output_format == "avi":
            codec_args = ["-c:v", "libx264", "-c:a", "mp3", "-b:a", "128k", "-ar", "44100"]
        elif output_format == "mov":
            codec_args = ["-c:v", "libx264", "-c:a", "aac", "-b:a", "128k", "-ar", "44100"]
        
        concat_cmd = [
            ffmpeg_path, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-vsync", "vfr"  # Variable frame rate sync
        ] + codec_args + [
            "-max_muxing_queue_size", "4096",
            str(output_path)
        ]
        
        logging.info(f"Concatenating: {' '.join(concat_cmd)}")
        result = subprocess.run(concat_cmd, capture_output=True, text=True, timeout=600)
        
        if result.returncode != 0:
            logging.error(f"FFmpeg concat error: {result.stderr}")
            raise HTTPException(status_code=500, detail=f"Video export failed: {result.stderr}")
        
        # Keep temporary files for debugging (comment out to clean)
        # for segment in segment_files:
        #     try:
        #         Path(segment).unlink()
        #     except:
        #         pass
        # try:
        #     concat_file.unlink()
        # except:
        #     pass
        logging.info(f"Kept segment files for debugging in {project_dir}")
        
        # Embed captions if requested
        if export_req.embed_captions:
            project_data = await db.projects.find_one({"id": project_id}, {"_id": 0})
            srt_content = project_data.get("transcript_srt") if project_data else None
            
            if srt_content:
                # Place captioned output on the same filesystem as output_path to avoid
                # EXDEV (cross-device link) errors when /tmp and /app/backend/uploads are
                # mounted on different filesystems.
                captioned_output = output_path.parent / f"captioned_{project_id}.{output_format}"
                from services.transcription import embed_captions_in_video
                success = await embed_captions_in_video(str(output_path), srt_content, str(captioned_output))
                if success and captioned_output.exists():
                    # Replace original with captioned version (same filesystem -> safe os.replace)
                    shutil.move(str(captioned_output), str(output_path))
                    logging.info("Captions embedded successfully")
                else:
                    logging.warning("Caption embedding failed, exporting without captions")
            else:
                logging.warning("No SRT content available for caption embedding")
        
        # Update project status
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"status": "completed"}}
        )
        
        return {
            "status": "success",
            "message": "Video exported successfully",
            "download_url": f"/api/download/{project_id}/{output_filename}",
            "format": output_format
        }
    except HTTPException as e:
        raise e
    except subprocess.TimeoutExpired:
        logging.error("FFmpeg timeout")
        raise HTTPException(status_code=500, detail="Video export timeout")
    except Exception as e:
        logging.error(f"Error exporting video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/download/{project_id}/{filename}")
async def download_video(project_id: str, filename: str):
    """Download exported video"""
    for search_dir in [Path("/tmp"), UPLOADS_DIR]:
        file_path = search_dir / filename
        if file_path.exists():
            return FileResponse(
                file_path, 
                filename=filename, 
                media_type="application/octet-stream",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )
    raise HTTPException(status_code=404, detail="File not found")

# Import auth routes
from routes import auth as auth_routes
from routes import payments as payment_routes

# Include the router in the main app
app.include_router(api_router)
app.include_router(auth_routes.router)
app.include_router(payment_routes.router)

# Stripe Webhook endpoint (must be outside authenticated routes)
@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    try:
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Get request body
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Stripe webhook received: {webhook_response.event_type}")
        
        # If payment succeeded, update user subscription
        if webhook_response.event_type == "checkout.session.completed":
            if webhook_response.payment_status == "paid":
                metadata = webhook_response.metadata or {}
                user_email = metadata.get("user_email")
                tier = metadata.get("tier")
                package_id = metadata.get("package_id")
                
                if user_email and tier:
                    # Update transaction
                    await db.payment_transactions.update_one(
                        {"session_id": webhook_response.session_id},
                        {
                            "$set": {
                                "payment_status": "paid",
                                "updated_at": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    
                    # Update user subscription
                    await db.users.update_one(
                        {"email": user_email},
                        {
                            "$set": {
                                "subscription_tier": tier,
                                "subscription_updated_at": datetime.now(timezone.utc).isoformat(),
                                "subscription_package": package_id
                            }
                        }
                    )
                    logger.info(f"Webhook: Upgraded {user_email} to {tier}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Stripe webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=os.environ.get(
        'CORS_ORIGIN_REGEX',
        r'https://.*\.emergentagent\.com$'
    ),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Health check endpoints for deployment
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes deployment (internal)"""
    return {"status": "healthy", "service": "gappy-describe-api"}

@app.get("/api/health")
async def api_health_check():
    """Health check endpoint accessible via Kubernetes ingress (external)"""
    return {"status": "healthy", "service": "gappy-describe-api"}

@app.on_event("startup")
async def startup_db():
    """Store database instance in app state for dependency injection"""
    app.state.db = db
    
    # Check FFmpeg availability via bundled imageio_ffmpeg
    try:
        ffmpeg_path = get_ffmpeg_path()
        logger.info(f"FFmpeg available at: {ffmpeg_path}")
    except FileNotFoundError:
        logger.warning("FFmpeg not found - video export functionality may not work. Install moviepy: pip install moviepy")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
