import Station from "../models/Station.js";

export const getStations = async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addStation = async (req, res) => {
  try {
    const { name, location } = req.body;
    const station = new Station({ name, location });
    await station.save();
    res.status(201).json(station);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};