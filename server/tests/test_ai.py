import datetime

TODAY = datetime.date.today().isoformat()


def _create_user(client, username="alice"):
    response = client.post(
        "/api/auth/register",
        json={"email": f"{username}@example.com", "first_name": username.title(), "last_name": "Tester", "password": "password123"},
    )
    return {"Authorization": f"Bearer {response.json()['token']}"}


def _post_session(client, username="alice", groups=None, rpe=7, duration=45, headers=None):
    if groups is None:
        groups = ["chest"]
    return client.post(
        f"/api/workouts/{username}",
        json={"date": TODAY, "name": "Test", "groups": groups,
              "rpe": rpe, "duration": duration, "soreness": 5},
        headers=headers,
    )


def test_ai_analysis_requires_existing_user(client):
    response = client.get("/api/ai/analyze/missing")

    assert response.status_code == 401


def test_ai_analysis_returns_patterns_and_disclaimer(client):
    headers = _create_user(client)
    _post_session(client, groups=["chest"], headers=headers)

    response = client.get("/api/ai/analyze/alice", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "demo"
    assert body["patterns"]
    assert body["risk_notes"]
    assert "medical advice" in body["disclaimer"]


def test_ai_plan_returns_seven_days(client):
    headers = _create_user(client)
    _post_session(client, groups=["quads", "hamstrings"], rpe=9, headers=headers)

    response = client.get("/api/ai/plan/alice", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "demo"
    assert len(body["plan"]) == 7
    assert {"day", "focus", "exercises", "reason"} <= set(body["plan"][0])


def test_ai_report_returns_narrative_fields(client):
    headers = _create_user(client)
    _post_session(client, groups=["quads"], headers=headers)

    response = client.get("/api/ai/report/alice", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Weekly Training Health Report"
    assert body["summary"]
    assert body["trend"]
    assert body["focus"]
