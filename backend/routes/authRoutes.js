const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController'); 

// 1. Import your auth middleware (you called it 'auth')
const auth = require('../middleware/authMiddleware');
const User = require('../models/User'); 

// --- IDENTITY PROTOCOLS ---
router.post('/register', register); 
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/change-password', auth, changePassword);
router.get('/health', (req, res) => res.send("Vault Node Online"));

// --- FORGOT PASSWORD PROTOCOLS ---

// 1. Verify if the email exists in the database
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Identity not found in vault records.' });
    }
    
    res.status(200).json({ success: true, message: 'Identity verified. Proceed to reset.' });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
});

// 2. Actually reset the password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // Find the user (Include the password field if your model hides it by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Update the password. (Mongoose will automatically hash this if you have a pre-save hook in User.js)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Cryptographic key reset successfully.' });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
});

router.put('/upgrade-plan', auth, async (req, res) => {
  try {
    const { plan } = req.body; 
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.tier = plan; 

    // Increase Storage Limit based on plan
    if (plan === 'Professional') {
      user.storageLimit = 51200; // 50,000 MB
    } else if (plan === 'Enterprise') {
      user.storageLimit = 'Unlimited';
    }

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: `Successfully upgraded to ${plan} plan!` 
    });

  } catch (error) {
    console.error("Upgrade Error:", error);
    res.status(500).json({ success: false, message: 'Server error during upgrade' });
  }
});

module.exports = router;