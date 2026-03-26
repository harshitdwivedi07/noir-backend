// routes.js
// All API routes in one simple file

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('./db');

const router = express.Router();

// ── HELPER: verify JWT token ──
// This checks if the user is logged in
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Please login first.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};


// ════════════════════════════
//        AUTH ROUTES
// ════════════════════════════

// REGISTER
// POST /api/register
// Body: { name, email, password }
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password.' });
    }

    // Check if email already exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Account created successfully!',
      userId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// LOGIN
// POST /api/login
// Body: { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare password with hashed version in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET MY PROFILE
// GET /api/me  (requires login)
router.get('/products', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error("DB ERROR:", err);   // 🔥 IMPORTANT
    res.status(500).json({ message: err.message });
  }
});


// ════════════════════════════
//      PRODUCT ROUTES
// ════════════════════════════

// GET ALL PRODUCTS
// GET /api/products
// Optional filters: /api/products?category=dresses&minPrice=100&maxPrice=500
router.get('/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.query;

    // Build SQL query dynamically based on filters
    let sql    = 'SELECT * FROM products WHERE 1=1';
    let params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (minPrice) {
      sql += ' AND price >= ?';
      params.push(minPrice);
    }
    if (maxPrice) {
      sql += ' AND price <= ?';
      params.push(maxPrice);
    }

    sql += ' ORDER BY created_at DESC';

    const [products] = await db.query(sql, params);
    res.json({ total: products.length, products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET SINGLE PRODUCT
// GET /api/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ADD PRODUCT (admin/demo purposes)
// POST /api/products
// Body: { name, description, price, category, image, stock }
router.post('/products', protect, async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required.' });
    }

    const [result] = await db.query(
      'INSERT INTO products (name, description, price, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, category, image, stock || 0]
    );

    res.status(201).json({
      message: 'Product added!',
      productId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// UPDATE PRODUCT
// PUT /api/products/:id
router.put('/products/:id', protect, async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    await db.query(
      'UPDATE products SET name=?, description=?, price=?, category=?, image=?, stock=? WHERE id=?',
      [name, description, price, category, image, stock, req.params.id]
    );

    res.json({ message: 'Product updated!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// DELETE PRODUCT
// DELETE /api/products/:id
router.delete('/products/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ════════════════════════════
//        CART ROUTES
// ════════════════════════════

// GET MY CART
// GET /api/cart  (requires login)
router.get('/cart', protect, async (req, res) => {
  try {
    // Join cart with products to get product details
    const [items] = await db.query(
      `SELECT 
        cart.id        AS cart_item_id,
        cart.quantity,
        products.id    AS product_id,
        products.name,
        products.price,
        products.image,
        (cart.quantity * products.price) AS subtotal
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = ?`,
      [req.user.id]
    );

    // Calculate total
    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({ items, total: total.toFixed(2) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ADD TO CART
// POST /api/cart  (requires login)
// Body: { product_id, quantity }
router.post('/cart', protect, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: 'product_id is required.' });
    }

    // Check if product exists
    const [product] = await db.query('SELECT * FROM products WHERE id = ?', [product_id]);
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check if item already in cart — if yes, update quantity
    const [existing] = await db.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, req.user.id, product_id]
      );
      return res.json({ message: 'Cart updated!' });
    }

    // Otherwise insert new cart item
    await db.query(
      'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
      [req.user.id, product_id, quantity]
    );

    res.status(201).json({ message: 'Item added to cart!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// UPDATE CART ITEM QUANTITY
// PUT /api/cart/:id  (requires login)
// Body: { quantity }
router.put('/cart/:id', protect, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1.' });
    }

    await db.query(
      'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, req.params.id, req.user.id]
    );

    res.json({ message: 'Cart updated!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// REMOVE ITEM FROM CART
// DELETE /api/cart/:id  (requires login)
router.delete('/cart/:id', protect, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Item removed from cart!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ════════════════════════════
//       ORDER ROUTES
// ════════════════════════════

// PLACE ORDER (checkout)
// POST /api/orders  (requires login)
router.post('/orders', protect, async (req, res) => {
  try {
    // Get all cart items for this user
    const [cartItems] = await db.query(
      `SELECT cart.quantity, products.id AS product_id, products.price
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = ?`,
      [req.user.id]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order
    const [order] = await db.query(
      'INSERT INTO orders (user_id, total) VALUES (?, ?)',
      [req.user.id, total]
    );

    // Insert order items
    for (const item of cartItems) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [order.insertId, item.product_id, item.quantity, item.price]
      );
    }

    // Clear cart after order
    await db.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId: order.insertId,
      total: total.toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET MY ORDERS
// GET /api/orders  (requires login)
router.get('/orders', protect, async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
