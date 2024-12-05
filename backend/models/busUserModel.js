const mongoose = require('mongoose');

// Define the schema for a bus user
const busUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Ensures that the name field is required
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures that email is unique across all users
    },
    phone: {
        type: String,
        required: true,
    },
    route: {
        type: String,
        required: true, // Assumes users have a preferred bus route
    },
    latitude: {
        type: Number,
        required: true, // Latitude of the user
    },
    longitude: {
        type: Number,
        required: true, // Longitude of the user
    },
    currentStop: {
        type: String,
        required: false, // Optional field to store the nearest bus stop
    },
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

// Create the BusUser model
const BusUser = mongoose.model('BusUser', busUserSchema);

// Export the model so it can be used in other files
module.exports = BusUser;
