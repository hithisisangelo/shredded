import React, { useState, useEffect, useRef } from 'react';
import { C, fonts, input, btn, btnPrimary, label } from '../styles.js';
import { food } from '../api.js';
import Modal from './shared/Modal.jsx';

const MEALS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

function FoodResultItem({ product, onSelect }) {
  return (
    <button
      onClick={() => onSelect(product)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
        padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`,
        backgroundColor: C.surface, cursor: 'pointer', fontFamily: fonts.body, marginBottom: '6px',
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
      ) : (
        <div style={{ width: '40px', height: '40px', backgroundColor: C.card, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🍽️</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
        {product.brand && <div style={{ fontSize: '11px', color: C.muted }}>{product.brand}</div>}
        <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
          <span style={{ fontSize: '11px', color: C.text, fontWeight: '600' }}>{Math.round(product.calories)} kcal</span>
          <span style={{ fontSize: '11px', color: C.accent }}>P: {Math.round(product.protein)}g</span>
          <span style={{ fontSize: '11px', color: C.info }}>C: {Math.round(product.carbs)}g</span>
          <span style={{ fontSize: '11px', color: C.accent2 }}>F: {Math.round(product.fat)}g</span>
          <span style={{ fontSize: '10px', color: C.muted }}>per 100g</span>
        </div>
      </div>
    </button>
  );
}

function AddFoodForm({ product, meal, onAdd, onBack }) {
  const [quantity, setQuantity] = useState(1);
  const [servingGrams, setServingGrams] = useState(100);
  const [selectedMeal, setSelectedMeal] = useState(meal);

  const factor = (servingGrams / 100) * quantity;
  const preview = {
    calories: Math.round(product.calories * factor),
    protein: Math.round(product.protein * factor * 10) / 10,
    carbs: Math.round(product.carbs * factor * 10) / 10,
    fat: Math.round(product.fat * factor * 10) / 10,
  };

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '12px', marginBottom: '16px', fontFamily: fonts.body }}>
        ← Back to results
      </button>
      <div style={{ padding: '14px', backgroundColor: C.surface, borderRadius: '10px', marginBottom: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>{product.name}</div>
        {product.brand && <div style={{ fontSize: '12px', color: C.muted }}>{product.brand}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ ...label }}>Serving Size (grams)</label>
          <input type="number" min="1" value={servingGrams} onChange={e => setServingGrams(parseFloat(e.target.value) || 100)} style={{ ...input }} />
        </div>
        <div>
          <label style={{ ...label }}>Quantity (servings)</label>
          <input type="number" min="0.25" step="0.25" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 1)} style={{ ...input }} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ ...label }}>Meal</label>
          <select value={selectedMeal} onChange={e => setSelectedMeal(e.target.value)} style={{ ...input }}>
            {MEALS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ padding: '14px', backgroundColor: `${C.accent}10`, border: `1px solid ${C.accent}30`, borderRadius: '10px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Nutritional preview ({servingGrams}g × {quantity})</div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: C.text }}>{preview.calories}</div>
            <div style={{ fontSize: '10px', color: C.muted }}>kcal</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: C.accent }}>{preview.protein}g</div>
            <div style={{ fontSize: '10px', color: C.muted }}>protein</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: C.info }}>{preview.carbs}g</div>
            <div style={{ fontSize: '10px', color: C.muted }}>carbs</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: C.accent2 }}>{preview.fat}g</div>
            <div style={{ fontSize: '10px', color: C.muted }}>fat</div>
          </div>
        </div>
      </div>

      <button onClick={() => onAdd(product, selectedMeal, quantity, servingGrams)} style={{ ...btnPrimary, width: '100%', padding: '12px' }}>
        + Add to {MEALS.find(m => m.id === selectedMeal)?.label}
      </button>
    </div>
  );
}

function BarcodeScanner({ onResult }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const startScan = async () => {
    setScanning(true);
    setError('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrCodeRef.current = new Html5Qrcode('barcode-reader');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          stopScan();
          onResult(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setError('Camera access denied or not available: ' + err.message);
      setScanning(false);
    }
  };

  const stopScan = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); } catch {}
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => { return () => { stopScan(); }; }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div id="barcode-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }} />
      {!scanning ? (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
          <p style={{ color: C.muted, fontSize: '13px', marginBottom: '16px' }}>Point your camera at a barcode to scan it</p>
          <button onClick={startScan} style={{ ...btnPrimary, padding: '10px 28px' }}>Start Camera</button>
        </div>
      ) : (
        <div style={{ marginTop: '12px' }}>
          <p style={{ color: C.muted, fontSize: '13px', marginBottom: '12px' }}>Scanning for barcode...</p>
          <button onClick={stopScan} style={{ ...btn, backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>Stop</button>
        </div>
      )}
      {error && <p style={{ color: C.danger, fontSize: '12px', marginTop: '12px' }}>{error}</p>}
    </div>
  );
}

export default function FoodSearch({ meal, date, onAdd, onClose }) {
  const [activeTab, setActiveTab] = useState('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selected, setSelected] = useState(null);
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState('');
  const [adding, setAdding] = useState(false);

  // Custom food form
  const [custom, setCustom] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', serving_size: '100' });

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setResults([]);
    try {
      const data = await food.search(query);
      setResults(data.products || []);
      if (data.products?.length === 0) setSearchError('No products found. Try a different search term.');
    } catch (err) {
      setSearchError('Search failed: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleBarcodeResult = async (code) => {
    setBarcodeLoading(true);
    setBarcodeError('');
    try {
      const data = await food.barcode(code);
      setBarcodeResult(data.product);
      setSelected(data.product);
    } catch (err) {
      setBarcodeError('Product not found for barcode: ' + code);
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleAdd = async (product, selectedMeal, quantity, servingGrams) => {
    setAdding(true);
    try {
      await onAdd(product, selectedMeal, quantity, servingGrams);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleCustomAdd = async () => {
    if (!custom.name) return;
    const product = {
      name: custom.name,
      calories: parseFloat(custom.calories) || 0,
      protein: parseFloat(custom.protein) || 0,
      carbs: parseFloat(custom.carbs) || 0,
      fat: parseFloat(custom.fat) || 0,
      serving_size: parseFloat(custom.serving_size) || 100,
    };
    setAdding(true);
    try {
      await onAdd(product, meal, 1, product.serving_size);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const setC = (k) => (e) => setCustom(f => ({ ...f, [k]: e.target.value }));

  return (
    <Modal onClose={onClose} title="Add Food" width="600px">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: C.bg, padding: '4px', borderRadius: '8px', marginBottom: '20px', border: `1px solid ${C.border}` }}>
        {[{ id: 'search', label: '🔍 Search' }, { id: 'barcode', label: '📷 Barcode' }, { id: 'custom', label: '✏️ Custom' }].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setSelected(null); }}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: fonts.body, fontSize: '12px', fontWeight: '600', transition: 'all 0.15s', backgroundColor: activeTab === t.id ? C.accent2 : 'transparent', color: activeTab === t.id ? '#fff' : C.muted }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'search' && (
        <div>
          {selected ? (
            <AddFoodForm product={selected} meal={meal} onAdd={handleAdd} onBack={() => setSelected(null)} />
          ) : (
            <div>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search foods (e.g. chicken breast, oats, banana...)" style={{ ...input, flex: 1 }} />
                <button type="submit" disabled={searching} style={{ ...btnPrimary, padding: '10px 20px', whiteSpace: 'nowrap', opacity: searching ? 0.7 : 1 }}>
                  {searching ? '...' : 'Search'}
                </button>
              </form>
              {searchError && <p style={{ color: C.muted, fontSize: '13px', marginBottom: '12px' }}>{searchError}</p>}
              {results.length > 0 && (
                <div style={{ maxHeight: '380px', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent` }}>
                  {results.map((p, i) => <FoodResultItem key={i} product={p} onSelect={setSelected} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'barcode' && (
        <div>
          {selected ? (
            <AddFoodForm product={selected} meal={meal} onAdd={handleAdd} onBack={() => { setSelected(null); setBarcodeResult(null); setBarcodeError(''); }} />
          ) : barcodeLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: C.muted }}>Looking up product...</div>
          ) : (
            <div>
              <BarcodeScanner onResult={handleBarcodeResult} />
              {barcodeError && <p style={{ color: C.danger, fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>{barcodeError}</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'custom' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ ...label }}>Food Name *</label>
              <input type="text" value={custom.name} onChange={setC('name')} placeholder="e.g. Homemade Granola Bar" style={{ ...input }} />
            </div>
            <div>
              <label style={{ ...label }}>Calories (kcal)</label>
              <input type="number" min="0" value={custom.calories} onChange={setC('calories')} placeholder="0" style={{ ...input }} />
            </div>
            <div>
              <label style={{ ...label }}>Serving Size (g)</label>
              <input type="number" min="1" value={custom.serving_size} onChange={setC('serving_size')} placeholder="100" style={{ ...input }} />
            </div>
            <div>
              <label style={{ ...label }}>Protein (g)</label>
              <input type="number" min="0" step="0.1" value={custom.protein} onChange={setC('protein')} placeholder="0" style={{ ...input }} />
            </div>
            <div>
              <label style={{ ...label }}>Carbohydrates (g)</label>
              <input type="number" min="0" step="0.1" value={custom.carbs} onChange={setC('carbs')} placeholder="0" style={{ ...input }} />
            </div>
            <div>
              <label style={{ ...label }}>Fat (g)</label>
              <input type="number" min="0" step="0.1" value={custom.fat} onChange={setC('fat')} placeholder="0" style={{ ...input }} />
            </div>
          </div>
          <button
            onClick={handleCustomAdd}
            disabled={!custom.name || adding}
            style={{ ...btnPrimary, width: '100%', padding: '12px', marginTop: '16px', opacity: (!custom.name || adding) ? 0.7 : 1 }}
          >
            {adding ? 'Adding...' : '+ Add Custom Food'}
          </button>
        </div>
      )}
    </Modal>
  );
}
