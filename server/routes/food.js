const express = require('express');
const fetch = require('node-fetch');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function parseProduct(product) {
  const n = product.nutriments || {};
  const per100 = (key) => {
    const v = n[key + '_100g'] || n[key] || 0;
    return Math.round(v * 10) / 10;
  };
  return {
    code: product.code || product._id || '',
    name: product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands || '',
    calories: per100('energy-kcal'),
    protein: per100('proteins'),
    carbs: per100('carbohydrates'),
    fat: per100('fat'),
    fiber: per100('fiber'),
    serving_size: product.serving_size || '100g',
    image_url: product.image_front_small_url || product.image_url || null,
  };
}

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Query required' });
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=20&fields=product_name,product_name_en,brands,nutriments,serving_size,code,image_front_small_url`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SHREDDED-FitnessApp/1.0 (contact@shredded.app)' },
      timeout: 10000,
    });
    if (!response.ok) throw new Error('Open Food Facts API error');
    const data = await response.json();
    const products = (data.products || [])
      .filter(p => p.product_name && p.nutriments)
      .map(parseProduct);
    res.json({ products });
  } catch (err) {
    console.error('Food search error:', err.message);
    res.status(500).json({ error: 'Food search failed', products: [] });
  }
});

router.get('/barcode/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const url = `https://world.openfoodfacts.org/api/v0/product/${code}.json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SHREDDED-FitnessApp/1.0 (contact@shredded.app)' },
      timeout: 10000,
    });
    if (!response.ok) throw new Error('Open Food Facts API error');
    const data = await response.json();
    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product: parseProduct({ ...data.product, code }) });
  } catch (err) {
    console.error('Barcode lookup error:', err.message);
    res.status(500).json({ error: 'Barcode lookup failed' });
  }
});

module.exports = router;
