require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Create an Express application
const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:4200', 'https://your-angular-app-url'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Apply CORS with specific options
app.use(cors(corsOptions));

// Middleware to handle JSON data
app.use(express.json());

// MongoDB connection using environment variable for the URI
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// Define the Schedule Schema with validation
const scheduleSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  division: { type: String, required: true },
  level: { type: String, required: true },
  term: { type: String, required: true },
  year: { type: String, required: true },
  days: [
    {
      name: { type: String, required: true }, // Day name
      subjects: [
        {
          hour: { type: String, required: true },
          content: [
            {
              subject: { type: String, required: true },
              prof: { type: String },
            },
          ],
        },
      ],
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
    res.status(200).json(schedules);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to retrieve schedules', error: err.message });
  }
});

// GET route to retrieve a specific schedule by either id or _id
app.get('/schedules/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      $or: [{ id: req.params.id }, { _id: req.params.id }],
    });
    if (!schedule)
      return res.status(404).json({ message: 'Schedule not found' });
    res.status(200).json(schedule);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to retrieve schedule', error: err.message });
  }
});

// POST route to add new schedules (handles array of schedules)
app.post('/schedules', async (req, res) => {
  const { schedules } = req.body;

  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({
      message:
        'Schedules array is required and should contain at least one schedule',
    });
  }

  try {
    for (const scheduleData of schedules) {
      const { division, level, term, year, days } = scheduleData;

      // Validate required fields for each schedule
      if (!division || !level || !term || !year || !days) {
        return res.status(400).json({
          message:
            'All fields (division, level, term, year, days) are required for each schedule',
        });
      }

      // Generate a new unique ID for the schedule
      let maxId = await Schedule.findOne().sort({ id: -1 }).select('id');
      const newId = maxId ? parseInt(maxId.id) + 1 : 1;

      // Validate and format days, subjects, and content
      const formattedDays = days.map((day) => {
        if (!day.name || !Array.isArray(day.subjects)) {
          throw new Error(
            'Each day must have a name and an array of subjects.'
          );
        }

        // Format subjects within each day
        const formattedSubjects = day.subjects.map((subject) => {
          if (!subject.hour || !Array.isArray(subject.content)) {
            throw new Error(
              'Each subject must have an hour and an array of content items.'
            );
          }

          // Format content within each subject
          const formattedContent = subject.content.map((contentItem) => {
            if (!contentItem.subject || !contentItem.prof) {
              throw new Error(
                'Each content item must have both subject and prof fields.'
              );
            }
            return {
              subject: contentItem.subject,
              prof: contentItem.prof,
            };
          });

          return {
            hour: subject.hour,
            content: formattedContent,
          };
        });

        return {
          name: day.name,
          subjects: formattedSubjects,
        };
      });

      // Create and save the schedule
      const schedule = new Schedule({
        id: newId.toString(),
        division,
        level,
        term,
        year,
        days: formattedDays,
      });

      await schedule.save();
    }

    res.status(201).json({ message: 'Schedules created successfully' });
  } catch (err) {
    res
      .status(400)
      .json({ message: 'Failed to create schedules', error: err.message });
  }
});

// PUT route to update a schedule's information by ID
app.put('/schedules/:id', async (req, res) => {
  try {
    const updatedSchedule = await Schedule.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { _id: req.params.id }] },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedSchedule)
      return res.status(404).json({ message: 'Schedule not found' });
    res.status(200).json(updatedSchedule);
  } catch (err) {
    res
      .status(400)
      .json({ message: 'Failed to update schedule', error: err.message });
  }
});

// DELETE route to remove a schedule by ID or _id
app.delete('/schedules/:id', async (req, res) => {
  try {
    const deletedSchedule = await Schedule.findOneAndDelete({
      $or: [{ id: req.params.id }, { _id: req.params.id }],
    });
    if (!deletedSchedule)
      return res.status(404).json({ message: 'Schedule not found' });
    res.status(204).send();
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to delete schedule', error: err.message });
  }
});

// Preflight OPTIONS request handling
app.options('*', cors(corsOptions));

// Set the port dynamically using the environment variable or fallback to 3000
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
