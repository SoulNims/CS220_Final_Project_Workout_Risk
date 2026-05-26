import sys
from pathlib import Path

from fastapi.testclient import TestClient
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app
from store.data_store import store


@pytest.fixture(autouse=True)
def reset_store():
    store.reset()
    yield
    store.reset()


@pytest.fixture
def client():
    return TestClient(app)
