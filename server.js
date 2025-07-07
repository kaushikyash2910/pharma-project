const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/user'); // Make sure this model exists

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pharmacy_users', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// ------------------ ROUTES ------------------ //

// ✅ SIGNUP ROUTE with VALIDATION
// SIGNUP Route with Auto-Login
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password, confirm } = req.body;

    // Basic validation
    if (!username || !email || !password || !confirm) {
      return res.send("❌ All fields are required.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.send("❌ Invalid email format.");
    }

    if (password.length < 6) {
      return res.send("🔐 Password must be at least 6 characters.");
    }

    if (password !== confirm) {
      return res.send("❗Passwords do not match.");
    }

    // Check for existing user
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.send("⚠️ Username or Email already exists.");
    }

    // Create user and auto-login
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    // ✅ Auto-login after signup
    req.session.userId = newUser._id;

    // ✅ Redirect to home/dashboard
    res.redirect('/home.html'); // or use /dashboard if that's your protected page
  } catch (error) {
    console.error(error);
    res.send("🚨 Server error. Please try again.");
  }
});

// ✅ LOGIN ROUTE with VALIDATION
// LOGIN Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.send("❌ All fields are required.");
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.send("❌ User not found. <a href='/login.html'>Try again</a>");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.send("❌ Incorrect password. <a href='/login.html'>Try again</a>");
  }

  req.session.userId = user._id;

  // 🔁 Redirect to home page on successful login
  res.redirect('/home.html');
});


// ✅ DASHBOARD (Protected Route)
app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    return res.send("🚫 Unauthorized. <a href='/login.html'>Login</a>");
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.send("🚫 Session expired. Please login again.");
    }

    res.send(`👋 Hello, ${user.username}! <a href="/logout">Logout</a>`);
  } catch (error) {
    res.send("🚨 Error fetching dashboard.");
  }
});

// ✅ LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// ✅ Server Start
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
