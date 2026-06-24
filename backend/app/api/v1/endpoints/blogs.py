from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.blog import BlogListResponse, BlogResponse
from app.services.blog_service import (
    build_blog_list_response,
    get_blog_by_slug,
    list_blogs as fetch_blogs,
)

router = APIRouter(prefix="/blogs", tags=["blogs"])


@router.get("", response_model=BlogListResponse)
def list_blogs(
    page: int = Query(1, ge=1),
    page_size: int = Query(9, ge=1, le=50, alias="pageSize"),
    search: str | None = Query(None, max_length=200),
) -> BlogListResponse:
    blogs, total = fetch_blogs(
        published_only=True,
        page=page,
        page_size=page_size,
        search=search,
    )
    return build_blog_list_response(blogs, total, page, page_size)


@router.get("/{slug}", response_model=BlogResponse)
def get_blog(slug: str) -> BlogResponse:
    blog = get_blog_by_slug(slug, published_only=True)
    if blog is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    return blog
