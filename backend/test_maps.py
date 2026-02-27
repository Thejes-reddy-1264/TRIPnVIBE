import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from app.db.base import Base
from app.schemas.user import UserCreate
from app.crud.crud_user import create as create_user

# Override session for testing
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)

def setup_db():
    from sqlalchemy.orm import sessionmaker
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    # Create a mock user
    user = create_user(db, obj_in=UserCreate(email="maps@tripnvibe.com", password="pwd", full_name="Maps Test User"))
    print(f"User created: {user.email}")
    return db

async def test_google_maps_service():
    from app.services.google_maps import search_places, get_place_details
    from app.core.config import settings
    
    # We aren't testing the actual HTTP call directly if key is None, 
    # but we are testing that the code path and mocks work.
    print(f"\n--- Testing Google Maps API (Key Active: {settings.GOOGLE_MAPS_API_KEY is not None}) ---")

    print("\n1. Searching for 'Eiffel Tower'")
    search_results = await search_places("Eiffel Tower")
    for result in search_results:
        print(f"Found: {result.get('description')} (ID: {result.get('place_id')})")

    if search_results:
        place_id = search_results[0].get("place_id")
        print(f"\n2. Fetching details for Place ID: {place_id}")
        details = await get_place_details(place_id)
        if details:
            print(f"Details: {details}")
        else:
            print("Failed to fetch details.")
    else:
        print("No search results found.")

if __name__ == "__main__":
    setup_db()
    asyncio.run(test_google_maps_service())
