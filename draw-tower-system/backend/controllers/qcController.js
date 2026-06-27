const supabase = require("../config/supabase");

exports.verifyBatchRecords = async (req, res) => {
  try {
    const { preform_id, barcode_id, pt_number } = req.body;

    if (!preform_id || !barcode_id || !pt_number) {
      return res.status(400).json({
        message: "All cross-reference search parameters are required.",
      });
    }

    // Check if the draw barcode matches the preform ID
    const { data: drawData, error: drawErr } = await supabase
      .from("production_data")
      .select("barcode_id")
      .eq("barcode_id", barcode_id)
      .eq("preform_id", preform_id)
      .maybeSingle();

    if (drawErr) throw drawErr;
    if (!drawData) {
      return res
        .status(404)
        .json({ message: "Record not found. Draw data reference mismatch." });
    }

    // Verify the PT barcode links cleanly to this draw barcode reference
    const { data: ptData, error: ptErr } = await supabase
      .from("pt_entries")
      .select("id")
      .eq("pt_barcode", pt_number)
      .eq("draw_barcode_id", barcode_id)
      .maybeSingle();

    if (ptErr) throw ptErr;
    if (!ptData) {
      return res
        .status(404)
        .json({ message: "Record not found. PT barcode reference mismatch." });
    }

    return res.status(200).json({
      message: "Batch pedigree verified successfully. Proceed to evaluation.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "System error checking batch verification.",
      error: error.message,
    });
  }
};

exports.saveQcRecord = async (req, res) => {
  try {
    const {
      preform_id,
      barcode_id,
      pt_number,
      entered_values,
      result,
      flawed_reasons,
    } = req.body;

    if (
      !preform_id ||
      !barcode_id ||
      !pt_number ||
      !entered_values ||
      !result ||
      !flawed_reasons
    ) {
      return res.status(400).json({
        message: "Missing required properties to process structural save.",
      });
    }

    const { data, error } = await supabase
      .from("qc_entries")
      .insert([
        {
          preform_id,
          barcode_id,
          pt_number,
          entered_values,
          result,
          flawed_reasons,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return res
      .status(201)
      .json({ message: "QC evaluation run saved successfully.", data });
  } catch (error) {
    return res.status(500).json({
      message: "Failed writing tracking records.",
      error: error.message,
    });
  }
};
