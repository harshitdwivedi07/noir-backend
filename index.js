// index.js
// This is the starting point of the backend
// Run it with: node index.js  or  npm run dev

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ──
app.use(cors());           // allows frontend to talk to backend
app.use(express.json());   // lets us read JSON from request body

// ── ROUTES ──
// All routes start with /api
app.use('/api', routes);

// ── HOME ROUTE ──
app.get('/', (req, res) => {
  res.json({
    message: '🖤 NOIR Fashion API is running!',
    routes: {
      register:    'POST   /api/register',
      login:       'POST   /api/login',
      myProfile:   'GET    /api/me',
      products:    'GET    /api/products',
      oneProduct:  'GET    /api/products/:id',
      addProduct:  'POST   /api/products',
      cart:        'GET    /api/cart',
      addToCart:   'POST   /api/cart',
      removeCart:  'DELETE /api/cart/:id',
      placeOrder:  'POST   /api/orders',
      myOrders:    'GET    /api/orders',
    },
  });
});

// ── START SERVER ──
app.listen(PORT, () => {
  console.log(`\n🖤 NOIR Backend running on http://localhost:${PORT}`);
  console.log(`📦 Visit http://localhost:${PORT} to see all routes\n`);
});
