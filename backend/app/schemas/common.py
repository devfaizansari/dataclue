from typing import Any, Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    app: str
    version: str


class StatResult(BaseModel):
    label: str
    value: str
    badge: dict[str, str] | None = None


class AnalysisResponse(BaseModel):
    test_id: str
    title: str
    stats: list[StatResult]
    interpretation: str
    apa_output: str | None = None
    chart_data: dict[str, Any] | None = None
    batch_results: list["AnalysisResponse"] | None = None
    variable_name: str | None = None


AnalysisResponse.model_rebuild()


class CsvAnalysisRequest(BaseModel):
    test_id: str = Field(..., description="Statistical test identifier")
    csv_data: str = Field(..., description="Raw CSV string with headers")
    options: dict[str, Any] = Field(default_factory=dict)


class NumericArrayRequest(BaseModel):
    values: list[float] = Field(..., min_length=1)
    options: dict[str, Any] = Field(default_factory=dict)


class TwoGroupRequest(BaseModel):
    group_a: list[float] = Field(..., min_length=1)
    group_b: list[float] = Field(..., min_length=1)
    options: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    detail: str
