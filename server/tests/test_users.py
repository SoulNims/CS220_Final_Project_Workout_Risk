def test_root_returns_welcome_message(client):
    response = client.get("/")

    assert response.status_code == 200
    assert "Tendon" in response.json()["message"]


def _register(client, username="alice", password="password123"):
    response = client.post(
        "/api/auth/register",
        json={"username": username, "password": password},
    )
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_creates_user_and_token(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "password123"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["token"]
    assert body["user"]["username"] == "alice"


def test_login_returns_token_for_existing_user(client):
    _register(client)

    response = client.post(
        "/api/auth/login",
        json={"username": "alice", "password": "password123"},
    )

    assert response.status_code == 200
    assert response.json()["token"]


def test_get_user_requires_token(client):
    response = client.get("/api/users/alice")

    assert response.status_code == 401


def test_get_user_returns_authenticated_user(client):
    headers = _register(client)

    response = client.get("/api/users/alice", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "alice"
    assert "gender" in body


def test_register_existing_user_is_rejected(client):
    _register(client)

    response = client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "password123"},
    )

    assert response.status_code == 409


def test_patch_user_updates_gender_and_age(client):
    headers = _register(client)

    response = client.patch(
        "/api/users/alice",
        json={"gender": "female", "age": 25},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["gender"] == "female"
    assert body["age"] == 25
