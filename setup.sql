-- setup.sql
-- Run this file to create all tables and fill with dummy data
-- In terminal: mysql -u root -p noir_fashion < setup.sql

USE noir_fashion;

-- ── USERS TABLE ──
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── PRODUCTS TABLE ──
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  price       DECIMAL(10, 2) NOT NULL,
  category    VARCHAR(100),
  image       VARCHAR(500),
  stock       INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── CART TABLE ──
CREATE TABLE IF NOT EXISTS cart (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── ORDERS TABLE ──
CREATE TABLE IF NOT EXISTS orders (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  total      DECIMAL(10, 2) NOT NULL,
  status     ENUM('pending', 'paid', 'shipped', 'delivered') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── ORDER ITEMS TABLE ──
CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL,
  price      DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── DUMMY PRODUCTS ──
INSERT INTO products (name, description, price, category, image, stock) VALUES
('Obsidian Silk Slip Dress',  'A minimalist slip dress crafted from pure silk.',          485.00, 'dresses',   'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800', 20),
('Raw Linen Overcoat',        'Structured yet relaxed, crafted from heavyweight linen.',  720.00, 'outerwear', 'https://images.unsplash.com/photo-1594938298603-c8148c4b4f20?w=800', 10),
('Wide Leg Wool Trousers',    'Tailored from a soft wool blend, wide-leg silhouette.',    310.00, 'bottoms',   'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800', 30),
('Draped Silk Blouse',        'Effortlessly draped blouse in fluid silk crepe.',          265.00, 'tops',      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800', 25),
('Structured Blazer',         'Sharp shoulders, clean lapels, oversized silhouette.',     580.00, 'outerwear', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800', 15);

SELECT 'Tables created and products inserted successfully!' AS message;
