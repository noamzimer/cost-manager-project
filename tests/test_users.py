import requests
from config import USERS_URL, TEST_USER_ID
from helpers import wait_for_service, print_result, assert_error_shape


def test_get_all_users():
    wait_for_service(USERS_URL)

    response = requests.get(USERS_URL + "/api/users")
    print_result("Testing GET /api/users", response)

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_specific_user():
    response = requests.get(USERS_URL + f"/api/users/{TEST_USER_ID}")
    print_result("Testing GET /api/users/123123", response)

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == TEST_USER_ID
    assert data["first_name"] == "mosh"
    assert data["last_name"] == "israeli"
    assert "total" in data


def test_get_missing_user():
    response = requests.get(USERS_URL + "/api/users/999999")
    print_result("Testing GET missing user", response)

    assert response.status_code == 404
    assert_error_shape(response.json())


def test_add_invalid_user_missing_fields():
    response = requests.post(USERS_URL + "/api/add", json={
        "id": 555555,
        "first_name": "test"
    })

    print_result("Testing POST /api/add invalid user", response)

    assert response.status_code == 400
    assert_error_shape(response.json())


if __name__ == "__main__":
    test_get_all_users()
    test_get_specific_user()
    test_get_missing_user()
    test_add_invalid_user_missing_fields()