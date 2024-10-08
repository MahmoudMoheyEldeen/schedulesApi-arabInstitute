require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Create an Express application
const app = express();

// Middleware to handle JSON data and enable CORS
app.use(express.json());
app.use(cors());

// MongoDB connection using environment variable for the URI
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// Define the Schedule Schema
const scheduleSchema = new mongoose.Schema({
  id: Number,
  division: String,
  level: String,
  days: [
    {
      day: String,
    },
  ],
  hours: [
    {
      hour: String,
    },
  ],
  subjects: [
    {
      subject: String,
    },
  ],
});

// Create the Schedule model from the schema
const Schedule = mongoose.model('Schedule', scheduleSchema, 'schedules');

// API Routes

// Route to handle root URL
app.get('/', (req, res) => {
  res.send('API is running');
});

// GET route to retrieve all schedules
app.get('/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET route to retrieve a specific schedule by ID
app.get('/schedules/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ id: req.params.id });
    if (!schedule)
      return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST route to add a new schedule
app.post('/schedules', async (req, res) => {
  const schedule = new Schedule({
    id: req.body.id,
    division: req.body.division,
    level: req.body.level,
    days: req.body.days,
    hours: req.body.hours,
    subjects: req.body.subjects,
  });

  try {
    const newSchedule = await schedule.save();
    res.status(201).json(newSchedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT route to update a schedule's information
app.put('/schedules/:id', async (req, res) => {
  try {
    const updatedSchedule = await Schedule.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updatedSchedule)
      return res.status(404).json({ message: 'Schedule not found' });
    res.json(updatedSchedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE route to remove a schedule by ID
app.delete('/schedules/:id', async (req, res) => {
  try {
    const deletedSchedule = await Schedule.findOneAndDelete({
      id: req.params.id,
    });
    if (!deletedSchedule)
      return res.status(404).json({ message: 'Schedule not found' });
    res.status(204).send(); // No content response
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Set the port dynamically using the environment variable or fallback to 3000
const port = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
