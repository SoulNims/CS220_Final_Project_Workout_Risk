from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class DataStore:
    users: dict[str, dict] = field(default_factory=dict)
    workouts: dict[str, list[dict]] = field(default_factory=dict)
    risk_history: dict[str, list[dict]] = field(default_factory=dict)

    def reset(self) -> None:
        self.users.clear()
        self.workouts.clear()
        self.risk_history.clear()


store = DataStore()
