const express = require('express'); // Import express
const mongoose = require('mongoose'); // Import mongoose
const cors = require('cors'); // Import cors
const dotenv = require('dotenv'); // Import dotenv to access environment variables

dotenv.config(); // Initialize dotenv

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
    });

// Initialize express application
const app = express();

// Import routes and models
const busUserRoutes = require('./routes/busUserRoutes'); // Import routes
const busUserModel = require('./models/busUserModel'); // Import the busUserModel
const BusLocation = require('./models/busLocationModel'); // Import the BusLocation model

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware to enable CORS (adjust the origin as necessary)
app.use(cors({
    origin: 'http://192.168.200.45:3000', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Register routes
app.use('/api', busUserRoutes); // Use routes defined in busUserRoutes

// Register new bus user
app.post('/api/register-bus-user', async (req, res) => {
    try {
        const { name, email, phone, route, latitude, longitude } = req.body;
        const busUser = new busUserModel({ name, email, phone, route, latitude, longitude });
        await busUser.save();
        res.status(201).send({ message: 'User registered successfully!', busUser });
    } catch (error) {
        console.error('Error saving user data:', error);
        res.status(500).send({ error: 'Failed to register user. Please try again later.' });
    }
});
// Root route to confirm server status
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Fallback for undefined routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});


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

// Endpoint to handle bus location data sent by the ESP8266
app.post('/register-bus-location', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({ message: "Latitude and Longitude are required." });
        }
        const busLocation = new BusLocation({ latitude, longitude });
        await busLocation.save();
        res.status(201).json({ message: "Bus location saved successfully." });
    } catch (error) {
        console.error("Error saving bus location:", error);
        res.status(500).json({ message: "Failed to save bus location data." });
    }
});

// Endpoint to fetch the latest bus location from the buslocations collection
app.get('/buslocations/latest', async (req, res) => {
    try {
        const busLocation = await BusLocation.findOne().sort({ timestamp: -1 }); // Ensure you're querying the buslocations collection
        if (!busLocation) return res.status(404).json({ message: "Bus location not found" });

        res.json({
            latitude: busLocation.latitude,
            longitude: busLocation.longitude
        });
    } catch (error) {
        console.error("Error fetching bus location:", error);
        res.status(500).json({ message: "Failed to fetch bus location" });
    }
});

// Endpoint to calculate ETA based on latest user and bus locations
app.get('/calculate-eta/latest', async (req, res) => {
    try {
        const user = await busUserModel.findOne().sort({ _id: -1 });
        const bus = await BusLocation.findOne().sort({ timestamp: -1 });

        if (!user || !bus) return res.status(404).json({ message: "User or Bus location not found" });

        const distance = haversine(user.latitude, user.longitude, bus.latitude, bus.longitude);
        const averageSpeed = 22.5; // km/h
        const eta = distance / averageSpeed; // ETA in hours

        res.json({
            eta: (eta * 60).toFixed(2) + " minutes", // Convert hours to minutes
            distance: distance.toFixed(2) + " km"
        });
    } catch (error) {
        console.error("Error calculating ETA:", error);
        res.status(500).json({ message: "Failed to calculate ETA" });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log("MongoDB URI:", process.env.MONGO_URI);

});
