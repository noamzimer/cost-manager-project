import requests
from config import LOGS_URL
from helpers import wait_for_service, print_result, assert_error_shape


def test_get_logs():
    wait_for_service(LOGS_URL)

    response = requests.get(LOGS_URL + "/api/logs")
    print_result("Testing GET /api/logs", response)

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_add_valid_log():
    response = requests.post(LOGS_URL + "/api/logs", json={
        "service": "python-tests",
        "method": "POST",
        "endpoint": "/api/logs",
        "status": 201,
        "message": "Hello from Python tests"
    })

    print_result("Testing POST /api/logs valid log", response)

    assert response.status_code == 201

    data = response.json()

    assert data["service"] == "python-tests"
    assert data["method"] == "POST"
    assert data["endpoint"] == "/api/logs"
    assert "status" in data
    assert "message" in data


def test_add_invalid_log_missing_fields():
    response = requests.post(LOGS_URL + "/api/logs", json={
        "service": "python-tests"
    })

    print_result("Testing POST /api/logs invalid log", response)

    assert response.status_code == 400
    assert_error_shape(response.json())


if __name__ == "__main__":
    test_get_logs()
    test_add_valid_log()
    test_add_invalid_log_missing_fields()