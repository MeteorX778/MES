const supabase = require("../config/supabase");

exports.getDrawDetails = async (req, res) => {
  try {
    const { drawBarcode } = req.params;
    const { data, error } = await supabase
      .from("production_data")
      .select("*")
      .eq("barcode_id", drawBarcode)
      .maybeSingle();

    if (error) throw error;
    if (!data)
      return res
        .status(404)
        .json({ message: "Draw Barcode ID does not exist." });

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching draw variables.",
      error: error.message,
    });
  }
};

exports.createEntry = async (req, res) => {
  try {
    const {
      pt_barcode,
      entry_type,
      pt_machine_no,
      draw_barcode_id,
      bobbin_type,
      pt_length,
      break_reason,
      start_date,
    } = req.body;

    if (
      !pt_barcode ||
      !entry_type ||
      !pt_machine_no ||
      !draw_barcode_id ||
      !bobbin_type ||
      !pt_length ||
      !start_date
    ) {
      return res.status(400).json({ message: "Missing mandatory fields." });
    }

    // Uniqueness constraint assertion safety layer
    const { data: duplicateCheck } = await supabase
      .from("pt_entries")
      .select("id")
      .eq("pt_barcode", pt_barcode)
      .maybeSingle();

    if (duplicateCheck) {
      return res
        .status(400)
        .json({ message: `PT Barcode '${pt_barcode}' already exists.` });
    }

    const { data, error } = await supabase
      .from("pt_entries")
      .insert([
        {
          pt_barcode,
          entry_type,
          pt_machine_no,
          draw_barcode_id,
          bobbin_type,
          pt_length: parseFloat(pt_length),
          break_reason: break_reason || null,
          start_date,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return res
      .status(201)
      .json({ message: "PT Entry successfully logged.", data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error logging PT Entry.", error: error.message });
  }
};
