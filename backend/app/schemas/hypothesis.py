from pydantic import BaseModel, Field


class OneSampleTTestRequest(BaseModel):
    values: list[float] = Field(..., min_length=2)
    population_mean: float = 0.0
    alternative: str = Field(default="two-sided", pattern="^(two-sided|less|greater)$")


class IndependentTTestRequest(BaseModel):
    group_a: list[float] = Field(..., min_length=2)
    group_b: list[float] = Field(..., min_length=2)
    equal_var: bool = True
    alternative: str = Field(default="two-sided", pattern="^(two-sided|less|greater)$")


class PairedTTestRequest(BaseModel):
    before: list[float] = Field(..., min_length=2)
    after: list[float] = Field(..., min_length=2)
    alternative: str = Field(default="two-sided", pattern="^(two-sided|less|greater)$")


class ChiSquareRequest(BaseModel):
    observed: list[list[int]] = Field(..., min_length=2)
