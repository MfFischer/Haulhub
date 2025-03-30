const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

router.get('/poster/active', (req, res) => {
  res.json([{
    id: '123456789',
    title: 'Test Job',
    status: 'created',
    price: {
      amount: 35.50,
      currencySymbol: '$'
    }
  }]);
});

module.exports = router;
