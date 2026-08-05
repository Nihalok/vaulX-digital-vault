const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Subscriber = require('./models/Subscriber');
const contactRoutes = require('./routes/contactRoutes');
dotenv.config();

connectDB();
const app = express();

app.use(cors());
app.use(express.json()); 

// Root health check (prevents 404 when visiting backend URL directly)
app.get('/', (req, res) => res.json({ status: 'VaultX API is online ✅' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));    
app.use('/api/contact', contactRoutes);

app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(409).json({ success: false, message: 'This email is already subscribed.' });
    }
    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    res.status(201).json({ success: true, message: 'Successfully subscribed to updates!' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// Local development: start the server normally
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Vault Server operational on port ${PORT}`));
}

// Vercel: export the app as a serverless function
module.exports = app;
