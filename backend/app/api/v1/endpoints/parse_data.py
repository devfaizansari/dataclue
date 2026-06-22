from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.column_utils import list_variables
from app.utils.data_parser import parse_csv

router = APIRouter(tags=["data"])


class ParseDataRequest(BaseModel):
    csv_data: str = Field(..., description="Raw CSV string")


@router.post("/parse-data")
def parse_data(payload: ParseDataRequest) -> dict:
    df = parse_csv(payload.csv_data)
    variables = list_variables(df)
    return {"variables": variables, "row_count": len(df)}
