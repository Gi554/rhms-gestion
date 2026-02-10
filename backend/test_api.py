import requests
import json

BASE_URL = 'http://localhost:8000/api'

# 1. Login
print("Logging in...")
try:
    auth_response = requests.post(f'{BASE_URL}/auth/token/', data={
        'username': 'admin',
        'password': 'admin123'
    })
    auth_response.raise_for_status()
    tokens = auth_response.json()
    access_token = tokens['access']
    print("Login successful, token obtained.")
except Exception as e:
    print(f"Login failed: {e}")
    exit(1)

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

# 2. Get Organizations
print("\nFetching organizations...")
try:
    org_response = requests.get(f'{BASE_URL}/organizations/', headers=headers)
    org_response.raise_for_status()
    org_data = org_response.json()
    print(f"Organizations Response: {json.dumps(org_data, indent=2)}")
    
    # Handle pagination
    if 'results' in org_data:
        orgs = org_data['results']
    else:
        orgs = org_data
        
    if not orgs:
        print("No organizations list found.")
        exit(1)
        
    first_org_id = orgs[0]['id']
    print(f"\nFirst Org ID: {first_org_id}")

    # 3. Get Stats
    print(f"\nFetching stats for org {first_org_id}...")
    stats_url = f'{BASE_URL}/organizations/{first_org_id}/stats/'
    stats_response = requests.get(stats_url, headers=headers)
    stats_response.raise_for_status()
    stats_data = stats_response.json()
    print(f"Stats Response: {json.dumps(stats_data, indent=2)}")

except Exception as e:
    print(f"API request failed: {e}")
    if hasattr(e, 'response') and e.response is not None:
        print(f"Error content: {e.response.text}")
