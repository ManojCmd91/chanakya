const busUserModel = require('../models/busUserModel');
const BusRoute = require('../models/busRouteModel'); // Import BusRoute model

// Controller for registering a bus user and checking their current bus stop
const registerBusUser = async (req, res) => {
    try {
        const { name, email, phone, route, latitude, longitude } = req.body;

        // Ensure required fields are provided
        if (!name || !email || !phone || !route || !latitude || !longitude) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if the route exists in the bus routes
        const busRoute = await BusRoute.findOne({ route }); // Fetch the bus route by name
        if (!busRoute) {
            return res.status(404).json({ message: "Route not found in the system." });
        }

        // Find the closest bus stop to the user
        const closestStop = busRoute.stops.reduce((closest, stop) => {
            const distance = haversine(latitude, longitude, stop.latitude, stop.longitude);
            return !closest || distance < closest.distance
                ? { stop: stop.name, distance }
                : closest;
        }, null);

        // If no nearby stop exists or no match, return an error
        if (!closestStop || closestStop.distance > 1) { // Threshold: 1 km
            return res.status(400).json({ message: "No buses available nearby." });
        }

        // Register the user with the identified closest stop
        const busUser = new busUserModel({
            name,
            email,
            phone,
            route,
            latitude,
            longitude,
            currentStop: closestStop.stop // Save the closest bus stop name
        });
        await busUser.save();

        res.status(201).json({
            message: "User registered successfully!",
            user: busUser,
            closestStop: closestStop.stop,
            distanceToStop: `${closestStop.distance.toFixed(2)} km`
        });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Failed to register user. Please try again later." });
    }
};

// Haversine formula to calculate distance between two GPS points
function haversine(lat1, lon1, lat2, lon2) {
    const toRad = (angle) => (Math.PI / 180) * angle;
    const R = 6371; // Earth radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

module.exports = { registerBusUser };
