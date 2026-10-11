
from fastapi import APIRouter, Depends
from ..auth import get_current_user, require_admin
from ..models import User

router = APIRouter(prefix="/api", tags=["Role Authorization"])


@router.get("/user/dashboard")
def user_dashboard(
    current_user: User = Depends(get_current_user),
):
    return {
        "message": "Authenticated dashboard access granted",
        "user_id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
    }


@router.get("/admin/dashboard")
def admin_dashboard(
    current_user: User = Depends(require_admin),
):
    return {
        "message": "Admin dashboard access granted",
        "user_id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
    }
