import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from app.db.base import Base
from app.db.session import SessionLocal
from app.schemas.user import UserCreate
from app.crud.crud_user import create as create_user, authenticate

# Override session for testing
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)

def test_auth_flow():
    from sqlalchemy.orm import sessionmaker
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # 1. Create a User
    user_in = UserCreate(email="test@tripnvibe.com", password="securepassword", full_name="Test User")
    user = create_user(db, obj_in=user_in)
    print(f"User created: {user.email}")

    # 2. Authenticate the User
    auth_user = authenticate(db, email="test@tripnvibe.com", password="securepassword")
    if auth_user:
        print("Authentication Successful!")
    else:
        print("Authentication Failed!")
        sys.exit(1)

    # 3. Create a JWT Token
    from app.core.security import create_access_token
    token = create_access_token(subject=auth_user.id)
    print(f"Generated Token: {token}")

    # 4. Verify the Token
    from jose import jwt
    from app.core.config import settings
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        print(f"Token verified for user ID: {payload.get('sub')}")
    except Exception as e:
        print(f"Token verification failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_auth_flow()
