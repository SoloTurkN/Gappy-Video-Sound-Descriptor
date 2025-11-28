#!/usr/bin/env python3
"""
Quick test to verify the fixes for duration limits and export format restrictions
"""
import requests
import tempfile
import cv2
import numpy as np
import os

BASE_URL = "https://video-describer-4.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def create_test_video(duration_seconds=600):
    """Create a test video of specified duration"""
    temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
    temp_file.close()
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    fps = 2.0
    out = cv2.VideoWriter(temp_file.name, fourcc, fps, (640, 480))
    
    total_frames = int(duration_seconds * fps)
    
    for i in range(total_frames):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        frame[:] = (0, 255, 0)  # Green frame
        cv2.putText(frame, f'Frame {i+1}', (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
        out.write(frame)
    
    out.release()
    return temp_file.name

def test_fixes():
    print("🔧 Testing Backend Fixes")
    print("=" * 40)
    
    # First, create a user and login
    user_data = {
        'name': 'Test User Fix',
        'email': 'testfix@example.com',
        'password': 'TestPass123'
    }
    
    # Signup
    response = requests.post(f"{API_URL}/auth/signup/email", json=user_data)
    if response.status_code != 200:
        print(f"❌ Signup failed: {response.status_code}")
        return
    
    # Login
    login_data = {'email': user_data['email'], 'password': user_data['password']}
    response = requests.post(f"{API_URL}/auth/login/email", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        return
    
    cookies = response.cookies
    print("✅ User logged in successfully")
    
    # Test 1: Duration limit (should return 403, not 500)
    print("\n🔍 Testing duration limit (10-minute video)...")
    video_path = create_test_video(600)  # 10 minutes
    
    try:
        with open(video_path, 'rb') as f:
            files = {'file': ('long_video.mp4', f, 'video/mp4')}
            response = requests.post(f"{API_URL}/upload", files=files, cookies=cookies, timeout=60)
            
            if response.status_code == 403:
                print("✅ Duration limit correctly enforced (403)")
                try:
                    error_msg = response.json().get('detail', '')
                    if 'too long' in error_msg.lower():
                        print(f"✅ Correct error message: {error_msg}")
                except:
                    pass
            else:
                print(f"❌ Expected 403, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
    finally:
        os.unlink(video_path)
    
    # Test 2: Upload a valid video first for export test
    print("\n🔍 Uploading valid video for export test...")
    video_path = create_test_video(3)  # 3 seconds
    project_id = None
    
    try:
        with open(video_path, 'rb') as f:
            files = {'file': ('test_video.mp4', f, 'video/mp4')}
            response = requests.post(f"{API_URL}/upload", files=files, cookies=cookies, timeout=60)
            
            if response.status_code == 200:
                project_id = response.json().get('id')
                print(f"✅ Video uploaded: {project_id}")
            else:
                print(f"❌ Upload failed: {response.status_code}")
                return
    finally:
        os.unlink(video_path)
    
    # Analyze the video
    print("🔍 Analyzing video...")
    response = requests.post(f"{API_URL}/analyze/{project_id}", cookies=cookies, timeout=120)
    if response.status_code == 200:
        print("✅ Video analyzed")
    else:
        print(f"❌ Analysis failed: {response.status_code}")
        return
    
    # Test 3: Export format restriction (should return 403, not 500)
    print("\n🔍 Testing export format restriction (AVI for free user)...")
    response = requests.post(
        f"{API_URL}/export/{project_id}",
        json={"format": "avi"},
        cookies=cookies,
        timeout=60
    )
    
    if response.status_code == 403:
        print("✅ Export format restriction correctly enforced (403)")
        try:
            error_msg = response.json().get('detail', '')
            if 'not available' in error_msg.lower():
                print(f"✅ Correct error message: {error_msg}")
        except:
            pass
    else:
        print(f"❌ Expected 403, got {response.status_code}")
        try:
            print(f"Response: {response.json()}")
        except:
            print(f"Response: {response.text}")
    
    # Test 4: Valid export (should work)
    print("\n🔍 Testing valid export (MP4 for free user)...")
    response = requests.post(
        f"{API_URL}/export/{project_id}",
        json={"format": "mp4"},
        cookies=cookies,
        timeout=60
    )
    
    if response.status_code == 200:
        print("✅ Valid export works correctly")
    else:
        print(f"❌ Valid export failed: {response.status_code}")
    
    print("\n🎯 Fix testing complete!")

if __name__ == "__main__":
    test_fixes()