from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    status: str = "uploaded"  # uploaded, processing, analyzed, completed, error
    total_scenes: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SceneUpdate(BaseModel):
    description: str

class ProjectCreate(BaseModel):
    video_path: str
    original_filename: str

# Helper functions
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

def frame_to_base64(frame):
    """Convert OpenCV frame to base64 string"""
    _, buffer = cv2.imencode('.jpg', frame)
    return base64.b64encode(buffer).decode('utf-8')

async def generate_description(frame_base64: str) -> str:
    """Generate WCAG-compliant audio description for a frame"""
    try:
        chat = LlmChat(
            api_key=API_KEY,
            session_id=f"scene_{uuid.uuid4()}",
            system_message="You are an expert at creating WCAG 1.2.3 Level A compliant audio descriptions. Provide clear, concise descriptions of visual content focusing on important visual information, actions, settings, and scene changes. Keep descriptions under 15 seconds when spoken."
        ).with_model("openai", "gpt-4o")
        
        image_content = ImageContent(image_base64=frame_base64)
        
        user_message = UserMessage(
            text="Describe this scene for audio description accessibility. Focus on the environment, people, actions, and important visual details. Be concise and clear.",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logging.error(f"Error generating description: {e}")
        return "Scene description unavailable."

async def generate_audio(text: str, output_path: str) -> float:
    """Generate audio from text using OpenAI TTS"""
    # Check if user provided their own OpenAI API key for TTS
    openai_api_key = os.environ.get('OPENAI_API_KEY', '')
    
    # If no OpenAI key is provided, create a placeholder and estimate duration
    if not openai_api_key:
        logging.info("No OPENAI_API_KEY found. Using placeholder audio. Add OPENAI_API_KEY to .env for TTS.")
        # Estimate duration based on text length (roughly 150 words per minute)
        word_count = len(text.split())
        duration = (word_count / 150) * 60
        
        # Create a minimal silent MP3 file as placeholder
        try:
            from pydub import AudioSegment
            silence = AudioSegment.silent(duration=int(duration * 1000))
            silence.export(output_path, format="mp3")
        except:
            # If pydub not available, just create empty file
            with open(output_path, 'wb') as f:
                f.write(b'')
        
        return duration
    
    # Try to generate actual TTS audio
    try:
        import httpx
        from mutagen.mp3 import MP3
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "tts-1",
                    "voice": "alloy",
                    "input": text,
                    "speed": 1.0
                }
            )
            
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                
                # Calculate audio duration for MP3
                try:
                    audio = MP3(output_path)
                    duration = audio.info.length
                except:
                    # Fallback: estimate duration
                    word_count = len(text.split())
                    duration = (word_count / 150) * 60
                
                return duration
            else:
                logging.error(f"TTS API error: {response.status_code}")
                # Fallback to placeholder
                word_count = len(text.split())
                duration = (word_count / 150) * 60
                with open(output_path, 'wb') as f:
                    f.write(b'')
                return duration
    except Exception as e:
        logging.error(f"Error generating audio: {e}")
        # Fallback to placeholder
        word_count = len(text.split())
        duration = (word_count / 150) * 60
        with open(output_path, 'wb') as f:
            f.write(b'')
        return duration

# Routes
@api_router.get("/")
async def root():
    return {"message": "Video Voice Description API"}

@api_router.post("/upload", response_model=ProjectData)
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file"""
    try:
        # Generate unique filename
        project_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        video_filename = f"{project_id}{file_extension}"
        video_path = UPLOADS_DIR / video_filename
        
        # Save uploaded file
        with open(video_path, 'wb') as f:
            shutil.copyfileobj(file.file, f)
        
        # Create project in database
        project = ProjectData(
            id=project_id,
            video_path=str(video_path),
            original_filename=file.filename
        )
        
        doc = project.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.projects.insert_one(doc)
        
        return project
    except Exception as e:
        logging.error(f"Error uploading video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/analyze/{project_id}")
async def analyze_video(project_id: str):
    """Analyze video for scene cuts and generate descriptions"""
    try:
        # Get project
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update status
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"status": "processing"}}
        )
        
        video_path = project['video_path']
        
        # Detect scenes
        scenes = detect_scene_cuts(video_path)
        
        # Create project directory for thumbnails and audio
        project_dir = UPLOADS_DIR / project_id
        project_dir.mkdir(exist_ok=True)
        
        # Process each scene
        scene_docs = []
        for i, scene in enumerate(scenes):
            # Save thumbnail
            thumbnail_path = project_dir / f"frame_{i}.jpg"
            cv2.imwrite(str(thumbnail_path), scene['frame'])
            
            # Generate description
            frame_base64 = frame_to_base64(scene['frame'])
            description = await generate_description(frame_base64)
            
            # Generate audio
            audio_path = project_dir / f"audio_{i}.mp3"
            duration = await generate_audio(description, str(audio_path))
            
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
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {"status": "success", "total_scenes": len(scene_docs)}
    except Exception as e:
        logging.error(f"Error analyzing video: {e}")
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"status": "error"}}
        )
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/projects", response_model=List[ProjectData])
async def get_projects():
    """Get all projects"""
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    
    for project in projects:
        if isinstance(project.get('created_at'), str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
        if isinstance(project.get('updated_at'), str):
            project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    
    return projects

@api_router.get("/projects/{project_id}", response_model=ProjectData)
async def get_project(project_id: str):
    """Get project by ID"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if isinstance(project.get('created_at'), str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    if isinstance(project.get('updated_at'), str):
        project['updated_at'] = datetime.fromisoformat(project['updated_at'])
    
    return project

@api_router.get("/projects/{project_id}/scenes", response_model=List[SceneData])
async def get_scenes(project_id: str):
    """Get all scenes for a project"""
    scenes = await db.scenes.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    return scenes

@api_router.put("/scenes/{scene_id}")
async def update_scene(scene_id: str, update: SceneUpdate):
    """Update scene description and regenerate audio"""
    try:
        # Get scene
        scene = await db.scenes.find_one({"id": scene_id}, {"_id": 0})
        if not scene:
            raise HTTPException(status_code=404, detail="Scene not found")
        
        # Regenerate audio with new description
        audio_path = scene['audio_path']
        duration = await generate_audio(update.description, audio_path)
        
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

@api_router.get("/thumbnail/{project_id}/{filename}")
async def get_thumbnail(project_id: str, filename: str):
    """Serve thumbnail image"""
    file_path = UPLOADS_DIR / project_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(file_path)

@api_router.get("/audio/{project_id}/{filename}")
async def get_audio(project_id: str, filename: str):
    """Serve audio file"""
    file_path = UPLOADS_DIR / project_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(file_path, media_type="audio/mpeg")

@api_router.post("/export/{project_id}")
async def export_video(project_id: str):
    """Export final video with audio descriptions"""
    try:
        # Get project and scenes
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        scenes = await db.scenes.find({"project_id": project_id}, {"_id": 0}).sort("frame_number").to_list(1000)
        
        if not scenes:
            raise HTTPException(status_code=400, detail="No scenes found")
        
        # This is a placeholder - full video export would require FFmpeg
        # For MVP, we'll return the scene data for frontend to handle
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"status": "completed"}}
        )
        
        return {
            "status": "success",
            "message": "Video export data prepared",
            "scenes": scenes
        }
    except Exception as e:
        logging.error(f"Error exporting video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
