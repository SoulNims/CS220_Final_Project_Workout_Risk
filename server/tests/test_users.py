def test_root_returns_welcome_message(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to InjuryGuard API"}


def test_get_user_creates_user(client):
    response = client.get("/api/users/alice")

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "alice"
    assert "created_at" in body


def test_get_user_is_idempotent(client):
    first = client.get("/api/users/alice").json()
    second = client.get("/api/users/alice").json()

    assert first["username"] == second["username"]
    assert first["created_at"] == second["created_at"]
