from datetime import datetime, timezone
import unittest

from fastapi.testclient import TestClient

from app import app
from src.theme import get_active_theme


class ThemeContractTests(unittest.TestCase):
    timezone_name = "Europe/Helsinki"

    def test_server_schedule_selects_each_period_and_next_boundary(self):
        expectations = (
            (1, "night", "#3d3676", 6),
            (7, "morning", "#9c426a", 12),
            (13, "afternoon", "#6351ad", 18),
            (19, "evening", "#471e6e", 0),
        )

        for hour, period, start_color, next_hour in expectations:
            with self.subTest(hour=hour):
                theme = get_active_theme(
                    datetime(2026, 1, 15, hour, 30),
                    timezone_name=self.timezone_name,
                )
                next_change = datetime.fromisoformat(theme["next_change_at"])

                self.assertEqual(theme["period"], period)
                self.assertEqual(theme["background"]["start"], start_color)
                self.assertEqual(theme["timezone"], self.timezone_name)
                self.assertEqual(next_change.hour, next_hour)
                self.assertGreater(next_change, datetime(2026, 1, 15, hour, 30, tzinfo=next_change.tzinfo))

    def test_theme_endpoint_exposes_the_contract_without_caching(self):
        response = TestClient(app).get("/api/theme")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["cache-control"], "no-store")
        self.assertEqual(
            set(response.json()),
            {"period", "background", "next_change_at", "server_time", "timezone", "revision"},
        )

    def test_aware_timestamps_are_converted_to_the_server_timezone(self):
        theme = get_active_theme(
            datetime(2026, 1, 15, 5, 30, tzinfo=timezone.utc),
            timezone_name=self.timezone_name,
        )

        self.assertEqual(theme["period"], "morning")
        self.assertEqual(theme["server_time"], "2026-01-15T07:30:00+02:00")


if __name__ == "__main__":
    unittest.main()
