const mongoose = require('mongoose');

// Define schema for bus routes
const busRouteSchema = new mongoose.Schema({
    stopName: { type: String, required: true }, // Name of the bus stop
    latitude: { type: Number, required: true }, // Latitude of the stop
    longitude: { type: Number, required: true }, // Longitude of the stop
});

// Create and export the Mongoose model
module.exports = mongoose.model('BusRoute', busRouteSchema);
