import datetime

TODAY = datetime.date.today().isoformat()


def _create_user(client, username="alice"):
    client.get(f"/api/users/{username}")


def _post_session(client, username="alice", groups=None, rpe=7, duration=45):
    if groups is None:
        groups = ["chest"]
    return client.post(
        f"/api/workouts/{username}",
        json={"date": TODAY, "name": "Test session", "groups": groups,
              "rpe": rpe, "duration": duration, "soreness": 5},
    )


def test_post_session_creates_session(client):
    _create_user(client)

    response = _post_session(client)

    assert response.status_code == 201
    body = response.json()
    assert body["id"]
    assert body["username"] == "alice"
    assert body["groups"] == ["chest"]
    assert body["rpe"] == 7


def test_post_session_unknown_user_returns_404(client):
    response = _post_session(client, username="missing")

    assert response.status_code == 404


def test_post_session_validates_muscle_group(client):
    _create_user(client)

    response = client.post(
        "/api/workouts/alice",
        json={"date": TODAY, "name": "Bad", "groups": ["neck"],
              "rpe": 7, "duration": 30, "soreness": 5},
    )

    assert response.status_code == 422


def test_get_sessions_returns_newest_first(client):
    _create_user(client)
    first = _post_session(client, groups=["chest"]).json()
    second = _post_session(client, groups=["quads"]).json()

    response = client.get("/api/workouts/alice")

    assert response.status_code == 200
    ids = [s["id"] for s in response.json()]
    assert ids.index(second["id"]) < ids.index(first["id"])


def test_put_session_updates_fields(client):
    _create_user(client)
    created = _post_session(client).json()

    response = client.put(
        f"/api/workouts/alice/{created['id']}",
        json={"date": TODAY, "name": "Updated", "groups": ["biceps"],
              "rpe": 9, "duration": 60, "soreness": 7},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated"
    assert response.json()["groups"] == ["biceps"]


def test_delete_session_returns_204(client):
    _create_user(client)
    created = _post_session(client).json()

    response = client.delete(f"/api/workouts/alice/{created['id']}")

    assert response.status_code == 204
    assert client.get("/api/workouts/alice").json() == []


def test_delete_missing_session_returns_404(client):
    _create_user(client)

    response = client.delete("/api/workouts/alice/notreal")

    assert response.status_code == 404
