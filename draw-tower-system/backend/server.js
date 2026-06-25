const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const drawRoutes = require("./routes/drawRoutes");
const ptEntryRoutes = require("./routes/ptEntryRoutes");
const ptAllocationRoutes = require("./routes/ptAllocationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/draw", drawRoutes);
app.use("/api/pt-entry", ptEntryRoutes);
app.use("/api/pt-allocation", ptAllocationRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`>>> Server actively running on network interface port: ${PORT}`);
});
