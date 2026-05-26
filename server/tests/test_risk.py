import datetime

TODAY = datetime.date.today().isoformat()


def _create_user(client, username="alice"):
    client.get(f"/api/users/{username}")


def _post_session(client, username="alice", groups=None, rpe=7, duration=45):
    if groups is None:
        groups = ["chest"]
    return client.post(
        f"/api/workouts/{username}",
        json={"date": TODAY, "name": "Test", "groups": groups,
              "rpe": rpe, "duration": duration, "soreness": 5},
    )


def test_risk_unknown_user_returns_404(client):
    response = client.get("/api/risk/missing")

    assert response.status_code == 404


def test_risk_returns_all_sixteen_muscle_groups(client):
    _create_user(client)

    response = client.get("/api/risk/alice")

    assert response.status_code == 200
    assert len(response.json()) == 16


def test_new_user_risk_scores_are_zero_none(client):
    _create_user(client)

    for item in client.get("/api/risk/alice").json():
        assert item["score"] == 0
        assert item["level"] == "none"


def test_logged_session_increases_matching_muscle_risk(client):
    _create_user(client)
    _post_session(client, groups=["chest"], rpe=7)

    scores = {item["group"]: item for item in client.get("/api/risk/alice").json()}

    assert scores["chest"]["score"] > 0
    assert scores["chest"]["level"] != "none"
    assert scores["quads"]["score"] == 0


def test_state_endpoint_returns_full_snapshot(client):
    _create_user(client)
    _post_session(client, groups=["chest", "triceps"], rpe=8)

    response = client.get("/api/risk/alice/state")

    assert response.status_code == 200
    body = response.json()
    assert "loads" in body
    assert "risk" in body
    assert "aggregate_score" in body
    assert len(body["trend"]) == 14


def test_history_returns_14_trend_points(client):
    _create_user(client)
    _post_session(client)

    history = client.get("/api/risk/alice/history")

    assert history.status_code == 200
    assert len(history.json()) == 14
    assert "d" in history.json()[0]
    assert "score" in history.json()[0]


def test_recommendations_include_message_per_muscle(client):
    _create_user(client)
    _post_session(client, groups=["chest"], rpe=7)

    response = client.get("/api/recommendations/alice")

    assert response.status_code == 200
    assert len(response.json()) == 16
    assert all("message" in item for item in response.json())
