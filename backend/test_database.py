
from sqlalchemy import select

from app.database import Base, engine, SessionLocal
from app.models import User, Question, Option, Answer

# Safe for this disposable development test only.
# Do not run against a database containing real project data.
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    user = User(
        username="demo_user",
        password_hash="development-only-placeholder",
        role="user",
    )

    question = Question(
        text="How often do you order food online?"
    )

    db.add_all([user, question])
    db.flush()

    option = Option(
        question_id=question.id,
        text="Rarely",
        weight=2,
    )

    db.add(option)
    db.flush()

    answer = Answer(
        user_id=user.id,
        question_id=question.id,
        option_id=option.id,
        tokens_awarded=option.weight,
    )

    user.balance += option.weight

    db.add(answer)
    db.commit()

    saved_user = db.scalar(
        select(User).where(User.username == "demo_user")
    )

    saved_answers = db.scalars(select(Answer)).all()

    print("User ID:", saved_user.id)
    print("Username:", saved_user.username)
    print("Balance:", saved_user.balance)
    print("Answers saved:", len(saved_answers))
