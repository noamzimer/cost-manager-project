import time
import requests


def wait_for_service(base_url, timeout_seconds=30):
    start_time = time.time()
    last_error = None

    while time.time() - start_time < timeout_seconds:
        try:
            response = requests.get(base_url + "/", timeout=5)

            if response.status_code < 500:
                return
        except Exception as error:
            last_error = error

        time.sleep(1)

    raise Exception(f"Service is not ready: {base_url}. Last error: {last_error}")


def request_safe(method, url, **kwargs):
    try:
        response = requests.request(method, url, **kwargs)

        return response
    except Exception as error:
        raise Exception(f"Request failed: {url}. Error: {error}")


def assert_error_shape(data):
    assert isinstance(data, dict)
    assert "id" in data
    assert "message" in data


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