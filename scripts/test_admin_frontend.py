#!/usr/bin/env python3
"""
Test script to verify admin authentication flow.
"""
import asyncio
import aiohttp
import json

async def test_admin_auth_flow():
    print("🧪 Testing Admin Authentication Flow")
    
    # Test login
    login_data = {
        "email": "lawmwad@gmail.com",
        "password": "Law2@admin"
    }
    
    async with aiohttp.ClientSession() as session:
        # Test login
        print("1. Testing login...")
        async with session.post(
            "http://localhost:8000/api/v1/super-admin/login",
            json=login_data
        ) as response:
            if response.status == 200:
                login_result = await response.json()
                token = login_result["access_token"]
                print(f"✅ Login successful, token: {token[:50]}...")
                
                # Test dashboard stats
                print("2. Testing dashboard stats...")
                headers = {"Authorization": f"Bearer {token}"}
                async with session.get(
                    "http://localhost:8000/api/v1/super-admin/dashboard/stats",
                    headers=headers
                ) as stats_response:
                    if stats_response.status == 200:
                        stats = await stats_response.json()
                        print(f"✅ Dashboard stats: {stats}")
                    else:
                        print(f"❌ Dashboard stats failed: {stats_response.status}")
                
                # Test schools endpoint
                print("3. Testing schools endpoint...")
                async with session.get(
                    "http://localhost:8000/api/v1/super-admin/schools",
                    headers=headers
                ) as schools_response:
                    if schools_response.status == 200:
                        schools = await schools_response.json()
                        print(f"✅ Schools endpoint: {len(schools)} schools found")
                    else:
                        print(f"❌ Schools endpoint failed: {schools_response.status}")
                
                # Test support tickets endpoint
                print("4. Testing support tickets endpoint...")
                async with session.get(
                    "http://localhost:8000/api/v1/super-admin/support-tickets?status=OPEN",
                    headers=headers
                ) as tickets_response:
                    if tickets_response.status == 200:
                        tickets = await tickets_response.json()
                        print(f"✅ Support tickets endpoint: {len(tickets)} tickets found")
                    else:
                        print(f"❌ Support tickets endpoint failed: {tickets_response.status}")
                
            else:
                print(f"❌ Login failed: {response.status}")
                error_text = await response.text()
                print(f"Error: {error_text}")

if __name__ == "__main__":
    asyncio.run(test_admin_auth_flow())
