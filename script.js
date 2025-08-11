// Import all necessary Firebase modules for a complete application
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInAnonymously,
    signInWithCustomToken, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    collection, 
    onSnapshot, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables for Firebase configuration provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase services
let app, db, auth;
if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} else {
    console.error("Firebase configuration is not available.");
}

// DOM elements
const authStatusEl = document.getElementById('auth-status');
const mainHeader = document.getElementById('main-header');
const mainContent = document.getElementById('main-content');
const loginContainer = document.getElementById('login-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterButton = document.getElementById('show-register-form');
const showLoginButton = document.getElementById('show-login-form');
const buyerDashboard = document.getElementById('buyer-dashboard');
const farmerDashboard = document.getElementById('farmer-dashboard');
const productsList = document.getElementById('products-list');
const productForm = document.getElementById('product-form');
const suggestPriceButton = document.getElementById('suggest-price-button');
const productPriceInput = document.getElementById('product-price');
const priceLoadingIndicator = document.getElementById('price-loading');
const microLoanForm = document.getElementById('micro-loan-form');
const logisticsForm = document.getElementById('logistics-form');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const messageCloseButton = document.getElementById('message-close');

let currentUserId = null;

/**
 * Shows a custom, non-blocking message to the user.
 * @param {string} text The message to display.
 */
const showMessage = (text) => {
    messageText.textContent = text;
    messageBox.classList.remove('hidden');
};

// Event listener for the message box close button
messageCloseButton.addEventListener('click', () => {
    messageBox.classList.add('hidden');
});

// Event listeners for switching between login and register forms
showRegisterButton.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});
showLoginButton.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Event listener for user authentication state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in. Update UI accordingly.
        currentUserId = user.uid;
        authStatusEl.textContent = "Status: Authenticated";
        
        // Hide login and show main content
        loginContainer.classList.add('hidden');
        mainContent.classList.remove('hidden');
        
        // Determine user role and show appropriate dashboard
        // This is a simple role-based logic for this example.
        // In a real app, you would have a user profile in Firestore.
        // For this code, a user's role is determined by their UID
        // in a simple way to demonstrate different views.
        if (user.uid.includes('farmer')) { // Example logic for farmer role
            farmerDashboard.classList.remove('hidden');
            buyerDashboard.classList.add('hidden');
            document.getElementById('welcome-message').textContent = "Welcome, Farmer!";
            setupProductListener(); // Farmers can still see all products
        } else { // All other users are considered buyers
            farmerDashboard.classList.add('hidden');
            buyerDashboard.classList.remove('hidden');
            document.getElementById('welcome-message').textContent = "Welcome to AgriConnect!";
            setupProductListener();
        }
    } else {
        // User is signed out. Show login form.
        currentUserId = null;
        authStatusEl.textContent = "Status: Not Authenticated";
        loginContainer.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
});

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage("Signed in successfully!");
    } catch (error) {
        console.error("Login failed:", error);
        showMessage("Login failed. Check your credentials.");
    }
});

// Handle register form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = registerForm['register-email'].value;
    const password = registerForm['register-password'].value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showMessage("Account created successfully! You are now logged in.");
    } catch (error) {
        console.error("Registration failed:", error);
        showMessage("Registration failed. Please try again.");
    }
});

// Handle logout
document.getElementById('logout-button').addEventListener('click', async () => {
    try {
        await signOut(auth);
        showMessage("Signed out successfully.");
    } catch (error) {
        console.error("Sign out failed:", error);
        showMessage("Sign out failed. Please try again.");
    }
});

// Handle product listing form submission (Farmer feature)
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) {
        showMessage("Please sign in to list a product.");
        return;
    }

    const productName = document.getElementById('product-name').value;
    const productPrice = document.getElementById('product-price').value;
    const productDescription = document.getElementById('product-description').value;

    if (!productName || !productPrice || !productDescription) {
        showMessage("Please fill out all product fields.");
        return;
    }

    try {
        const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
        await addDoc(productsCollectionRef, {
            ownerId: currentUserId,
            name: productName,
            price: parseFloat(productPrice),
            description: productDescription,
            createdAt: serverTimestamp(),
        });
        showMessage("Product listed successfully!");
        productForm.reset();
    } catch (error) {
        console.error("Error adding document:", error);
        showMessage("Failed to list product. Please try again.");
    }
});

// AI-Powered Price Recommendation (Farmer feature)
suggestPriceButton.addEventListener('click', async () => {
    const productName = document.getElementById('product-name').value;
    const productDescription = document.getElementById('product-description').value;

    if (!productName || !productDescription) {
        showMessage("Please enter a product name and description before requesting a price.");
        return;
    }

    priceLoadingIndicator.classList.remove('hidden');
    suggestPriceButton.disabled = true;

    try {
        const prompt = `Based on the following product details, suggest a realistic and fair price in Rwandan Francs (RWF). The price should be a single number.
        Product Name: ${productName}
        Product Description: ${productDescription}
        
        Suggested Price (RWF):`;

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            const suggestedPrice = parseFloat(text.replace(/[^0-9.]/g, ''));
            if (!isNaN(suggestedPrice)) {
                productPriceInput.value = suggestedPrice.toFixed(2);
                showMessage("Price suggested by AI successfully!");
            } else {
                showMessage("Could not parse the suggested price. Please try again.");
            }
        } else {
            showMessage("Could not get a price recommendation.");
        }

    } catch (error) {
        console.error("Error getting AI price recommendation:", error);
        showMessage("Failed to get price recommendation. Please try again.");
    } finally {
        priceLoadingIndicator.classList.add('hidden');
        suggestPriceButton.disabled = false;
    }
});

// Simulated Micro-Loan Application (Farmer feature)
microLoanForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const loanAmount = microLoanForm['loan-amount'].value;
    const loanPurpose = microLoanForm['loan-purpose'].value;
    if (loanAmount && loanPurpose) {
        showMessage(`Micro-loan application for RWF ${loanAmount} submitted successfully! A representative will contact you.`);
        console.log(`Loan Application from ${currentUserId}: Amount=${loanAmount}, Purpose=${loanPurpose}`);
        microLoanForm.reset();
    }
});

// Simulated Logistics Request (Farmer feature)
logisticsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pickupLocation = logisticsForm['pickup-location'].value;
    const deliveryLocation = logisticsForm['delivery-location'].value;
    if (pickupLocation && deliveryLocation) {
        showMessage(`Logistics pickup from ${pickupLocation} to ${deliveryLocation} requested. A partner will be in touch.`);
        console.log(`Logistics Request from ${currentUserId}: Pickup=${pickupLocation}, Delivery=${deliveryLocation}`);
        logisticsForm.reset();
    }
});


// Set up the real-time listener for products in the Firestore database
const setupProductListener = () => {
    const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
    
    // Listen for real-time updates to the products collection
    onSnapshot(productsCollectionRef, (snapshot) => {
        productsList.innerHTML = ''; // Clear the current list
        snapshot.forEach((doc) => {
            const product = doc.data();
            const productItem = document.createElement('div');
            productItem.classList.add('bg-white', 'p-4', 'rounded-xl', 'shadow-md', 'mb-4');
            productItem.innerHTML = `
                <h3 class="text-xl font-bold text-gray-800 mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-2">${product.description}</p>
                <p class="text-green-600 font-semibold text-lg mb-2">RWF ${product.price.toFixed(2)}</p>
                <p class="text-sm text-gray-400">Listed by: ${product.ownerId.slice(0, 8)}...${product.ownerId.slice(-8)}</p>
                <button class="buy-button mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">Buy</button>
            `;
            productsList.appendChild(productItem);

            // Add a simple "Buy" button listener (for demonstration)
            productItem.querySelector('.buy-button').addEventListener('click', () => {
                showMessage(`You've simulated buying "${product.name}". This feature would typically lead to a checkout process.`);
                console.log(`User ${currentUserId} wants to buy ${product.name}`);
            });
        });
    });
};
