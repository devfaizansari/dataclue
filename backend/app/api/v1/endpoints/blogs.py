from fastapi import APIRouter, HTTPException, status

from app.schemas.blog import BlogListResponse, BlogResponse
from app.services.blog_service import get_blog_by_slug, list_blogs as fetch_blogs

router = APIRouter(prefix="/blogs", tags=["blogs"])


@router.get("", response_model=BlogListResponse)
def list_blogs() -> BlogListResponse:
    blogs = fetch_blogs(published_only=True)
    return BlogListResponse(blogs=blogs, count=len(blogs))


@router.get("/{slug}", response_model=BlogResponse)
def get_blog(slug: str) -> BlogResponse:
    blog = get_blog_by_slug(slug, published_only=True)
    if blog is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    return blog
