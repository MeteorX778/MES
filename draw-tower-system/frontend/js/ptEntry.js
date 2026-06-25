const API_URL = "http://localhost:5000/api/pt-entry";
const drawInput = document.getElementById("drawBarcodeId");
const section = document.getElementById("readOnlySection");
const msgBox = document.getElementById("msgBox");
const form = document.getElementById("ptEntryForm");

function feedback(text, isErr = true) {
  msgBox.textContent = text;
  msgBox.className = isErr ? "msg msg-error" : "msg msg-success";
  msgBox.style.display = "block";
}

drawInput.addEventListener("change", async () => {
  const code = drawInput.value.trim();
  if (!code) return;

  try {
    const res = await fetch(`${API_URL}/${encodeURIComponent(code)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    const result = await res.json();

    if (!res.ok) {
      feedback(result.message || "Failed referencing parent code maps.");
      section.style.display = "none";
    } else {
      msgBox.style.display = "none";
      document.getElementById("roPreform").textContent = result.data.preform_id;
      document.getElementById("roMachine").textContent = result.data.machine;
      document.getElementById("roOperator").textContent =
        result.data.operator_name;
      document.getElementById("roShift").textContent = result.data.shift;
      document.getElementById("roProduct").textContent =
        result.data.product_type;
      document.getElementById("roFiber").textContent = result.data.fiber_count;
      document.getElementById("roLength").textContent =
        `${result.data.produced_length} M`;
      document.getElementById("roDate").textContent = new Date(
        result.data.production_date,
      ).toLocaleDateString();
      document.getElementById("roTime").textContent =
        result.data.production_time;
      section.style.display = "block";
    }
  } catch (err) {
    feedback("Communication with backend framework timed out.");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    entry_type: document.getElementById("entryType").value,
    pt_machine_no: document.getElementById("ptMachineNo").value,
    pt_barcode: document.getElementById("ptBarcode").value.trim(),
    bobbin_type: document.getElementById("bobbinType").value,
    pt_length: document.getElementById("ptLength").value,
    draw_barcode_id: drawInput.value.trim(),
    break_reason: document.getElementById("breakReason").value.trim(),
    start_date: document.getElementById("startDate").value,
  };

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.innerHTML = `Saving PT Metrics... <span class="spinner"></span>`;

  try {
    const res = await fetch(`${API_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (!res.ok) {
      feedback(result.message || "Error logging asset entry mapping details.");
    } else {
      feedback(
        "Success! Post-Treatment processing run cleanly committed.",
        false,
      );
      form.reset();
      section.style.display = "none";
    }
  } catch (err) {
    feedback("Failed execution sync with server endpoints.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save PT Entry Record";
  }
});
