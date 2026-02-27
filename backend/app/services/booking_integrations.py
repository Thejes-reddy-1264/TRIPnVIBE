from typing import List, Dict
import random
import uuid
import asyncio

async def search_hotels(location_name: str, check_in: str, check_out: str) -> List[Dict]:
    """
    Simulates fetching hotel data from an external provider.
    """
    await asyncio.sleep(0.5) # simulate network latency
    hotels = [
        {"name": "Grand Plaza Hotel", "price_per_night": 120.0, "rating": 4.5},
        {"name": "Comfort Inn", "price_per_night": 80.0, "rating": 3.8},
        {"name": "Luxury Suites", "price_per_night": 250.0, "rating": 4.9}
    ]
    return [
        {
            "id": str(uuid.uuid4()),
            "provider": "MockHotelAPI",
            "name": h["name"],
            "location": location_name,
            "cost": h["price_per_night"],
            "rating": h["rating"]
        } for h in hotels
    ]

async def search_flights(origin: str, destination: str, date: str) -> List[Dict]:
    """
    Simulates fetching flight data from an external provider like Amadeus.
    """
    await asyncio.sleep(0.5)
    airlines = ["AirTravel", "SkyHigh Alliance", "BudgetFly"]
    results = []
    for airline in airlines:
        results.append({
            "id": str(uuid.uuid4()),
            "provider": "MockAmadeus",
            "airline": airline,
            "origin": origin,
            "destination": destination,
            "departure": f"{date}T08:00:00Z",
            "cost": round(random.uniform(50.0, 500.0), 2)
        })
    return results

async def search_cabs(origin: str, destination: str) -> List[Dict]:
    """
    Simulates fetching cab data from an external provider like Uber/Ola.
    """
    await asyncio.sleep(0.2)
    return [
        {
            "id": str(uuid.uuid4()),
            "provider": "MockUber",
            "type": "Economy",
            "origin": origin,
            "destination": destination,
            "cost": round(random.uniform(10.0, 50.0), 2)
        },
        {
            "id": str(uuid.uuid4()),
            "provider": "MockUber",
            "type": "Premium",
            "origin": origin,
            "destination": destination,
            "cost": round(random.uniform(30.0, 100.0), 2)
        }
    ]
