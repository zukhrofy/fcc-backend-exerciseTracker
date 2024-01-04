const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

const port = process.env.PORT || 3000;
const Schema = mongoose.Schema;

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const userSchema = new Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;
    const newUser = await User.create({ username });
    res.json(newUser);
  } catch (err) {
    res.json({ error: "Failed to create user" });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const { _id: userId } = req.params;

    const user = await User.findById(userId);
    if (user) {
      const exercise = await Exercise.create({
        user: userId,
        description,
        duration,
        date,
      });

      return res.json({
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
        _id: user._id,
      });
    }

    res.json({ error: "User not found" });
  } catch (error) {
    res.json({ error: "can't add new exercise" });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id);
    let exercises = [];
    if (user) {
      exercises = await Exercise.find({ user: _id }).select(["-_id", "-user"]);
      exercises = exercises.map((exercise) => {
        return {
          ...exercise._doc,
          date: exercise.date.toDateString(),
        };
      });

      if (from) {
        exercises = exercises.filter((exercise) => {
          return new Date(exercise.date) >= new Date(from);
        });
      }
      if (to) {
        exercises = exercises.filter((exercise) => {
          return new Date(exercise.date) <= new Date(to);
        });
      }
      if (limit) {
        exercises = exercises.slice(0, limit);
      }
    }

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises,
    });
  } catch (err) {
    console.log(err);
  }
});

mongoose
  .connect(
    "mongodb+srv://abbarzukhrofy:mamasasa@zukhrofy.xvvdwqj.mongodb.net/Exercise-tracker",
  )
  .then(() => {
    // listen for requests
    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  });
