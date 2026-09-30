// AIDANS Clinic Patient Portal
const API_BASE = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
    ? `${window.location.origin}/api/v1`
    : "http://localhost:8080/api/v1";

const doctorSelect = document.getElementById("doctor-select");
const appointmentDate = document.getElementById("appointment-date");
const slotSelect = document.getElementById("slot-select");
const bookingForm = document.getElementById("booking-form");
const bookingAlert = document.getElementById("booking-alert");
const bookBtn = document.getElementById("book-btn");
const lookupPhone = document.getElementById("lookup-phone");
const lookupBtn = document.getElementById("lookup-btn");
const lookupResults = document.getElementById("lookup-results");

// Initialize min date for datepicker (today)
const todayStr = new Date().toISOString().split("T")[0];
appointmentDate.min = todayStr;
appointmentDate.value = todayStr;

// Load doctors list
async function loadDoctors() {
    try {
        const res = await fetch(`${API_BASE}/doctors`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const doctors = await res.json();

        doctorSelect.innerHTML = '<option value="">-- Choose a doctor --</option>';
        doctors.forEach(doc => {
            const opt = document.createElement("option");
            opt.value = doc.id;
            opt.textContent = `${doc.name} (${doc.specialization})`;
            doctorSelect.appendChild(opt);
        });
    } catch (err) {
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
        slotSelect.innerHTML = `<option value="">Error loading slots</option>`;
        showAlert(bookingAlert, `Failed to load slots: ${err.message}`, "error");
    }
}

// Submit Appointment Booking
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

// Lookup Appointments by Phone
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
        lookupResults.innerHTML = `<p class="description" style="color: var(--error);">Lookup error: ${err.message}</p>`;
    }
});

function showAlert(elem, msg, type) {
    elem.textContent = msg;
    elem.className = `alert ${type}`;
    elem.classList.remove("hidden");
}

function hideAlert(elem) {
    elem.textContent = "";
    elem.className = "alert hidden";
}

// Event listeners
doctorSelect.addEventListener("change", loadSlots);
appointmentDate.addEventListener("change", loadSlots);

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
    loadDoctors();
});
