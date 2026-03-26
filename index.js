require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());

// ── ROUTES ──
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
  console.log(`🖤 NOIR Backend running on http://localhost:${PORT}`);
});