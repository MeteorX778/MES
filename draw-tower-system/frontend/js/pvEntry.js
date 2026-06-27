const PV_URL = "http://localhost:5000/api/pv";

document.addEventListener("DOMContentLoaded", async () => {
  await pullDynamicDropdownOptions();
  await refreshPvViewTable();
});

async function pullDynamicDropdownOptions() {
  try {
    const res = await fetch(`${PV_URL}/meta-options`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    const payload = await res.json();

    const opDrop = document.getElementById("pvOperator");
    const codeDrop = document.getElementById("pvBarcodeId");

    opDrop.innerHTML = "";
    codeDrop.innerHTML = "";

    if (payload.operators && payload.operators.length > 0) {
      payload.operators.forEach(
        (op) => (opDrop.innerHTML += `<option value="${op}">${op}</option>`),
      );
    } else {
      opDrop.innerHTML =
        '<option value="" disabled>No draw operators logged</option>';
    }

    if (payload.barcodes && payload.barcodes.length > 0) {
      payload.barcodes.forEach(
        (c) => (codeDrop.innerHTML += `<option value="${c}">${c}</option>`),
      );
    } else {
      codeDrop.innerHTML =
        '<option value="" disabled>No draw spools found</option>';
    }
  } catch (err) {
    console.error("Meta parameters collection failure.");
  }
}

async function refreshPvViewTable() {
  try {
    const res = await fetch(`${PV_URL}/list`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    const payload = await res.json();
    const rows = payload.data || [];

    const body = document.getElementById("pvTableBody");
    body.innerHTML = "";

    if (rows.length === 0) {
      body.innerHTML =
        '<tr><td colspan="9" style="text-align:center; color:#94a3b8;">No data records located inside the system database.</td></tr>';
      return;
    }

    rows.forEach((item) => {
      let statusColor = "#eab308"; // Amber for PENDING
      if (item.grade_status === "PASSED") statusColor = "#22c55e"; // Green
      if (item.grade_status === "FAILED") statusColor = "#ef4444"; // Red

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="text-align: center;"><input type="checkbox" class="pv-row-selector" data-id="${item.id}" data-gas="${item.gas_batch}"></td>
        <td><strong>${item.barcode_id}</strong></td>
        <td>${item.operator_name}</td>
        <td>Shift ${item.shift_incharge}</td>
        <td>${item.selected_colour}</td>
        <td>${item.gas_batch}</td>
        <td><span style="font-size:0.85rem; color:#94a3b8;">${item.remark || ""}</span></td>
        <td><span style="color:${statusColor}; font-weight:bold;">${item.grade_status}</span></td>
        <td>${new Date(item.created_at).toLocaleString()}</td>
      `;
      body.appendChild(tr);
    });

    bindPvCheckboxes();
  } catch (err) {
    alert("Error loading structural elements dashboard.");
  }
}

document.getElementById("pvEntryForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    shift_incharge: document.getElementById("pvShiftIncharge").value,
    operator_name: document.getElementById("pvOperator").value,
    selected_colour: document.getElementById("pvColour").value,
    barcode_id: document.getElementById("pvBarcodeId").value,
    gas_batch: document.getElementById("pvGasBatch").value,
    remark: document.getElementById("pvRemark").value.trim(),
  };

  try {
    const res = await fetch(`${PV_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      document.getElementById("pvRemark").value = "";
      await refreshPvViewTable();
    } else {
      const err = await res.json();
      alert(err.message || "Error logging PV processing parameters.");
    }
  } catch (err) {
    alert("Failed run execution sequence on endpoints.");
  }
});

function bindPvCheckboxes() {
  const master = document.getElementById("selectAllPvBox");
  const rows = document.querySelectorAll(".pv-row-selector");

  master.checked = false;
  toggleTrayVisibility(0);

  master.onclick = function () {
    rows.forEach((r) => (r.checked = master.checked));
    toggleTrayVisibility(
      document.querySelectorAll(".pv-row-selector:checked").length,
    );
  };

  rows.forEach((r) => {
    r.onclick = function () {
      master.checked =
        document.querySelectorAll(".pv-row-selector:checked").length ===
        rows.length;
      toggleTrayVisibility(
        document.querySelectorAll(".pv-row-selector:checked").length,
      );
    };
  });
}

function toggleTrayVisibility(checkedCount) {
  const displayStyle = checkedCount > 0 ? "block" : "none";
  document.getElementById("gradePassedBtn").style.display = displayStyle;
  document.getElementById("gradeFailedBtn").style.display = displayStyle;
  document.getElementById("deletePvBtn").style.display = displayStyle;
}

// Batch Grading Action Routing Paths
async function runBatchGrade(targetStatus) {
  const selectedBoxes = document.querySelectorAll(".pv-row-selector:checked");
  const ids = Array.from(selectedBoxes).map((cb) => cb.getAttribute("data-id"));

  try {
    const res = await fetch(`${PV_URL}/grade-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify({ ids, targetStatus }),
    });

    const data = await res.json();
    alert(data.message);
    await refreshPvViewTable();
  } catch (err) {
    alert("Batch update run timed out.");
  }
}

document
  .getElementById("gradePassedBtn")
  .addEventListener("click", () => runBatchGrade("PASSED"));
document
  .getElementById("gradeFailedBtn")
  .addEventListener("click", () => runBatchGrade("FAILED"));

document.getElementById("deletePvBtn").addEventListener("click", async () => {
  const ids = Array.from(
    document.querySelectorAll(".pv-row-selector:checked"),
  ).map((cb) => cb.getAttribute("data-id"));
  if (
    !confirm(
      `Permanently erase ${ids.length} entries from database records storage?`,
    )
  )
    return;

  try {
    const res = await fetch(`${PV_URL}/delete-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify({ ids }),
    });

    if (res.ok) await refreshPvViewTable();
  } catch (err) {
    alert("Cascade delete loop struck a connection timeout issue.");
  }
});
