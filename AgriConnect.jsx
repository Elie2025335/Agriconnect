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
import React, { useState } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("farmer"); // or "buyer"
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Save role in user profile or your database — here, just save locally for demo
      setUser({ email: userCredential.user.email, role });
      alert("Registered successfully! Please login.");
      setIsRegister(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // For demo, we don't have role saved in Firebase user, you would fetch from DB
      // Here, assume role stored in localStorage or assign 'buyer' by default
      const storedRole = localStorage.getItem("role") || "buyer";
      setUser({ email: userCredential.user.email, role: storedRole });
    } catch (err) {
      setError(err.message);
    }
  };

  // Simple logout
  const handleLogout = () => {
    auth.signOut();
    setUser(null);
  };

  // After login show dashboard based on role
  if (user) {
    return (
      <div>
        <h2>Welcome, {user.email}</h2>
        <h3>Your role: {user.role}</h3>
        {user.role === "farmer" ? (
          <FarmerDashboard />
        ) : (
          <BuyerDashboard />
        )}
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>{isRegister ? "Register" : "Login"}</h2>
      <form onSubmit={isRegister ? handleRegister : handleLogin}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        {isRegister && (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 10 }}
          >
            <option value="farmer">Farmer</option>
            <option value="buyer">Buyer</option>
          </select>
        )}
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          {isRegister ? "Register" : "Login"}
        </button>
      </form>
      <p style={{ marginTop: 10 }}>
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => setIsRegister(!isRegister)}
          style={{ color: "blue", background: "none", border: "none", cursor: "pointer" }}
        >
          {isRegister ? "Login" : "Register"}
        </button>
      </p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

// Dummy dashboards
function FarmerDashboard() {
  return <h3>This is Farmer Dashboard</h3>;
}

function BuyerDashboard() {
  return <h3>This is Buyer Dashboard</h3>;
}

export default Auth;
import React from "react";
import Auth from "./Auth";

function App() {
  return <Auth />;
}
export default App; import React, { useState } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("farmer"); // or "buyer"
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Register user and save role in Firestore
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save role in Firestore under users collection
      await setDoc(doc(db, "users", uid), { role, email });

      alert("Registered successfully! Please login.");
      setIsRegister(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Login user and fetch role from Firestore
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Fetch role from Firestore
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUser({ email: userCredential.user.email, role: userData.role });
      } else {
        setError("No user data found!");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (user) {
    return (
      <div>
        <h2>Welcome, {user.email}</h2>
        <h3>Your role: {user.role}</h3>
        {user.role === "farmer" ? <FarmerDashboard /> : <BuyerDashboard />}
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>{isRegister ? "Register" : "Login"}</h2>
      <form onSubmit={isRegister ? handleRegister : handleLogin}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        {isRegister && (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 10 }}
          >
            <option value="farmer">Farmer</option>
            <option value="buyer">Buyer</option>
          </select>
        )}
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          {isRegister ? "Register" : "Login"}
        </button>
      </form>
      <p style={{ marginTop: 10 }}>
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
          style={{
            color: "blue",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isRegister ? "Login" : "Register"}
        </button>
      </p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
function FarmerDashboard() {
  return <h3>This is the Farmer Dashboard.</h3>;
}

function BuyerDashboard() {
  return <h3>This is the Buyer Dashboard.</h3>;
}

export default Auth;

