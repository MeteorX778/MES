const supabase = require("../config/supabase");

exports.allocateEntries = async (req, res) => {
  try {
    const { pt_machine_no, operator_name, shift } = req.body;
    if (!pt_machine_no || !operator_name || !shift) {
      return res
        .status(400)
        .json({ message: "Missing required allocation filter parameters." });
    }

    const { data: validEntries, error: fetchErr } = await supabase
      .from("pt_entries")
      .select(`id, pt_machine_no, draw_barcode_id (operator_name, shift)`)
      .eq("pt_machine_no", pt_machine_no);

    if (fetchErr) throw fetchErr;

    const targets = validEntries.filter(
      (entry) =>
        entry.draw_barcode_id &&
        entry.draw_barcode_id.operator_name === operator_name &&
        entry.draw_barcode_id.shift === shift,
    );

    if (targets.length === 0) {
      return res.status(404).json({
        message: "No matching unallocated entries found for this combination.",
      });
    }

    const { data: existingAllocations } = await supabase
      .from("pt_allocations")
      .select("pt_entry_id");
    const allocatedIds = new Set(
      existingAllocations ? existingAllocations.map((a) => a.pt_entry_id) : [],
    );

    const allocationsToInsert = targets
      .filter((t) => !allocatedIds.has(t.id))
      .map((t) => ({
        pt_entry_id: t.id,
        pt_machine_no,
        operator_name,
        shift,
      }));

    if (allocationsToInsert.length === 0) {
      return res
        .status(400)
        .json({ message: "All matching records are already allocated." });
    }

    const { error: insertErr } = await supabase
      .from("pt_allocations")
      .insert(allocationsToInsert);
    if (insertErr) throw insertErr;

    return res.status(201).json({
      message: `Successfully allocated ${allocationsToInsert.length} records.`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error committing allocation maps.",
      error: error.message,
    });
  }
};

exports.getAllocations = async (req, res) => {
  try {
    const { data, error } = await supabase.from("pt_allocations").select(`
        id,
        pt_machine_no,
        operator_name,
        shift,
        pt_entries (
          pt_barcode,
          start_date,
          production_data: draw_barcode_id (
            barcode_id,
            machine,
            produced_length,
            remarks
          )
        )
      `);

    if (error) throw error;
    return res.status(200).json({ data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error reading table records.", error: error.message });
  }
};

exports.deleteAllocations = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "No operational primary keys supplied for erasure." });
    }

    const { error } = await supabase
      .from("pt_allocations")
      .delete()
      .in("id", ids);

    if (error) throw error;
    return res
      .status(200)
      .json({ message: "Allocations deleted successfully." });
  } catch (error) {
    return res.status(500).json({
      message: "Failed cascade array operations.",
      error: error.message,
    });
  }
};
