const supabase = require("../config/supabase");

exports.getDynamicOptions = async (req, res) => {
  try {
    // Dynamically harvest distinct values from the main draw logs table
    const { data, error } = await supabase
      .from("production_data")
      .select("operator_name, barcode_id");

    if (error) throw error;

    const operators = [...new Set(data.map((item) => item.operator_name))];
    const barcodes = [...new Set(data.map((item) => item.barcode_id))];

    return res.status(200).json({ operators, barcodes });
  } catch (error) {
    return res.status(500).json({
      message: "Error harvesting drop down options.",
      error: error.message,
    });
  }
};

exports.createPvEntry = async (req, res) => {
  try {
    const {
      shift_incharge,
      operator_name,
      selected_colour,
      barcode_id,
      gas_batch,
      remark,
    } = req.body;

    if (
      !shift_incharge ||
      !operator_name ||
      !selected_colour ||
      !barcode_id ||
      !gas_batch
    ) {
      return res
        .status(400)
        .json({ message: "Missing required tracking values." });
    }

    const { data, error } = await supabase
      .from("pv_entries")
      .insert([
        {
          shift_incharge,
          operator_name,
          selected_colour,
          barcode_id,
          gas_batch,
          remark: remark || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return res
      .status(201)
      .json({ message: "PV configuration entry successfully recorded.", data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed logging PV element.", error: error.message });
  }
};

exports.getPvEntries = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pv_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({ data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error loading PV logs.", error: error.message });
  }
};

exports.gradeBatchEntries = async (req, res) => {
  try {
    const { ids, targetStatus } = req.body; // targetStatus should be 'PASSED' or 'FAILED'

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !targetStatus) {
      return res
        .status(400)
        .json({ message: "Missing target batch array properties." });
    }

    const { error } = await supabase
      .from("pv_entries")
      .update({ grade_status: targetStatus })
      .in("id", ids);

    if (error) throw error;
    return res
      .status(200)
      .json({ message: `${ids.length} entries marked as ${targetStatus}.` });
  } catch (error) {
    return res.status(500).json({
      message: "Batch status rewrite operation failed.",
      error: error.message,
    });
  }
};

exports.deleteBatchEntries = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "Missing target IDs for deletion." });
    }

    const { error } = await supabase.from("pv_entries").delete().in("id", ids);

    if (error) throw error;
    return res
      .status(200)
      .json({ message: "PV log records erased completely from database." });
  } catch (error) {
    return res.status(500).json({
      message: "Failed multi-row deletion run.",
      error: error.message,
    });
  }
};
