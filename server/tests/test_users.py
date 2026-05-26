def test_root_returns_welcome_message(client):
    response = client.get("/")

    assert response.status_code == 200
    assert "Tendon" in response.json()["message"]


def test_get_user_creates_user(client):
    response = client.get("/api/users/alice")

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "alice"
    assert "gender" in body


def test_get_user_is_idempotent(client):
    first = client.get("/api/users/alice").json()
    second = client.get("/api/users/alice").json()

    assert first["username"] == second["username"]


def test_patch_user_updates_gender_and_age(client):
    client.get("/api/users/alice")

    response = client.patch("/api/users/alice", json={"gender": "female", "age": 25})

    assert response.status_code == 200
    body = response.json()
    assert body["gender"] == "female"
    assert body["age"] == 25
