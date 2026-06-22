import pytest
from fastapi.testclient import TestClient
from pymongo.errors import ServerSelectionTimeoutError

from app.core.database import close_mongodb, connect_mongodb, get_blogs_collection
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def mongodb_available():
    try:
        connect_mongodb()
        get_blogs_collection().database.client.admin.command("ping")
    except ServerSelectionTimeoutError:
        pytest.skip("MongoDB is not running on localhost:27017")
    yield
    close_mongodb()


def test_public_blogs_list(client: TestClient) -> None:
    response = client.get("/api/v1/blogs")
    assert response.status_code == 200
    data = response.json()
    assert "blogs" in data
    assert data["count"] >= 0


def test_admin_credentials_update(client: TestClient) -> None:
    login = client.post(
        "/api/v1/admin/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    update = client.put(
        "/api/v1/admin/credentials",
        headers=headers,
        json={
            "current_password": "admin123",
            "new_username": "admin",
            "new_password": "admin123",
        },
    )
    assert update.status_code == 200
    assert update.json()["username"] == "admin"
    assert "access_token" in update.json()

    profile = client.get("/api/v1/admin/me", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["username"] == "admin"


def test_admin_blog_crud(client: TestClient) -> None:
    login = client.post(
        "/api/v1/admin/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/api/v1/admin/blogs",
        headers=headers,
        json={
            "slug": "pytest-sample-blog",
            "title": "Pytest Sample Blog",
            "excerpt": "A short test excerpt for CRUD verification.",
            "category": "Testing",
            "author": "Pytest",
            "date": "2026-06-16",
            "readTime": "2 min read",
            "published": True,
            "content": [{"type": "paragraph", "text": "Hello from pytest."}],
        },
    )
    assert create.status_code == 201
    blog = create.json()
    blog_id = blog["id"]

    public = client.get("/api/v1/blogs/pytest-sample-blog")
    assert public.status_code == 200

    update = client.put(
        f"/api/v1/admin/blogs/{blog_id}",
        headers=headers,
        json={"title": "Pytest Sample Blog Updated"},
    )
    assert update.status_code == 200
    assert update.json()["title"] == "Pytest Sample Blog Updated"

    delete = client.delete(f"/api/v1/admin/blogs/{blog_id}", headers=headers)
    assert delete.status_code == 204

    missing = client.get("/api/v1/blogs/pytest-sample-blog")
    assert missing.status_code == 404
