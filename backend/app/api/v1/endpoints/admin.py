from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings
from app.core.exceptions import DataValidationError
from app.core.security import (
    create_admin_token,
    get_current_admin,
    verify_admin_credentials,
)
from app.schemas.blog import (
    AdminCredentialsUpdate,
    AdminCredentialsUpdateResponse,
    AdminLoginRequest,
    AdminLoginResponse,
    AdminProfileResponse,
    BlogCreate,
    BlogListResponse,
    BlogResponse,
    BlogUpdate,
)
from app.services.admin_service import get_admin_username, update_admin_credentials
from app.services.blog_service import (
    create_blog,
    delete_blog,
    get_blog_by_id,
    list_blogs,
    update_blog,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest) -> AdminLoginResponse:
    if not verify_admin_credentials(payload.username, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    settings = get_settings()
    token = create_admin_token(payload.username)
    return AdminLoginResponse(
        access_token=token,
        expires_in_hours=settings.admin_token_expire_hours,
    )


@router.get("/me", response_model=AdminProfileResponse)
def admin_profile(_admin: dict[str, Any] = Depends(get_current_admin)) -> AdminProfileResponse:
    return AdminProfileResponse(username=get_admin_username())


@router.put("/credentials", response_model=AdminCredentialsUpdateResponse)
def admin_update_credentials(
    payload: AdminCredentialsUpdate,
    _admin: dict[str, Any] = Depends(get_current_admin),
) -> AdminCredentialsUpdateResponse:
    try:
        username = update_admin_credentials(
            current_password=payload.current_password,
            new_username=payload.new_username,
            new_password=payload.new_password,
        )
    except DataValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    token = create_admin_token(username)
    return AdminCredentialsUpdateResponse(
        username=username,
        access_token=token,
        message="Admin credentials updated successfully",
    )


@router.get("/blogs", response_model=BlogListResponse)
def admin_list_blogs(_admin: dict[str, Any] = Depends(get_current_admin)) -> BlogListResponse:
    blogs = list_blogs(published_only=False)
    return BlogListResponse(blogs=blogs, count=len(blogs))


@router.get("/blogs/{blog_id}", response_model=BlogResponse)
def admin_get_blog(
    blog_id: str,
    _admin: dict[str, Any] = Depends(get_current_admin),
) -> BlogResponse:
    blog = get_blog_by_id(blog_id)
    if blog is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    return blog


@router.post("/blogs", response_model=BlogResponse, status_code=status.HTTP_201_CREATED)
def admin_create_blog(
    payload: BlogCreate,
    _admin: dict[str, Any] = Depends(get_current_admin),
) -> BlogResponse:
    try:
        return create_blog(payload)
    except DataValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.put("/blogs/{blog_id}", response_model=BlogResponse)
def admin_update_blog(
    blog_id: str,
    payload: BlogUpdate,
    _admin: dict[str, Any] = Depends(get_current_admin),
) -> BlogResponse:
    try:
        return update_blog(blog_id, payload)
    except DataValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.delete("/blogs/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_blog(
    blog_id: str,
    _admin: dict[str, Any] = Depends(get_current_admin),
) -> None:
    try:
        delete_blog(blog_id)
    except DataValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
