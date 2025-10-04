import mongoose from "mongoose";

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  available: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Station", stationSchema);