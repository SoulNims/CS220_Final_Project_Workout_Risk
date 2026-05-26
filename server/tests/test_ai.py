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


def test_ai_analysis_requires_existing_user(client):
    response = client.get("/api/ai/analyze/missing")

    assert response.status_code == 404


def test_ai_analysis_returns_patterns_and_disclaimer(client):
    _create_user(client)
    _post_session(client, groups=["chest"])

    response = client.get("/api/ai/analyze/alice")

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "demo"
    assert body["patterns"]
    assert body["risk_notes"]
    assert "medical advice" in body["disclaimer"]


def test_ai_plan_returns_seven_days(client):
    _create_user(client)
    _post_session(client, groups=["quads", "hamstrings"], rpe=9)

    response = client.get("/api/ai/plan/alice")

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "demo"
    assert len(body["plan"]) == 7
    assert {"day", "focus", "exercises", "reason"} <= set(body["plan"][0])


def test_ai_report_returns_narrative_fields(client):
    _create_user(client)
    _post_session(client, groups=["quads"])

    response = client.get("/api/ai/report/alice")

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Weekly Training Health Report"
    assert body["summary"]
    assert body["trend"]
    assert body["focus"]
