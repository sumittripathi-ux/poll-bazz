
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models import User, Question, Option, Answer

with SessionLocal() as db:
    user = db.scalar(
        select(User).where(User.username == "demo_user")
    )
    question = db.scalar(select(Question))
    option = db.scalar(select(Option))

    if not user or not question or not option:
        raise RuntimeError(
            "Run the database seed test first."
        )

    # Test 1: Duplicate username
    try:
        db.add(
            User(
                username="demo_user",
                password_hash="placeholder",
                role="user",
            )
        )
        db.commit()
        print("FAIL: Duplicate username was accepted")
    except IntegrityError:
        db.rollback()
        print("PASS: Duplicate username rejected")

    # Test 2: Duplicate answer
    try:
        db.add(
            Answer(
                user_id=user.id,
                question_id=question.id,
                option_id=option.id,
                tokens_awarded=option.weight,
            )
        )
        db.commit()
        print("FAIL: Duplicate answer was accepted")
    except IntegrityError:
        db.rollback()
        print("PASS: Duplicate answer rejected")

    # Test 3: Invalid weight
    try:
        db.add(
            Option(
                question_id=question.id,
                text="Invalid option",
                weight=11,
            )
        )
        db.commit()
        print("FAIL: Invalid weight was accepted")
    except IntegrityError:
        db.rollback()
        print("PASS: Invalid weight rejected")
