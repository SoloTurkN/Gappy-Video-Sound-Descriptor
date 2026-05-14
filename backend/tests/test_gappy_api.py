"""
Gappy Describe API Tests
Tests for authentication, public endpoints, and authenticated endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://scene-describe-1.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "tester1@gappylabs.com"
TEST_PASSWORD = "GappyTest2024!"


class TestPublicEndpoints:
    """Tests for public API endpoints (no auth required)"""
    
    def test_health_check(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "gappy-describe-api"
        print("✓ Health check passed")
    
    def test_get_languages(self):
        """Test /api/languages returns available languages"""
        response = requests.get(f"{BASE_URL}/api/languages")
        assert response.status_code == 200
        data = response.json()
        assert "languages" in data
        assert len(data["languages"]) > 0
        # Verify English is available
        lang_codes = [lang["code"] for lang in data["languages"]]
        assert "en" in lang_codes
        print(f"✓ Languages endpoint returned {len(data['languages'])} languages")
    
    def test_get_voices(self):
        """Test /api/voices returns available voices"""
        response = requests.get(f"{BASE_URL}/api/voices")
        assert response.status_code == 200
        data = response.json()
        assert "voices" in data
        assert len(data["voices"]) > 0
        # Verify voice structure
        voice = data["voices"][0]
        assert "voice_id" in voice
        assert "name" in voice
        assert "description" in voice
        assert "gender" in voice
        print(f"✓ Voices endpoint returned {len(data['voices'])} voices")
    
    def test_get_packages(self):
        """Test /api/payments/packages returns subscription packages"""
        response = requests.get(f"{BASE_URL}/api/payments/packages")
        assert response.status_code == 200
        data = response.json()
        assert "packages" in data
        assert len(data["packages"]) > 0
        # Verify package structure
        package = data["packages"][0]
        assert "id" in package
        assert "name" in package
        assert "amount" in package
        assert "tier" in package
        assert "features" in package
        print(f"✓ Packages endpoint returned {len(data['packages'])} packages")


class TestAuthentication:
    """Tests for authentication endpoints"""
    
    def test_login_with_valid_credentials(self):
        """Test email login with valid credentials"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login/email",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert "id" in data["user"]
        assert "name" in data["user"]
        assert "subscription_tier" in data["user"]
        print(f"✓ Login successful for {TEST_EMAIL}")
        return session
    
    def test_login_with_invalid_credentials(self):
        """Test email login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login/email",
            json={"email": "wrong@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_auth_check_authenticated(self):
        """Test /api/auth/check returns user data when authenticated"""
        session = requests.Session()
        # Login first
        session.post(
            f"{BASE_URL}/api/auth/login/email",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        # Check auth
        response = session.get(f"{BASE_URL}/api/auth/check")
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] == True
        assert data["user"]["email"] == TEST_EMAIL
        print("✓ Auth check returns authenticated user")
    
    def test_auth_check_unauthenticated(self):
        """Test /api/auth/check returns unauthenticated when no session"""
        response = requests.get(f"{BASE_URL}/api/auth/check")
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] == False
        print("✓ Auth check returns unauthenticated for no session")
    
    def test_logout(self):
        """Test logout clears session"""
        session = requests.Session()
        # Login first
        session.post(
            f"{BASE_URL}/api/auth/login/email",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        # Logout
        response = session.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        # Verify logged out
        check_response = session.get(f"{BASE_URL}/api/auth/check")
        check_data = check_response.json()
        assert check_data["authenticated"] == False
        print("✓ Logout successful")


class TestAuthenticatedEndpoints:
    """Tests for endpoints requiring authentication"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Create an authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login/email",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_get_usage(self, authenticated_session):
        """Test /api/usage returns user usage data"""
        response = authenticated_session.get(f"{BASE_URL}/api/usage")
        assert response.status_code == 200
        data = response.json()
        assert "subscription_tier" in data
        assert "tier_name" in data
        assert "videos_uploaded" in data
        assert "max_videos" in data
        assert "month" in data
        print(f"✓ Usage endpoint returned: {data['tier_name']} tier, {data['videos_uploaded']} videos")
    
    def test_get_projects(self, authenticated_session):
        """Test /api/projects returns user projects"""
        response = authenticated_session.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Projects endpoint returned {len(data)} projects")
    
    def test_get_folders(self, authenticated_session):
        """Test /api/folders returns folder structure"""
        response = authenticated_session.get(f"{BASE_URL}/api/folders")
        assert response.status_code == 200
        data = response.json()
        assert "folders" in data
        # Verify default folders exist
        folder_ids = [f["id"] for f in data["folders"]]
        assert "all" in folder_ids
        assert "recent" in folder_ids
        assert "trash" in folder_ids
        print(f"✓ Folders endpoint returned {len(data['folders'])} folders")
    
    def test_usage_requires_auth(self):
        """Test /api/usage requires authentication"""
        response = requests.get(f"{BASE_URL}/api/usage")
        assert response.status_code == 401
        print("✓ Usage endpoint correctly requires authentication")
    
    def test_projects_requires_auth(self):
        """Test /api/projects requires authentication"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 401
        print("✓ Projects endpoint correctly requires authentication")


class TestSceneMerging:
    """Tests for scene merging functionality (Task 2)"""
    
    def test_scene_merging_functions_exist(self):
        """Verify merge_similar_scenes and compare_scene_similarity functions exist in server.py"""
        import sys
        sys.path.insert(0, '/app/backend')
        from server import merge_similar_scenes, compare_scene_similarity
        
        # Verify functions are callable
        assert callable(merge_similar_scenes)
        assert callable(compare_scene_similarity)
        print("✓ Scene merging functions exist and are callable")
    
    def test_merge_similar_scenes_empty_list(self):
        """Test merge_similar_scenes with empty list"""
        import sys
        sys.path.insert(0, '/app/backend')
        from server import merge_similar_scenes
        
        result = merge_similar_scenes([])
        assert result == []
        print("✓ merge_similar_scenes handles empty list")
    
    def test_merge_similar_scenes_single_scene(self):
        """Test merge_similar_scenes with single scene"""
        import sys
        import numpy as np
        sys.path.insert(0, '/app/backend')
        from server import merge_similar_scenes
        
        # Create a dummy scene with a frame
        dummy_frame = np.zeros((100, 100, 3), dtype=np.uint8)
        scenes = [{'frame_number': 0, 'timestamp': 0.0, 'frame': dummy_frame}]
        
        result = merge_similar_scenes(scenes)
        assert len(result) == 1
        print("✓ merge_similar_scenes handles single scene")


class TestAuthInactivityTimeout:
    """Tests for auth inactivity timeout (Task 4)"""
    
    def test_auth_context_timeout_is_30_minutes(self):
        """Verify AuthContext.js has 30 minute inactivity timeout"""
        with open('/app/frontend/src/context/AuthContext.js', 'r') as f:
            content = f.read()
        
        # Check for 30 minute timeout (30 * 60 * 1000 = 1800000 ms)
        assert '30 * 60 * 1000' in content or '1800000' in content
        assert 'INACTIVITY_TIMEOUT' in content
        print("✓ AuthContext.js has 30 minute inactivity timeout")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
