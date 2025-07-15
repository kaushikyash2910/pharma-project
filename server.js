const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/user');

const app = express();
const PORT = 3000;

// ✅ MongoDB Connection
mongoose.connect('mongodb://localhost:27017/pharmacy_users', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
});

// ✅ Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// ✅ JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(403).send("🚫 Token missing.");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send("🚫 Invalid or expired token.");
  }
};

// ✅ HOME ROUTE
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/home.html');
});

// ✅ SIGNUP ROUTE
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password, confirm } = req.body;

    if (!username || !email || !password || !confirm) {
      return res.send("❌ All fields are required.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.send("❌ Invalid email format.");
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.send("❌ Password too weak.");
    }

    if (password !== confirm) {
      return res.send("❗Passwords do not match.");
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.send("⚠️ Username or Email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    // Automatically login (issue JWT)
    const token = jwt.sign({ id: newUser._id, username: newUser.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/home.html');
  } catch (error) {
    console.error(error);
    res.send("🚨 Server error during signup.");
  }
});

// ✅ LOGIN ROUTE (username or email)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "❌ All fields are required." });
  }

  const user = await User.findOne({
    $or: [{ username }, { email: username }]
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "❌ User not found." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ success: false, message: "❌ Incorrect password." });
  }

  const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.cookie('token', token, { httpOnly: true });

  // ✅ Important: respond with JSON for frontend fetch
  res.status(200).json({
    success: true,
    message: "✅ Login successful!",
    email: user.email
  });
});


// ✅ DASHBOARD ROUTE (Protected)
app.get('/dashboard', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.send(`👋 Hello, ${user.username}! <a href="/logout">Logout</a>`);
});

// ✅ LOGOUT
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login.html');
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
