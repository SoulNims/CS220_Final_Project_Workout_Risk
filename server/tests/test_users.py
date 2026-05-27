def test_root_returns_welcome_message(client):
    response = client.get("/")

    assert response.status_code == 200
    assert "Tendon" in response.json()["message"]


def _register(client, email="alice@example.com", password="password123"):
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "first_name": "Alice",
            "last_name": "Runner",
            "password": password,
            "security_question": "What is your favorite exercise?",
            "security_answer": "Squat",
        },
    )
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_creates_user_and_token(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "alice@example.com",
            "first_name": "Alice",
            "last_name": "Runner",
            "password": "password123",
            "security_question": "What is your favorite exercise?",
            "security_answer": "Squat",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["token"]
    assert body["user"]["username"] == "alice"
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["first_name"] == "Alice"
    assert body["user"]["last_name"] == "Runner"


def test_login_returns_token_for_existing_user(client):
    _register(client)

    response = client.post(
        "/api/auth/login",
        json={"email": "ALICE@example.com", "password": "password123"},
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
    assert body["first_name"] == "Alice"
    assert body["last_name"] == "Runner"
    assert "gender" in body


def test_register_existing_user_is_rejected(client):
    _register(client)

    response = client.post(
        "/api/auth/register",
        json={
            "email": "alice@example.com",
            "first_name": "Alice",
            "last_name": "Runner",
            "password": "password123",
            "security_question": "What is your favorite exercise?",
            "security_answer": "Squat",
        },
    )

    assert response.status_code == 409


def test_notes_are_private_and_persist_for_user(client):
    headers = _register(client)

    empty = client.get("/api/users/alice/notes", headers=headers)
    assert empty.status_code == 200
    assert empty.json()["body"] == ""

    saved = client.put(
        "/api/users/alice/notes",
        json={"body": "Left knee felt tight after squats."},
        headers=headers,
    )

    assert saved.status_code == 200
    assert saved.json()["body"] == "Left knee felt tight after squats."

    loaded = client.get("/api/users/alice/notes", headers=headers)
    assert loaded.status_code == 200
    assert loaded.json()["body"] == "Left knee felt tight after squats."


def test_notes_require_matching_user_token(client):
    _register(client, email="alice@example.com")
    bob_headers = _register(client, email="bob@example.com")

    response = client.get("/api/users/alice/notes", headers=bob_headers)

    assert response.status_code == 403


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
