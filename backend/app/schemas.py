from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator



class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class CurrentUserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
class AdminCreateUserRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    temporary_password: str = Field(min_length=8, max_length=128)


class AdminUserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    balance: int
    created_at: datetime


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


class AdminPasswordResetRequest(BaseModel):
    temporary_password: str = Field(min_length=8, max_length=128)

class QuestionOptionCreate(BaseModel):
    text: str = Field(min_length=1, max_length=300)
    weight: int = Field(ge=0, le=10)

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Option text cannot be blank")
        return value


class QuestionCreateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    options: list[QuestionOptionCreate] = Field(min_length=2, max_length=6)

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Question text cannot be blank")
        return value


class QuestionOptionUpdate(BaseModel):
    # Existing option ka ID edit karne ke liye.
    # New option ke liye id omit karein.
    id: int | None = None
    text: str = Field(min_length=1, max_length=300)
    weight: int = Field(ge=0, le=10)

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Option text cannot be blank")
        return value


class QuestionUpdateRequest(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=1000)
    options: list[QuestionOptionUpdate] | None = Field(
        default=None, min_length=2, max_length=6
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Question text cannot be blank")
        return value


class QuestionStatusRequest(BaseModel):
    is_active: bool


class QuestionOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    weight: int


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # id: int
    # text: str
    # is_active: bool
    # created_at: object
    # options: list[QuestionOptionResponse]
    id: int
    text: str
    is_active: bool
    created_at: datetime
    options: list[QuestionOptionResponse]

class QuizOptionResponse(BaseModel):
    id: int
    text: str


class QuizQuestionResponse(BaseModel):
    id: int
    text: str
    options: list[QuizOptionResponse]


class QuizResponse(BaseModel):
    questions: list[QuizQuestionResponse]
    count: int
    message: str | None = None


class SubmitAnswerRequest(BaseModel):
    question_id: int = Field(gt=0)
    option_id: int = Field(gt=0)


class SubmitAnswerResponse(BaseModel):
    question_id: int
    option_id: int
    tokens_awarded: int
    balance: int


class UserBalanceResponse(BaseModel):
    balance: int