from pydantic import BaseModel, Field


class CorrelationRequest(BaseModel):
    x: list[float] = Field(..., min_length=2)
    y: list[float] = Field(..., min_length=2)


class PartialCorrelationRequest(BaseModel):
    x: list[float] = Field(..., min_length=3)
    y: list[float] = Field(..., min_length=3)
    control: list[float] = Field(..., min_length=3)
