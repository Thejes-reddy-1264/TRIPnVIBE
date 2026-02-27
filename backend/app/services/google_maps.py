import httpx
from typing import List, Dict, Optional
from app.core.config import settings

GOOGLE_PLACES_AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
GOOGLE_PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

async def search_places(query: str) -> List[Dict]:
    """
    Search for places using Google Places Autocomplete API.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        # For development/testing without a real key
        return [
            {"description": f"Mock Place for {query} 1", "place_id": "mock_id_1"},
            {"description": f"Mock Place for {query} 2", "place_id": "mock_id_2"}
        ]

    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_PLACES_AUTOCOMPLETE_URL,
            params={
                "input": query,
                "key": settings.GOOGLE_MAPS_API_KEY
            }
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("predictions", [])
        return []

async def get_place_details(place_id: str) -> Optional[Dict]:
    """
    Get detailed information (latitude, longitude, name) about a specific place.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
         # Mock response for development
         return {
             "name": "Mock Location",
             "lat": 0.0,
             "lng": 0.0,
             "place_id": place_id,
             "type": "mock"
         }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_PLACE_DETAILS_URL,
            params={
                "place_id": place_id,
                "fields": "name,geometry,type",
                "key": settings.GOOGLE_MAPS_API_KEY
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            result = data.get("result")
            if result:
                location = result.get("geometry", {}).get("location", {})
                types = result.get("types", [])
                primary_type = types[0] if types else "general"
                
                return {
                    "name": result.get("name"),
                    "lat": location.get("lat"),
                    "lng": location.get("lng"),
                    "place_id": place_id,
                    "type": primary_type
                }
        return None
