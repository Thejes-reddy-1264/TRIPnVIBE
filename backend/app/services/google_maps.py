import httpx
from typing import List, Dict, Optional, Tuple
from app.core.config import settings

GOOGLE_PLACES_AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
GOOGLE_PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
GOOGLE_DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"

async def search_places(query: str) -> List[Dict]:
    """
    Search for places using Google Places Autocomplete API.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
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


def geocode_location(name: str) -> Optional[Tuple[float, float]]:
    """
    Geocode a place name to lat/lng.
    1. Tries Google Geocoding API first (if key is set).
    2. Falls back to Nominatim (OpenStreetMap) which is free and needs no key.
    """
    import logging
    logger = logging.getLogger(__name__)

    # --- Try Google Geocoding ---
    if settings.GOOGLE_MAPS_API_KEY:
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    GOOGLE_GEOCODING_URL,
                    params={"address": name, "key": settings.GOOGLE_MAPS_API_KEY}
                )
                if response.status_code == 200:
                    data = response.json()
                    status = data.get("status")
                    if status == "OK":
                        results = data.get("results", [])
                        if results:
                            loc = results[0]["geometry"]["location"]
                            logger.info("Google geocoded '%s' -> %s", name, loc)
                            return (loc["lat"], loc["lng"])
                    else:
                        logger.warning("Google Geocoding API returned status '%s' for '%s'. Falling back to Nominatim.", status, name)
        except Exception as e:
            logger.warning("Google Geocoding failed for '%s': %s. Falling back to Nominatim.", name, e)

    # --- Fallback: Nominatim (OpenStreetMap) ---
    try:
        with httpx.Client(timeout=10.0, headers={"User-Agent": "TRIPnVIBE/1.0"}) as client:
            response = client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": name, "format": "json", "limit": 1}
            )
            if response.status_code == 200:
                results = response.json()
                if results:
                    lat = float(results[0]["lat"])
                    lon = float(results[0]["lon"])
                    logger.info("Nominatim geocoded '%s' -> (%s, %s)", name, lat, lon)
                    return (lat, lon)
    except Exception as e:
        logger.error("Nominatim geocoding also failed for '%s': %s", name, e)

    return None


def get_distance_matrix(
    origins: List[Tuple[float, float]],
    destinations: List[Tuple[float, float]]
) -> Optional[List[List[Optional[Dict]]]]:
    """
    Fetch a travel time/distance matrix using Google Distance Matrix API (driving mode).
    Returns a 2D list of {duration_secs, distance_meters} dicts (None on unavailable pairs).
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        return None

    origins_str = "|".join([f"{lat},{lng}" for lat, lng in origins])
    destinations_str = "|".join([f"{lat},{lng}" for lat, lng in destinations])

    with httpx.Client(timeout=15.0) as client:
        response = client.get(
            GOOGLE_DISTANCE_MATRIX_URL,
            params={
                "origins": origins_str,
                "destinations": destinations_str,
                "mode": "driving",
                "key": settings.GOOGLE_MAPS_API_KEY
            }
        )
        if response.status_code == 200:
            data = response.json()
            rows = data.get("rows", [])
            matrix: List[List[Optional[Dict]]] = []
            for row in rows:
                row_data = []
                for element in row.get("elements", []):
                    if element.get("status") == "OK":
                        row_data.append({
                            "duration_secs": element["duration"]["value"],
                            "distance_meters": element["distance"]["value"]
                        })
                    else:
                        row_data.append(None)
                matrix.append(row_data)
            return matrix
    return None
