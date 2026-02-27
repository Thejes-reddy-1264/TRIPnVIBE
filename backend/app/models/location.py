from sqlalchemy import Column, Integer, String, Float
from app.db.base_class import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    place_id = Column(String, unique=True, index=True) # Google Places ID
    type = Column(String) # e.g., 'hotel', 'restaurant', 'attraction'
