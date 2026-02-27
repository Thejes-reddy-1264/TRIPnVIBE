from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

db_uri = str(settings.DATABASE_URI) if settings.DATABASE_URI else "sqlite:///./tripnvibe.db"
if db_uri.startswith("sqlite"):
    engine = create_engine(db_uri, connect_args={"check_same_thread": False})
else:
    engine = create_engine(db_uri, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
