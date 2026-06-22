from __future__ import annotations

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.config import get_settings

_client: MongoClient | None = None
_db: Database | None = None


def connect_mongodb() -> Database:
    global _client, _db
    if _db is not None:
        return _db

    settings = get_settings()
    _client = MongoClient(settings.mongodb_uri)
    _db = _client[settings.mongodb_db]
    _db.blogs.create_index("slug", unique=True)
    _db.blogs.create_index([("published", 1), ("date", -1)])
    return _db


def get_database() -> Database:
    if _db is None:
        return connect_mongodb()
    return _db


def get_blogs_collection() -> Collection:
    return get_database().blogs


def close_mongodb() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None
