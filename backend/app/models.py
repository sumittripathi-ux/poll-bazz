
from datetime import datetime, timezone
from sqlalchemy import ForeignKeyConstraint
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'user')",
            name="ck_users_role",
        ),
        CheckConstraint(
            "balance >= 0",
            name="ck_users_balance_nonnegative",
        ),
        Index("ix_users_role", "role"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="user",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    balance: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    answers: Mapped[list["Answer"]] = relationship(
        back_populates="user",
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    options: Mapped[list["Option"]] = relationship(
        back_populates="question",
        cascade="save-update, merge",
        passive_deletes=True,
    )

    # answers: Mapped[list["Answer"]] = relationship(
    #     back_populates="question",
    # )
    answers: Mapped[list["Answer"]] = relationship(
    back_populates="question",
    foreign_keys="Answer.question_id",
)


class Option(Base):
    __tablename__ = "options"

    __table_args__ = (
        CheckConstraint(
            "weight >= 0 AND weight <= 10",
            name="ck_options_weight_range",
        ),
        UniqueConstraint(
            "id",
            "question_id",
            name="uq_options_id_question",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    text: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    weight: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    question: Mapped["Question"] = relationship(
        back_populates="options",
    )


class Answer(Base):
    __tablename__ = "answers"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "question_id",
            name="uq_answers_user_question",
        ),
        CheckConstraint(
            "tokens_awarded >= 0",
            name="ck_answers_tokens_nonnegative",
        ),
        ForeignKeyConstraint(
            ["option_id", "question_id"],
            ["options.id", "options.question_id"],
            name="fk_answers_option_question",
            ondelete="RESTRICT",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    option_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    tokens_awarded: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    user: Mapped["User"] = relationship(
        back_populates="answers",
        foreign_keys=[user_id],
    )

    question: Mapped["Question"] = relationship(
        back_populates="answers",
        foreign_keys=[question_id],
    )



# class Answer(Base):
#     __tablename__ = "answers"

#     __table_args__ = (
#     UniqueConstraint(
#         "user_id",
#         "question_id",
#         name="uq_answers_user_question",
#     ),
#     CheckConstraint(
#         "tokens_awarded >= 0",
#         name="ck_answers_tokens_nonnegative",
#     ),
#     ForeignKeyConstraint(
#         ["option_id", "question_id"],
#         ["options.id", "options.question_id"],
#         name="fk_answers_option_question",
#         ondelete="RESTRICT",
#     ),
# )

#     id: Mapped[int] = mapped_column(
#         Integer,
#         primary_key=True,
#         index=True,
#     )

#     user_id: Mapped[int] = mapped_column(
#         ForeignKey("users.id", ondelete="RESTRICT"),
#         nullable=False,
#         index=True,
#     )

#     question_id: Mapped[int] = mapped_column(
#         ForeignKey("questions.id", ondelete="RESTRICT"),
#         nullable=False,
#         index=True,
#     )

#     option_id: Mapped[int] = mapped_column(
#         Integer,
#         nullable=False,
#     )

#     tokens_awarded: Mapped[int] = mapped_column(
#         Integer,
#         nullable=False,
#     )

#     created_at: Mapped[datetime] = mapped_column(
#         DateTime(timezone=True),
#         nullable=False,
#         default=utc_now,
#     )

#     user: Mapped["User"] = relationship(
#         back_populates="answers",
#     )

#     question: Mapped["Question"] = relationship(
#         back_populates="answers",
#     )
