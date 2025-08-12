{
  "name": "agriconnect",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "firebase": "^11.0.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.14.1",
    "react-i18next": "^13.2.1",
    "i18next": "^23.6.0",
    "tailwindcss": "^3.3.3"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "deploy": "firebase deploy"
  }
}
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
// src/components/Navbar.js
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="bg-green-600 p-4 text-white flex justify-between">
      <Link to="/" className="font-bold text-xl">AgriConnect</Link>
      <div>
        <Link to="/marketplace" className="mr-4">Marketplace</Link>
        {user ? (
          <>
            <Link to="/dashboard" className="mr-4">Dashboard</Link>
            <button onClick={() => signOut(auth)}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="mr-4">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
// src/components/Footer.js
export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white text-center p-4 mt-8">
      <p>© {new Date().getFullYear()} AgriConnect. All rights reserved.</p>
    </footer>
  );
}
// src/components/ProductCard.js
export default function ProductCard({ product }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-40 object-cover rounded-md"
      />
      <h3 className="text-lg font-bold mt-2">{product.name}</h3>
      <p className="text-gray-600">{product.description}</p>
      <p className="text-green-600 font-bold mt-2">{product.price} RWF</p>
    </div>
  );
}
// src/utils/PrivateRoute.js
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}
// src/utils/RoleRoute.js
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RoleRoute({ children, allowedRole }) {
  const { user } = useAuth();
  const role = user?.role || "Buyer"; // Temporary placeholder for role logic
  return role === allowedRole ? children : <Navigate to="/" />;
}
// src/pages/Home.js
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-100 p-8 text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">
          Welcome to AgriConnect
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">
          Connecting Rwandan farmers directly with buyers, logistics providers,
          and micro-loan services. Empowering agriculture through technology.
        </p>
        <Link
          to="/marketplace"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Explore Marketplace
        </Link>
      </main>
      <Footer />
    </div>
  );
}
// src/pages/Login.js
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex justify-center items-center bg-gray-100">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-lg shadow-md w-96"
        >
          <h2 className="text-2xl font-bold mb-4">Login</h2>
          {error && <p className="text-red-500">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border w-full p-2 mb-4 rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border w-full p-2 mb-4 rounded"
            required
          />
          <button
            type="submit"
            className="bg-green-600 text-white w-full p-2 rounded hover:bg-green-700"
          >
            Login
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
// src/pages/Register.js
import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Farmer");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), { role });
      await sendEmailVerification(userCredential.user);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex justify-center items-center bg-gray-100">
        <form
          onSubmit={handleRegister}
          className="bg-white p-8 rounded-lg shadow-md w-96"
        >
          <h2 className="text-2xl font-bold mb-4">Register</h2>
          {error && <p className="text-red-500">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border w-full p-2 mb-4 rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border w-full p-2 mb-4 rounded"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border w-full p-2 mb-4 rounded"
          >
            <option value="Farmer">Farmer</option>
            <option value="Buyer">Buyer</option>
          </select>
          <button
            type="submit"
            className="bg-green-600 text-white w-full p-2 rounded hover:bg-green-700"
          >
            Register
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
// src/pages/Marketplace.js
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    let q = collection(db, "products");

    if (category) {
      q = query(q, where("category", "==", category));
    }

    const snapshot = await getDocs(q);
    const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (search) {
      setProducts(
        productList.filter(p =>
          p.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setProducts(productList);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [category]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Marketplace</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Categories</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Fruits">Fruits</option>
            <option value="Grains">Grains</option>
          </select>
          <button
            onClick={fetchProducts}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Search
          </button>
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
// src/pages/Dashboard.js
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { auth, db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import LoanForm from "../components/LoanForm";
import LogisticsForm from "../components/LogisticsForm";

export default function Dashboard() {
  const { user } = useAuth();
  const [role, setRole] = useState("");
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  const fetchRole = async () => {
    const snap = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
    if (!snap.empty) {
      setRole(snap.docs[0].data().role);
    }
  };

  const fetchMyProducts = async () => {
    const q = query(collection(db, "products"), where("owner", "==", user.uid));
    const snapshot = await getDocs(q);
    setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchRole();
    fetchMyProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!image) return alert("Please upload an image.");

    const imageRef = ref(storage, `products/${Date.now()}-${image.name}`);
    await uploadBytes(imageRef, image);
    const imageUrl = await getDownloadURL(imageRef);

    await addDoc(collection(db, "products"), {
      name,
      price,
      description,
      image: imageUrl,
      owner: user.uid
    });

    setName("");
    setPrice("");
    setDescription("");
    setImage(null);
    fetchMyProducts();
  };

  const handleDeleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
    fetchMyProducts();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-100 p-8">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="mb-4">Role: {role}</p>

        {role === "Farmer" && (
          <div>
            <h2 className="text-xl font-bold mb-2">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="bg-white p-4 rounded shadow-md mb-6">
              <input
                type="text"
                placeholder="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2 w-full mb-2 rounded"
                required
              />
              <input
                type="number"
                placeholder="Price (RWF)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="border p-2 w-full mb-2 rounded"
                required
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border p-2 w-full mb-2 rounded"
                required
              />
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                className="mb-2"
                required
              />
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Add Product
              </button>
            </form>

            <h2 className="text-xl font-bold mb-2">My Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded shadow">
                  <img src={p.image} alt={p.name} className="w-full h-40 object-cover rounded" />
                  <h3 className="font-bold mt-2">{p.name}</h3>
                  <p>{p.price} RWF</p>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="bg-red-600 text-white px-3 py-1 mt-2 rounded"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {role === "Buyer" && (
          <div>
            <h2 className="text-xl font-bold mb-2">Purchase History</h2>
            <p>Feature coming soon...</p>
          </div>
        )}

        <h2 className="text-xl font-bold mt-6">Micro-Loan Request</h2>
        <LoanForm />

        <h2 className="text-xl font-bold mt-6">Logistics Request</h2>
        <LogisticsForm />
      </main>
      <Footer />
    </div>
  );
}
// src/pages/AdminPanel.js
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [logistics, setLogistics] = useState([]);

  const fetchAllData = async () => {
    const usersSnap = await getDocs(collection(db, "users"));
    setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const productsSnap = await getDocs(collection(db, "products"));
    setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const loansSnap = await getDocs(collection(db, "loans"));
    setLoans(loansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const logisticsSnap = await getDocs(collection(db, "logistics"));
    setLogistics(logisticsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDeleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
    fetchAllData();
  };

  const handleLoanStatus = async (id, status) => {
    await updateDoc(doc(db, "loans", id), { status });
    fetchAllData();
  };

  const handleLogisticsStatus = async (id, status) => {
    await updateDoc(doc(db, "logistics", id), { status });
    fetchAllData();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-100 p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        {/* Users Management */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Users</h2>
          <table className="w-full bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="p-2">{user.email || "Unknown"}</td>
                  <td className="p-2">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Products Management */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded shadow">
                <img src={p.image} alt={p.name} className="w-full h-40 object-cover rounded" />
                <h3 className="font-bold mt-2">{p.name}</h3>
                <p>{p.price} RWF</p>
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="bg-red-600 text-white px-3 py-1 mt-2 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Loan Requests */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Loan Requests</h2>
          {loans.map(loan => (
            <div key={loan.id} className="bg-white p-4 rounded shadow mb-2">
              <p><strong>Farmer:</strong> {loan.farmerId}</p>
              <p><strong>Amount:</strong> {loan.amount} RWF</p>
              <p><strong>Status:</strong> {loan.status}</p>
              <div className="mt-2">
                <button
                  onClick={() => handleLoanStatus(loan.id, "Approved")}
                  className="bg-green-600 text-white px-3 py-1 rounded mr-2"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleLoanStatus(loan.id, "Rejected")}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Logistics Requests */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Logistics Requests</h2>
          {logistics.map(log => (
            <div key={log.id} className="bg-white p-4 rounded shadow mb-2">
              <p><strong>Farmer:</strong> {log.farmerId}</p>
              <p><strong>Pickup:</strong> {log.pickup}</p>
              <p><strong>Destination:</strong> {log.destination}</p>
              <p><strong>Status:</strong> {log.status}</p>
              <div className="mt-2">
                <button
                  onClick={() => handleLogisticsStatus(log.id, "Approved")}
                  className="bg-green-600 text-white px-3 py-1 rounded mr-2"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleLogisticsStatus(log.id, "Rejected")}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
// src/components/ChatBox.js
import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";

export default function ChatBox() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    await addDoc(collection(db, "messages"), {
      text: message,
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      timestamp: serverTimestamp()
    });

    setMessage("");
  };

  return (
    <div className="flex flex-col bg-white shadow-md rounded-lg p-4 h-[500px]">
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 my-1 rounded ${
              msg.uid === auth.currentUser.uid
                ? "bg-green-100 text-right"
                : "bg-gray-200 text-left"
            }`}
          >
            <p className="text-sm font-bold">{msg.email}</p>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow border rounded-l p-2"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 rounded-r hover:bg-green-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}
// src/pages/Chat.js
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ChatBox from "../components/ChatBox";

export default function Chat() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Community Chat</h1>
        <ChatBox />
      </main>
      <Footer />
    </div>
  );
}
// src/pages/LogisticsForm.js
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function LogisticsForm() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    try {
      await addDoc(collection(db, "logistics"), {
        farmerId: auth.currentUser.uid,
        pickup,
        destination,
        notes,
        status: "Pending",
        createdAt: serverTimestamp()
      });

      setSuccess("Logistics request submitted successfully!");
      setPickup("");
      setDestination("");
      setNotes("");
    } catch (error) {
      console.error("Error submitting logistics request:", error);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-green-600 mb-6">Request Logistics</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow-md max-w-lg mx-auto"
        >
          <label className="block mb-2 font-semibold">Pickup Location</label>
          <input
            type="text"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="w-full border p-2 rounded mb-4"
            required
          />

          <label className="block mb-2 font-semibold">Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border p-2 rounded mb-4"
            required
          />

          <label className="block mb-2 font-semibold">Notes for Delivery Provider</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border p-2 rounded mb-4"
            rows="3"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>

          {success && <p className="mt-4 text-green-600">{success}</p>}
        </form>
      </main>
      <Footer />
    </div>
  );
}
// src/pages/LogisticsTracking.js
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth } from "../firebase";

export default function LogisticsTracking() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "logistics"),
      where("buyerId", "==", auth.currentUser?.uid || "")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-green-600 mb-6">Track Your Deliveries</h1>
        {requests.length === 0 ? (
          <p>No deliveries found.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white p-4 rounded shadow mb-4">
              <p><strong>Pickup:</strong> {req.pickup}</p>
              <p><strong>Destination:</strong> {req.destination}</p>
              <p><strong>Status:</strong> {req.status}</p>
            </div>
          ))
        )}
      </main>
      <Footer />
    </div>
  );
}
// src/components/LogisticsMap.js
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

export default function LogisticsMap({ pickupCoords, destinationCoords }) {
  const center = pickupCoords || { lat: -1.9403, lng: 29.8739 }; // Rwanda default

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}>
      <GoogleMap
        mapContainerStyle={{ height: "400px", width: "100%" }}
        center={center}
        zoom={10}
      >
        {pickupCoords && <Marker position={pickupCoords} label="Pickup" />}
        {destinationCoords && <Marker position={destinationCoords} label="Destination" />}
      </GoogleMap>
    </LoadScript>
  );
}
// src/pages/LogisticsTracking.js
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth } from "../firebase";
import LogisticsMap from "../components/LogisticsMap";

export default function LogisticsTracking() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "logistics"),
      where("buyerId", "==", auth.currentUser?.uid || "")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-green-600 mb-6">Track Your Deliveries</h1>
        {requests.length === 0 ? (
          <p>No deliveries found.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white p-4 rounded shadow mb-6">
              <p><strong>Pickup:</strong> {req.pickup}</p>
              <p><strong>Destination:</strong> {req.destination}</p>
              <p><strong>Status:</strong> {req.status}</p>
              {req.pickupCoords && req.destinationCoords && (
                <LogisticsMap
                  pickupCoords={req.pickupCoords}
                  destinationCoords={req.destinationCoords}
                />
              )}
            </div>
          ))
        )}
      </main>
      <Footer />
    </div>
  );
}
// Inside LogisticsForm.js - handleSubmit()
const getCoordinates = async (address) => {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}`
  );
  const data = await res.json();
  return data.results[0]?.geometry.location || null;
};

const pickupCoords = await getCoordinates(pickup);
const destinationCoords = await getCoordinates(destination);

await addDoc(collection(db, "logistics"), {
  farmerId: auth.currentUser.uid,
  pickup,
  destination,
  pickupCoords,
  destinationCoords,
  notes,
  status: "Pending",
  createdAt: serverTimestamp()
});
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);

// Request permission & get token
export const requestNotificationPermission = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
    });
    if (token) {
      console.log("Notification token:", token);
      return token;
    } else {
      console.warn("No registration token available.");
    }
  } catch (error) {
    console.error("Error getting token:", error);
  }
};

// Foreground message listener
onMessage(messaging, (payload) => {
  console.log("Message received:", payload);
});
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon.png",
  });
});
// src/pages/Login.js
import { requestNotificationPermission } from "../firebase";

// Inside successful login handler
const token = await requestNotificationPermission();
// Save token to Firestore for the logged-in user
await setDoc(doc(db, "users", auth.currentUser.uid), { fcmToken: token }, { merge: true });
// sendNotification.js (Node.js Cloud Function)
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendNotification = async (userId, title, body) => {
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  const token = userDoc.data()?.fcmToken;

  if (token) {
    await admin.messaging().send({
      token,
      notification: { title, body }
    });
  }
};
// server.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const MOMO_BASE = "https://sandbox.momodeveloper.mtn.com";
const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
const userId = process.env.MTN_USER_ID;
const apiKey = process.env.MTN_API_KEY;

// Get access token
async function getAccessToken() {
  const res = await axios.post(`${MOMO_BASE}/collection/token/`, null, {
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      Authorization: "Basic " + Buffer.from(`${userId}:${apiKey}`).toString("base64")
    }
  });
  return res.data.access_token;
}

// Request payment
app.post("/pay", async (req, res) => {
  try {
    const { amount, phoneNumber, transactionId } = req.body;
    const token = await getAccessToken();

    await axios.post(`${MOMO_BASE}/collection/v1_0/requesttopay`, {
      amount,
      currency: "RWF",
      externalId: transactionId,
      payer: { partyIdType: "MSISDN", partyId: phoneNumber },
      payerMessage: "AgriConnect Payment",
      payeeNote: "Thanks for buying local produce!"
    }, {
      headers: {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        Authorization: `Bearer ${token}`,
        "X-Reference-Id": transactionId
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment failed" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
// src/components/PayButton.js
import axios from "axios";

export default function PayButton({ amount, phoneNumber, transactionId }) {
  const handlePay = async () => {
    try {
      await axios.post("http://localhost:5000/pay", { amount, phoneNumber, transactionId });
      alert("Payment request sent. Please confirm on your phone.");
    } catch (err) {
      console.error(err);
      alert("Payment failed. Try again.");
    }
  };

  return (
    <button
      onClick={handlePay}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      Pay {amount} RWF with MTN MoMo
    </button>
  );
}
// src/components/StripeCheckoutButton.js
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

export default function StripeCheckoutButton({ amount }) {
  const handleCheckout = async () => {
    const stripe = await stripePromise;
    await stripe.redirectToCheckout({
      mode: "payment",
      lineItems: [{ price: process.env.REACT_APP_STRIPE_PRICE_ID, quantity: 1 }],
      successUrl: window.location.origin + "/success",
      cancelUrl: window.location.origin + "/cancel"
    });
  };

  return (
    <button
      onClick={handleCheckout}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Pay with Card (Stripe)
    </button>
  );
  import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import rw from "./locales/rw/translation.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      rw: { translation: rw }
    },
    lng: "en", // Default language
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });
export default i18n;import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import "./i18n"; // Import language setup

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
import { useTranslation } from "react-i18next";

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="p-4 bg-green-600 text-white flex justify-between">
      <h1>{t("welcome")}</h1>
      <button>{t("logout")}</button>
    </header>
  );
}
// src/components/LanguageSwitcher.js
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex gap-2 p-2">
      <button onClick={() => changeLanguage("en")} className="bg-gray-200 px-2 py-1 rounded">
        EN
      </button>
      <button onClick={() => changeLanguage("rw")} className="bg-gray-200 px-2 py-1 rounded">
        RW
      </button>
    </div>
  );
} // src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // Replace with your actual apiKey
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", 
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);



}
