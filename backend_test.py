#!/usr/bin/env python3
"""
Backend API Testing Script for Streaming App
Tests all endpoints according to the test plan in test_result.md
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://mobile-todo-themes.preview.emergentagent.com/api"

class StreamingAppTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    def test_health_check(self):
        """Test GET /api/health"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, "Backend is healthy")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response: {data}")
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
        return False
    
    def test_movies_endpoints(self):
        """Test all movies endpoints (public, no auth required)"""
        success_count = 0
        
        # Test GET /api/movies (all movies)
        try:
            response = requests.get(f"{self.base_url}/movies", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "results" in data and len(data["results"]) == 10:
                    self.log_test("GET /api/movies (all)", True, f"Retrieved {len(data['results'])} movies")
                    success_count += 1
                else:
                    self.log_test("GET /api/movies (all)", False, f"Expected 10 movies, got {len(data.get('results', []))}")
            else:
                self.log_test("GET /api/movies (all)", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/movies (all)", False, f"Exception: {str(e)}")
        
        # Test GET /api/movies?category=trending (top 6 by rating)
        try:
            response = requests.get(f"{self.base_url}/movies?category=trending", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "results" in data and len(data["results"]) == 6:
                    # Check if sorted by rating
                    ratings = [movie["vote_average"] for movie in data["results"]]
                    if ratings == sorted(ratings, reverse=True):
                        self.log_test("GET /api/movies?category=trending", True, f"Retrieved top 6 movies by rating")
                        success_count += 1
                    else:
                        self.log_test("GET /api/movies?category=trending", False, "Movies not sorted by rating")
                else:
                    self.log_test("GET /api/movies?category=trending", False, f"Expected 6 movies, got {len(data.get('results', []))}")
            else:
                self.log_test("GET /api/movies?category=trending", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/movies?category=trending", False, f"Exception: {str(e)}")
        
        # Test GET /api/movies?category=movies (only movies)
        try:
            response = requests.get(f"{self.base_url}/movies?category=movies", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "results" in data:
                    movies_only = all(movie["media_type"] == "movie" for movie in data["results"])
                    if movies_only:
                        self.log_test("GET /api/movies?category=movies", True, f"Retrieved {len(data['results'])} movies only")
                        success_count += 1
                    else:
                        self.log_test("GET /api/movies?category=movies", False, "Response contains non-movie items")
                else:
                    self.log_test("GET /api/movies?category=movies", False, "No results field in response")
            else:
                self.log_test("GET /api/movies?category=movies", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/movies?category=movies", False, f"Exception: {str(e)}")
        
        # Test GET /api/movies?category=tv (only TV series)
        try:
            response = requests.get(f"{self.base_url}/movies?category=tv", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "results" in data:
                    tv_only = all(movie["media_type"] == "tv" for movie in data["results"])
                    if tv_only:
                        self.log_test("GET /api/movies?category=tv", True, f"Retrieved {len(data['results'])} TV series only")
                        success_count += 1
                    else:
                        self.log_test("GET /api/movies?category=tv", False, "Response contains non-TV items")
                else:
                    self.log_test("GET /api/movies?category=tv", False, "No results field in response")
            else:
                self.log_test("GET /api/movies?category=tv", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/movies?category=tv", False, f"Exception: {str(e)}")
        
        # Test GET /api/movies/1 (specific movie details)
        try:
            response = requests.get(f"{self.base_url}/movies/1", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == "1" and "title" in data:
                    self.log_test("GET /api/movies/1", True, f"Retrieved movie: {data['title']}")
                    success_count += 1
                else:
                    self.log_test("GET /api/movies/1", False, "Invalid movie data structure")
            else:
                self.log_test("GET /api/movies/1", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/movies/1", False, f"Exception: {str(e)}")
        
        # Test GET /api/movies/search?q=ação (search)
        try:
            response = requests.get(f"{self.base_url}/movies/search?q=ação", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "results" in data:
                    # Should find "Ação Explosiva"
                    found_action = any("ação" in movie["title"].lower() for movie in data["results"])
                    if found_action:
                        self.log_test("GET /api/movies/search?q=ação", True, f"Found {len(data['results'])} matching movies")
                        success_count += 1
                    else:
                        self.log_test("GET /api/movies/search?q=ação", False, "No matching movies found")
                else:
                    self.log_test("GET /api/movies/search?q=ação", False, "No results field in response")
            else:
                self.log_test("GET /api/movies/search?q=ação", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/movies/search?q=ação", False, f"Exception: {str(e)}")
        
        return success_count == 6
    
    def create_test_user_and_session(self):
        """Create test user and session using mongosh"""
        print("Creating test user and session...")
        
        # Generate unique IDs
        timestamp = int(datetime.now().timestamp())
        user_id = f"test-user-{timestamp}"
        session_token = f"test_session_{timestamp}"
        
        # MongoDB command to create test user and session
        mongo_cmd = f'''
        use streaming_app;
        db.users.insertOne({{
            "_id": "{user_id}",
            "email": "test.user.{timestamp}@example.com",
            "name": "Test User {timestamp}",
            "picture": "https://via.placeholder.com/150",
            "created_at": new Date()
        }});
        db.sessions.insertOne({{
            "user_id": "{user_id}",
            "session_token": "{session_token}",
            "expires_at": new Date(Date.now() + 7*24*60*60*1000),
            "created_at": new Date()
        }});
        print("User ID: {user_id}");
        print("Session Token: {session_token}");
        '''
        
        try:
            import subprocess
            result = subprocess.run(
                ["mongosh", "--eval", mongo_cmd],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.user_id = user_id
                self.session_token = session_token
                self.log_test("Create Test User & Session", True, f"Created user {user_id}")
                return True
            else:
                self.log_test("Create Test User & Session", False, f"MongoDB error: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_test("Create Test User & Session", False, f"Exception: {str(e)}")
            return False
    
    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        if not self.session_token:
            self.log_test("Auth Endpoints", False, "No session token available")
            return False
        
        success_count = 0
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        # Test GET /api/auth/me
        try:
            response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == self.user_id:
                    self.log_test("GET /api/auth/me", True, f"Retrieved user data for {data.get('name')}")
                    success_count += 1
                else:
                    self.log_test("GET /api/auth/me", False, f"User ID mismatch: expected {self.user_id}, got {data.get('id')}")
            else:
                self.log_test("GET /api/auth/me", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/auth/me", False, f"Exception: {str(e)}")
        
        # Test POST /api/auth/logout
        try:
            response = requests.post(f"{self.base_url}/auth/logout", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("POST /api/auth/logout", True, "Successfully logged out")
                    success_count += 1
                else:
                    self.log_test("POST /api/auth/logout", False, "No message in response")
            else:
                self.log_test("POST /api/auth/logout", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/auth/logout", False, f"Exception: {str(e)}")
        
        return success_count == 2
    
    def test_favorites_endpoints(self):
        """Test favorites endpoints (require auth)"""
        if not self.session_token:
            self.log_test("Favorites Endpoints", False, "No session token available")
            return False
        
        success_count = 0
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        # Test GET /api/favorites (initially empty)
        try:
            response = requests.get(f"{self.base_url}/favorites", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "results" in data:
                    self.log_test("GET /api/favorites (empty)", True, f"Retrieved {len(data['results'])} favorites")
                    success_count += 1
                else:
                    self.log_test("GET /api/favorites (empty)", False, "No results field in response")
            else:
                self.log_test("GET /api/favorites (empty)", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/favorites (empty)", False, f"Exception: {str(e)}")
        
        # Test POST /api/favorites?movie_id=1 (add favorite)
        try:
            response = requests.post(f"{self.base_url}/favorites?movie_id=1", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("POST /api/favorites?movie_id=1", True, "Added movie to favorites")
                    success_count += 1
                else:
                    self.log_test("POST /api/favorites?movie_id=1", False, "No message in response")
            else:
                self.log_test("POST /api/favorites?movie_id=1", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/favorites?movie_id=1", False, f"Exception: {str(e)}")
        
        # Test GET /api/favorites (should have 1 item now)
        try:
            response = requests.get(f"{self.base_url}/favorites", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "results" in data and len(data["results"]) == 1:
                    self.log_test("GET /api/favorites (with data)", True, f"Retrieved {len(data['results'])} favorites")
                    success_count += 1
                else:
                    self.log_test("GET /api/favorites (with data)", False, f"Expected 1 favorite, got {len(data.get('results', []))}")
            else:
                self.log_test("GET /api/favorites (with data)", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/favorites (with data)", False, f"Exception: {str(e)}")
        
        # Test DELETE /api/favorites/1 (remove favorite)
        try:
            response = requests.delete(f"{self.base_url}/favorites/1", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("DELETE /api/favorites/1", True, "Removed movie from favorites")
                    success_count += 1
                else:
                    self.log_test("DELETE /api/favorites/1", False, "No message in response")
            else:
                self.log_test("DELETE /api/favorites/1", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("DELETE /api/favorites/1", False, f"Exception: {str(e)}")
        
        return success_count == 4
    
    def test_watch_history_endpoints(self):
        """Test watch history endpoints (require auth)"""
        if not self.session_token:
            self.log_test("Watch History Endpoints", False, "No session token available")
            return False
        
        success_count = 0
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        # Test GET /api/watch-history (initially empty)
        try:
            response = requests.get(f"{self.base_url}/watch-history", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "results" in data:
                    self.log_test("GET /api/watch-history (empty)", True, f"Retrieved {len(data['results'])} history items")
                    success_count += 1
                else:
                    self.log_test("GET /api/watch-history (empty)", False, "No results field in response")
            else:
                self.log_test("GET /api/watch-history (empty)", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/watch-history (empty)", False, f"Exception: {str(e)}")
        
        # Test POST /api/watch-history?movie_id=1&progress=45.5
        try:
            response = requests.post(f"{self.base_url}/watch-history?movie_id=1&progress=45.5", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("POST /api/watch-history?movie_id=1&progress=45.5", True, "Updated watch history")
                    success_count += 1
                else:
                    self.log_test("POST /api/watch-history?movie_id=1&progress=45.5", False, "No message in response")
            else:
                self.log_test("POST /api/watch-history?movie_id=1&progress=45.5", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/watch-history?movie_id=1&progress=45.5", False, f"Exception: {str(e)}")
        
        # Test GET /api/watch-history (should have 1 item now)
        try:
            response = requests.get(f"{self.base_url}/watch-history", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "results" in data and len(data["results"]) == 1:
                    item = data["results"][0]
                    if item.get("progress") == 45.5:
                        self.log_test("GET /api/watch-history (with data)", True, f"Retrieved history with correct progress: {item['progress']}%")
                        success_count += 1
                    else:
                        self.log_test("GET /api/watch-history (with data)", False, f"Progress mismatch: expected 45.5, got {item.get('progress')}")
                else:
                    self.log_test("GET /api/watch-history (with data)", False, f"Expected 1 history item, got {len(data.get('results', []))}")
            else:
                self.log_test("GET /api/watch-history (with data)", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/watch-history (with data)", False, f"Exception: {str(e)}")
        
        return success_count == 3
    
    def test_theme_endpoints(self):
        """Test theme preference endpoints (require auth)"""
        if not self.session_token:
            self.log_test("Theme Endpoints", False, "No session token available")
            return False
        
        success_count = 0
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        # Test GET /api/theme (default should be dark)
        try:
            response = requests.get(f"{self.base_url}/theme", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("theme") == "dark":
                    self.log_test("GET /api/theme (default)", True, f"Default theme: {data['theme']}")
                    success_count += 1
                else:
                    self.log_test("GET /api/theme (default)", False, f"Expected 'dark', got {data.get('theme')}")
            else:
                self.log_test("GET /api/theme (default)", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/theme (default)", False, f"Exception: {str(e)}")
        
        # Test POST /api/theme?theme=light
        try:
            response = requests.post(f"{self.base_url}/theme?theme=light", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("theme") == "light":
                    self.log_test("POST /api/theme?theme=light", True, f"Updated theme to: {data['theme']}")
                    success_count += 1
                else:
                    self.log_test("POST /api/theme?theme=light", False, f"Theme not updated correctly: {data}")
            else:
                self.log_test("POST /api/theme?theme=light", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/theme?theme=light", False, f"Exception: {str(e)}")
        
        # Test GET /api/theme (should now be light)
        try:
            response = requests.get(f"{self.base_url}/theme", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("theme") == "light":
                    self.log_test("GET /api/theme (updated)", True, f"Theme updated to: {data['theme']}")
                    success_count += 1
                else:
                    self.log_test("GET /api/theme (updated)", False, f"Expected 'light', got {data.get('theme')}")
            else:
                self.log_test("GET /api/theme (updated)", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/theme (updated)", False, f"Exception: {str(e)}")
        
        return success_count == 3
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests for Streaming App")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test public endpoints first
        print("📋 Testing Public Endpoints...")
        health_ok = self.test_health_check()
        movies_ok = self.test_movies_endpoints()
        
        print("🔐 Setting up Authentication...")
        auth_setup_ok = self.create_test_user_and_session()
        
        # Test auth-protected endpoints
        auth_ok = favorites_ok = history_ok = theme_ok = False
        if auth_setup_ok:
            print("🔒 Testing Auth-Protected Endpoints...")
            auth_ok = self.test_auth_endpoints()
            favorites_ok = self.test_favorites_endpoints()
            history_ok = self.test_watch_history_endpoints()
            theme_ok = self.test_theme_endpoints()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n🎯 Component Status:")
        print(f"Health Check: {'✅' if health_ok else '❌'}")
        print(f"Movies Endpoints: {'✅' if movies_ok else '❌'}")
        print(f"Auth Setup: {'✅' if auth_setup_ok else '❌'}")
        print(f"Auth Endpoints: {'✅' if auth_ok else '❌'}")
        print(f"Favorites: {'✅' if favorites_ok else '❌'}")
        print(f"Watch History: {'✅' if history_ok else '❌'}")
        print(f"Theme Preferences: {'✅' if theme_ok else '❌'}")
        
        # Return overall success
        return all([health_ok, movies_ok, auth_setup_ok, auth_ok, favorites_ok, history_ok, theme_ok])

if __name__ == "__main__":
    tester = StreamingAppTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)