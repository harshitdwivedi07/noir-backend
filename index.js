require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ──
app.use(cors({
  origin: 'https://magenta-sable-f7893d.netlify.app',
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});