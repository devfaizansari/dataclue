from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _empty_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class BlogContentBlock(BaseModel):
    type: Literal["paragraph", "heading", "list"]
    text: str | None = None
    items: list[str] | None = None


class BlogBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    slug: str = Field(..., min_length=1, max_length=200)
    title: str = Field(..., min_length=1, max_length=300)
    excerpt: str = Field(..., min_length=1, max_length=500)
    category: str = Field(..., min_length=1, max_length=100)
    author: str = Field(..., min_length=1, max_length=120)
    date: str = Field(..., description="ISO date YYYY-MM-DD")
    read_time: str = Field(
        default="5 min read",
        max_length=40,
        alias="readTime",
        serialization_alias="readTime",
    )
    content: list[BlogContentBlock] = Field(..., min_length=1)
    published: bool = True
    seo_title: str | None = Field(
        default=None,
        max_length=70,
        alias="seoTitle",
        serialization_alias="seoTitle",
    )
    seo_description: str | None = Field(
        default=None,
        max_length=320,
        alias="seoDescription",
        serialization_alias="seoDescription",
    )
    seo_keywords: str | None = Field(
        default=None,
        max_length=500,
        alias="seoKeywords",
        serialization_alias="seoKeywords",
    )
    og_image: str | None = Field(
        default=None,
        max_length=500,
        alias="ogImage",
        serialization_alias="ogImage",
    )

    @field_validator("seo_title", "seo_description", "seo_keywords", "og_image", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        return _empty_to_none(value) if isinstance(value, str) or value is None else value


class BlogCreate(BlogBase):
    pass


class BlogUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    slug: str | None = Field(default=None, min_length=1, max_length=200)
    title: str | None = Field(default=None, min_length=1, max_length=300)
    excerpt: str | None = Field(default=None, min_length=1, max_length=500)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    author: str | None = Field(default=None, min_length=1, max_length=120)
    date: str | None = None
    read_time: str | None = Field(
        default=None,
        max_length=40,
        alias="readTime",
        serialization_alias="readTime",
    )
    content: list[BlogContentBlock] | None = None
    published: bool | None = None
    seo_title: str | None = Field(
        default=None,
        max_length=70,
        alias="seoTitle",
        serialization_alias="seoTitle",
    )
    seo_description: str | None = Field(
        default=None,
        max_length=320,
        alias="seoDescription",
        serialization_alias="seoDescription",
    )
    seo_keywords: str | None = Field(
        default=None,
        max_length=500,
        alias="seoKeywords",
        serialization_alias="seoKeywords",
    )
    og_image: str | None = Field(
        default=None,
        max_length=500,
        alias="ogImage",
        serialization_alias="ogImage",
    )

    @field_validator("seo_title", "seo_description", "seo_keywords", "og_image", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        return _empty_to_none(value) if isinstance(value, str) or value is None else value


class BlogResponse(BlogBase):
    id: str


class BlogListResponse(BaseModel):
    blogs: list[BlogResponse]
    count: int


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_hours: int


class AdminProfileResponse(BaseModel):
    username: str


class AdminCredentialsUpdate(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_username: str | None = Field(default=None, min_length=3, max_length=50)
    new_password: str | None = Field(default=None, min_length=6, max_length=128)


class AdminCredentialsUpdateResponse(BaseModel):
    username: str
    access_token: str
    token_type: str = "bearer"
    message: str
