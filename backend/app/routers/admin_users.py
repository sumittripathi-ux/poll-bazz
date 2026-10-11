
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_admin
from ..database import get_db
from ..models import User
from ..schemas import (
    AdminCreateUserRequest,
    AdminUserResponse,
    UserStatusUpdateRequest,
    AdminPasswordResetRequest,
)
from ..security import hash_password


router = APIRouter(
    prefix="/api/admin/users",
    tags=["Admin - User Management"],
)


@router.post(
    "",
    response_model=AdminUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    username = payload.username.strip()

    if not username:
        raise HTTPException(
            status_code=422,
            detail="Username cannot be blank",
        )

    existing_user = db.scalar(
        select(User).where(User.username == username)
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Username already exists",
        )

    user = User(
        username=username,
        password_hash=hash_password(payload.temporary_password),
        role="user",
        is_active=True,
        balance=0,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not create user; username may already exist",
        )

    return user


@router.get("", response_model=list[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    users = db.scalars(
        select(User).order_by(User.id.desc())
    ).all()

    return users


@router.patch(
    "/{user_id}/status",
    response_model=AdminUserResponse,
)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.id == admin.id and not payload.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)

    return user


@router.patch(
    "/{user_id}/password",
    status_code=status.HTTP_204_NO_CONTENT,
)
def reset_user_password(
    user_id: int,
    payload: AdminPasswordResetRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    user.password_hash = hash_password(payload.temporary_password)
    db.commit()

    return None
