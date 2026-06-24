import pytest
from fastapi.testclient import TestClient

from app.main import app

SAMPLE_CSV = """Age,Score,Group
23,78,A
25,85,A
22,90,A
24,76,A
26,82,A
27,58,B
29,64,B
28,70,B
30,62,B
31,68,B"""

SURVEY_CSV = """satisfaction,nps,feature,q2,q3
4,9,Dashboard,4,3
5,10,Reports,5,4
3,7,Export,3,3
4,8,Charts,4,4
5,9,Dashboard,5,5"""


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_root(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200


def test_health(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_tests_catalog(client: TestClient) -> None:
    response = client.get("/api/v1/tests")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 45


@pytest.mark.parametrize(
    "test_id",
    [
        "summary-statistics",
        "independent-ttest",
        "pearson-correlation",
        "shapiro-wilk",
        "cronbach-alpha",
        "linear-regression",
        "logistic-regression",
        "classification-models",
        "regression-models",
        "time-series-models",
        "mcnemar",
    ],
)
def test_analyze_endpoints(client: TestClient, test_id: str) -> None:
    csv_data = SAMPLE_CSV
    options: dict = {}
    if test_id == "logistic-regression":
        csv_data = """Age,Score,Passed
23,78,1
25,85,1
27,58,0
29,64,0
28,70,0"""
    if test_id == "classification-models":
        csv_data = """Age,Score,Passed
23,78,1
25,85,1
22,90,1
24,76,1
26,82,1
27,58,0
29,64,0
28,70,0
30,62,0
31,68,0"""
    if test_id == "regression-models":
        csv_data = """Age,StudyHours,Salary
23,4.5,42000
25,5.2,48000
22,6.0,51000
24,4.8,45000
26,5.5,50000
27,3.5,38000
29,4.0,40000
28,5.8,52000
30,3.2,36000
31,6.2,55000"""
        options = {
            "y_column": "Salary",
            "predictor_columns": ["Age", "StudyHours"],
            "model": "random_forest",
            "test_size": 0.2,
            "random_state": 42,
            "scale_features": False,
            "hyperparameters": {"n_estimators": 50, "max_depth": 3, "min_samples_split": 2},
        }
    if test_id == "time-series-models":
        csv_data = """Date,Sales
2022-01,100
2022-02,105
2022-03,110
2022-04,115
2022-05,118
2022-06,122
2022-07,125
2022-08,130
2022-09,128
2022-10,135
2022-11,140
2022-12,145
2023-01,142
2023-02,148
2023-03,152
2023-04,158
2023-05,162
2023-06,168
2023-07,172
2023-08,175
2023-09,170
2023-10,178
2023-11,182
2023-12,188"""
        options = {
            "date_column": "Date",
            "value_column": "Sales",
            "model": "arima",
            "forecast_horizon": 4,
            "hyperparameters": {"p": 1, "d": 1, "q": 1},
        }
    if test_id == "mcnemar":
        csv_data = """Before,After
Yes,Yes
Yes,No
No,Yes
No,No
Yes,No
No,Yes"""
        options = {"row_column": "Before", "col_column": "After"}
    response = client.post(
        "/api/v1/analyze",
        json={"test_id": test_id, "csv_data": csv_data, "options": options},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["test_id"] == test_id
    assert len(data["stats"]) > 0


def test_summary_statistics_requested_metrics(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "summary-statistics",
            "csv_data": SAMPLE_CSV,
            "options": {
                "value_column": "Score",
                "requested_metrics": ["mean", "std", "min", "max"],
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    labels = [stat["label"] for stat in data["stats"]]
    assert labels == ["Mean", "Std. Deviation", "Minimum", "Maximum"]


def test_multi_value_independent_ttest(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "independent-ttest",
            "csv_data": SAMPLE_CSV,
            "options": {
                "value_columns": ["Score", "Age"],
                "group_column": "Group",
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["batch_results"] is not None
    assert len(data["batch_results"]) == 2
    assert all(len(item["stats"]) > 0 for item in data["batch_results"])


def test_multi_value_summary_statistics(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "summary-statistics",
            "csv_data": SAMPLE_CSV,
            "options": {
                "value_columns": ["Score", "Age"],
                "requested_metrics": ["mean", "std"],
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["batch_results"] is not None
    assert len(data["batch_results"]) == 2


def test_classification_models_with_options(client: TestClient) -> None:
    csv_data = """Age,Score,Passed
23,78,1
25,85,1
22,90,1
24,76,1
26,82,1
27,58,0
29,64,0
28,70,0
30,62,0
31,68,0"""
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "classification-models",
            "csv_data": csv_data,
            "options": {
                "outcome_column": "Passed",
                "predictor_columns": ["Age", "Score"],
                "model": "random_forest",
                "test_size": 0.2,
                "random_state": 42,
                "scale_features": False,
                "hyperparameters": {"n_estimators": 50, "max_depth": 3, "min_samples_split": 2},
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["test_id"] == "classification-models"
    assert any(stat["label"] == "Accuracy" for stat in data["stats"])
    assert data["chart_data"]["confusion_matrix"] is not None


def test_classification_models_ignores_missing_in_unused_columns(client: TestClient) -> None:
    csv_data = """,,,User ID,Age,Score,Passed
,,,1,23,78,1
,,,2,25,85,1
,,,3,22,90,1
,,,4,24,76,1
,,,5,26,82,1
,,,6,27,58,0
,,,7,29,64,0
,,,8,28,70,0
,,,9,30,62,0
,,,10,31,68,0"""
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "classification-models",
            "csv_data": csv_data,
            "options": {
                "outcome_column": "Passed",
                "predictor_columns": ["Age", "Score"],
                "model": "random_forest",
                "test_size": 0.2,
                "random_state": 42,
                "scale_features": False,
                "preprocessing": {
                    "missing_values": "drop",
                    "column_types": {
                        "Age": "numeric",
                        "Score": "numeric",
                        "Passed": "numeric",
                    },
                },
                "hyperparameters": {"n_estimators": 50, "max_depth": 3, "min_samples_split": 2},
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["test_id"] == "classification-models"
    assert any(stat["label"] == "N" and stat["value"] == "10" for stat in data["stats"])


def test_regression_models_with_options(client: TestClient) -> None:
    csv_data = """Age,StudyHours,Salary
23,4.5,42000
25,5.2,48000
22,6.0,51000
24,4.8,45000
26,5.5,50000
27,3.5,38000
29,4.0,40000
28,5.8,52000
30,3.2,36000
31,6.2,55000"""
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "regression-models",
            "csv_data": csv_data,
            "options": {
                "y_column": "Salary",
                "predictor_columns": ["Age", "StudyHours"],
                "model": "ridge",
                "test_size": 0.2,
                "random_state": 42,
                "scale_features": True,
                "hyperparameters": {"alpha": 1.0},
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["test_id"] == "regression-models"
    assert any(stat["label"] == "R²" for stat in data["stats"])
    assert data["chart_data"]["scatter"] is not None


def test_time_series_models_arima(client: TestClient) -> None:
    csv_data = """Date,Sales
2022-01,100
2022-02,105
2022-03,110
2022-04,115
2022-05,118
2022-06,122
2022-07,125
2022-08,130
2022-09,128
2022-10,135
2022-11,140
2022-12,145
2023-01,142
2023-02,148
2023-03,152
2023-04,158
2023-05,162
2023-06,168
2023-07,172
2023-08,175
2023-09,170
2023-10,178
2023-11,182
2023-12,188"""
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "time-series-models",
            "csv_data": csv_data,
            "options": {
                "date_column": "Date",
                "value_column": "Sales",
                "model": "arima",
                "forecast_horizon": 6,
                "hyperparameters": {"p": 1, "d": 1, "q": 1},
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["test_id"] == "time-series-models"
    assert any(stat["label"] == "RMSE" for stat in data["stats"])
    assert data["chart_data"]["time_series"] is not None


def test_summary_statistics_group_and_ci(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "summary-statistics",
            "csv_data": SAMPLE_CSV,
            "options": {
                "value_column": "Score",
                "group_column": "Group",
                "requested_metrics": ["mean", "std", "p83"],
                "confidence_interval": {"enabled": True, "level": 95},
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["batch_results"] is not None
    assert len(data["batch_results"]) == 2
    first_stats = data["batch_results"][0]["stats"]
    assert any(stat["label"] == "83th Percentile" or "83" in stat["label"] for stat in first_stats)
    assert any("Mean CI (95%)" in stat["label"] for stat in first_stats)


def test_summary_statistics_requires_metric(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "summary-statistics",
            "csv_data": SAMPLE_CSV,
            "options": {"requested_metrics": []},
        },
    )
    assert response.status_code == 422


def test_survey_analyze(client: TestClient) -> None:
    response = client.post(
        "/api/v1/survey/analyze",
        json={
            "csv_data": SURVEY_CSV,
            "options": ["descriptive", "frequency", "cronbach", "crosstab", "factor"],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["response_count"] == 5


def test_survey_analyze_sparse_excel_like_data(client: TestClient) -> None:
    """Factor analysis should not crash when many columns have missing values."""
    sparse_csv = "a,b,c,d,e,f,g,h,i,j,k,l,m,n\n" + "\n".join(
        f"{i},,,,,,,,,,,,," for i in range(1, 6)
    )
    response = client.post(
        "/api/v1/survey/analyze",
        json={"csv_data": sparse_csv, "options": ["factor", "descriptive"]},
    )
    assert response.status_code == 200
    assert "interpretation" in response.json()


def test_shapiro_wilk_includes_qq_plot_and_downloads(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "shapiro-wilk",
            "csv_data": SAMPLE_CSV,
            "options": {"value_columns": ["Score"]},
        },
    )
    assert response.status_code == 200
    data = response.json()
    chart_data = data["chart_data"]
    assert chart_data is not None
    assert len(chart_data["qq_plot"]) > 0
    downloads = chart_data["downloads"]
    assert len(downloads) >= 2
    assert any(item["label"] == "Variable data" for item in downloads)
    assert any(item["label"] == "Q-Q plot data" for item in downloads)
    assert any(item["label"] == "Normalized data" for item in downloads)


def test_feature_scaling_transform_and_download(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "feature-scaling",
            "csv_data": SAMPLE_CSV,
            "options": {
                "value_columns": ["Age", "Score"],
                "transform_method": "standard",
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["test_id"] == "feature-scaling"
    downloads = data["chart_data"]["downloads"]
    assert len(downloads) == 1
    assert "Age" in downloads[0]["content"]
    assert "Score" in downloads[0]["content"]


def test_normalize_data_includes_normalized_download(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analyze",
        json={
            "test_id": "normalize-data",
            "csv_data": SAMPLE_CSV,
            "options": {
                "value_columns": ["Score"],
                "transform_method": "quantile",
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["test_id"] == "normalize-data"
    downloads = data["chart_data"]["downloads"]
    labels = [item["label"] for item in downloads]
    assert "Normalized data" in labels
    assert "Original data" in labels
    assert any("Shapiro p before" in stat["label"] for stat in data["stats"])
    assert any("Shapiro p after" in stat["label"] for stat in data["stats"])
