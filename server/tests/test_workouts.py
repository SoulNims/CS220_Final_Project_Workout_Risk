def _create_user(client, username="alice"):
    client.get(f"/api/users/{username}")


def test_post_workout_creates_workout(client):
    _create_user(client)

    response = client.post(
        "/api/workouts/alice",
        json={"muscle_group": "chest", "sets": 4, "reps": 10, "intensity": 80},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"]
    assert body["username"] == "alice"
    assert body["muscle_group"] == "chest"
    assert body["intensity"] == 80.0


def test_post_workout_unknown_user_returns_404(client):
    response = client.post(
        "/api/workouts/missing",
        json={"muscle_group": "chest", "sets": 4, "reps": 10, "intensity": 80},
    )

    assert response.status_code == 404


def test_post_workout_validates_muscle_group(client):
    _create_user(client)

    response = client.post(
        "/api/workouts/alice",
        json={"muscle_group": "neck", "sets": 4, "reps": 10, "intensity": 80},
    )

    assert response.status_code == 422


def test_post_workout_validates_positive_sets(client):
    _create_user(client)

    response = client.post(
        "/api/workouts/alice",
        json={"muscle_group": "chest", "sets": 0, "reps": 10, "intensity": 80},
    )

    assert response.status_code == 422


def test_get_workouts_returns_newest_first(client):
    _create_user(client)
    first = client.post(
        "/api/workouts/alice",
        json={"muscle_group": "chest", "sets": 4, "reps": 10, "intensity": 80},
    ).json()
    second = client.post(
        "/api/workouts/alice",
        json={"muscle_group": "quads", "sets": 5, "reps": 12, "intensity": 90},
    ).json()

    response = client.get("/api/workouts/alice")

    assert response.status_code == 200
    body = response.json()
    assert [workout["id"] for workout in body] == [second["id"], first["id"]]


def test_delete_workout_returns_204_and_removes_it(client):
    _create_user(client)
    created = client.post(
        "/api/workouts/alice",
        json={"muscle_group": "chest", "sets": 4, "reps": 10, "intensity": 80},
    ).json()

    response = client.delete(f"/api/workouts/alice/{created['id']}")

    assert response.status_code == 204
    assert client.get("/api/workouts/alice").json() == []


def test_delete_missing_workout_returns_404(client):
    _create_user(client)

    response = client.delete("/api/workouts/alice/not-real")

    assert response.status_code == 404
