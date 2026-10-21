#!/usr/bin/env python3
"""
Export HubSpot Deals created in the last N days to CSV.

Usage:
  python export_deals.py
  python export_deals.py --dry-run
  python export_deals.py --days 7 --output deals_export.csv

Environment:
  HUBSPOT_PRIVATE_APP_TOKEN  (required)
  EXPORT_DAYS                (optional, default 7)
  EXPORT_OUTPUT              (optional, default deals_export.csv)

Timezone: UTC for the date window (createdate GTE now_utc - N days).
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from typing import Any

try:
    import requests
except ImportError:
    print("Missing dependency: requests. Run: pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore


HUBSPOT_SEARCH_URL = "https://api.hubapi.com/crm/v3/objects/deals/search"
ORDER_ID_RE = re.compile(r"^Order\s+([\w\-]+)", re.IGNORECASE)
DEAL_PROPERTIES = [
    "dealname",
    "amount",
    "deal_currency_code",
    "createdate",
    "dealstage",
    "pipeline",
]


def load_env() -> None:
    if load_dotenv is not None:
        # Load from project root .env.local if present
        root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        load_dotenv(os.path.join(root, ".env.local"))
        load_dotenv(os.path.join(root, ".env"))


def get_token() -> str:
    token = os.environ.get("HUBSPOT_PRIVATE_APP_TOKEN")
    if not token:
        print(
            "HUBSPOT_PRIVATE_APP_TOKEN is not set. "
            "Add it to .env.local or export it in your shell.",
            file=sys.stderr,
        )
        sys.exit(1)
    return token


def window_start_ms(days: int) -> int:
    start = datetime.now(timezone.utc) - timedelta(days=days)
    return int(start.timestamp() * 1000)


def fetch_deals(token: str, days: int) -> list[dict[str, Any]]:
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    after: str | None = None
    results: list[dict[str, Any]] = []
    gte_ms = window_start_ms(days)

    while True:
        body: dict[str, Any] = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": "createdate",
                            "operator": "GTE",
                            "value": str(gte_ms),
                        }
                    ]
                }
            ],
            "properties": DEAL_PROPERTIES,
            "limit": 100,
            "sorts": [{"propertyName": "createdate", "direction": "DESCENDING"}],
        }
        if after:
            body["after"] = after

        resp = requests.post(HUBSPOT_SEARCH_URL, headers=headers, json=body, timeout=30)
        if resp.status_code >= 400:
            print(
                f"HubSpot API error {resp.status_code}: {resp.text[:500]}",
                file=sys.stderr,
            )
            sys.exit(1)

        data = resp.json()
        batch = data.get("results") or []
        results.extend(batch)

        paging = data.get("paging") or {}
        next_page = (paging.get("next") or {}).get("after")
        if not next_page:
            break
        after = next_page

    return results


def extract_order_id(dealname: str | None) -> str:
    if not dealname:
        return ""
    match = ORDER_ID_RE.match(dealname.strip())
    return match.group(1) if match else ""


def createdate_to_iso(value: str | None) -> str:
    if not value:
        return ""
    # HubSpot may return epoch ms as string
    try:
        if value.isdigit():
            dt = datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc)
            return dt.isoformat()
        return value
    except (ValueError, OSError):
        return value


def rows_from_deals(deals: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for deal in deals:
        props = deal.get("properties") or {}
        name = props.get("dealname") or ""
        rows.append(
            {
                "deal_id": str(deal.get("id") or ""),
                "deal_name": name,
                "amount": props.get("amount") or "",
                "currency": props.get("deal_currency_code") or "",
                "created_at_utc": createdate_to_iso(props.get("createdate")),
                "pipeline": props.get("pipeline") or "",
                "stage": props.get("dealstage") or "",
                "order_id": extract_order_id(name),
            }
        )
    return rows


def write_csv(path: str, rows: list[dict[str, str]]) -> None:
    fieldnames = [
        "deal_id",
        "deal_name",
        "amount",
        "currency",
        "created_at_utc",
        "pipeline",
        "stage",
        "order_id",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    load_env()

    parser = argparse.ArgumentParser(description="Export recent HubSpot deals to CSV")
    parser.add_argument(
        "--days",
        type=int,
        default=int(os.environ.get("EXPORT_DAYS", "7")),
        help="Number of days to look back (UTC)",
    )
    parser.add_argument(
        "--output",
        default=os.environ.get("EXPORT_OUTPUT", "deals_export.csv"),
        help="Output CSV path",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print row count and first few rows as JSON instead of writing CSV",
    )
    args = parser.parse_args()

    token = get_token()
    deals = fetch_deals(token, args.days)
    rows = rows_from_deals(deals)

    if args.dry_run:
        import json

        print(json.dumps({"count": len(rows), "sample": rows[:5]}, indent=2))
        return

    if not rows:
        print("No deals found in the selected window. Writing header-only CSV.")

    write_csv(args.output, rows)
    print(f"Wrote {len(rows)} deal(s) to {os.path.abspath(args.output)}")


if __name__ == "__main__":
    main()
