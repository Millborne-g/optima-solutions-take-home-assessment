"""Unit tests for export_deals.py with mocked HubSpot API."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

# Ensure scripts/ is importable
sys.path.insert(0, os.path.dirname(__file__))

import export_deals  # noqa: E402


class ExportDealsTests(unittest.TestCase):
    def test_extract_order_id(self) -> None:
        self.assertEqual(export_deals.extract_order_id("Order ORD-10482"), "ORD-10482")
        self.assertEqual(export_deals.extract_order_id("Something else"), "")

    def test_rows_from_deals(self) -> None:
        deals = [
            {
                "id": "123",
                "properties": {
                    "dealname": "Order ORD-1",
                    "amount": "900",
                    "deal_currency_code": "PHP",
                    "createdate": "1720000000000",
                    "pipeline": "default",
                    "dealstage": "appointmentscheduled",
                },
            }
        ]
        rows = export_deals.rows_from_deals(deals)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["deal_id"], "123")
        self.assertEqual(rows[0]["order_id"], "ORD-1")
        self.assertEqual(rows[0]["amount"], "900")
        self.assertEqual(rows[0]["currency"], "PHP")

    @patch("export_deals.requests.post")
    def test_fetch_deals_pagination(self, mock_post: MagicMock) -> None:
        page1 = MagicMock()
        page1.status_code = 200
        page1.json.return_value = {
            "results": [{"id": "1", "properties": {"dealname": "Order A"}}],
            "paging": {"next": {"after": "cursor2"}},
        }
        page2 = MagicMock()
        page2.status_code = 200
        page2.json.return_value = {
            "results": [{"id": "2", "properties": {"dealname": "Order B"}}],
        }
        mock_post.side_effect = [page1, page2]

        with patch.dict(os.environ, {"HUBSPOT_PRIVATE_APP_TOKEN": "test-token"}):
            results = export_deals.fetch_deals("test-token", days=7)

        self.assertEqual(len(results), 2)
        self.assertEqual(mock_post.call_count, 2)

    @patch("export_deals.fetch_deals")
    def test_write_csv_empty(self, mock_fetch: MagicMock) -> None:
        mock_fetch.return_value = []
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "out.csv")
            with patch.dict(os.environ, {"HUBSPOT_PRIVATE_APP_TOKEN": "t"}):
                with patch("sys.argv", ["export_deals.py", "--output", out]):
                    export_deals.main()
            with open(out, encoding="utf-8") as f:
                content = f.read()
            self.assertIn("deal_id", content)


if __name__ == "__main__":
    unittest.main()
