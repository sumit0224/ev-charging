// routes/bookings.js (excerpt for POST /)
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Charger = require('../models/Charger');
const Station = require('../models/Station');
const { protect, authorizeRoles } = require('../middleware/auth');

async function hasOverlap(chargerId, startTime, endTime) {
  const conflict = await Booking.findOne({
    chargerId,
    status: { $in: ['booked','confirmed','started'] },
    $not: { $or: [ { endTime: { $lte: startTime } }, { startTime: { $gte: endTime } } ] }
  });
  return !!conflict;
}

router.post('/', protect, authorizeRoles('driver'), asyncHandler(async (req, res) => {
  const { chargerId, startTime, endTime } = req.body;
  if (!chargerId || !startTime || !endTime) { res.status(400); throw new Error('Missing fields'); }
  const charger = await Charger.findById(chargerId);
  if (!charger) { res.status(404); throw new Error('Charger not found'); }
  if (new Date(startTime) >= new Date(endTime)) { res.status(400); throw new Error('Invalid time window'); }

  const overlap = await hasOverlap(chargerId, new Date(startTime), new Date(endTime));
  if (overlap) { res.status(409); throw new Error('Time slot conflict'); }

  const station = await Station.findById(charger.stationId);
  const durationHours = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
  const estimatedKwh = (charger.powerKw * durationHours);
  const priceEstimate = Math.round(estimatedKwh * charger.pricePerKwh * 100) / 100;

  const booking = new Booking({
    driverId: req.user._id,
    stationId: station._id,
    chargerId: charger._id,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    estimatedKwh,
    priceEstimate,
    status: 'booked'
  });
  await booking.save();

  // Return booking and instruction to create a payment intent
  res.status(201).json({
    booking,
    paymentNext: {
      provider: (process.env.STRIPE_SECRET_KEY ? 'stripe' : 'stub'),
      action: 'create_payment_intent',
      endpoint: '/api/payments/create-intent',
      amount: priceEstimate
    }
  });
}));

module.exports = router;
