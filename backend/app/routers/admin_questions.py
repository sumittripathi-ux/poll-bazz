
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func
from ..auth import require_admin
from ..database import get_db
from ..models import Question, Option, Answer, User
from ..schemas import (
    QuestionCreateRequest,
    QuestionUpdateRequest,
    QuestionStatusRequest,
    QuestionResponse,
)


router = APIRouter(
    prefix="/api/admin/questions",
    tags=["Admin - Question Management"],
)


@router.post(
    "",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_question(
    payload: QuestionCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    active_count = db.scalar(
        select(func.count(Question.id)).where(
            Question.is_active.is_(True)
    )
    ) or 0

    if active_count >= 50:
      raise HTTPException(
        status_code=409,
        detail="Maximum of 10 active questions allowed",
    )

    question = Question(
        text=payload.text,
        is_active=True,
    )

    for item in payload.options:
        question.options.append(
            Option(
                text=item.text,
                weight=item.weight,
            )
        )

    db.add(question)
    db.commit()

    saved_question = db.scalar(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question.id)
    )

    return saved_question


@router.get("", response_model=list[QuestionResponse])
def list_questions(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return db.scalars(
        select(Question)
        .options(selectinload(Question.options))
        .order_by(Question.id.desc())
    ).all()


@router.patch(
    "/{question_id}",
    response_model=QuestionResponse,
)
def update_question(
    question_id: int,
    payload: QuestionUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    question = db.scalar(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question_id)
    )

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    if payload.text is not None:
        question.text = payload.text

    if payload.options is not None:
        existing_by_id = {
            option.id: option for option in question.options
        }
        submitted_ids = [
            item.id for item in payload.options if item.id is not None
        ]

        if len(submitted_ids) != len(set(submitted_ids)):
            raise HTTPException(
                status_code=422,
                detail="An option ID cannot appear more than once",
            )

        # Prevent using an option ID belonging to another question.
        if any(option_id not in existing_by_id for option_id in submitted_ids):
            raise HTTPException(
                status_code=422,
                detail="One or more option IDs do not belong to this question",
            )

        submitted_existing_ids = set(submitted_ids)

        # Don't remove an option that has historical answers.
        for option in list(question.options):
            if option.id not in submitted_existing_ids:
                has_answers = db.scalar(
                    select(Answer.id)
                    .where(Answer.option_id == option.id)
                    .limit(1)
                )

                if has_answers is not None:
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            f"Option {option.id} has historical answers "
                            "and cannot be removed"
                        ),
                    )

                db.delete(option)

        for item in payload.options:
            if item.id is None:
                question.options.append(
                    Option(text=item.text, weight=item.weight)
                )
            else:
                option = existing_by_id[item.id]
                option.text = item.text
                option.weight = item.weight

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return db.scalar(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question_id)
    )


@router.patch(
    "/{question_id}/status",
    response_model=QuestionResponse,
)
def update_question_status(
    question_id: int,
    payload: QuestionStatusRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    question = db.scalar(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question_id)
    )

    if question is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    question.is_active = payload.is_active
    db.commit()

    return db.scalar(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question_id)
    )
