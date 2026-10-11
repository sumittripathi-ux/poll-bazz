
from getpass import getpass

from sqlalchemy import select

from app.database import SessionLocal
from app.models import User
from app.security import hash_password


username = input("Enter demo username: ").strip()

if not username or len(username) > 50:
    raise SystemExit("Username must contain 1-50 characters.")

password = getpass("Enter demo password: ")

if not password or len(password) > 128:
    raise SystemExit("Password must contain 1-128 characters.")

with SessionLocal() as db:
    existing_user = db.scalar(
        select(User).where(User.username == username)
    )

    if existing_user:
        raise SystemExit(
            "Username already exists. Choose another username."
        )

    user = User(
        username=username,
        password_hash=hash_password(password),
        role="user",
        is_active=True,
        balance=0,
    )

    db.add(user)
    db.commit()

    print(f"Demo user created successfully: {username}")
