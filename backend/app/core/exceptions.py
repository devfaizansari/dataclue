from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class DataValidationError(AppException):
    def __init__(self, detail: str = "Invalid or insufficient data for analysis"):
        super().__init__(detail=detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class TestNotFoundError(AppException):
    def __init__(self, test_id: str):
        super().__init__(
            detail=f"Statistical test '{test_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
