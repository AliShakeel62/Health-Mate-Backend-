const Report = require("../models/reportModel");

const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    console.log("request from view report ",req.params.id)
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { getReportById };