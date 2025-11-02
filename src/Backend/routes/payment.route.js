import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { protect } from '../middleware/auth.js';
import User from '../models/user.model.js';

dotenv.config();

const router = express.Router();

// Initialize Flutterwave payment
router.post('/initiate', protect, async (req, res) => {
  try {
    const { amount, currency = 'NGN', plan } = req.body;
    const user = req.user;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const payload = {
      tx_ref: `ApexoAI-${Date.now()}-${user._id}`,
      amount,
      currency,
      redirect_url: `${process.env.FRONTEND_URL}/payment/verify`,
      customer: {
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ApexoAI User'
      },
      customizations: {
        title: 'ApexoAI Subscription',
        description: plan ? `Upgrade to ${plan} plan` : 'AI Credit Purchase',
        logo: `${process.env.FRONTEND_URL}/logo.png`
      }
    };

    const response = await axios.post('https://api.flutterwave.com/v3/payments', payload, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
      }
    });

    if (response.data.status === 'success') {
      return res.json({
        success: true,
        checkoutUrl: response.data.data.link
      });
    }

    res.status(500).json({ success: false, message: 'Unable to initialize payment' });
  } catch (error) {
    console.error('Flutterwave Init Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
});

// Verify payment
router.get('/verify/:tx_ref', protect, async (req, res) => {
  try {
    const { tx_ref } = req.params;

    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
        }
      }
    );

    const data = response.data.data;

    if (data && data.status === 'successful' && data.amount > 0) {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Example: upgrade plan or add credits
      if (data.meta?.plan) {
        user.plan = data.meta.plan;
      } else {
        user.tokens.aiCredits += Math.floor(data.amount / 500); // e.g. 500 NGN = 1 credit
      }

      await user.save();

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        user
      });
    }

    res.status(400).json({ success: false, message: 'Payment not successful' });
  } catch (error) {
    console.error('Verification Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Optional webhook for automatic confirmation
router.post('/webhook', async (req, res) => {
  try {
    const secretHash = process.env.FLW_WEBHOOK_SECRET;
    const signature = req.headers['verif-hash'];

    if (!signature || signature !== secretHash) {
      return res.status(401).send('Invalid signature');
    }

    const payload = req.body;
    if (payload.status === 'successful') {
      const tx_ref = payload.tx_ref;
      const userId = tx_ref.split('-').pop(); // from ApexoAI-${Date.now()}-${user._id}
      const user = await User.findById(userId);

      if (user) {
        user.tokens.aiCredits += Math.floor(payload.amount / 500);
        await user.save();
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).send('Server Error');
  }
});

export default router;
