import datetime

TODAY = datetime.date.today().isoformat()


def _create_user(client, username="alice"):
    response = client.post(
        "/api/auth/register",
        json={"username": username, "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['token']}"}


def _post_session(client, username="alice", groups=None, rpe=7, duration=45, headers=None):
    if groups is None:
        groups = ["chest"]
    return client.post(
        f"/api/workouts/{username}",
        json={"date": TODAY, "name": "Test session", "groups": groups,
              "rpe": rpe, "duration": duration, "soreness": 5},
        headers=headers,
    )


def test_post_session_creates_session(client):
    headers = _create_user(client)

    response = _post_session(client, headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["id"]
    assert body["username"] == "alice"
    assert body["groups"] == ["chest"]
    assert body["rpe"] == 7


def test_post_session_unknown_user_returns_404(client):
    response = _post_session(client, username="missing")

    assert response.status_code == 401


def test_post_session_validates_muscle_group(client):
    headers = _create_user(client)

    response = client.post(
        "/api/workouts/alice",
        json={"date": TODAY, "name": "Bad", "groups": ["neck"],
              "rpe": 7, "duration": 30, "soreness": 5},
        headers=headers,
    )

    assert response.status_code == 422


def test_get_sessions_returns_newest_first(client):
    headers = _create_user(client)
    first = _post_session(client, groups=["chest"], headers=headers).json()
    second = _post_session(client, groups=["quads"], headers=headers).json()

    response = client.get("/api/workouts/alice", headers=headers)

    assert response.status_code == 200
    ids = [s["id"] for s in response.json()]
    assert ids.index(second["id"]) < ids.index(first["id"])


def test_put_session_updates_fields(client):
    headers = _create_user(client)
    created = _post_session(client, headers=headers).json()

    response = client.put(
        f"/api/workouts/alice/{created['id']}",
        json={"date": TODAY, "name": "Updated", "groups": ["biceps"],
              "rpe": 9, "duration": 60, "soreness": 7},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated"
    assert response.json()["groups"] == ["biceps"]


def test_delete_session_returns_204(client):
    headers = _create_user(client)
    created = _post_session(client, headers=headers).json()

    response = client.delete(f"/api/workouts/alice/{created['id']}", headers=headers)

    assert response.status_code == 204
    assert client.get("/api/workouts/alice", headers=headers).json() == []


def test_delete_missing_session_returns_404(client):
    headers = _create_user(client)

    response = client.delete("/api/workouts/alice/notreal", headers=headers)

    assert response.status_code == 404
