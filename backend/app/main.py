from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.database import close_mongodb, connect_mongodb
from app.services.blog_service import seed_blogs_if_empty
from app.services.admin_service import seed_admin_if_missing


@asynccontextmanager
async def lifespan(_app: FastAPI):
    connect_mongodb()
    seed_admin_if_missing()
    seed_blogs_if_empty()
    yield
    close_mongodb()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        description="Statistical analysis API for dataclue",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/", tags=["root"])
    def root() -> dict[str, str]:
        return {
            "message": "dataclue API",
            "docs": "/docs",
            "health": f"{settings.api_v1_prefix}/health",
        }

    return app


app = create_app()
