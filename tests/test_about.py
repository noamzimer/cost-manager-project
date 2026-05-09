import requests
from config import ABOUT_URL
from helpers import wait_for_service, print_result


def test_get_about():
    wait_for_service(ABOUT_URL)

    response = requests.get(ABOUT_URL + "/api/about")
    print_result("Testing GET /api/about", response)

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 3

    for developer in data:
        assert "first_name" in developer
        assert "last_name" in developer
        assert len(developer.keys()) == 2


if __name__ == "__main__":
    test_get_about()