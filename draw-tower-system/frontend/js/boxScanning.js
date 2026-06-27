const BOX_URL = "http://localhost:5000/api/box";
let stagedBobbinsList = [];

document.addEventListener("DOMContentLoaded", async () => {
  await refreshBoxesViewTable();
});

// Staging Array Builder Controller Interceptors
document.getElementById("addBobbinToArrayBtn").addEventListener("click", () => {
  const input = document.getElementById("tempBobbinInput");
  const value = input.value.trim();

  if (!value) return;

  if (stagedBobbinsList.length >= 4) {
    alert(
      "Validation Exception: This container box has reached its maximum structural limit of 4 bobbins.",
    );
    return;
  }

  if (stagedBobbinsList.includes(value)) {
    alert(
      "Duplicate item check failure: This specific bobbin code is already added to your temporary manifest.",
    );
    return;
  }

  stagedBobbinsList.push(value);
  input.value = "";
  renderStagedListMarkupRows();
});

function renderStagedListMarkupRows() {
  const container = document.getElementById("stagingArrayContainer");
  container.innerHTML = "";

  stagedBobbinsList.forEach((barcode, idx) => {
    const row = document.createElement("div");
    row.style =
      "display:flex; justify-content:space-between; background:#1e293b; padding:0.75rem 1rem; border-radius:4px; align-items:center; border:1px solid #334155; margin-bottom: 0.5rem;";
    row.innerHTML = `
      <div><span style="color:#94a3b8; font-size:0.8rem; margin-right:1rem;">[Bobbin Slot #${idx + 1}]</span><strong>${barcode}</strong></div>
      <button type="button" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold; font-size:0.9rem;" onclick="removeStagedBobbinItemIndex(${idx})">Remove Spool</button>
    `;
    container.appendChild(row);
  });
}

window.removeStagedBobbinItemIndex = function (index) {
  stagedBobbinsList.splice(index, 1);
  renderStagedListMarkupRows();
};

// Form Save Transaction Interceptor
document
  .getElementById("boxManifestForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    if (stagedBobbinsList.length === 0) {
      alert(
        "Validation Error: Cannot save an empty container. Add at least 1 bobbin item to create a valid box.",
      );
      return;
    }

    const payload = {
      box_barcode: document.getElementById("boxMasterBarcode").value.trim(),
      entry_date: document.getElementById("boxEntryDate").value,
      bobbin_type: document.getElementById("boxBobbinType").value,
      final_length: document.getElementById("boxFinalLength").value,
      fiber_colour: document.getElementById("boxFiberColour").value.trim(),
      bobbin_count: stagedBobbinsList.length,
      bobbins: stagedBobbinsList,
    };

    const btn = document.getElementById("submitBoxManifestBtn");
    btn.disabled = true;
    btn.innerHTML = `Saving Box Manifest... <span class="spinner"></span>`;

    try {
      const res = await fetch(`${BOX_URL}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // Cleanly report the exact error string returned by your Express backend engine
        alert(
          data.message || "An error occurred writing configuration mappings.",
        );
      } else {
        alert("Success! Box packaging layout manifest committed safely.");
        document.getElementById("boxManifestForm").reset();
        stagedBobbinsList = [];
        renderStagedListMarkupRows();
        await refreshBoxesViewTable();
      }
    } catch (err) {
      console.error("Transmission layout drop details:", err);
      alert(
        "Network sync drop encountered during transmission. Please confirm your Node backend server is running on port 5000.",
      );
    } finally {
      btn.disabled = false;
      btn.textContent = "Save Box Manifest";
    }
  });

async function refreshBoxesViewTable() {
  try {
    const res = await fetch(`${BOX_URL}/list`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    const payload = await res.json();
    const rows = payload.data || [];

    const body = document.getElementById("boxTableBody");
    body.innerHTML = "";

    if (rows.length === 0) {
      body.innerHTML =
        '<tr><td colspan="7" style="text-align:center; color:#94a3b8;">No packaged boxes active in current warehouse storage inventory.</td></tr>';
      return;
    }

    rows.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="text-align: center;"><input type="checkbox" class="box-row-selector" data-id="${item.id}"></td>
        <td><span class="inline-badge" style="font-weight:bold; color:#fff;">${item.box_barcode}</span></td>
        <td>${new Date(item.entry_date).toLocaleDateString()}</td>
        <td>${item.bobbin_type}</td>
        <td>${item.final_length} Meters</td>
        <td>${item.fiber_colour}</td>
        <td><strong style="color:#38bdf8;">${item.bobbin_count} Bobbins</strong></td>
      `;
      body.appendChild(tr);
    });

    bindBoxCheckboxes();
  } catch (err) {
    console.error("Table reload failure:", err);
  }
}

function bindBoxCheckboxes() {
  const master = document.getElementById("selectAllBoxesBox");
  const rows = document.querySelectorAll(".box-row-selector");

  master.checked = false;
  document.getElementById("deleteSelectedBoxesBtn").style.display = "none";

  master.onclick = function () {
    rows.forEach((r) => (r.checked = master.checked));
    document.getElementById("deleteSelectedBoxesBtn").style.display =
      master.checked && rows.length > 0 ? "block" : "none";
  };

  rows.forEach((r) => {
    r.onclick = function () {
      const activeCount = document.querySelectorAll(
        ".box-row-selector:checked",
      ).length;
      master.checked = activeCount === rows.length;
      document.getElementById("deleteSelectedBoxesBtn").style.display =
        activeCount > 0 ? "block" : "none";
    };
  });
}

document
  .getElementById("deleteSelectedBoxesBtn")
  .addEventListener("click", async () => {
    const ids = Array.from(
      document.querySelectorAll(".box-row-selector:checked"),
    ).map((cb) => cb.getAttribute("data-id"));
    if (
      !confirm(
        `Delete ${ids.length} selected boxes along with all their nested structural bobbins permanently from inventory profiles?`,
      )
    )
      return;

    try {
      const res = await fetch(`${BOX_URL}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ ids }),
      });

      if (res.ok) {
        await refreshBoxesViewTable();
      } else {
        alert(
          "Failed running cascading erasure runs on the cloud cluster nodes.",
        );
      }
    } catch (err) {
      alert("Connection failure interacting with application storage layers.");
    }
  });
