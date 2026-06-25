const ALLOC_URL = "http://localhost:5000/api/pt-allocation";
let activeAllocationsList = [];

document.addEventListener("DOMContentLoaded", async () => {
  await refreshAllocationViewTable();
});

async function refreshAllocationViewTable() {
  try {
    const res = await fetch(`${ALLOC_URL}/list`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    const payload = await res.json();
    activeAllocationsList = payload.data || [];

    const body = document.getElementById("allocationTableBody");
    body.innerHTML = "";

    if (activeAllocationsList.length === 0) {
      body.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#94a3b8;">No operational process maps active in database layer.</td></tr>`;
      return;
    }

    activeAllocationsList.forEach((item) => {
      const entry = item.pt_entries;
      const rawDraw = entry ? entry.production_data : null;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="text-align: center;"><input type="checkbox" class="row-selector" data-id="${item.id}"></td>
        <td><strong>${entry ? entry.pt_barcode : "--"}</strong></td>
        <td>${rawDraw ? rawDraw.barcode_id : "--"}</td>
        <td>${item.operator_name}</td>
        <td>${rawDraw ? rawDraw.machine : "--"}</td>
        <td>${rawDraw ? rawDraw.produced_length + " M" : "--"}</td>
        <td>${entry ? new Date(entry.start_date).toLocaleDateString() : "--"}</td>
        <td>Shift ${item.shift}</td>
        <td><span style="font-size:0.85rem; color:#94a3b8;">${rawDraw && rawDraw.remarks ? rawDraw.remarks : ""}</span></td>
      `;
      body.appendChild(tr);
    });

    bindCheckboxToggleListeners();
  } catch (err) {
    alert("Error synchronizing tracking allocations table layout framework.");
  }
}

document.getElementById("allocateBtn").addEventListener("click", async () => {
  const pt_machine_no = document.getElementById("filterMachine").value;
  const operator_name = document.getElementById("filterOperator").value.trim();
  const shift = document.getElementById("filterShift").value;

  if (!pt_machine_no || !operator_name || !shift) {
    alert(
      "Validation Failure: Please configure explicit input values across all three filter parameters.",
    );
    return;
  }

  try {
    const res = await fetch(`${ALLOC_URL}/allocate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify({ pt_machine_no, operator_name, shift }),
    });
    const result = await res.json();

    alert(result.message);
    await refreshAllocationViewTable();
  } catch (err) {
    alert("Failed run execution sequence on allocations node.");
  }
});

function bindCheckboxToggleListeners() {
  const master = document.getElementById("selectAllBox");
  const rows = document.querySelectorAll(".row-selector");

  master.checked = false;
  master.onclick = function () {
    rows.forEach((r) => (r.checked = master.checked));
    toggleDeleteButtonVisibility();
  };

  rows.forEach((r) => {
    r.onclick = function () {
      const allChecked =
        document.querySelectorAll(".row-selector:checked").length ===
        rows.length;
      master.checked = allChecked;
      toggleDeleteButtonVisibility();
    };
  });
}

function toggleDeleteButtonVisibility() {
  const checkedCount = document.querySelectorAll(
    ".row-selector:checked",
  ).length;
  document.getElementById("deleteSelectedBtn").style.display =
    checkedCount > 0 ? "block" : "none";
}

document
  .getElementById("deleteSelectedBtn")
  .addEventListener("click", async () => {
    const targets = Array.from(
      document.querySelectorAll(".row-selector:checked"),
    ).map((cb) => cb.getAttribute("data-id"));
    if (targets.length === 0) return;

    if (
      !confirm(
        `Delete ${targets.length} selected rows permanently from production floor mapping histories?`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${ALLOC_URL}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ ids: targets }),
      });

      if (res.ok) {
        await refreshAllocationViewTable();
        document.getElementById("deleteSelectedBtn").style.display = "none";
      } else {
        const err = await res.json();
        alert(
          err.message || "Failed completing database array item deletions.",
        );
      }
    } catch (err) {
      alert(
        "Network layer connection lost processing cascade array operations.",
      );
    }
  });
