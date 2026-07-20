const mongoose = require('mongoose');

// Backs atomic, race-free sequence generation (e.g. daily order number
// sequences). _id is the counter's key (e.g. "order-20260720").
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', CounterSchema);
