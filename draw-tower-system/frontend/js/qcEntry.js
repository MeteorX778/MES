const QC_URL = "http://localhost:5000/api/qc";

// Hardcoded verification target matrix parameters configuration
const TARGET_SPECS = {
  sec_coat_top: "245.0",
  sec_coat_bot: "245.0",
  sec_conc_top: "12.0",
  clad_top: "125.0",
  clad_bot: "125.0",
  clad_ovl_bot: "1.0",
  zd_wave_len: "1312.0",
  slope: "0.092",
  cd1285: "3.5",
};

let verifiedPreformId = "";
let verifiedBarcodeId = "";
let verifiedPtNumber = "";

const msgBox = document.getElementById("msgBox");

function renderAlert(msg, isErr = true) {
  msgBox.textContent = msg;
  msgBox.className = isErr ? "msg msg-error" : "msg msg-success";
  msgBox.style.display = "block";
}

// Stage 1: Pedigree Verification Action Step
document
  .getElementById("verifyBatchBtn")
  .addEventListener("click", async () => {
    const preform_id = document.getElementById("vPreformId").value.trim();
    const barcode_id = document.getElementById("vBarcodeId").value.trim();
    const pt_number = document.getElementById("vPtNumber").value.trim();

    if (!preform_id || !barcode_id || !pt_number) {
      renderAlert(
        "Please enter Preform ID, Draw Barcode ID, and PT Number to execute validation lookup.",
      );
      return;
    }

    msgBox.style.display = "none";
    const btn = document.getElementById("verifyBatchBtn");
    btn.disabled = true;
    btn.textContent = "Verifying Batch Pedigree...";

    try {
      const res = await fetch(`${QC_URL}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ preform_id, barcode_id, pt_number }),
      });

      const result = await res.json();

      if (!res.ok) {
        renderAlert(result.message || "Record not found.");
        document.getElementById("qcEntryFormContainer").style.display = "none";
      } else {
        // Unveil user inputs deck configuration panel
        verifiedPreformId = preform_id;
        verifiedBarcodeId = barcode_id;
        verifiedPtNumber = pt_number;

        document.getElementById("verificationCard").style.style = "none";
        document.getElementById("verificationCard").style.display = "none";
        document.getElementById("qcEntryFormContainer").style.display = "block";
        renderAlert(
          "Batch tracking history verified completely. Enter parameters to evaluate.",
          false,
        );
      }
    } catch (err) {
      renderAlert("Failed connectivity test with verification gateway.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Verify Batch Lineage";
    }
  });

// Stage 2: Inline Grading Evaluation Engine and Database Save Block
document
  .getElementById("qcMainEvaluationForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputs = {
      sec_coat_top: document.getElementById("qc_sec_coat_top").value.trim(),
      sec_coat_bot: document.getElementById("qc_sec_coat_bot").value.trim(),
      sec_conc_top: document.getElementById("qc_sec_conc_top").value.trim(),
      clad_top: document.getElementById("qc_clad_top").value.trim(),
      clad_bot: document.getElementById("qc_clad_bot").value.trim(),
      clad_ovl_bot: document.getElementById("qc_clad_ovl_bot").value.trim(),
      zd_wave_len: document.getElementById("qc_zd_wave_len").value.trim(),
      slope: document.getElementById("qc_slope").value.trim(),
      cd1285: document.getElementById("qc_cd1285").value.trim(),
    };

    const flawed_reasons = [];

    // Comparison logic loop assertion step (Strict equality, no tolerance allowed)
    if (inputs.sec_coat_top !== TARGET_SPECS.sec_coat_top)
      flawed_reasons.push("Sec Coat Dia Top mismatch");
    if (inputs.sec_coat_bot !== TARGET_SPECS.sec_coat_bot)
      flawed_reasons.push("Sec Coat Dia Bot mismatch");
    if (inputs.sec_conc_top !== TARGET_SPECS.sec_conc_top)
      flawed_reasons.push("Sec Conc Top mismatch");
    if (inputs.clad_top !== TARGET_SPECS.clad_top)
      flawed_reasons.push("Clad Dia Top mismatch");
    if (inputs.clad_bot !== TARGET_SPECS.clad_bot)
      flawed_reasons.push("Clad Dia Bot mismatch");
    if (inputs.clad_ovl_bot !== TARGET_SPECS.clad_ovl_bot)
      flawed_reasons.push("Clad Ovl Bot mismatch");
    if (inputs.zd_wave_len !== TARGET_SPECS.zd_wave_len)
      flawed_reasons.push("ZD Wave Len mismatch");
    if (inputs.slope !== TARGET_SPECS.slope)
      flawed_reasons.push("Slope mismatch");
    if (inputs.cd1285 !== TARGET_SPECS.cd1285)
      flawed_reasons.push("CD1285 mismatch");

    const result = flawed_reasons.length === 0 ? "PASS" : "FAIL";

    const listContainer = document.getElementById("flawsList");
    const flawsBox = document.getElementById("flawsBox");
    listContainer.innerHTML = "";

    if (result === "FAIL") {
      flawed_reasons.forEach((r) => {
        const li = document.createElement("li");
        li.textContent = r;
        listContainer.appendChild(li);
      });
      flawsBox.style.display = "block";
    } else {
      flawsBox.style.display = "none";
    }

    const gradeBtn = document.getElementById("submitGradeBtn");
    gradeBtn.disabled = true;
    gradeBtn.innerHTML = `Saving Calculated Grade Result... <span class="spinner"></span>`;

    try {
      const res = await fetch(`${QC_URL}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          preform_id: verifiedPreformId,
          barcode_id: verifiedBarcodeId,
          pt_number: verifiedPtNumber,
          entered_values: inputs,
          result,
          flawed_reasons,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        renderAlert(
          payload.message || "Failed running automated save execution loops.",
        );
      } else {
        if (result === "PASS") {
          renderAlert(
            "QC evaluation complete: PASS status achieved and saved.",
            false,
          );
        } else {
          renderAlert(
            "QC evaluation complete: FAIL status logged and tracked.",
            true,
          );
        }

        // Delay and reset back to stage 1 verification mode window state
        setTimeout(() => {
          document.getElementById("qcMainEvaluationForm").reset();
          document.getElementById("qcEntryFormContainer").style.display =
            "none";
          document.getElementById("verificationCard").style.display = "block";
          flawsBox.style.display = "none";
          msgBox.style.display = "none";
        }, 4000);
      }
    } catch (err) {
      renderAlert(
        "Network disconnect occurred transmitting tracking evaluation matrices.",
      );
    } finally {
      gradeBtn.disabled = false;
      gradeBtn.textContent = "Calculate & Commit Grade Status";
    }
  });
