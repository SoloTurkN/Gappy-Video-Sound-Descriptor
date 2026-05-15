"""
Transcription Service using OpenAI Whisper
Generates transcripts and closed captions (SRT/VTT) from video audio
Uses pydub + imageio_ffmpeg for audio extraction (no system FFmpeg dependency)
"""
import os
import logging
from pathlib import Path
from typing import Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def _get_ffmpeg_path():
    """Get FFmpeg path from imageio_ffmpeg (bundled with moviepy)"""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


async def extract_audio_from_video(video_path: str) -> Optional[str]:
    """Extract audio from video file using pydub with bundled FFmpeg"""
    try:
        import subprocess
        ffmpeg_path = _get_ffmpeg_path()
        audio_path = video_path.rsplit('.', 1)[0] + '_audio.mp3'

        cmd = [
            ffmpeg_path, '-i', video_path,
            '-vn', '-acodec', 'libmp3lame',
            '-ar', '16000', '-ac', '1',
            '-y', audio_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            logger.error(f"Audio extraction error: {result.stderr}")
            return None

        return audio_path
    except Exception as e:
        logger.error(f"Error extracting audio: {e}")
        return None


async def transcribe_audio(audio_path: str, language: str = "en") -> Optional[dict]:
    """
    Transcribe audio using OpenAI Whisper API
    Returns dict with text, segments (with timestamps), and duration
    """
    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            logger.error("EMERGENT_LLM_KEY not configured")
            return None
        
        stt = OpenAISpeechToText(api_key=api_key)
        
        file_size = os.path.getsize(audio_path)
        if file_size > 25 * 1024 * 1024:
            logger.warning(f"Audio file too large ({file_size} bytes), may need chunking")
        
        with open(audio_path, "rb") as audio_file:
            response = await stt.transcribe(
                file=audio_file,
                model="whisper-1",
                response_format="verbose_json",
                language=language if language != "auto" else None,
                timestamp_granularities=["segment"]
            )
        
        segments = []
        
        if hasattr(response, 'segments') and response.segments:
            for segment in response.segments:
                if hasattr(segment, 'start'):
                    segments.append({
                        "start": segment.start,
                        "end": segment.end,
                        "text": segment.text.strip()
                    })
                elif isinstance(segment, dict):
                    segments.append({
                        "start": segment.get("start", 0.0),
                        "end": segment.get("end", 0.0),
                        "text": segment.get("text", "").strip()
                    })
        else:
            segments = [{
                "start": 0.0,
                "end": 5.0,
                "text": response.text if hasattr(response, 'text') else ""
            }]
        
        return {
            "text": response.text,
            "segments": segments,
            "language": language
        }
        
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        return None


def format_timestamp_srt(seconds: float) -> str:
    """Format seconds to SRT timestamp (HH:MM:SS,mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_timestamp_vtt(seconds: float) -> str:
    """Format seconds to VTT timestamp (HH:MM:SS.mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def generate_srt(segments: list) -> str:
    """Generate SRT format captions from segments"""
    srt_lines = []
    for i, segment in enumerate(segments, 1):
        start = format_timestamp_srt(segment["start"])
        end = format_timestamp_srt(segment["end"])
        text = segment["text"]
        srt_lines.append(f"{i}\n{start} --> {end}\n{text}\n")
    return "\n".join(srt_lines)


def generate_vtt(segments: list) -> str:
    """Generate WebVTT format captions from segments"""
    vtt_lines = ["WEBVTT\n"]
    for i, segment in enumerate(segments, 1):
        start = format_timestamp_vtt(segment["start"])
        end = format_timestamp_vtt(segment["end"])
        text = segment["text"]
        vtt_lines.append(f"\n{i}\n{start} --> {end}\n{text}")
    return "\n".join(vtt_lines)


async def process_video_transcription(
    video_path: str, 
    language: str = "en"
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Full pipeline: extract audio, transcribe, generate captions
    Returns: (transcript_text, srt_content, vtt_content)
    """
    try:
        logger.info(f"Extracting audio from {video_path}")
        audio_path = await extract_audio_from_video(video_path)
        
        if not audio_path or not os.path.exists(audio_path):
            logger.error("Failed to extract audio")
            return None, None, None
        
        try:
            logger.info("Transcribing audio with Whisper...")
            result = await transcribe_audio(audio_path, language)
            
            if not result:
                logger.error("Transcription failed")
                return None, None, None
            
            transcript_text = result["text"]
            segments = result["segments"]
            
            srt_content = generate_srt(segments) if segments else None
            vtt_content = generate_vtt(segments) if segments else None
            
            logger.info(f"Transcription complete: {len(segments)} segments")
            return transcript_text, srt_content, vtt_content
            
        finally:
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)
                
    except Exception as e:
        logger.error(f"Error in transcription pipeline: {e}")
        return None, None, None


async def embed_captions_in_video(
    video_path: str, 
    srt_content: str, 
    output_path: str
) -> bool:
    """Burn captions into video using bundled FFmpeg"""
    try:
        import subprocess
        ffmpeg_path = _get_ffmpeg_path()
        
        srt_path = video_path.rsplit('.', 1)[0] + '_captions.srt'
        with open(srt_path, 'w', encoding='utf-8') as f:
            f.write(srt_content)
        
        try:
            cmd = [
                ffmpeg_path, '-i', video_path,
                '-vf', f"subtitles='{srt_path}'",
                '-c:a', 'copy',
                '-y', output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            
            if result.returncode != 0:
                logger.error(f"Subtitle burn error: {result.stderr}")
                return False
                
            return True
        finally:
            if os.path.exists(srt_path):
                os.remove(srt_path)
                
    except Exception as e:
        logger.error(f"Error embedding captions: {e}")
        return False
