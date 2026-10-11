
from getpass import getpass

from sqlalchemy import select

from app.database import SessionLocal
from app.models import User

username = input("Existing username: ").strip()
confirmation = input(
    "Type PROMOTE to grant this user the admin role: "
).strip()

if confirmation != "PROMOTE":
    raise SystemExit("Cancelled.")

with SessionLocal() as db:
    user = db.scalar(
        select(User).where(User.username == username)
    )

    if user is None:
        raise SystemExit("User not found.")

    user.role = "admin"
    db.commit()

    print(f"{user.username} now has role={user.role}")
