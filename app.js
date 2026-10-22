/**
 * @file app.js
 * @brief AIDANS Patient Portal - Client-Side Controller.
 *
 * Provides a responsive, dependency-free web experience for clinic patients.
 * Responsibilities:
 *  - Dynamically fetches doctor directory and real-time appointment slot availability.
 *  - Submits new patient booking requests with form validation and collision detection.
 *  - Queries patient appointment histories by contact phone number.
 *  - Handles network offline states, retry logic, and runtime API base configuration.
 */

// AIDANS Clinic Patient Portal
let API_BASE = "http://localhost:8080/api/v1";

const doctorSelect = document.getElementById("doctor-select");
const appointmentDate = document.getElementById("appointment-date");
const slotSelect = document.getElementById("slot-select");
const bookingForm = document.getElementById("booking-form");
const bookingAlert = document.getElementById("booking-alert");
const bookBtn = document.getElementById("book-btn");
const lookupPhone = document.getElementById("lookup-phone");
const lookupBtn = document.getElementById("lookup-btn");
const lookupResults = document.getElementById("lookup-results");

// Offline UI elements
const offlineCard = document.getElementById("server-offline-card");
const offlineUrlSpan = document.getElementById("offline-url");
const retryConnBtn = document.getElementById("retry-conn-btn");
const configServerBtn = document.getElementById("config-server-btn");

// Settings Modal elements
const openSettingsBtn = document.getElementById("open-settings-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const configApiBaseInput = document.getElementById("config-api-base-input");
const testConnBtn = document.getElementById("test-conn-btn");
const saveConfigBtn = document.getElementById("save-config-btn");
const settingsStatus = document.getElementById("settings-status");

// Initialize min date for datepicker (today)
const todayStr = new Date().toISOString().split("T")[0];
if (appointmentDate) {
    appointmentDate.min = todayStr;
    appointmentDate.value = todayStr;
}

// Runtime Configuration Loader
async function initConfig() {
    const saved = localStorage.getItem("aidans_portal_api_base");
    if (saved && saved.trim()) {
        API_BASE = saved.trim();
        return;
    }

    try {
        const res = await fetch("config.json");
        if (res.ok) {
            const cfg = await res.json();
            if (cfg.api_base) {
                API_BASE = cfg.api_base;
            }
        }
    } catch {
        // Fall back to default localhost
        API_BASE = "http://localhost:8080/api/v1";
    }
}

function setServerOffline(offline) {
    if (!offlineCard) return;
    if (offline) {
        if (offlineUrlSpan) offlineUrlSpan.textContent = API_BASE;
        offlineCard.classList.remove("hidden");
    } else {
        offlineCard.classList.add("hidden");
    }
}

// Load doctors list
async function loadDoctors() {
    try {
        const res = await fetch(`${API_BASE}/doctors`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const doctors = await res.json();

        setServerOffline(false);
        doctorSelect.innerHTML = '<option value="">-- Choose a doctor --</option>';
        doctors.forEach(doc => {
            const opt = document.createElement("option");
            opt.value = doc.id;
            opt.textContent = `${doc.name} (${doc.specialization})`;
            doctorSelect.appendChild(opt);
        });
        hideAlert(bookingAlert);
    } catch (err) {
        setServerOffline(true);
        showAlert(bookingAlert, `Could not load doctors from server (${err.message})`, "error");
    }
}

// Fetch available slots for chosen doctor and date
async function loadSlots() {
    const doctorId = doctorSelect.value;
    const date = appointmentDate.value;

    if (!doctorId || !date) {
        slotSelect.innerHTML = '<option value="">-- Select doctor and date first --</option>';
        slotSelect.disabled = true;
        return;
    }

    slotSelect.disabled = true;
    slotSelect.innerHTML = '<option value="">Checking available slots...</option>';

    try {
        const res = await fetch(`${API_BASE}/doctors/${doctorId}/available-slots?date=${date}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const slots = await res.json();

        setServerOffline(false);
        if (slots.length === 0) {
            slotSelect.innerHTML = '<option value="">-- No available slots on this date --</option>';
            slotSelect.disabled = true;
            return;
        }

        slotSelect.innerHTML = '<option value="">-- Select a time slot --</option>';
        slots.forEach(slot => {
            const timePart = slot.split(" ")[1].substring(0, 5);
            const opt = document.createElement("option");
            opt.value = slot;
            opt.textContent = `${timePart} Uhr`;
            slotSelect.appendChild(opt);
        });
        slotSelect.disabled = false;
    } catch (err) {
        setServerOffline(true);
        slotSelect.innerHTML = `<option value="">Error loading slots</option>`;
        showAlert(bookingAlert, `Failed to load slots: ${err.message}`, "error");
    }
}

// Submit Appointment Booking
if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideAlert(bookingAlert);

        const payload = {
            doctor_id: parseInt(doctorSelect.value, 10),
            appointment_time: slotSelect.value,
            first_name: document.getElementById("first-name").value.trim(),
            last_name: document.getElementById("last-name").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            email: document.getElementById("email").value.trim() || undefined,
            reason: document.getElementById("reason").value.trim() || undefined
        };

        if (!payload.appointment_time) {
            showAlert(bookingAlert, "Please select an available time slot.", "error");
            return;
        }

        bookBtn.disabled = true;
        bookBtn.textContent = "Confirming...";

        try {
            const res = await fetch(`${API_BASE}/appointments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            setServerOffline(false);
            showAlert(bookingAlert, `Appointment confirmed! Ref ID #${data.id} on ${data.appointment_time} with ${data.doctor_name || "Doctor"}.`, "success");
            bookingForm.reset();
            appointmentDate.value = todayStr;
            loadSlots();
        } catch (err) {
            showAlert(bookingAlert, `Booking failed: ${err.message}`, "error");
        } finally {
            bookBtn.disabled = false;
            bookBtn.textContent = "Confirm Appointment";
        }
    });
}

// Lookup Appointments by Phone
if (lookupBtn) {
    lookupBtn.addEventListener("click", async () => {
        const phone = lookupPhone.value.trim();
        if (!phone) {
            lookupResults.innerHTML = '<p class="description">Please enter a phone number.</p>';
            return;
        }

        lookupResults.innerHTML = '<p class="description">Searching...</p>';

        try {
            const res = await fetch(`${API_BASE}/appointments`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const list = await res.json();

            setServerOffline(false);
            // Filter appointments matching phone number or patient name
            const matched = list.filter(a => 
                (a.patient_phone && a.patient_phone.includes(phone)) ||
                (a.phone && a.phone.includes(phone)) ||
                !phone ||
                (a.patient_name && a.patient_name.toLowerCase().includes(phone.toLowerCase()))
            );

            if (matched.length === 0) {
                lookupResults.innerHTML = '<p class="description">No appointments found for this inquiry.</p>';
                return;
            }

            lookupResults.innerHTML = "";
            matched.forEach(appt => {
                const item = document.createElement("div");
                item.className = "appointment-item";
                item.innerHTML = `
                    <div>
                        <strong>${appt.patient_name}</strong> &bull; ${appt.doctor_name}<br>
                        <small style="color: var(--text-secondary);">${appt.appointment_time}</small>
                        ${appt.reason ? `<br><small><em>${appt.reason}</em></small>` : ""}
                    </div>
                    <div>
                        <span class="badge badge-${appt.status}">${appt.status}</span>
                    </div>
                `;
                lookupResults.appendChild(item);
            });
        } catch (err) {
            setServerOffline(true);
            lookupResults.innerHTML = `<p class="description" style="color: var(--error);">Lookup error: ${err.message}</p>`;
        }
    });
}

function showAlert(elem, msg, type) {
    if (!elem) return;
    elem.textContent = msg;
    elem.className = `alert ${type}`;
    elem.classList.remove("hidden");
}

function hideAlert(elem) {
    if (!elem) return;
    elem.textContent = "";
    elem.className = "alert hidden";
}

// Modal handling
function openSettings() {
    if (!settingsModal) return;
    configApiBaseInput.value = API_BASE;
    hideAlert(settingsStatus);
    settingsModal.classList.remove("hidden");
}

function closeSettings() {
    if (!settingsModal) return;
    settingsModal.classList.add("hidden");
}

if (openSettingsBtn) openSettingsBtn.addEventListener("click", openSettings);
if (configServerBtn) configServerBtn.addEventListener("click", openSettings);
if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeSettings);

if (retryConnBtn) {
    retryConnBtn.addEventListener("click", () => {
        loadDoctors();
    });
}

if (testConnBtn) {
    testConnBtn.addEventListener("click", async () => {
        const testUrl = configApiBaseInput.value.trim();
        if (!testUrl) {
            showAlert(settingsStatus, "Please enter a valid URL.", "error");
            return;
        }

        showAlert(settingsStatus, "Pinging server...", "warning");
        const healthUrl = (testUrl.endsWith("/health") || testUrl.endsWith("/api/v1/health"))
            ? testUrl
            : `${testUrl}/health`;

        try {
            const res = await fetch(healthUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            showAlert(settingsStatus, `Connection successful: ${data.service || "AIDANS Server"} (v${data.version || "1.0"})`, "success");
        } catch (err) {
            showAlert(settingsStatus, `Connection failed: ${err.message}`, "error");
        }
    });
}

if (saveConfigBtn) {
    saveConfigBtn.addEventListener("click", () => {
        const newUrl = configApiBaseInput.value.trim();
        if (!newUrl) {
            showAlert(settingsStatus, "URL cannot be empty.", "error");
            return;
        }

        API_BASE = newUrl;
        localStorage.setItem("aidans_portal_api_base", API_BASE);
        closeSettings();
        loadDoctors();
    });
}

// Event listeners
if (doctorSelect) doctorSelect.addEventListener("change", loadSlots);
if (appointmentDate) appointmentDate.addEventListener("change", loadSlots);

// Initial Load
document.addEventListener("DOMContentLoaded", async () => {
    await initConfig();
    loadDoctors();
});
