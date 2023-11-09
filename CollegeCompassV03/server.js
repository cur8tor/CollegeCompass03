const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const { join } = require("path");
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Middleware
app.use(morgan("dev"));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

const { Schema, model } = require('mongoose');

const movieSchema = new Schema({
  Course: String,
  Title: String,
  Credits: String,
  Term: String,
});

const Movie = model('Movie', movieSchema, 'CompassV01');

// Re-add the missing User schema and model
const userSchema = new Schema({
  userId: String,
  seenMovies: [String]
});

const User = model('User', userSchema);

app.get('/api/movies', async (req, res) => {
  try {
    let movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/user/seenMovies', /*checkJwt,*/ async (req, res) => {
  console.log('GET /api/user/seenMovies hit');
  console.log('Fetching seen movies for user:', req.user.sub);
  try {
    const user = await User.findOne({ userId: req.user.sub });
    res.json(user ? user.seenMovies : []);
  } catch (error) {
    console.error('Error fetching seen movies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/user/seenMovies', checkJwt, async (req, res) => {
  console.log('GET /api/user/seenMovies hit');
  const movieId = req.body.movieId;
  try {
    let user = await User.findOne({ userId: req.user.sub });
    if (!user) {
      user = new User({ userId: req.user.sub, seenMovies: [movieId] });
    } else if (!user.seenMovies.includes(movieId)) {
      user.seenMovies.push(movieId);
    }
    await user.save();
    res.json(user.seenMovies);
  } catch (error) {
    console.error('Error updating seen movies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/user/seenMovies/:movieId', checkJwt, async (req, res) => {
  console.log('GET /api/user/seenMovies hit');
  const movieId = req.params.movieId;
  try {
    const user = await User.findOne({ userId: req.user.sub });
    if (user && user.seenMovies.includes(movieId)) {
      user.seenMovies.pull(movieId);
      await user.save();
    }
    res.json(user.seenMovies);
  } catch (error) {
    console.error('Error removing seen movie:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Moved static file serving to the end
app.use(express.static(join(__dirname, "build")));

app.listen(port, () => console.log(`Server started on http://localhost:${port}`));
