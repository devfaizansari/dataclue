from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.core.database import get_blogs_collection
from app.core.exceptions import DataValidationError
from app.schemas.blog import BlogCreate, BlogResponse, BlogUpdate

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def slugify(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "blog-post"


def _serialize_content(content: list[Any]) -> list[dict[str, Any]]:
    return [block.model_dump() if hasattr(block, "model_dump") else dict(block) for block in content]


def _doc_to_response(doc: dict[str, Any]) -> BlogResponse:
    return BlogResponse(
        id=str(doc["_id"]),
        slug=doc["slug"],
        title=doc["title"],
        excerpt=doc["excerpt"],
        category=doc["category"],
        author=doc["author"],
        date=doc["date"],
        read_time=doc.get("read_time", "5 min read"),
        content=doc.get("content", []),
        published=bool(doc.get("published", True)),
    )


def list_blogs(*, published_only: bool = True) -> list[BlogResponse]:
    query: dict[str, Any] = {"published": True} if published_only else {}
    cursor = get_blogs_collection().find(query).sort("date", -1)
    return [_doc_to_response(doc) for doc in cursor]


def get_blog_by_slug(slug: str, *, published_only: bool = True) -> BlogResponse | None:
    query: dict[str, Any] = {"slug": slug}
    if published_only:
        query["published"] = True
    doc = get_blogs_collection().find_one(query)
    return _doc_to_response(doc) if doc else None


def get_blog_by_id(blog_id: str) -> BlogResponse | None:
    if not ObjectId.is_valid(blog_id):
        return None
    doc = get_blogs_collection().find_one({"_id": ObjectId(blog_id)})
    return _doc_to_response(doc) if doc else None


def create_blog(payload: BlogCreate) -> BlogResponse:
    slug = payload.slug.strip().lower()
    if not SLUG_PATTERN.match(slug):
        raise DataValidationError("Slug must use lowercase letters, numbers, and hyphens only")

    now = datetime.now(UTC)
    document = {
        "slug": slug,
        "title": payload.title.strip(),
        "excerpt": payload.excerpt.strip(),
        "category": payload.category.strip(),
        "author": payload.author.strip(),
        "date": payload.date,
        "read_time": payload.read_time.strip(),
        "content": _serialize_content(payload.content),
        "published": payload.published,
        "created_at": now,
        "updated_at": now,
    }

    try:
        result = get_blogs_collection().insert_one(document)
    except DuplicateKeyError as exc:
        raise DataValidationError(f"A blog with slug '{slug}' already exists") from exc

    document["_id"] = result.inserted_id
    return _doc_to_response(document)


def update_blog(blog_id: str, payload: BlogUpdate) -> BlogResponse:
    if not ObjectId.is_valid(blog_id):
        raise DataValidationError("Invalid blog id")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        existing = get_blog_by_id(blog_id)
        if existing is None:
            raise DataValidationError("Blog not found")
        return existing

    if "slug" in updates and updates["slug"] is not None:
        updates["slug"] = updates["slug"].strip().lower()
        if not SLUG_PATTERN.match(updates["slug"]):
            raise DataValidationError("Slug must use lowercase letters, numbers, and hyphens only")

    for text_field in ("title", "excerpt", "category", "author", "read_time"):
        if text_field in updates and isinstance(updates[text_field], str):
            updates[text_field] = updates[text_field].strip()

    if "content" in updates and updates["content"] is not None:
        updates["content"] = _serialize_content(updates["content"])

    updates["updated_at"] = datetime.now(UTC)

    try:
        result = get_blogs_collection().update_one(
            {"_id": ObjectId(blog_id)},
            {"$set": updates},
        )
    except DuplicateKeyError as exc:
        raise DataValidationError("A blog with this slug already exists") from exc

    if result.matched_count == 0:
        raise DataValidationError("Blog not found")

    updated = get_blog_by_id(blog_id)
    if updated is None:
        raise DataValidationError("Blog not found")
    return updated


def delete_blog(blog_id: str) -> None:
    if not ObjectId.is_valid(blog_id):
        raise DataValidationError("Invalid blog id")

    result = get_blogs_collection().delete_one({"_id": ObjectId(blog_id)})
    if result.deleted_count == 0:
        raise DataValidationError("Blog not found")


def seed_blogs_if_empty() -> int:
    collection = get_blogs_collection()
    if collection.count_documents({}) > 0:
        return 0

    from app.data.blog_seed import BLOG_SEED_DATA

    now = datetime.now(UTC)
    documents = []
    for item in BLOG_SEED_DATA:
        documents.append(
            {
                **item,
                "created_at": now,
                "updated_at": now,
            }
        )

    if documents:
        collection.insert_many(documents)
    return len(documents)
