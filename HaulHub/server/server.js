const express = require('express');
const app = express();
const authRoutes = require('./api/auth');

// If using /api prefix
app.use('/api/auth', authRoutes);
// OR if not using /api prefix
// app.use('/auth', authRoutes);