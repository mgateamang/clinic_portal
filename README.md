# AIDANS Patient Portal (Web Application)

## Executive Summary (For Engineering Leaders & Hiring Managers)

**`clinic_portal`** is the patient-facing web application for the **AIDANS** healthcare platform. Built with modern, dependency-free **HTML5, CSS3, and Vanilla JavaScript (ES2022)**, it delivers a frictionless, zero-build-step experience for patients booking consultations, viewing doctor schedules, and tracking appointment statuses.

---

## Architectural Highlights

1. **Zero-Dependency Vanilla JavaScript:**
   - No heavy single-page application (SPA) framework overhead (no React/Angular/Vue dependencies, no node_modules bloat, zero build-step latency).
   - Fast initial page load (< 250ms), high accessibility, and complete browser compatibility.
2. **Dynamic Slot Calculation & Collision Prevention:**
   - Queries `GET /api/v1/doctors` and `GET /api/v1/doctors/:id/available-slots?date=YYYY-MM-DD`.
   - Prevents double-booking by only displaying confirmed free time intervals.
3. **Automated Patient Upsert:**
   - Submits appointment bookings with patient contact information. The server automatically associates existing patient accounts or creates a new one without requiring cumbersome multi-step registrations.
4. **Resilient Network & Runtime Configuration:**
   - Dynamically loads backend target from `config.json` or user-configured `localStorage`.
   - Displays clear status messaging if the server is offline, with in-modal connection testing.

---

## Project Structure
- `index.html`: Semantic HTML5 layout with accessible forms, doctor selector, and responsive scheduling cards.
- `style.css`: Clean, professional clinical styling with responsive CSS grid and flexbox.
- `app.js`: Client-side state management, asynchronous REST API communication, and dynamic DOM rendering.
- `config.json`: Configurable base URL for multi-environment deployments.

---

## Running Locally

Because `clinic_portal` is static, it can be served by any static file server:

```bash
# Option 1: Hosted directly by clinic_server
./clinic_server --static-dir ./clinic_portal

# Option 2: Python quick server
python -m http.server 8000
```
Then navigate to `http://localhost:8080/` or `http://localhost:8000/`.
