#!/usr/bin/env python3
import os # Import module dependency for runtime execution
import json # Import module dependency for runtime execution
import re # Import module dependency for runtime execution
import sys # Import module dependency for runtime execution
from html.parser import HTMLParser # Import specific symbols into local namespace

class TagCollector(HTMLParser): # Execute clinical workflow step
    def __init__(self): # Execute clinical workflow step
        super().__init__() # Execute clinical workflow step
        self.element_ids = set() # Assign value to target variable
        self.tags = [] # Assign value to target variable

    def handle_starttag(self, tag, attrs): # Execute clinical workflow step
        self.tags.append(tag) # Execute clinical workflow step
        for attr, val in attrs: # Iterate through items in sequence or collection
            if attr == "id": # Assign value to target variable
                self.element_ids.add(val) # Execute clinical workflow step

def test_portal(): # Execute clinical workflow step
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Assign value to target variable
    html_path = os.path.join(base_dir, "index.html") # Assign value to target variable
    css_path = os.path.join(base_dir, "style.css") # Assign value to target variable
    js_path = os.path.join(base_dir, "app.js") # Assign value to target variable
    cfg_path = os.path.join(base_dir, "config.json") # Assign value to target variable

    print("[TEST] Checking clinic_portal files...") # Output diagnostic status to console stream
    assert os.path.exists(html_path), "index.html must exist" # Execute clinical workflow step
    assert os.path.exists(css_path), "style.css must exist" # Execute clinical workflow step
    assert os.path.exists(js_path), "app.js must exist" # Execute clinical workflow step
    assert os.path.exists(cfg_path), "config.json must exist" # Execute clinical workflow step

    # 1. Parse and validate config.json
    print("[TEST] Validating runtime configuration file config.json...") # Output diagnostic status to console stream
    with open(cfg_path, "r", encoding="utf-8") as f: # Assign value to target variable
        cfg = json.load(f) # Assign value to target variable
    assert "api_base" in cfg, "config.json must specify 'api_base'" # Execute clinical workflow step
    assert cfg["api_base"].startswith("http"), "api_base must be a valid HTTP URL" # Execute clinical workflow step

    # 2. Parse and validate HTML structure
    print("[TEST] Validating HTML5 structure and required DOM IDs...") # Output diagnostic status to console stream
    with open(html_path, "r", encoding="utf-8") as f: # Assign value to target variable
        html_content = f.read() # Assign value to target variable

    parser = TagCollector() # Assign value to target variable
    parser.feed(html_content) # Execute clinical workflow step

    required_ids = [ # Assign value to target variable
        "doctor-select", # Execute clinical workflow step
        "appointment-date", # Execute clinical workflow step
        "slot-select", # Execute clinical workflow step
        "first-name", # Execute clinical workflow step
        "last-name", # Execute clinical workflow step
        "phone", # Execute clinical workflow step
        "email", # Execute clinical workflow step
        "reason", # Execute clinical workflow step
        "book-btn", # Execute clinical workflow step
        "booking-alert", # Execute clinical workflow step
        "lookup-phone", # Execute clinical workflow step
        "lookup-btn", # Execute clinical workflow step
        "lookup-results", # Execute clinical workflow step
        # New Settings & Offline UI IDs
        "open-settings-btn", # Execute clinical workflow step
        "server-offline-card", # Execute clinical workflow step
        "offline-url", # Execute clinical workflow step
        "retry-conn-btn", # Execute clinical workflow step
        "config-server-btn", # Execute clinical workflow step
        "settings-modal", # Execute clinical workflow step
        "close-settings-btn", # Execute clinical workflow step
        "config-api-base-input", # Execute clinical workflow step
        "test-conn-btn", # Execute clinical workflow step
        "save-config-btn", # Execute clinical workflow step
        "settings-status" # Execute clinical workflow step
    ] # Execute clinical workflow step

    for req_id in required_ids: # Iterate through items in sequence or collection
        assert req_id in parser.element_ids, f"Required DOM element id '{req_id}' missing in index.html" # Execute clinical workflow step

    # 3. Check JavaScript logic & API contract matching
    print("[TEST] Validating JavaScript API contract and runtime config logic...") # Output diagnostic status to console stream
    with open(js_path, "r", encoding="utf-8") as f: # Assign value to target variable
        js_content = f.read() # Assign value to target variable

    assert "/doctors" in js_content, "Missing /doctors route in app.js" # Execute clinical workflow step
    assert "/available-slots" in js_content, "Missing /available-slots route in app.js" # Execute clinical workflow step
    assert "/appointments" in js_content, "Missing /appointments route in app.js" # Execute clinical workflow step
    assert "config.json" in js_content, "Missing config.json dynamic fetch in app.js" # Execute clinical workflow step
    assert "localStorage" in js_content, "Missing localStorage config persistence in app.js" # Execute clinical workflow step
    assert "setServerOffline" in js_content, "Missing offline handling in app.js" # Execute clinical workflow step

    # Verify JSON request fields match OpenAPI schema
    required_payload_keys = ["doctor_id", "appointment_time", "first_name", "last_name", "phone"] # Assign value to target variable
    for key in required_payload_keys: # Iterate through items in sequence or collection
        assert key in js_content, f"Payload key '{key}' missing from appointment booking in app.js" # Execute clinical workflow step

    # 4. Check CSS styling
    print("[TEST] Validating CSS style presence...") # Output diagnostic status to console stream
    with open(css_path, "r", encoding="utf-8") as f: # Assign value to target variable
        css_content = f.read() # Assign value to target variable
    assert len(css_content.strip()) > 100, "style.css appears empty or truncated" # Execute clinical workflow step
    assert ".offline-card" in css_content, "Missing .offline-card style definition" # Execute clinical workflow step
    assert ".modal" in css_content, "Missing .modal style definition" # Execute clinical workflow step

    print("\n>>> ALL CLINIC_PORTAL TESTS PASSED SUCCESSFULLY! <<<\n") # Output diagnostic status to console stream

if __name__ == "__main__": # Assign value to target variable
    test_portal() # Execute clinical workflow step
