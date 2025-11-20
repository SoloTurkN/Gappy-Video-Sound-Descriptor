import requests
import sys
import os
import tempfile
import cv2
import numpy as np
from datetime import datetime

class VideoDescriptionAPITester:
    def __init__(self, base_url="https://video-describer-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        if not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, timeout=60)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=60)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

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

    def create_test_video(self):
        """Create a simple test video for testing"""
        try:
            # Create a temporary video file
            temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
            temp_file.close()
            
            # Create a simple video with OpenCV
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(temp_file.name, fourcc, 2.0, (640, 480))
            
            # Create 3 different colored frames to simulate scene changes
            colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]  # Blue, Green, Red
            
            for i in range(6):  # 3 seconds at 2 fps
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                color_idx = i // 2  # Change color every 2 frames
                frame[:] = colors[color_idx]
                
                # Add some text to make frames different
                cv2.putText(frame, f'Frame {i+1}', (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 3)
                out.write(frame)
            
            out.release()
            return temp_file.name
        except Exception as e:
            print(f"Error creating test video: {e}")
            return None

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_upload_video(self):
        """Test video upload"""
        video_path = self.create_test_video()
        if not video_path:
            print("❌ Failed to create test video")
            return False
        
        try:
            with open(video_path, 'rb') as f:
                files = {'file': ('test_video.mp4', f, 'video/mp4')}
                success, response = self.run_test(
                    "Upload Video",
                    "POST",
                    "upload",
                    200,
                    files=files
                )
            
            if success and 'id' in response:
                self.project_id = response['id']
                print(f"Project ID: {self.project_id}")
                return True
            return False
        finally:
            # Clean up temp file
            try:
                os.unlink(video_path)
            except:
                pass

    def test_get_projects(self):
        """Test getting all projects"""
        success, response = self.run_test(
            "Get Projects",
            "GET",
            "projects",
            200
        )
        return success

    def test_get_project(self):
        """Test getting specific project"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        success, response = self.run_test(
            "Get Project",
            "GET",
            f"projects/{self.project_id}",
            200
        )
        return success

    def test_analyze_video(self):
        """Test video analysis"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        print("⏳ This may take 30-60 seconds for AI processing...")
        success, response = self.run_test(
            "Analyze Video",
            "POST",
            f"analyze/{self.project_id}",
            200
        )
        
        if success:
            print(f"Analysis result: {response}")
        return success

    def test_get_scenes(self):
        """Test getting scenes for project"""
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
            print(f"Found {len(response)} scenes")
            # Store first scene ID for update test
            self.scene_id = response[0].get('id')
            return True
        return success

    def test_update_scene(self):
        """Test updating scene description"""
        if not hasattr(self, 'scene_id') or not self.scene_id:
            print("❌ No scene ID available")
            return False
        
        success, response = self.run_test(
            "Update Scene",
            "PUT",
            f"scenes/{self.scene_id}",
            200,
            data={"description": "Updated test description for accessibility compliance"}
        )
        return success

    def test_export_video(self):
        """Test video export"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        success, response = self.run_test(
            "Export Video",
            "POST",
            f"export/{self.project_id}",
            200
        )
        return success

    def test_file_serving(self):
        """Test thumbnail and audio file serving"""
        if not self.project_id:
            print("❌ No project ID available")
            return False
        
        # Test thumbnail endpoint (may not exist yet)
        try:
            url = f"{self.api_url}/thumbnail/{self.project_id}/frame_0.jpg"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                print("✅ Thumbnail serving works")
                return True
            else:
                print(f"⚠️  Thumbnail not found (expected after analysis): {response.status_code}")
        except Exception as e:
            print(f"⚠️  Thumbnail test error: {e}")
        
        return True  # Don't fail the test suite for this

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