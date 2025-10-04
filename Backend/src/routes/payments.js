// routes/payments.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// POST /api/payments/create-intent
// Body: { bookingId }
router.post('/create-intent', asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) { res.status(400); throw new Error('bookingId required'); }

  const booking = await Booking.findById(bookingId).populate('chargerId');
  if (!booking) { res.status(404); throw new Error('Booking not found'); }
  if (booking.status !== 'booked') { res.status(400); throw new Error('Booking already processed'); }

  const amount = Math.round((booking.priceEstimate || 0) * 100); // in cents/paise depending on currency; client must interpret
  const currency = process.env.PAYMENT_CURRENCY || 'inr';

  if (stripe) {
    // Create a PaymentIntent with amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { bookingId: booking._id.toString() },
      description: `EV charging booking ${booking._id}`
    });

    // Save payment attempt info (non-sensitive)
    booking.paymentInfo = {
      provider: 'stripe',
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      clientSecretReturned: true
    };
    await booking.save();

    return res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } else {
    // Stub flow (useful for local testing without Stripe)
    const fakeClientSecret = `stub_client_secret_${booking._id}`;
    booking.paymentInfo = { provider: 'stub', stubClientSecret: fakeClientSecret, amount, currency };
    await booking.save();
    return res.json({ clientSecret: fakeClientSecret, paymentIntentId: null });
  }
}));

// POST /api/payments/webhook
// Stripe sends raw body + signature header; we handle both real and stub webhook calls.
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  // If Stripe configured, verify signature
  if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
    const sig = req.headers['stripe-signature'];
    let event = null;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const bookingId = pi.metadata?.bookingId;
      if (!bookingId) return res.status(200).send('no bookingId in metadata');

      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).send('booking not found');

      booking.status = 'confirmed';
      booking.paymentInfo = booking.paymentInfo || {};
      booking.paymentInfo.provider = 'stripe';
      booking.paymentInfo.paymentIntentId = pi.id;
      booking.paymentInfo.raw = pi;
      await booking.save();

      // Optionally: notify driver & owner here
      return res.status(200).send('ok');
    }

    // Handle other relevant events if desired
    return res.status(200).send('event ignored');
  } else {
    // Stub: accept json body like { bookingId, status: 'paid' }
    let body = null;
    try { body = JSON.parse(req.body.toString()); } catch (e) { body = req.body; }
    const { bookingId, status } = body || {};
    if (!bookingId) return res.status(400).send('missing bookingId');
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).send('booking not found');

    if (status === 'paid' || status === 'succeeded') {
      booking.status = 'confirmed';
      booking.paymentInfo = Object.assign({}, booking.paymentInfo || {}, { provider: 'stub', raw: body });
      await booking.save();
      return res.status(200).send('ok');
    }
    return res.status(400).send('no-op');
  }
}));

module.exports = router;
