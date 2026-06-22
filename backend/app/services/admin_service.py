from __future__ import annotations

from datetime import UTC, datetime

import bcrypt

from app.core.config import get_settings
from app.core.database import get_database
from app.core.exceptions import DataValidationError

ADMIN_SINGLETON_ID = "primary"


def _admin_collection():
    return get_database().admin_users


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def seed_admin_if_missing() -> None:
    collection = _admin_collection()
    if collection.find_one({"_id": ADMIN_SINGLETON_ID}):
        return

    settings = get_settings()
    now = datetime.now(UTC)
    collection.insert_one(
        {
            "_id": ADMIN_SINGLETON_ID,
            "username": settings.admin_username,
            "password_hash": _hash_password(settings.admin_password),
            "created_at": now,
            "updated_at": now,
        }
    )


def get_admin_username() -> str:
    seed_admin_if_missing()
    doc = _admin_collection().find_one({"_id": ADMIN_SINGLETON_ID})
    if doc is None:
        return get_settings().admin_username
    return str(doc["username"])


def verify_admin_credentials(username: str, password: str) -> bool:
    seed_admin_if_missing()
    doc = _admin_collection().find_one({"_id": ADMIN_SINGLETON_ID})
    if doc is None:
        return False
    if username != doc["username"]:
        return False
    return _verify_password(password, doc["password_hash"])


def update_admin_credentials(
    *,
    current_password: str,
    new_username: str | None = None,
    new_password: str | None = None,
) -> str:
    seed_admin_if_missing()
    doc = _admin_collection().find_one({"_id": ADMIN_SINGLETON_ID})
    if doc is None:
        raise DataValidationError("Admin account not found")

    if not _verify_password(current_password, doc["password_hash"]):
        raise DataValidationError("Current password is incorrect")

    if not new_username and not new_password:
        raise DataValidationError("Provide a new username and/or new password")

    updates: dict[str, object] = {"updated_at": datetime.now(UTC)}
    next_username = doc["username"]

    if new_username is not None:
        cleaned = new_username.strip()
        if len(cleaned) < 3:
            raise DataValidationError("Username must be at least 3 characters")
        updates["username"] = cleaned
        next_username = cleaned

    if new_password is not None:
        if len(new_password) < 6:
            raise DataValidationError("New password must be at least 6 characters")
        updates["password_hash"] = _hash_password(new_password)

    _admin_collection().update_one({"_id": ADMIN_SINGLETON_ID}, {"$set": updates})
    return str(next_username)
