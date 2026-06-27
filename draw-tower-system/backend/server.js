const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger middleware to see exactly what hits the server
app.use((req, res, next) => {
  console.log(`>>> Incoming Request: [${req.method}] ${req.url}`);
  next();
});

const authRoutes = require("./routes/authRoutes");
const drawRoutes = require("./routes/drawRoutes");
const ptEntryRoutes = require("./routes/ptEntryRoutes");
const ptAllocationRoutes = require("./routes/ptAllocationRoutes");
const qcRoutes = require("./routes/qcRoutes");
const pvRoutes = require("./routes/pvRoutes");
const boxRoutes = require("./routes/boxRoutes"); // Make sure this line is exactly here

app.use("/api/auth", authRoutes);
app.use("/api/draw", drawRoutes);
app.use("/api/pt-entry", ptEntryRoutes);
app.use("/api/pt-allocation", ptAllocationRoutes);
app.use("/api/qc", qcRoutes);
app.use("/api/pv", pvRoutes);
app.use("/api/box", boxRoutes); // This mounts it to http://localhost:5000/api/box

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`>>> Server actively running on network interface port: ${PORT}`);
});
