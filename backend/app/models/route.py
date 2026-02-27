from sqlalchemy import Column, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    stop_order = Column(Integer, nullable=False)
    travel_time_mins = Column(Integer) # Time from previous stop
    distance_km = Column(Float) # Distance from previous stop

    trip = relationship("Trip", backref="routes")
    location = relationship("Location")
