from pydantic import BaseModel, Field


class SummaryStatisticsRequest(BaseModel):
    values: list[float] = Field(..., min_length=1)


class FrequencyTableRequest(BaseModel):
    values: list[str | int | float] = Field(..., min_length=1)


class CrossTabulationRequest(BaseModel):
    row_variable: list[str] = Field(..., min_length=1)
    col_variable: list[str] = Field(..., min_length=1)


class HistogramRequest(BaseModel):
    values: list[float] = Field(..., min_length=1)
    bins: int = Field(default=10, ge=2, le=100)
