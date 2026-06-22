from io import StringIO

import pandas as pd

from app.core.exceptions import DataValidationError


def _is_blank_column(df: pd.DataFrame, column: str) -> bool:
    name = str(column).strip()
    if name and not name.startswith("Unnamed:"):
        return False
    series = df[column]
    if series.isna().all():
        return True
    return series.astype(str).str.strip().eq("").all()


def _drop_blank_columns(df: pd.DataFrame) -> pd.DataFrame:
    kept = [column for column in df.columns if not _is_blank_column(df, str(column))]
    if not kept:
        return df
    return df[kept]


def parse_csv(csv_data: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(StringIO(csv_data.strip()))
    except Exception as exc:
        raise DataValidationError(f"Failed to parse CSV: {exc}") from exc

    if df.empty:
        raise DataValidationError("CSV data is empty")

    df = _drop_blank_columns(df)
    df.columns = [str(column).strip() for column in df.columns]

    return df


def ensure_equal_length(*arrays: list, names: list[str] | None = None) -> None:
    lengths = {len(arr) for arr in arrays}
    if len(lengths) > 1:
        label = ", ".join(names) if names else "arrays"
        raise DataValidationError(f"All {label} must have the same length")
