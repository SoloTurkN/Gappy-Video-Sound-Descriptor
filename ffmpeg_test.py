#!/usr/bin/env python3
"""
Quick test to verify FFmpeg-dependent features are working
"""

import requests
import tempfile
import cv2
import numpy as np
import os

def create_test_video(duration_seconds=3):
    """Create a simple test video"""
    try:
        temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
        temp_file.close()
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        fps = 2.0
        out = cv2.VideoWriter(temp_file.name, fourcc, fps, (640, 480))
        
        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
        total_frames = int(duration_seconds * fps)
        
        for i in range(total_frames):
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            color_idx = (i // 2) % len(colors)
            frame[:] = colors[color_idx]
            cv2.putText(frame, f'Frame {i+1}', (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
            out.write(frame)
        
        out.release()
        return temp_file.name
    except Exception as e:
        print(f"Error creating test video: {e}")
        return None

def test_ffmpeg_features():
    base_url = "https://describebot.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Create test user and login
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    test_user = {
        'name': 'FFmpeg Tester',
        'email': f'ffmpeg.tester.{unique_id}@testmail.com',
        'password': 'FFmpegTest2024!'
    }
    
    print("🔧 Testing FFmpeg-dependent features...")
    
    # Signup
    response = requests.post(f"{api_url}/auth/signup/email", json=test_user, timeout=30)
    if response.status_code != 200:
        print("❌ Failed to create test user")
        return False
    
    # Login
    login_data = {'email': test_user['email'], 'password': test_user['password']}
    response = requests.post(f"{api_url}/auth/login/email", json=login_data, timeout=30)
    if response.status_code != 200:
        print("❌ Failed to login")
        return False
    
    session_cookies = response.cookies
    print("✅ Logged in successfully")
    
    # Create and upload test video
    video_path = create_test_video(3)
    if not video_path:
        print("❌ Failed to create test video")
        return False
    
    try:
        with open(video_path, 'rb') as f:
            files = {'file': ('test_video.mp4', f, 'video/mp4')}
            data = {
                'language': 'en',
                'voice_id': '21m00Tcm4TlvDq8ikWAM',
                'description_length': '1',
                'generate_transcript': 'true',
                'generate_captions': 'true',
                'embed_captions': 'false'
            }
            
            response = requests.post(f"{api_url}/upload", files=files, data=data, cookies=session_cookies, timeout=60)
            
            if response.status_code == 200:
                project_data = response.json()
                project_id = project_data['id']
                print(f"✅ Video uploaded successfully: {project_id}")
                
                # Test transcription
                print("🔄 Testing transcription (may take 30-60 seconds)...")
                response = requests.post(f"{api_url}/transcribe/{project_id}", cookies=session_cookies, timeout=120)
                
                if response.status_code == 200:
                    transcript_data = response.json()
                    if transcript_data.get('success'):
                        print("✅ Transcription successful")
                        print(f"   Has transcript: {transcript_data.get('has_srt', False) or transcript_data.get('has_vtt', False)}")
                    else:
                        print("❌ Transcription failed")
                        return False
                else:
                    print(f"❌ Transcription request failed: {response.status_code}")
                    return False
                
                # Test export
                print("🔄 Testing video export...")
                export_data = {"format": "mp4"}
                response = requests.post(f"{api_url}/export/{project_id}", json=export_data, cookies=session_cookies, timeout=120)
                
                if response.status_code == 200:
                    export_result = response.json()
                    if export_result.get('status') == 'success':
                        print("✅ Video export successful")
                        print(f"   Download URL: {export_result.get('download_url', 'N/A')}")
                    else:
                        print("❌ Video export failed")
                        return False
                else:
                    print(f"❌ Export request failed: {response.status_code}")
                    try:
                        print(f"   Error: {response.json()}")
                    except:
                        print(f"   Error: {response.text}")
                    return False
                
                return True
            else:
                print(f"❌ Video upload failed: {response.status_code}")
                return False
    
    finally:
        # Clean up temp file
        try:
            os.unlink(video_path)
        except:
            pass
    
    return False

if __name__ == "__main__":
    success = test_ffmpeg_features()
    if success:
        print("\n🎉 All FFmpeg-dependent features are working!")
    else:
        print("\n❌ Some FFmpeg-dependent features failed")