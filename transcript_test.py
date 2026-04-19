#!/usr/bin/env python3
"""
Focused test script for transcript and closed captioning features
Tests the new endpoints added to Gappy Describe app
"""
import requests
import sys
import os
import tempfile
import cv2
import numpy as np
from datetime import datetime
import json
import time
import uuid

class TranscriptTester:
    def __init__(self, base_url="https://scene-describe-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session_cookies = None
        self.user_data = None
        self.project_id = None
        
        # Generate unique user for this test run
        unique_id = str(uuid.uuid4())[:8]
        self.test_user = {
            'name': 'Transcript Tester',
            'email': f'transcript.test.{unique_id}@testmail.com',
            'password': 'TranscriptTest123!'
        }

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   {details}")
        else:
            print(f"❌ {name}")
            if details:
                print(f"   {details}")

    def create_test_video_with_audio(self, duration_seconds=5):
        """Create a test video with synthetic audio for transcription testing"""
        try:
            # Create a temporary video file (without audio first)
            temp_video = tempfile.NamedTemporaryFile(suffix='_video.mp4', delete=False)
            temp_video.close()
            
            # Create a simple video with OpenCV
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            fps = 2.0
            out = cv2.VideoWriter(temp_video.name, fourcc, fps, (640, 480))
            
            # Create frames with text that could be "spoken"
            total_frames = int(duration_seconds * fps)
            
            for i in range(total_frames):
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                frame[:] = (50, 50, 100)  # Dark blue background
                
                # Add text that represents what would be spoken
                text = f"This is frame {i+1} of the test video"
                cv2.putText(frame, text, (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                out.write(frame)
            
            out.release()
            
            # Now add a synthetic audio track using FFmpeg
            temp_final = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            temp_final.close()
            
            # Create a sine wave audio track
            import subprocess
            cmd = [
                'ffmpeg', '-i', temp_video.name,
                '-f', 'lavfi', '-i', f'sine=frequency=440:duration={duration_seconds}',
                '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-y',
                temp_final.name
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            # Clean up intermediate file
            try:
                os.unlink(temp_video.name)
            except:
                pass
            
            if result.returncode == 0:
                return temp_final.name
            else:
                print(f"FFmpeg error adding audio: {result.stderr}")
                # If FFmpeg fails, return the video-only file
                return temp_video.name
                
        except Exception as e:
            print(f"Error creating test video: {e}")
            return None

    def signup_and_login(self):
        """Create account and login"""
        print("\n🔐 Setting up authentication...")
        
        # Signup
        try:
            url = f"{self.api_url}/auth/signup/email"
            response = requests.post(url, json=self.test_user, timeout=30)
            
            if response.status_code == 200:
                self.log_test("User signup", True, f"Created user: {self.test_user['email']}")
            elif response.status_code == 409:
                self.log_test("User signup", True, "User already exists, proceeding to login")
            else:
                self.log_test("User signup", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("User signup", False, f"Error: {str(e)}")
            return False
        
        # Login
        try:
            login_data = {
                'email': self.test_user['email'],
                'password': self.test_user['password']
            }
            url = f"{self.api_url}/auth/login/email"
            response = requests.post(url, json=login_data, timeout=30)
            
            if response.status_code == 200:
                self.session_cookies = response.cookies
                try:
                    resp_data = response.json()
                    if resp_data.get('success'):
                        self.user_data = resp_data.get('user')
                        self.log_test("User login", True, f"Logged in as: {self.user_data['email']}")
                        return True
                except:
                    pass
            
            self.log_test("User login", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
            
        except Exception as e:
            self.log_test("User login", False, f"Error: {str(e)}")
            return False

    def test_upload_with_transcript_options(self):
        """Test 1: Upload endpoint with new transcript/caption options"""
        print("\n📤 Testing upload with transcript options...")
        
        video_path = self.create_test_video_with_audio(5)
        if not video_path:
            self.log_test("Create test video", False, "Failed to create video file")
            return False
        
        try:
            with open(video_path, 'rb') as f:
                files = {'file': ('transcript_test.mp4', f, 'video/mp4')}
                data = {
                    'language': 'en',
                    'voice_id': '21m00Tcm4TlvDq8ikWAM',
                    'description_length': '1',
                    'generate_transcript': 'true',   # NEW: Enable transcript generation
                    'generate_captions': 'true',    # NEW: Enable caption generation
                    'embed_captions': 'false'       # NEW: Don't embed captions in video
                }
                
                url = f"{self.api_url}/upload"
                response = requests.post(url, files=files, data=data, cookies=self.session_cookies, timeout=60)
                
                if response.status_code == 200:
                    try:
                        resp_data = response.json()
                        self.project_id = resp_data.get('id')
                        
                        # Check if new fields are accepted and stored
                        transcript_enabled = resp_data.get('generate_transcript', False)
                        captions_enabled = resp_data.get('generate_captions', False)
                        embed_enabled = resp_data.get('embed_captions', False)
                        
                        self.log_test("Upload with transcript options", True, 
                                    f"Project ID: {self.project_id}, Transcript: {transcript_enabled}, Captions: {captions_enabled}, Embed: {embed_enabled}")
                        return True
                    except Exception as e:
                        self.log_test("Upload with transcript options", False, f"JSON parse error: {e}")
                        return False
                else:
                    self.log_test("Upload with transcript options", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    return False
                    
        except Exception as e:
            self.log_test("Upload with transcript options", False, f"Error: {str(e)}")
            return False
        finally:
            try:
                os.unlink(video_path)
            except:
                pass

    def test_transcribe_endpoint(self):
        """Test 2: POST /api/transcribe/{project_id}"""
        print("\n🎤 Testing transcription endpoint...")
        
        if not self.project_id:
            self.log_test("Transcribe video", False, "No project ID available")
            return False
        
        try:
            url = f"{self.api_url}/transcribe/{self.project_id}"
            response = requests.post(url, cookies=self.session_cookies, timeout=120)  # Longer timeout for transcription
            
            if response.status_code == 200:
                try:
                    resp_data = response.json()
                    
                    # Check required response fields
                    success = resp_data.get('success', False)
                    transcript_text = resp_data.get('transcript_text', '')
                    has_srt = resp_data.get('has_srt', False)
                    has_vtt = resp_data.get('has_vtt', False)
                    
                    if success and transcript_text:
                        self.log_test("Transcribe video", True, 
                                    f"Success: {success}, Text length: {len(transcript_text)}, SRT: {has_srt}, VTT: {has_vtt}")
                        return True
                    else:
                        self.log_test("Transcribe video", False, 
                                    f"Missing required fields - Success: {success}, Text: {bool(transcript_text)}")
                        return False
                        
                except Exception as e:
                    self.log_test("Transcribe video", False, f"JSON parse error: {e}")
                    return False
            else:
                self.log_test("Transcribe video", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Transcribe video", False, f"Error: {str(e)}")
            return False

    def test_get_transcript_endpoint(self):
        """Test 3: GET /api/transcript/{project_id}"""
        print("\n📄 Testing get transcript endpoint...")
        
        if not self.project_id:
            self.log_test("Get transcript", False, "No project ID available")
            return False
        
        try:
            url = f"{self.api_url}/transcript/{self.project_id}"
            response = requests.get(url, cookies=self.session_cookies, timeout=30)
            
            if response.status_code == 200:
                try:
                    resp_data = response.json()
                    
                    # Check response structure
                    transcript_text = resp_data.get('transcript_text', '')
                    has_srt = resp_data.get('has_srt', False)
                    has_vtt = resp_data.get('has_vtt', False)
                    
                    self.log_test("Get transcript", True, 
                                f"Text length: {len(transcript_text) if transcript_text else 0}, SRT: {has_srt}, VTT: {has_vtt}")
                    return True
                    
                except Exception as e:
                    self.log_test("Get transcript", False, f"JSON parse error: {e}")
                    return False
            else:
                self.log_test("Get transcript", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get transcript", False, f"Error: {str(e)}")
            return False

    def test_download_captions(self):
        """Test 4: GET /api/captions/{project_id}/{format}"""
        print("\n📥 Testing caption download endpoints...")
        
        if not self.project_id:
            self.log_test("Download captions", False, "No project ID available")
            return False
        
        formats_to_test = [
            ('srt', 'application/x-subrip', 'SRT'),
            ('vtt', 'text/vtt', 'VTT'), 
            ('txt', 'text/plain', 'TXT')
        ]
        
        all_passed = True
        
        for format_name, expected_content_type, display_name in formats_to_test:
            try:
                url = f"{self.api_url}/captions/{self.project_id}/{format_name}"
                response = requests.get(url, cookies=self.session_cookies, timeout=30)
                
                if response.status_code == 200:
                    content_type = response.headers.get('Content-Type', '')
                    content_disposition = response.headers.get('Content-Disposition', '')
                    content = response.text
                    
                    # Check content type (allow some flexibility)
                    content_type_ok = (expected_content_type in content_type or 
                                     format_name in content_type or
                                     'text' in content_type)
                    
                    # Check download header
                    download_header_ok = 'attachment' in content_disposition and f'.{format_name}' in content_disposition
                    
                    # Check content format
                    content_ok = len(content.strip()) > 0
                    if format_name == 'srt':
                        content_ok = content_ok and '-->' in content
                    elif format_name == 'vtt':
                        content_ok = content_ok and ('WEBVTT' in content and '-->' in content)
                    
                    if content_type_ok and download_header_ok and content_ok:
                        self.log_test(f"Download {display_name} captions", True, 
                                    f"Content-Type: {content_type}, Size: {len(content)} chars")
                    else:
                        self.log_test(f"Download {display_name} captions", False, 
                                    f"Content-Type OK: {content_type_ok}, Header OK: {download_header_ok}, Content OK: {content_ok}")
                        all_passed = False
                else:
                    self.log_test(f"Download {display_name} captions", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Download {display_name} captions", False, f"Error: {str(e)}")
                all_passed = False
        
        # Test invalid format
        try:
            url = f"{self.api_url}/captions/{self.project_id}/invalid"
            response = requests.get(url, cookies=self.session_cookies, timeout=30)
            
            if response.status_code == 400:
                self.log_test("Download invalid format", True, "Correctly rejected invalid format")
            else:
                self.log_test("Download invalid format", False, f"Expected 400, got {response.status_code}")
                all_passed = False
                
        except Exception as e:
            self.log_test("Download invalid format", False, f"Error: {str(e)}")
            all_passed = False
        
        return all_passed

    def test_authentication_requirements(self):
        """Test 5: Verify all endpoints require authentication"""
        print("\n🔒 Testing authentication requirements...")
        
        fake_project_id = "00000000-0000-0000-0000-000000000000"
        
        endpoints_to_test = [
            ("POST", f"transcribe/{fake_project_id}", "Transcribe"),
            ("GET", f"transcript/{fake_project_id}", "Get transcript"),
            ("GET", f"captions/{fake_project_id}/srt", "Download SRT"),
            ("GET", f"captions/{fake_project_id}/vtt", "Download VTT"),
            ("GET", f"captions/{fake_project_id}/txt", "Download TXT"),
        ]
        
        all_passed = True
        
        for method, endpoint, name in endpoints_to_test:
            try:
                url = f"{self.api_url}/{endpoint}"
                
                if method == "POST":
                    response = requests.post(url, timeout=30)
                else:
                    response = requests.get(url, timeout=30)
                
                if response.status_code == 401:
                    self.log_test(f"{name} auth required", True, "Correctly requires authentication")
                else:
                    self.log_test(f"{name} auth required", False, f"Expected 401, got {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"{name} auth required", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed

    def run_all_tests(self):
        """Run all transcript and caption tests"""
        print("🎬 Starting Transcript & Closed Captioning Tests")
        print("=" * 60)
        
        # Setup
        if not self.signup_and_login():
            print("\n❌ Authentication setup failed - cannot continue")
            return False
        
        # Run tests in sequence
        tests = [
            self.test_upload_with_transcript_options,
            self.test_transcribe_endpoint,
            self.test_get_transcript_endpoint,
            self.test_download_captions,
            self.test_authentication_requirements,
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"\n💥 Test {test.__name__} crashed: {str(e)}")
        
        # Results
        print("\n" + "=" * 60)
        print(f"📊 TRANSCRIPT TESTS RESULTS: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TRANSCRIPT TESTS PASSED!")
            return True
        else:
            print(f"⚠️ {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = TranscriptTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())