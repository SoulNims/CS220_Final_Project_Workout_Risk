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


def test_ai_analysis_requires_existing_user(client):
    response = client.get("/api/ai/analyze/missing")

    assert response.status_code == 404


def test_ai_analysis_returns_patterns_and_disclaimer(client):
    _create_user(client)
    _post_workout(client, muscle_group="chest")

    response = client.get("/api/ai/analyze/alice")

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "demo"
    assert body["patterns"]
    assert body["risk_notes"]
    assert "medical advice" in body["disclaimer"]


def test_ai_plan_returns_seven_days(client):
    _create_user(client)
    _post_workout(client, muscle_group="chest", sets=10, reps=15, intensity=95)

    response = client.get("/api/ai/plan/alice")

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "demo"
    assert len(body["plan"]) == 7
    assert {"day", "focus", "exercises", "reason"} <= set(body["plan"][0])


def test_ai_report_returns_narrative_fields(client):
    _create_user(client)
    _post_workout(client, muscle_group="quads")

    response = client.get("/api/ai/report/alice")

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Weekly Training Health Report"
    assert body["summary"]
    assert body["trend"]
    assert body["focus"]
