// Load base authorization routing hooks
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("adminToken")) {
    window.location.href = "login.html";
  } else {
    document.getElementById("userDisplay").textContent =
      `Admin: ${localStorage.getItem("adminEmail")}`;
  }
});

const form = document.getElementById("drawDataForm");
const msgBox = document.getElementById("msgBox");
const submitBtn = document.getElementById("submitBtn");

function displayFeedback(text, isErr = true) {
  if (!isErr) {
    const successPopup = document.getElementById("successPopup");
    const successMessage = document.getElementById("successMessage");
    successMessage.textContent = text;
    successPopup.style.display = "flex";
    setTimeout(() => {
      successPopup.style.display = "none";
    }, 3000); // Hide after 3 seconds
    return;
  }
  msgBox.textContent = text;
  msgBox.className = isErr ? "msg msg-error" : "msg msg-success";
  msgBox.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Pick up entry options from barcode fields
  const autoBarcode = document.getElementById("barcodeAuto").value.trim();
  const manualBarcode = document.getElementById("barcodeManual").value.trim();

  // Rule assertion logic enforcement
  if (!autoBarcode && !manualBarcode) {
    displayFeedback(
      "Data input conflict: You must supply a Barcode tracking ID using either the Auto box or Manual input slot.",
    );
    return;
  }
  if (autoBarcode && manualBarcode) {
    displayFeedback(
      "Data input conflict: Please use only ONE slot field choice for structural barcodes (Clear either Auto or Manual).",
    );
    return;
  }

  const finalBarcode = autoBarcode || manualBarcode;

  // Extract configuration settings
  const preform_id = document.getElementById("preformId").value.trim();
  const machine = document.getElementById("machine").value;
  const operator_name = document.getElementById("operatorName").value.trim();
  const product_type = document.getElementById("productType").value;
  const fiber_count = document.getElementById("fiberCount").value;
  const produced_length = document.getElementById("producedLength").value;
  const production_date = document.getElementById("productionDate").value;
  const production_time = document
    .getElementById("productionTime")
    .value.trim();
  const remarks = document.getElementById("remarks").value.trim();

  // Find active checked choice matching shift arrays
  const selectedShiftNode = document.querySelector(
    'input[name="shift"]:checked',
  );
  const shift = selectedShiftNode ? selectedShiftNode.value : "";

  // Show status processing loader states
  submitBtn.disabled = true;
  submitBtn.innerHTML = `Saving Metrics Data Matrix... <span class="spinner"></span>`;

  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch("http://localhost:5000/api/draw/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        barcode_id: finalBarcode,
        preform_id,
        machine,
        operator_name,
        shift,
        product_type,
        fiber_count,
        produced_length,
        production_date,
        production_time,
        remarks,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      displayFeedback(
        data.message || "Error occurred saving structural record context.",
      );
    } else {
      displayFeedback("Successfully saved", false);
      form.reset();
    }
  } catch (err) {
    displayFeedback(
      "Network timeout failure interacting with backend API routes server instance.",
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Production Data Row";
  }
});

// Setup logout binding structural listeners
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});
