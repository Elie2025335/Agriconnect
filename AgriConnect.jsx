import React, { useState, useEffect } from "react";

// Mock API fetch/save functions
const fetchOnlineData = async () => {
  // simulate fetching from backend
  return new Promise((resolve) =>
    setTimeout(() => resolve([{ id: 1, product: "Maize", quantity: 100 }]), 1000)
  );
};

const saveOnlineData = async (data) => {
  // simulate saving to backend
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true }), 1000)
  );
};

function AgriConnect() {
  const [mode, setMode] = useState("free"); // "free" or "data"
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load data based on mode
  useEffect(() => {
    if (mode === "free") {
      // Load from localStorage
      const localData = localStorage.getItem("products");
      setProducts(localData ? JSON.parse(localData) : []);
    } else {
      // Online mode - fetch from backend
      setLoading(true);
      fetchOnlineData()
        .then((data) => {
          setProducts(data);
          setLoading(false);
          // Optional: save online data locally for offline fallback
          localStorage.setItem("products", JSON.stringify(data));
        })
        .catch(() => setLoading(false));
    }
  }, [mode]);

  // Add a new product
  const addProduct = (product) => {
    const newProducts = [...products, product];
    setProducts(newProducts);

    if (mode === "free") {
      // Save offline
      localStorage.setItem("products", JSON.stringify(newProducts));
    } else {
      // Save online
      saveOnlineData(newProducts);
      // Also update local storage as backup
      localStorage.setItem("products", JSON.stringify(newProducts));
    }
  };

  // Switch mode handler
  const toggleMode = () => {
    if (mode === "free") {
      setMode("data");
    } else {
      setMode("free");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "Arial" }}>
      <h1>AgriConnect Rwanda</h1>
      <button onClick={toggleMode}>
        Switch to {mode === "free" ? "Data (Online) Mode" : "Free (Offline) Mode"}
      </button>
      <p>
        Current mode: <b>{mode === "free" ? "Free (Offline)" : "Data (Online)"}</b>
      </p>
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <>
          <h3>Products</h3>
          {products.length === 0 ? (
            <p>No products found.</p>
          ) : (
            <ul>
              {products.map((p) => (
                <li key={p.id}>
                  {p.product} - Quantity: {p.quantity}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <AddProductForm onAdd={addProduct} />
    </div>
  );
}

function AddProductForm({ onAdd }) {
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!product || !quantity) return;

    onAdd({ id: Date.now(), product, quantity: Number(quantity) });
    setProduct("");
    setQuantity("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      <input
        placeholder="Product name"
        value={product}
        onChange={(e) => setProduct(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
        min={1}
        style={{ marginLeft: 10 }}
      />
      <button type="submit" style={{ marginLeft: 10 }}>
        Add Product
      </button>
    </form>
  );
}

export default AgriConnect;
