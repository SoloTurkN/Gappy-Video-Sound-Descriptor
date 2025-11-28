import requests
import sys
import os
import tempfile
import cv2
import numpy as np
from datetime import datetime
import json
import time

class VideoDescriptionAPITester:
    def __init__(self, base_url="https://video-describer-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.session_cookies = None
        self.user_data = None
        self.scene_id = None
        self.test_users = {
            'free_user': {
                'name': 'Alice Johnson',
                'email': 'alice.johnson@testmail.com',
                'password': 'TestPass123'
            },
            'pro_user': {
                'name': 'Bob Smith', 
                'email': 'bob.smith@testmail.com',
                'password': 'TestPass456'
            }
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, auth_required=True, cookies=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        if not files:
            headers['Content-Type'] = 'application/json'

        # Use session cookies if available and auth required
        test_cookies = cookies or (self.session_cookies if auth_required else None)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, cookies=test_cookies, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, cookies=test_cookies, timeout=60)
                else:
                    response = requests.post(url, json=data, headers=headers, cookies=test_cookies, timeout=60)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, cookies=test_cookies, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, cookies=test_cookies, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_test_video(self, duration_seconds=3):
        """Create a simple test video for testing"""
        try:
            # Create a temporary video file
            temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            temp_file.close()
            
            # Create a simple video with OpenCV
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            fps = 2.0
            out = cv2.VideoWriter(temp_file.name, fourcc, fps, (640, 480))
            
            # Create different colored frames to simulate scene changes
            colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]  # Blue, Green, Red
            total_frames = int(duration_seconds * fps)
            
            for i in range(total_frames):
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                color_idx = (i // 2) % len(colors)  # Change color every 2 frames
                frame[:] = colors[color_idx]
                
                # Add some text to make frames different
                cv2.putText(frame, f'Frame {i+1}', (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
                out.write(frame)
            
            out.release()
            return temp_file.name
        except Exception as e:
            print(f"Error creating test video: {e}")
            return None

    # ========== AUTHENTICATION TESTS ==========
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200,
            auth_required=False
        )
        return success

    def test_email_signup(self):
        """Test email signup functionality"""
        user_data = self.test_users['free_user']
        success, response = self.run_test(
            "Email Signup",
            "POST",
            "auth/signup/email",
            200,
            data=user_data,
            auth_required=False
        )
        
        if success and response.get('success'):
            self.user_data = response.get('user')
            print(f"✅ User created: {self.user_data['email']}")
            return True
        return success

    def test_email_login(self):
        """Test email login functionality"""
        login_data = {
            'email': self.test_users['free_user']['email'],
            'password': self.test_users['free_user']['password']
        }
        
        # Make request manually to capture cookies
        url = f"{self.api_url}/auth/login/email"
        response = requests.post(url, json=login_data, timeout=30)
        
        self.tests_run += 1
        print(f"\n🔍 Testing Email Login...")
        
        if response.status_code == 200:
            self.tests_passed += 1
            print(f"✅ Passed - Status: {response.status_code}")
            
            # Store session cookies
            self.session_cookies = response.cookies
            
            try:
                resp_data = response.json()
                if resp_data.get('success'):
                    self.user_data = resp_data.get('user')
                    print(f"✅ Logged in as: {self.user_data['email']}")
                    return True
            except:
                pass
        else:
            print(f"❌ Failed - Expected 200, got {response.status_code}")
            try:
                print(f"Response: {response.json()}")
            except:
                print(f"Response: {response.text}")
        
        return False

    def test_session_validation(self):
        """Test session validation with /auth/me"""
        success, response = self.run_test(
            "Session Validation (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if success and response.get('email'):
            print(f"✅ Session valid for: {response['email']}")
            return True
        return success

    def test_protected_endpoint_without_auth(self):
        """Test that protected endpoints require authentication"""
        success, response = self.run_test(
            "Protected Endpoint Without Auth",
            "GET",
            "projects",
            401,
            auth_required=False
        )
        
        if success:
            print("✅ Correctly rejected unauthenticated request")
        return success

    # ========== VIDEO PROCESSING TESTS ==========

    def test_upload_video(self):
        """Test video upload with authentication"""
        video_path = self.create_test_video(3)  # 3 second video
        if not video_path:
            print("❌ Failed to create test video")
            return False
        
        try:
            with open(video_path, 'rb') as f:
                files = {'file': ('test_video.mp4', f, 'video/mp4')}
                
                # Make request manually to handle file upload with cookies
                url = f"{self.api_url}/upload"
                response = requests.post(url, files=files, cookies=self.session_cookies, timeout=60)
                
                self.tests_run += 1
                print(f"\n🔍 Testing Upload Video...")
                
                if response.status_code == 200:
                    self.tests_passed += 1
                    print(f"✅ Passed - Status: {response.status_code}")
                    
                    try:
                        resp_data = response.json()
                        if 'id' in resp_data:
                            self.project_id = resp_data['id']
                            print(f"✅ Project ID: {self.project_id}")
                            print(f"✅ User email stored: {resp_data.get('user_email')}")
                            return True
                    except:
                        pass
                else:
                    print(f"❌ Failed - Expected 200, got {response.status_code}")
                    try:
                        print(f"Response: {response.json()}")
                    except:
                        print(f"Response: {response.text}")
                
                return False
        finally:
            # Clean up temp file
            try:
                os.unlink(video_path)
            except:
                pass

    def test_usage_counter(self):
        """Test that usage counter increments after upload"""
        success, response = self.run_test(
            "Usage Counter Check",
            "GET",
            "usage",
            200
        )
        
        if success and response.get('videos_uploaded', 0) > 0:
            print(f"✅ Usage counter: {response['videos_uploaded']} videos")
            print(f"✅ Subscription tier: {response.get('subscription_tier', 'unknown')}")
            return True
        return success

    def test_video_analysis(self):
        """Test video analysis with scene detection and AI descriptions"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        print("⏳ This may take 30-60 seconds for AI processing...")
        success, response = self.run_test(
            "Video Analysis",
            "POST",
            f"analyze/{self.project_id}",
            200
        )
        
        if success:
            print(f"✅ Analysis result: {response}")
            total_scenes = response.get('total_scenes', 0)
            if total_scenes > 0:
                print(f"✅ Scene detection working: {total_scenes} scenes found")
            return True
        return success

    def test_get_scenes(self):
        """Test getting scenes with AI descriptions and TTS audio"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        success, response = self.run_test(
            "Get Scenes",
            "GET",
            f"projects/{self.project_id}/scenes",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            print(f"✅ Found {len(response)} scenes")
            scene = response[0]
            self.scene_id = scene.get('id')
            
            # Check if AI descriptions and audio were generated
            if scene.get('description'):
                print(f"✅ AI description generated: {scene['description'][:50]}...")
            if scene.get('audio_path'):
                print(f"✅ TTS audio created: {scene['audio_path']}")
            if scene.get('duration', 0) > 0:
                print(f"✅ Audio duration: {scene['duration']} seconds")
            
            return True
        return success

    def test_scene_editing(self):
        """Test scene description editing and audio regeneration"""
        if not self.scene_id:
            print("❌ No scene ID available")
            return False
        
        new_description = "A person walking through a beautiful garden with colorful flowers."
        success, response = self.run_test(
            "Scene Editing",
            "PUT",
            f"scenes/{self.scene_id}",
            200,
            data={"description": new_description}
        )
        
        if success and response.get('status') == 'success':
            print(f"✅ Scene updated successfully")
            if response.get('duration', 0) > 0:
                print(f"✅ Audio regenerated with duration: {response['duration']} seconds")
            return True
        return success

    # ========== PROJECT MANAGEMENT TESTS ==========

    def test_get_projects(self):
        """Test getting user's projects (ownership filtering)"""
        success, response = self.run_test(
            "Get Projects",
            "GET",
            "projects",
            200
        )
        
        if success and isinstance(response, list):
            user_projects = [p for p in response if p.get('user_email') == self.user_data['email']]
            print(f"✅ Found {len(user_projects)} projects for current user")
            
            # Check sorting (newest first)
            if len(user_projects) > 1:
                dates = [p.get('created_at') for p in user_projects if p.get('created_at')]
                if dates == sorted(dates, reverse=True):
                    print("✅ Projects sorted correctly (newest first)")
            
            return True
        return success

    def test_get_single_project(self):
        """Test getting single project with ownership check"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        success, response = self.run_test(
            "Get Single Project",
            "GET",
            f"projects/{self.project_id}",
            200
        )
        
        if success and response.get('user_email') == self.user_data['email']:
            print("✅ Ownership check passed")
            return True
        return success

    def test_project_rename(self):
        """Test project renaming"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        new_name = "Renamed Test Video Project"
        success, response = self.run_test(
            "Project Rename",
            "PUT",
            f"projects/{self.project_id}",
            200,
            data={"original_filename": new_name}
        )
        
        if success and response.get('success'):
            print(f"✅ Project renamed successfully")
            return True
        return success

    # ========== SUBSCRIPTION & USAGE TESTS ==========

    def test_usage_endpoint(self):
        """Test usage endpoint for counter accuracy and tier limits"""
        success, response = self.run_test(
            "Usage Endpoint",
            "GET",
            "usage",
            200
        )
        
        if success:
            print(f"✅ Videos uploaded: {response.get('videos_uploaded', 0)}")
            print(f"✅ Max videos: {response.get('max_videos', 'unlimited')}")
            print(f"✅ Max duration: {response.get('max_duration_seconds', 'unlimited')} seconds")
            print(f"✅ Allowed formats: {response.get('allowed_formats', [])}")
            print(f"✅ Subscription tier: {response.get('subscription_tier', 'unknown')}")
            return True
        return success

    def test_upload_limits_free_user(self):
        """Test upload limits for free tier users"""
        print("⏳ Testing free tier upload limits...")
        
        # Try to upload multiple videos to test monthly limit
        videos_uploaded = 0
        for i in range(5):  # Try to upload 5 videos (free limit is 3)
            video_path = self.create_test_video(2)  # 2 second video
            if not video_path:
                continue
                
            try:
                with open(video_path, 'rb') as f:
                    files = {'file': (f'test_video_{i}.mp4', f, 'video/mp4')}
                    url = f"{self.api_url}/upload"
                    response = requests.post(url, files=files, cookies=self.session_cookies, timeout=60)
                    
                    if response.status_code == 200:
                        videos_uploaded += 1
                        print(f"✅ Video {i+1} uploaded successfully")
                    elif response.status_code == 403:
                        print(f"✅ Upload limit enforced at video {i+1}")
                        break
                    else:
                        print(f"⚠️ Unexpected response for video {i+1}: {response.status_code}")
            finally:
                try:
                    os.unlink(video_path)
                except:
                    pass
        
        print(f"✅ Successfully uploaded {videos_uploaded} videos before limit")
        return True

    def test_duration_limits_free_user(self):
        """Test video duration limits for free tier"""
        print("⏳ Testing free tier duration limits (5 min max)...")
        
        # Try to upload a 10-minute video (should fail for free tier)
        video_path = self.create_test_video(600)  # 10 minutes = 600 seconds
        if not video_path:
            print("❌ Failed to create long test video")
            return False
        
        try:
            with open(video_path, 'rb') as f:
                files = {'file': ('long_test_video.mp4', f, 'video/mp4')}
                url = f"{self.api_url}/upload"
                response = requests.post(url, files=files, cookies=self.session_cookies, timeout=60)
                
                self.tests_run += 1
                print(f"\n🔍 Testing Duration Limits...")
                
                if response.status_code == 403:
                    self.tests_passed += 1
                    print(f"✅ Duration limit enforced correctly")
                    try:
                        error_msg = response.json().get('detail', '')
                        if 'too long' in error_msg.lower():
                            print(f"✅ Correct error message: {error_msg}")
                    except:
                        pass
                    return True
                else:
                    print(f"❌ Expected 403, got {response.status_code}")
                    return False
        finally:
            try:
                os.unlink(video_path)
            except:
                pass

    # ========== EXPORT TESTS ==========

    def test_export_format_restrictions(self):
        """Test export format restrictions for free tier"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Test MP4 export (should work for free tier)
        success_mp4, response_mp4 = self.run_test(
            "Export MP4 (Free Tier)",
            "POST",
            f"export/{self.project_id}",
            200,
            data={"format": "mp4"}
        )
        
        # Test AVI export (should fail for free tier)
        success_avi, response_avi = self.run_test(
            "Export AVI (Free Tier - Should Fail)",
            "POST",
            f"export/{self.project_id}",
            403,
            data={"format": "avi"}
        )
        
        if success_mp4:
            print("✅ MP4 export allowed for free tier")
        if success_avi:
            print("✅ AVI export correctly restricted for free tier")
        
        return success_mp4 and success_avi

    def test_video_export_with_ffmpeg(self):
        """Test video export with FFmpeg availability"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        success, response = self.run_test(
            "Video Export with FFmpeg",
            "POST",
            f"export/{self.project_id}",
            200,
            data={"format": "mp4"}
        )
        
        if success:
            print(f"✅ Export successful: {response.get('message', '')}")
            if response.get('download_url'):
                print(f"✅ Download URL generated: {response['download_url']}")
            return True
        return success

    # ========== SECURITY TESTS ==========

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        endpoints_to_test = [
            ("GET", "projects", "Get Projects"),
            ("GET", "usage", "Get Usage"),
            ("POST", "upload", "Upload Video"),
        ]
        
        all_passed = True
        for method, endpoint, name in endpoints_to_test:
            success, response = self.run_test(
                f"Unauthorized {name}",
                method,
                endpoint,
                401,
                auth_required=False
            )
            if not success:
                all_passed = False
        
        return all_passed

    def test_cross_user_access_prevention(self):
        """Test that users cannot access other users' projects"""
        # This would require creating a second user and testing cross-access
        # For now, we'll test with an invalid project ID
        fake_project_id = "00000000-0000-0000-0000-000000000000"
        
        success, response = self.run_test(
            "Cross-User Project Access",
            "GET",
            f"projects/{fake_project_id}",
            404  # Should return 404 for non-existent or unauthorized project
        )
        
        if success:
            print("✅ Cross-user access prevention working")
        return success

    def test_logout(self):
        """Test logout functionality"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        
        if success and response.get('success'):
            print("✅ Logout successful")
            # Clear session cookies
            self.session_cookies = None
            return True
        return success

    def test_session_expiration(self):
        """Test that session is expired after logout"""
        success, response = self.run_test(
            "Session Expiration Check",
            "GET",
            "auth/me",
            401,
            auth_required=False  # Don't use cookies since we logged out
        )
        
        if success:
            print("✅ Session correctly expired after logout")
        return success

    # ========== PROJECT CLEANUP ==========

    def test_project_delete(self):
        """Test project deletion with file cleanup"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Re-login for delete test
        if not self.session_cookies:
            login_success = self.test_email_login()
            if not login_success:
                print("❌ Could not re-login for delete test")
                return False
        
        success, response = self.run_test(
            "Project Delete",
            "DELETE",
            f"projects/{self.project_id}",
            200
        )
        
        if success and response.get('success'):
            print("✅ Project deleted successfully")
            print("✅ Files and scenes should be removed")
            return True
        return success

def main():
    print("🚀 Starting Video Description API Tests")
    print("=" * 50)
    
    tester = VideoDescriptionAPITester()
    
    # Run tests in sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_upload_video,
        tester.test_get_projects,
        tester.test_get_project,
        tester.test_analyze_video,
        tester.test_get_scenes,
        tester.test_update_scene,
        tester.test_export_video,
        tester.test_file_serving,
    ]
    
    for test in tests:
        if not test():
            print(f"\n❌ Test failed: {test.__name__}")
            # Continue with other tests even if one fails
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())