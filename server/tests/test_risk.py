def _create_user(client, username="alice"):
    client.get(f"/api/users/{username}")


def _post_workout(client, username="alice", muscle_group="chest", sets=4, reps=10, intensity=80):
    return client.post(
        f"/api/workouts/{username}",
        json={
            "muscle_group": muscle_group,
            "sets": sets,
            "reps": reps,
            "intensity": intensity,
        },
    )


def test_risk_unknown_user_returns_404(client):
    response = client.get("/api/risk/missing")

    assert response.status_code == 404


def test_risk_returns_all_ten_muscle_groups(client):
    _create_user(client)

    response = client.get("/api/risk/alice")

    assert response.status_code == 200
    assert len(response.json()) == 10


def test_new_user_risk_scores_are_zero_low_gray(client):
    _create_user(client)

    response = client.get("/api/risk/alice")

    for score in response.json():
        assert score["score"] == 0.0
        assert score["level"] == "Low"
        assert score["color"] == "gray"


def test_logged_workout_increases_matching_muscle_risk(client):
    _create_user(client)
    _post_workout(client, muscle_group="chest", sets=4, reps=10, intensity=80)

    scores = client.get("/api/risk/alice").json()
    chest = next(score for score in scores if score["muscle_group"] == "chest")
    back = next(score for score in scores if score["muscle_group"] == "back")

    assert chest["score"] > 0
    assert chest["color"] != "gray"
    assert back["score"] == 0.0


def test_high_volume_workout_can_return_critical_level(client):
    _create_user(client)
    _post_workout(client, muscle_group="quads", sets=10, reps=15, intensity=95)

    scores = client.get("/api/risk/alice").json()
    quads = next(score for score in scores if score["muscle_group"] == "quads")

    assert quads["level"] == "Critical"
    assert quads["color"] == "red"


def test_risk_call_creates_history_snapshot(client):
    _create_user(client)
    _post_workout(client)

    client.get("/api/risk/alice")
    history = client.get("/api/risk/alice/history")

    assert history.status_code == 200
    assert len(history.json()) == 1
    assert "timestamp" in history.json()[0]
    assert len(history.json()[0]["scores"]) == 10


def test_multiple_risk_calls_create_multiple_history_snapshots(client):
    _create_user(client)

    client.get("/api/risk/alice")
    client.get("/api/risk/alice")

    assert len(client.get("/api/risk/alice/history").json()) == 2


def test_recommendations_include_message_per_muscle(client):
    _create_user(client)
    _post_workout(client, muscle_group="chest", sets=4, reps=10, intensity=80)

    response = client.get("/api/recommendations/alice")

    assert response.status_code == 200
    assert len(response.json()) == 10
    assert all("message" in item for item in response.json())


def test_recommendations_do_not_create_history_snapshot(client):
    _create_user(client)

    client.get("/api/recommendations/alice")

    assert client.get("/api/risk/alice/history").json() == []
