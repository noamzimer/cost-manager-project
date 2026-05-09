import requests


logs_service = "http://localhost:3003"
users_service = "http://localhost:3001"
costs_service = "http://localhost:3002"
about_service = "http://localhost:3004"


def print_result(title, response):
    print("\n" + title)
    print("-" * len(title))
    print("URL:", response.url)
    print("Status code:", response.status_code)
    print("Response:")
    try:
        print(response.json())
    except Exception:
        print(response.text)


def test_about():
    response = requests.get(about_service + "/api/about")
    print_result("Testing /api/about", response)


def test_users():
    response = requests.get(users_service + "/api/users")
    print_result("Testing /api/users", response)


def test_user_details():
    response = requests.get(users_service + "/api/users/123123")
    print_result("Testing /api/users/123123", response)


def test_report_before_add():
    response = requests.get(costs_service + "/api/report?id=123123&year=2026&month=5")
    print_result("Testing /api/report before adding cost", response)


def test_add_cost():
    data = {
        "userid": 123123,
        "description": "milk 9",
        "category": "food",
        "sum": 8
    }

    response = requests.post(costs_service + "/api/add", json=data)
    print_result("Testing POST /api/add cost", response)


def test_report_after_add():
    response = requests.get(costs_service + "/api/report?id=123123&year=2026&month=5")
    print_result("Testing /api/report after adding cost", response)


def test_logs():
    response = requests.get(logs_service + "/api/logs")
    print_result("Testing /api/logs", response)


def test_invalid_category():
    data = {
        "userid": 123123,
        "description": "wrong category test",
        "category": "shopping",
        "sum": 10
    }

    response = requests.post(costs_service + "/api/add", json=data)
    print_result("Testing invalid category", response)


def test_invalid_user():
    response = requests.get(users_service + "/api/users/999999")
    print_result("Testing invalid user", response)


test_about()
test_users()
test_user_details()
test_report_before_add()
test_add_cost()
test_report_after_add()
test_logs()
test_invalid_category()
test_invalid_user()