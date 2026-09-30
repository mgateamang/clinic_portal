#!/usr/bin/env python3
import os
import json
import re
import sys
from html.parser import HTMLParser

class TagCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.element_ids = set()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)
        for attr, val in attrs:
            if attr == "id":
                self.element_ids.add(val)

def test_portal():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    html_path = os.path.join(base_dir, "index.html")
    css_path = os.path.join(base_dir, "style.css")
    js_path = os.path.join(base_dir, "app.js")
    cfg_path = os.path.join(base_dir, "config.json")

    print("[TEST] Checking clinic_portal files...")
    assert os.path.exists(html_path), "index.html must exist"
    assert os.path.exists(css_path), "style.css must exist"
    assert os.path.exists(js_path), "app.js must exist"
    assert os.path.exists(cfg_path), "config.json must exist"

    # 1. Parse and validate config.json
    print("[TEST] Validating runtime configuration file config.json...")
    with open(cfg_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    assert "api_base" in cfg, "config.json must specify 'api_base'"
    assert cfg["api_base"].startswith("http"), "api_base must be a valid HTTP URL"

    # 2. Parse and validate HTML structure
    print("[TEST] Validating HTML5 structure and required DOM IDs...")
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    parser = TagCollector()
    parser.feed(html_content)

    required_ids = [
        "doctor-select",
        "appointment-date",
        "slot-select",
        "first-name",
        "last-name",
        "phone",
        "email",
        "reason",
        "book-btn",
        "booking-alert",
        "lookup-phone",
        "lookup-btn",
        "lookup-results",
        # New Settings & Offline UI IDs
        "open-settings-btn",
        "server-offline-card",
        "offline-url",
        "retry-conn-btn",
        "config-server-btn",
        "settings-modal",
        "close-settings-btn",
        "config-api-base-input",
        "test-conn-btn",
        "save-config-btn",
        "settings-status"
    ]

    for req_id in required_ids:
        assert req_id in parser.element_ids, f"Required DOM element id '{req_id}' missing in index.html"

    # 3. Check JavaScript logic & API contract matching
    print("[TEST] Validating JavaScript API contract and runtime config logic...")
    with open(js_path, "r", encoding="utf-8") as f:
        js_content = f.read()

    assert "/doctors" in js_content, "Missing /doctors route in app.js"
    assert "/available-slots" in js_content, "Missing /available-slots route in app.js"
    assert "/appointments" in js_content, "Missing /appointments route in app.js"
    assert "config.json" in js_content, "Missing config.json dynamic fetch in app.js"
    assert "localStorage" in js_content, "Missing localStorage config persistence in app.js"
    assert "setServerOffline" in js_content, "Missing offline handling in app.js"

    # Verify JSON request fields match OpenAPI schema
    required_payload_keys = ["doctor_id", "appointment_time", "first_name", "last_name", "phone"]
    for key in required_payload_keys:
        assert key in js_content, f"Payload key '{key}' missing from appointment booking in app.js"

    # 4. Check CSS styling
    print("[TEST] Validating CSS style presence...")
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()
    assert len(css_content.strip()) > 100, "style.css appears empty or truncated"
    assert ".offline-card" in css_content, "Missing .offline-card style definition"
    assert ".modal" in css_content, "Missing .modal style definition"

    print("\n>>> ALL CLINIC_PORTAL TESTS PASSED SUCCESSFULLY! <<<\n")

if __name__ == "__main__":
    test_portal()
