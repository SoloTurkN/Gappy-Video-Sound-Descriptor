#!/usr/bin/env python3
"""
Focused test script for Gappy Describe API review request
Tests specific endpoints mentioned in the review request
"""

import requests
import sys
import json
import time

class GappyDescribeReviewTester:
    def __init__(self, base_url="https://describebot.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session_cookies = None
        self.user_data = None
        
        # Create new test user for this review
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        self.test_user = {
            'name': 'Review Tester',
            'email': f'review.tester.{unique_id}@testmail.com',
            'password': 'ReviewTest2024!'
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if data else {}
        
        # Use session cookies if available and auth required
        test_cookies = self.session_cookies if auth_required else None

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, cookies=test_cookies, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, cookies=test_cookies, timeout=30)
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

    def test_health_endpoints(self):
        """Test health endpoints"""
        print("\n" + "=" * 20 + " HEALTH ENDPOINTS " + "=" * 20)
        
        # Test GET /health
        success1, response1 = self.run_test(
            "GET /health",
            "GET",
            "health",
            200,
            auth_required=False
        )
        
        # Test GET /api/health  
        success2, response2 = self.run_test(
            "GET /api/health",
            "GET", 
            "health",
            200,
            auth_required=False
        )
        
        if success2 and response2.get('status') == 'healthy':
            print("✅ API health endpoint returns correct status")
        
        return success1 and success2

    def test_authentication_flow(self):
        """Test authentication endpoints"""
        print("\n" + "=" * 20 + " AUTHENTICATION FLOW " + "=" * 20)
        
        # First create a new test user
        signup_success, signup_response = self.run_test(
            "POST /api/auth/signup/email",
            "POST",
            "auth/signup/email",
            200,
            data=self.test_user,
            auth_required=False
        )
        
        if signup_success and signup_response.get('success'):
            print(f"✅ User created: {self.test_user['email']}")
        
        # Test login with the new user
        login_data = {
            'email': self.test_user['email'],
            'password': self.test_user['password']
        }
        
        # Make request manually to capture cookies
        url = f"{self.api_url}/auth/login/email"
        response = requests.post(url, json=login_data, timeout=30)
        
        self.tests_run += 1
        print(f"\n🔍 Testing POST /api/auth/login...")
        
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
                    login_success = True
                else:
                    login_success = False
            except:
                login_success = False
        else:
            print(f"❌ Failed - Expected 200, got {response.status_code}")
            try:
                print(f"Response: {response.json()}")
            except:
                print(f"Response: {response.text}")
            login_success = False
        
        # Test GET /api/auth/me
        me_success, me_response = self.run_test(
            "GET /api/auth/me",
            "GET",
            "auth/me", 
            200
        )
        
        if me_success and me_response.get('email'):
            print(f"✅ Current user: {me_response['email']}")
        
        # Test POST /api/auth/logout
        logout_success, logout_response = self.run_test(
            "POST /api/auth/logout",
            "POST",
            "auth/logout",
            200
        )
        
        if logout_success and logout_response.get('success'):
            print("✅ Logout successful")
            # Re-login for subsequent tests
            response = requests.post(url, json=login_data, timeout=30)
            if response.status_code == 200:
                self.session_cookies = response.cookies
                print("✅ Re-logged in for subsequent tests")
        
        return signup_success and login_success and me_success and logout_success

    def test_api_endpoints(self):
        """Test core API endpoints"""
        print("\n" + "=" * 20 + " API ENDPOINTS " + "=" * 20)
        
        # Test GET /api/languages
        lang_success, lang_response = self.run_test(
            "GET /api/languages",
            "GET",
            "languages",
            200,
            auth_required=False
        )
        
        if lang_success and lang_response.get('languages'):
            languages = lang_response['languages']
            print(f"✅ Found {len(languages)} languages")
            # Check for English
            english_found = any(lang['code'] == 'en' for lang in languages)
            if english_found:
                print("✅ English language available")
        
        # Test GET /api/voices
        voice_success, voice_response = self.run_test(
            "GET /api/voices", 
            "GET",
            "voices",
            200,
            auth_required=False
        )
        
        if voice_success and voice_response.get('voices'):
            voices = voice_response['voices']
            print(f"✅ Found {len(voices)} voices")
            # Check for Rachel voice
            rachel_found = any(voice['name'] == 'Rachel' for voice in voices)
            if rachel_found:
                print("✅ Rachel voice available")
        
        # Test GET /api/usage (requires auth)
        usage_success, usage_response = self.run_test(
            "GET /api/usage",
            "GET", 
            "usage",
            200
        )
        
        if usage_success:
            print(f"✅ Subscription tier: {usage_response.get('subscription_tier', 'unknown')}")
            print(f"✅ Videos uploaded: {usage_response.get('videos_uploaded', 0)}")
            print(f"✅ Max videos: {usage_response.get('max_videos', 'unlimited')}")
        
        # Test GET /api/folders (requires auth)
        folder_success, folder_response = self.run_test(
            "GET /api/folders",
            "GET",
            "folders", 
            200
        )
        
        if folder_success and folder_response.get('folders'):
            folders = folder_response['folders']
            print(f"✅ Found {len(folders)} folders")
            folder_names = [f['name'] for f in folders]
            print(f"✅ Folder names: {', '.join(folder_names)}")
        
        # Test GET /api/projects (requires auth)
        project_success, project_response = self.run_test(
            "GET /api/projects",
            "GET",
            "projects",
            200
        )
        
        if project_success:
            projects = project_response if isinstance(project_response, list) else []
            print(f"✅ Found {len(projects)} projects")
        
        return lang_success and voice_success and usage_success and folder_success and project_success

    def test_payment_endpoints(self):
        """Test payment endpoints and verify new pricing"""
        print("\n" + "=" * 20 + " PAYMENT ENDPOINTS " + "=" * 20)
        
        # Test GET /api/payments/packages
        packages_success, packages_response = self.run_test(
            "GET /api/payments/packages",
            "GET",
            "payments/packages",
            200,
            auth_required=False
        )
        
        if packages_success and packages_response.get('packages'):
            packages = packages_response['packages']
            print(f"✅ Found {len(packages)} subscription packages")
            
            # Verify new pricing structure
            expected_packages = {
                'creator_monthly': {'amount': 15.0, 'tier': 'creator'},
                'creator_yearly': {'amount': 150.0, 'tier': 'creator'},
                'pro_monthly': {'amount': 49.0, 'tier': 'pro'},
                'pro_yearly': {'amount': 490.0, 'tier': 'pro'}
            }
            
            pricing_correct = True
            for pkg in packages:
                pkg_id = pkg['id']
                if pkg_id in expected_packages:
                    expected = expected_packages[pkg_id]
                    if pkg['amount'] == expected['amount'] and pkg['tier'] == expected['tier']:
                        print(f"✅ {pkg_id}: ${pkg['amount']} ({pkg['tier']} tier) - CORRECT")
                    else:
                        print(f"❌ {pkg_id}: Expected ${expected['amount']} ({expected['tier']}), got ${pkg['amount']} ({pkg['tier']})")
                        pricing_correct = False
                else:
                    print(f"⚠️ Unexpected package: {pkg_id}")
            
            # Verify Creator $15 and Pro $49 specifically mentioned in review
            creator_15_found = any(pkg['id'] == 'creator_monthly' and pkg['amount'] == 15.0 for pkg in packages)
            pro_49_found = any(pkg['id'] == 'pro_monthly' and pkg['amount'] == 49.0 for pkg in packages)
            
            if creator_15_found:
                print("✅ Creator $15 pricing verified")
            else:
                print("❌ Creator $15 pricing not found")
                pricing_correct = False
                
            if pro_49_found:
                print("✅ Pro $49 pricing verified")
            else:
                print("❌ Pro $49 pricing not found")
                pricing_correct = False
            
            return packages_success and pricing_correct
        
        return packages_success

    def test_transcript_endpoints(self):
        """Test transcript endpoints (basic verification)"""
        print("\n" + "=" * 20 + " TRANSCRIPT ENDPOINTS " + "=" * 20)
        
        # Test that transcript endpoints exist and require auth
        fake_project_id = "00000000-0000-0000-0000-000000000000"
        
        # Test POST /api/transcribe/{project_id} without auth
        transcribe_unauth_success, _ = self.run_test(
            "POST /api/transcribe/{project_id} (no auth)",
            "POST",
            f"transcribe/{fake_project_id}",
            401,
            auth_required=False
        )
        
        # Test GET /api/transcript/{project_id} without auth
        transcript_unauth_success, _ = self.run_test(
            "GET /api/transcript/{project_id} (no auth)",
            "GET",
            f"transcript/{fake_project_id}",
            401,
            auth_required=False
        )
        
        # Test GET /api/captions/{project_id}/srt without auth
        captions_unauth_success, _ = self.run_test(
            "GET /api/captions/{project_id}/srt (no auth)",
            "GET",
            f"captions/{fake_project_id}/srt",
            401,
            auth_required=False
        )
        
        if transcribe_unauth_success:
            print("✅ Transcribe endpoint requires authentication")
        if transcript_unauth_success:
            print("✅ Transcript endpoint requires authentication")
        if captions_unauth_success:
            print("✅ Captions endpoint requires authentication")
        
        return transcribe_unauth_success and transcript_unauth_success and captions_unauth_success

    def run_all_tests(self):
        """Run all review tests"""
        print("🚀 Starting Gappy Describe API Review Tests")
        print("=" * 60)
        
        # Run test suites
        health_result = self.test_health_endpoints()
        auth_result = self.test_authentication_flow()
        api_result = self.test_api_endpoints()
        payment_result = self.test_payment_endpoints()
        transcript_result = self.test_transcript_endpoints()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 FINAL RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        
        # Summary by category
        print("\n📋 CATEGORY RESULTS:")
        print(f"   Health Endpoints: {'✅ PASS' if health_result else '❌ FAIL'}")
        print(f"   Authentication Flow: {'✅ PASS' if auth_result else '❌ FAIL'}")
        print(f"   API Endpoints: {'✅ PASS' if api_result else '❌ FAIL'}")
        print(f"   Payment Endpoints: {'✅ PASS' if payment_result else '❌ FAIL'}")
        print(f"   Transcript Endpoints: {'✅ PASS' if transcript_result else '❌ FAIL'}")
        
        all_passed = all([health_result, auth_result, api_result, payment_result, transcript_result])
        
        if all_passed:
            print("\n🎉 ALL REVIEW TESTS PASSED! The Gappy Describe API meets review requirements.")
            return 0
        else:
            print(f"\n⚠️ SOME TESTS FAILED - See details above")
            return 1

def main():
    tester = GappyDescribeReviewTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())