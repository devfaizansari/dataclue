from pydantic import BaseModel, Field


class LinearRegressionRequest(BaseModel):
    x: list[float] = Field(..., min_length=2)
    y: list[float] = Field(..., min_length=2)


class MultipleRegressionRequest(BaseModel):
    y: list[float] = Field(..., min_length=2)
    predictors: dict[str, list[float]] = Field(..., min_length=1)


class LogisticRegressionRequest(BaseModel):
    x: list[float] = Field(..., min_length=2)
    y: list[int] = Field(..., min_length=2)
