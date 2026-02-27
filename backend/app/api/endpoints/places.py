from typing import Any, List, Dict
from fastapi import APIRouter, Depends, Query, HTTPException
from app.api import deps
from app.models.user import User
from app.services import google_maps

router = APIRouter()

@router.get("/search", response_model=List[Dict])
async def search_places(
    query: str = Query(..., min_length=2, description="Search query for places"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Search for places via Google Places Autocomplete API.
    """
    results = await google_maps.search_places(query)
    return results

@router.get("/{place_id}", response_model=Dict)
async def get_place_details(
    place_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get detailed information about a specific place (lat, lng, type).
    """
    details = await google_maps.get_place_details(place_id)
    if not details:
        raise HTTPException(status_code=404, detail="Place details not found or invalid Place ID")
    return details
