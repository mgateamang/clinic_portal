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

const doctorSelect = document.getElementById("doctor-select"); // Assign value to target variable
const appointmentDate = document.getElementById("appointment-date"); // Assign value to target variable
const slotSelect = document.getElementById("slot-select"); // Assign value to target variable
const bookingForm = document.getElementById("booking-form"); // Assign value to target variable
const bookingAlert = document.getElementById("booking-alert"); // Assign value to target variable
const bookBtn = document.getElementById("book-btn"); // Assign value to target variable
const lookupPhone = document.getElementById("lookup-phone"); // Assign value to target variable
const lookupBtn = document.getElementById("lookup-btn"); // Assign value to target variable
const lookupResults = document.getElementById("lookup-results"); // Assign value to target variable

// Offline UI elements
const offlineCard = document.getElementById("server-offline-card"); // Assign value to target variable
const offlineUrlSpan = document.getElementById("offline-url"); // Assign value to target variable
const retryConnBtn = document.getElementById("retry-conn-btn"); // Assign value to target variable
const configServerBtn = document.getElementById("config-server-btn"); // Assign value to target variable

// Settings Modal elements
const openSettingsBtn = document.getElementById("open-settings-btn"); // Assign value to target variable
const settingsModal = document.getElementById("settings-modal"); // Assign value to target variable
const closeSettingsBtn = document.getElementById("close-settings-btn"); // Assign value to target variable
const configApiBaseInput = document.getElementById("config-api-base-input"); // Assign value to target variable
const testConnBtn = document.getElementById("test-conn-btn"); // Assign value to target variable
const saveConfigBtn = document.getElementById("save-config-btn"); // Assign value to target variable
const settingsStatus = document.getElementById("settings-status"); // Assign value to target variable

// Initialize min date for datepicker (today)
const todayStr = new Date().toISOString().split("T")[0]; // Assign value to target variable
if (appointmentDate) { // Evaluate conditional expression to branch execution flow
    appointmentDate.min = todayStr; // Assign value to target variable
    appointmentDate.value = todayStr; // Assign value to target variable
} // Close active scope block

// Runtime Configuration Loader
async function initConfig() { // Execute clinical workflow step
    const saved = localStorage.getItem("aidans_portal_api_base"); // Assign value to target variable
    if (saved && saved.trim()) { // Evaluate conditional expression to branch execution flow
        API_BASE = saved.trim(); // Assign value to target variable
        return; // Exit current function execution scope
    } // Close active scope block

    try { // Begin guarded block for exception safety
        const res = await fetch("config.json"); // Assign value to target variable
        if (res.ok) { // Evaluate conditional expression to branch execution flow
            const cfg = await res.json(); // Assign value to target variable
            if (cfg.api_base) { // Evaluate conditional expression to branch execution flow
                API_BASE = cfg.api_base; // Assign value to target variable
            } // Close active scope block
        } // Close active scope block
    } catch { // Handle caught exception gracefully
        // Fall back to default localhost
        API_BASE = "http://localhost:8080/api/v1";
    } // Close active scope block
} // Close active scope block

function setServerOffline(offline) { // Execute clinical workflow step
    if (!offlineCard) return; // Evaluate conditional expression to branch execution flow
    if (offline) { // Evaluate conditional expression to branch execution flow
        if (offlineUrlSpan) offlineUrlSpan.textContent = API_BASE; // Evaluate conditional expression to branch execution flow
        offlineCard.classList.remove("hidden"); // Execute clinical workflow step
    } else { // Execute default fallback branch
        offlineCard.classList.add("hidden"); // Execute clinical workflow step
    } // Close active scope block
} // Close active scope block

// Load doctors list
async function loadDoctors() { // Execute clinical workflow step
    try { // Begin guarded block for exception safety
        const res = await fetch(`${API_BASE}/doctors`); // Assign value to target variable
        if (!res.ok) throw new Error(`HTTP ${res.status}`); // Evaluate conditional expression to branch execution flow
        const doctors = await res.json(); // Assign value to target variable

        setServerOffline(false); // Execute clinical workflow step
        doctorSelect.innerHTML = '<option value="">-- Choose a doctor --</option>'; // Assign value to target variable
        doctors.forEach(doc => { // Assign value to target variable
            const opt = document.createElement("option"); // Assign value to target variable
            opt.value = doc.id; // Assign value to target variable
            opt.textContent = `${doc.name} (${doc.specialization})`; // Assign value to target variable
            doctorSelect.appendChild(opt); // Execute clinical workflow step
        }); // Execute clinical workflow step
        hideAlert(bookingAlert); // Execute clinical workflow step
    } catch (err) { // Handle caught exception gracefully
        setServerOffline(true); // Execute clinical workflow step
        showAlert(bookingAlert, `Could not load doctors from server (${err.message})`, "error"); // Execute clinical workflow step
    } // Close active scope block
} // Close active scope block

// Fetch available slots for chosen doctor and date
async function loadSlots() { // Execute clinical workflow step
    const doctorId = doctorSelect.value; // Assign value to target variable
    const date = appointmentDate.value; // Assign value to target variable

    if (!doctorId || !date) { // Evaluate conditional expression to branch execution flow
        slotSelect.innerHTML = '<option value="">-- Select doctor and date first --</option>'; // Assign value to target variable
        slotSelect.disabled = true; // Assign value to target variable
        return; // Exit current function execution scope
    } // Close active scope block

    slotSelect.disabled = true; // Assign value to target variable
    slotSelect.innerHTML = '<option value="">Checking available slots...</option>'; // Assign value to target variable

    try { // Begin guarded block for exception safety
        const res = await fetch(`${API_BASE}/doctors/${doctorId}/available-slots?date=${date}`); // Assign value to target variable
        if (!res.ok) throw new Error(`HTTP ${res.status}`); // Evaluate conditional expression to branch execution flow
        const slots = await res.json(); // Assign value to target variable

        setServerOffline(false); // Execute clinical workflow step
        if (slots.length === 0) { // Evaluate conditional expression to branch execution flow
            slotSelect.innerHTML = '<option value="">-- No available slots on this date --</option>'; // Assign value to target variable
            slotSelect.disabled = true; // Assign value to target variable
            return; // Exit current function execution scope
        } // Close active scope block

        slotSelect.innerHTML = '<option value="">-- Select a time slot --</option>'; // Assign value to target variable
        slots.forEach(slot => { // Assign value to target variable
            const timePart = slot.split(" ")[1].substring(0, 5); // Assign value to target variable
            const opt = document.createElement("option"); // Assign value to target variable
            opt.value = slot; // Assign value to target variable
            opt.textContent = `${timePart} Uhr`; // Assign value to target variable
            slotSelect.appendChild(opt); // Execute clinical workflow step
        }); // Execute clinical workflow step
        slotSelect.disabled = false; // Assign value to target variable
    } catch (err) { // Handle caught exception gracefully
        setServerOffline(true); // Execute clinical workflow step
        slotSelect.innerHTML = `<option value="">Error loading slots</option>`; // Assign value to target variable
        showAlert(bookingAlert, `Failed to load slots: ${err.message}`, "error"); // Execute clinical workflow step
    } // Close active scope block
} // Close active scope block

// Submit Appointment Booking
if (bookingForm) { // Evaluate conditional expression to branch execution flow
    bookingForm.addEventListener("submit", async (e) => { // Assign value to target variable
        e.preventDefault(); // Execute clinical workflow step
        hideAlert(bookingAlert); // Execute clinical workflow step

        const payload = { // Assign value to target variable
            doctor_id: parseInt(doctorSelect.value, 10), // Execute clinical workflow step
            appointment_time: slotSelect.value, // Execute clinical workflow step
            first_name: document.getElementById("first-name").value.trim(), // Execute clinical workflow step
            last_name: document.getElementById("last-name").value.trim(), // Execute clinical workflow step
            phone: document.getElementById("phone").value.trim(), // Execute clinical workflow step
            email: document.getElementById("email").value.trim() || undefined, // Execute clinical workflow step
            reason: document.getElementById("reason").value.trim() || undefined // Execute clinical workflow step
        }; // Scope delimiter

        if (!payload.appointment_time) { // Evaluate conditional expression to branch execution flow
            showAlert(bookingAlert, "Please select an available time slot.", "error"); // Execute clinical workflow step
            return; // Exit current function execution scope
        } // Close active scope block

        bookBtn.disabled = true; // Assign value to target variable
        bookBtn.textContent = "Confirming..."; // Assign value to target variable

        try { // Begin guarded block for exception safety
            const res = await fetch(`${API_BASE}/appointments`, { // Assign value to target variable
                method: "POST", // Execute clinical workflow step
                headers: { "Content-Type": "application/json" }, // Execute clinical workflow step
                body: JSON.stringify(payload) // Execute clinical workflow step
            }); // Execute clinical workflow step

            const data = await res.json(); // Assign value to target variable
            if (!res.ok) { // Evaluate conditional expression to branch execution flow
                throw new Error(data.error || `HTTP ${res.status}`); // Execute clinical workflow step
            } // Close active scope block

            setServerOffline(false); // Execute clinical workflow step
            showAlert(bookingAlert, `Appointment confirmed! Ref ID #${data.id} on ${data.appointment_time} with ${data.doctor_name || "Doctor"}.`, "success"); // Execute clinical workflow step
            bookingForm.reset(); // Execute clinical workflow step
            appointmentDate.value = todayStr; // Assign value to target variable
            loadSlots(); // Execute clinical workflow step
        } catch (err) { // Handle caught exception gracefully
            showAlert(bookingAlert, `Booking failed: ${err.message}`, "error"); // Execute clinical workflow step
        } finally { // Execute clinical workflow step
            bookBtn.disabled = false; // Assign value to target variable
            bookBtn.textContent = "Confirm Appointment"; // Assign value to target variable
        } // Close active scope block
    }); // Execute clinical workflow step
} // Close active scope block

// Lookup Appointments by Phone
if (lookupBtn) { // Evaluate conditional expression to branch execution flow
    lookupBtn.addEventListener("click", async () => { // Assign value to target variable
        const phone = lookupPhone.value.trim(); // Assign value to target variable
        if (!phone) { // Evaluate conditional expression to branch execution flow
            lookupResults.innerHTML = '<p class="description">Please enter a phone number.</p>'; // Assign value to target variable
            return; // Exit current function execution scope
        } // Close active scope block

        lookupResults.innerHTML = '<p class="description">Searching...</p>'; // Assign value to target variable

        try { // Begin guarded block for exception safety
            const res = await fetch(`${API_BASE}/appointments`); // Assign value to target variable
            if (!res.ok) throw new Error(`HTTP ${res.status}`); // Evaluate conditional expression to branch execution flow
            const list = await res.json(); // Assign value to target variable

            setServerOffline(false); // Execute clinical workflow step
            // Filter appointments matching phone number or patient name
            const matched = list.filter(a =>  // Assign value to target variable
                (a.patient_phone && a.patient_phone.includes(phone)) || // Execute clinical workflow step
                (a.phone && a.phone.includes(phone)) || // Execute clinical workflow step
                !phone || // Execute clinical workflow step
                (a.patient_name && a.patient_name.toLowerCase().includes(phone.toLowerCase())) // Execute clinical workflow step
            ); // Execute clinical workflow step

            if (matched.length === 0) { // Evaluate conditional expression to branch execution flow
                lookupResults.innerHTML = '<p class="description">No appointments found for this inquiry.</p>'; // Assign value to target variable
                return; // Exit current function execution scope
            } // Close active scope block

            lookupResults.innerHTML = ""; // Assign value to target variable
            matched.forEach(appt => { // Assign value to target variable
                const item = document.createElement("div"); // Assign value to target variable
                item.className = "appointment-item"; // Assign value to target variable
                item.innerHTML = ` // Assign value to target variable
                    <div> // Execute clinical workflow step
                        <strong>${appt.patient_name}</strong> &bull; ${appt.doctor_name}<br> // Execute clinical workflow step
                        <small style="color: var(--text-secondary);">${appt.appointment_time}</small> // Assign value to target variable
                        ${appt.reason ? `<br><small><em>${appt.reason}</em></small>` : ""} // Execute clinical workflow step
                    </div> // Execute clinical workflow step
                    <div> // Execute clinical workflow step
                        <span class="badge badge-${appt.status}">${appt.status}</span> // Assign value to target variable
                    </div> // Execute clinical workflow step
                `; // Execute clinical workflow step
                lookupResults.appendChild(item); // Execute clinical workflow step
            }); // Execute clinical workflow step
        } catch (err) { // Handle caught exception gracefully
            setServerOffline(true); // Execute clinical workflow step
            lookupResults.innerHTML = `<p class="description" style="color: var(--error);">Lookup error: ${err.message}</p>`; // Assign value to target variable
        } // Close active scope block
    }); // Execute clinical workflow step
} // Close active scope block

function showAlert(elem, msg, type) { // Execute clinical workflow step
    if (!elem) return; // Evaluate conditional expression to branch execution flow
    elem.textContent = msg; // Assign value to target variable
    elem.className = `alert ${type}`; // Assign value to target variable
    elem.classList.remove("hidden"); // Execute clinical workflow step
} // Close active scope block

function hideAlert(elem) { // Execute clinical workflow step
    if (!elem) return; // Evaluate conditional expression to branch execution flow
    elem.textContent = ""; // Assign value to target variable
    elem.className = "alert hidden"; // Assign value to target variable
} // Close active scope block

// Modal handling
function openSettings() { // Execute clinical workflow step
    if (!settingsModal) return; // Evaluate conditional expression to branch execution flow
    configApiBaseInput.value = API_BASE; // Assign value to target variable
    hideAlert(settingsStatus); // Execute clinical workflow step
    settingsModal.classList.remove("hidden"); // Execute clinical workflow step
} // Close active scope block

function closeSettings() { // Execute clinical workflow step
    if (!settingsModal) return; // Evaluate conditional expression to branch execution flow
    settingsModal.classList.add("hidden"); // Execute clinical workflow step
} // Close active scope block

if (openSettingsBtn) openSettingsBtn.addEventListener("click", openSettings); // Evaluate conditional expression to branch execution flow
if (configServerBtn) configServerBtn.addEventListener("click", openSettings); // Evaluate conditional expression to branch execution flow
if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeSettings); // Evaluate conditional expression to branch execution flow

if (retryConnBtn) { // Evaluate conditional expression to branch execution flow
    retryConnBtn.addEventListener("click", () => { // Assign value to target variable
        loadDoctors(); // Execute clinical workflow step
    }); // Execute clinical workflow step
} // Close active scope block

if (testConnBtn) { // Evaluate conditional expression to branch execution flow
    testConnBtn.addEventListener("click", async () => { // Assign value to target variable
        const testUrl = configApiBaseInput.value.trim(); // Assign value to target variable
        if (!testUrl) { // Evaluate conditional expression to branch execution flow
            showAlert(settingsStatus, "Please enter a valid URL.", "error"); // Execute clinical workflow step
            return; // Exit current function execution scope
        } // Close active scope block

        showAlert(settingsStatus, "Pinging server...", "warning"); // Execute clinical workflow step
        const healthUrl = (testUrl.endsWith("/health") || testUrl.endsWith("/api/v1/health")) // Assign value to target variable
            ? testUrl // Execute clinical workflow step
            : `${testUrl}/health`; // Execute clinical workflow step

        try { // Begin guarded block for exception safety
            const res = await fetch(healthUrl); // Assign value to target variable
            if (!res.ok) throw new Error(`HTTP ${res.status}`); // Evaluate conditional expression to branch execution flow
            const data = await res.json(); // Assign value to target variable
            showAlert(settingsStatus, `Connection successful: ${data.service || "AIDANS Server"} (v${data.version || "1.0"})`, "success"); // Execute clinical workflow step
        } catch (err) { // Handle caught exception gracefully
            showAlert(settingsStatus, `Connection failed: ${err.message}`, "error"); // Execute clinical workflow step
        } // Close active scope block
    }); // Execute clinical workflow step
} // Close active scope block

if (saveConfigBtn) { // Evaluate conditional expression to branch execution flow
    saveConfigBtn.addEventListener("click", () => { // Assign value to target variable
        const newUrl = configApiBaseInput.value.trim(); // Assign value to target variable
        if (!newUrl) { // Evaluate conditional expression to branch execution flow
            showAlert(settingsStatus, "URL cannot be empty.", "error"); // Execute clinical workflow step
            return; // Exit current function execution scope
        } // Close active scope block

        API_BASE = newUrl; // Assign value to target variable
        localStorage.setItem("aidans_portal_api_base", API_BASE); // Execute clinical workflow step
        closeSettings(); // Execute clinical workflow step
        loadDoctors(); // Execute clinical workflow step
    }); // Execute clinical workflow step
} // Close active scope block

// Event listeners
if (doctorSelect) doctorSelect.addEventListener("change", loadSlots); // Evaluate conditional expression to branch execution flow
if (appointmentDate) appointmentDate.addEventListener("change", loadSlots); // Evaluate conditional expression to branch execution flow

// Initial Load
document.addEventListener("DOMContentLoaded", async () => { // Assign value to target variable
    await initConfig(); // Execute clinical workflow step
    loadDoctors(); // Execute clinical workflow step
}); // Execute clinical workflow step
