
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import User, Question, Option, Answer
from ..schemas import (
    QuizResponse,
    QuizQuestionResponse,
    QuizOptionResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    UserBalanceResponse,
)


router = APIRouter(prefix="/api/quiz", tags=["User Quiz"])

QUESTIONS_PER_QUIZ = 5


def require_normal_user(current_user: User) -> User:
    if current_user.role != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only normal users can take quizzes",
        )
    return current_user


@router.get("", response_model=QuizResponse)
def get_quiz(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_normal_user(current_user)

    answered_questions = (
        select(Answer.question_id)
        .where(Answer.user_id == current_user.id)
    )

    questions = db.scalars(
        select(Question)
        .where(
            Question.is_active.is_(True),
            Question.id.not_in(answered_questions),
        )
        .options(selectinload(Question.options))
        .order_by(func.random())
        .limit(QUESTIONS_PER_QUIZ)
    ).all()

    question_responses = [
        QuizQuestionResponse(
            id=question.id,
            text=question.text,
            options=[
                QuizOptionResponse(id=option.id, text=option.text)
                for option in question.options
            ],
        )
        for question in questions
    ]

    message = (
        None
        if questions
        else "No new questions right now, come back later."
    )

    return QuizResponse(
        questions=question_responses,
        count=len(question_responses),
        message=message,
    )


@router.post(
    "/answer",
    response_model=SubmitAnswerResponse,
)
def submit_answer(
    payload: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_normal_user(current_user)

    question = db.scalar(
        select(Question).where(
            Question.id == payload.question_id,
            Question.is_active.is_(True),
        )
    )

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Active question not found",
        )

    option = db.scalar(
        select(Option).where(
            Option.id == payload.option_id,
            Option.question_id == payload.question_id,
        )
    )

    if option is None:
        raise HTTPException(
            status_code=422,
            detail="Selected option does not belong to this question",
        )

    already_answered = db.scalar(
        select(Answer.id).where(
            Answer.user_id == current_user.id,
            Answer.question_id == payload.question_id,
        )
    )

    if already_answered is not None:
        raise HTTPException(
            status_code=409,
            detail="You have already answered this question",
        )

    tokens = option.weight

    try:
        # Answer creation and balance increment must commit together.
        answer = Answer(
            user_id=current_user.id,
            question_id=question.id,
            option_id=option.id,
            tokens_awarded=tokens,
        )
        db.add(answer)

        result = db.execute(
            update(User)
            .where(User.id == current_user.id)
            .values(balance=User.balance + tokens)
        )

        if result.rowcount != 1:
            raise HTTPException(
                status_code=401,
                detail="User account not found",
            )

        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This question has already been answered",
        )
    except Exception:
        db.rollback()
        raise

    db.refresh(current_user)

    return SubmitAnswerResponse(
        question_id=question.id,
        option_id=option.id,
        tokens_awarded=tokens,
        balance=current_user.balance,
    )


@router.get("/balance", response_model=UserBalanceResponse)
def get_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_normal_user(current_user)

    user = db.get(User, current_user.id)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User account not found",
        )

    return UserBalanceResponse(balance=user.balance)
