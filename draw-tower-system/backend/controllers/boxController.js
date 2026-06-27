const supabase = require("../config/supabase");

exports.saveBoxManifest = async (req, res) => {
  try {
    const {
      box_barcode,
      entry_date,
      bobbin_type,
      final_length,
      fiber_colour,
      bobbin_count,
      bobbins,
    } = req.body;

    // Explicit validation check
    if (
      !box_barcode ||
      !entry_date ||
      !bobbin_type ||
      !final_length ||
      !fiber_colour ||
      !bobbin_count ||
      !bobbins ||
      !Array.isArray(bobbins)
    ) {
      return res.status(400).json({
        message: "Missing mandatory box structure initialization variables.",
      });
    }

    if (bobbins.length < 1 || bobbins.length > 4) {
      return res.status(400).json({
        message:
          "Validation Rejection: Containers must hold between 1 and 4 bobbins maximum.",
      });
    }

    // 1. Check for duplicate box barcode
    const { data: duplicateBox, error: boxCheckErr } = await supabase
      .from("box_scanning")
      .select("id")
      .eq("box_barcode", box_barcode)
      .maybeSingle();

    if (boxCheckErr) throw boxCheckErr;
    if (duplicateBox) {
      return res.status(400).json({
        message: `Validation Failure: Box Barcode '${box_barcode}' already exists.`,
      });
    }

    // 2. Check for duplicate bobbin barcodes
    const { data: duplicateBobbins, error: checkErr } = await supabase
      .from("box_bobbins")
      .select("bobbin_barcode")
      .in("bobbin_barcode", bobbins);

    if (checkErr) throw checkErr;
    if (duplicateBobbins && duplicateBobbins.length > 0) {
      const activeDupes = duplicateBobbins
        .map((b) => b.bobbin_barcode)
        .join(", ");
      return res.status(400).json({
        message: `Validation Rejection: Bobbins [${activeDupes}] are already assigned to existing shipping boxes.`,
      });
    }

    // 3. Write Master Box Summary Header record
    const { data: newBox, error: boxErr } = await supabase
      .from("box_scanning")
      .insert([
        {
          box_barcode,
          entry_date,
          bobbin_type,
          final_length: parseFloat(final_length),
          fiber_colour,
          bobbin_count: parseInt(bobbin_count),
        },
      ])
      .select()
      .single();

    if (boxErr) throw boxErr;

    // 4. Map and bind the temporary collection array values straight to the Box UUID primary key
    const bobbinsPayload = bobbins.map((barcode) => ({
      box_id: newBox.id,
      bobbin_barcode: String(barcode).trim(),
    }));

    const { error: bobbinsErr } = await supabase
      .from("box_bobbins")
      .insert(bobbinsPayload);
    if (bobbinsErr) throw bobbinsErr;

    return res.status(201).json({
      message:
        "Shipping container manifest successfully locked and saved down to cloud database storage structures.",
    });
  } catch (error) {
    console.error(">>> CRITICAL DATABASE RUNTIME ERROR:", error); // Logs the specific database reason in your backend console terminal
    return res.status(500).json({
      message: "System error running relational box transactions.",
      error: error.message,
    });
  }
};

exports.getBoxManifests = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("box_scanning")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({
      message: "Error loading box configurations log lists.",
      error: error.message,
    });
  }
};

exports.deleteBoxManifests = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message:
          "Missing primary identifier criteria targets to run erasure loops.",
      });
    }

    const { error } = await supabase
      .from("box_scanning")
      .delete()
      .in("id", ids);

    if (error) throw error;
    return res.status(200).json({
      message: "Selected packing containers and nested items cleared cleanly.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Cascade execution tracking fault.",
      error: error.message,
    });
  }
};
