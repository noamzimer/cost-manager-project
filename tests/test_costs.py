import requests
from config import COSTS_URL, TEST_USER_ID, TEST_YEAR, TEST_MONTH
from helpers import wait_for_service, print_result, assert_error_shape


def test_get_report():
    wait_for_service(COSTS_URL)

    url = COSTS_URL + f"/api/report?id={TEST_USER_ID}&year={TEST_YEAR}&month={TEST_MONTH}"
    response = requests.get(url)
    print_result("Testing GET /api/report", response)

    assert response.status_code == 200

    data = response.json()

    assert data["userid"] == TEST_USER_ID
    assert data["year"] == TEST_YEAR
    assert data["month"] == TEST_MONTH
    assert "costs" in data
    assert isinstance(data["costs"], list)

    categories = []

    for category_object in data["costs"]:
        categories.extend(category_object.keys())

    assert "food" in categories
    assert "health" in categories
    assert "housing" in categories
    assert "sports" in categories
    assert "education" in categories


def test_get_empty_report_future_month():
    response = requests.get(COSTS_URL + f"/api/report?id={TEST_USER_ID}&year=2027&month=1")
    print_result("Testing GET empty/future /api/report", response)

    assert response.status_code == 200

    data = response.json()

    assert data["userid"] == TEST_USER_ID
    assert data["year"] == 2027
    assert data["month"] == 1
    assert "costs" in data
    assert isinstance(data["costs"], list)


def test_add_cost():
    response = requests.post(COSTS_URL + "/api/add", json={
        "userid": TEST_USER_ID,
        "description": "test milk",
        "category": "food",
        "sum": 8
    })

    print_result("Testing POST /api/add cost", response)

    assert response.status_code == 201

    data = response.json()

    assert data["userid"] == TEST_USER_ID
    assert data["description"] == "test milk"
    assert data["category"] == "food"
    assert data["sum"] == 8


def test_add_cost_missing_fields():
    response = requests.post(COSTS_URL + "/api/add", json={
        "userid": TEST_USER_ID
    })

    print_result("Testing POST /api/add missing fields", response)

    assert response.status_code == 400
    assert_error_shape(response.json())


def test_add_cost_invalid_category():
    response = requests.post(COSTS_URL + "/api/add", json={
        "userid": TEST_USER_ID,
        "description": "wrong category",
        "category": "shopping",
        "sum": 10
    })

    print_result("Testing POST /api/add invalid category", response)

    assert response.status_code == 400
    assert_error_shape(response.json())


def test_add_cost_negative_sum():
    response = requests.post(COSTS_URL + "/api/add", json={
        "userid": TEST_USER_ID,
        "description": "negative sum",
        "category": "food",
        "sum": -5
    })

    print_result("Testing POST /api/add negative sum", response)

    assert response.status_code == 400
    assert_error_shape(response.json())


def test_get_report_missing_params():
    response = requests.get(COSTS_URL + "/api/report")
    print_result("Testing GET /api/report missing params", response)

    assert response.status_code == 400
    assert_error_shape(response.json())


if __name__ == "__main__":
    test_get_report()
    test_get_empty_report_future_month()
    test_add_cost()
    test_add_cost_missing_fields()
    test_add_cost_invalid_category()
    test_add_cost_negative_sum()
    test_get_report_missing_params()