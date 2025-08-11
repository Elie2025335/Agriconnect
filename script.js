// Import all necessary Firebase modules for a complete application
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
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
    serverTimestamp,
    getDoc,
    query,
    where,
    updateDoc
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
const adminDashboard = document.getElementById('admin-dashboard');
const productsListBuyer = document.getElementById('products-list-buyer');
const productsListFarmer = document.getElementById('products-list-farmer'); 
const unconfirmedUsersList = document.getElementById('unconfirmed-users-list');
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
let currentUserRole = null;

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
        // User is signed in. Fetch their role and confirmation status from Firestore.
        currentUserId = user.uid;
        authStatusEl.textContent = "Status: Authenticated";
        
        try {
            const userDocRef = doc(db, `artifacts/${appId}/users/${currentUserId}/profile/user_data`);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                currentUserRole = userData.role;
                const isConfirmed = userData.isConfirmed;
                
                // Check if user is confirmed before showing main content
                if (isConfirmed) {
                    document.getElementById('welcome-message').textContent = `Welcome, ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}!`;
                    // Hide login and show main content
                    loginContainer.classList.add('hidden');
                    mainContent.classList.remove('hidden');
                    
                    // Show the correct dashboard based on the fetched role
                    if (currentUserRole === 'farmer') {
                        farmerDashboard.classList.remove('hidden');
                        buyerDashboard.classList.add('hidden');
                        adminDashboard.classList.add('hidden');
                        setupProductListener(productsListFarmer); // Farmer's marketplace view
                    } else if (currentUserRole === 'buyer') {
                        farmerDashboard.classList.add('hidden');
                        buyerDashboard.classList.remove('hidden');
                        adminDashboard.classList.add('hidden');
                        setupProductListener(productsListBuyer); // Buyer's marketplace view
                    } else if (currentUserRole === 'admin') {
                        farmerDashboard.classList.add('hidden');
                        buyerDashboard.classList.add('hidden');
                        adminDashboard.classList.remove('hidden');
                        setupAdminDashboardListener(); // Admin dashboard view
                    }
                } else {
                    // User is not confirmed, force sign out and show message
                    showMessage("Your account is pending confirmation. Please wait for an admin to approve your registration.");
                    await signOut(auth);
                }
            } else {
                // This case should not happen if registration is successful, but is a good fallback
                currentUserRole = null;
                console.error("User profile not found in Firestore.");
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            currentUserRole = null;
            showMessage("An error occurred. Please try logging in again.");
        }
    } else {
        // User is signed out. Show login form.
        currentUserId = null;
        currentUserRole = null;
        authStatusEl.textContent = "Status: Not Authenticated";
        loginContainer.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
});

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('#login-email').value;
    const password = loginForm.querySelector('#login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // The onAuthStateChanged listener will handle the UI update
        showMessage("Attempting to sign in...");
    } catch (error) {
        console.error("Login failed:", error);
        showMessage("Login failed. Check your credentials and confirmation status.");
    }
});

// Handle register form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = registerForm.querySelector('#register-email').value;
    const password = registerForm.querySelector('#register-password').value;
    const role = registerForm.querySelector('#user-role').value;

    if (!role) {
        showMessage("Please select a role (Farmer or Buyer).");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save the user's profile with their role and a confirmation flag to Firestore
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/user_data`);
        await setDoc(userDocRef, {
            email: user.email,
            role: role,
            isConfirmed: false, // New users are unconfirmed by default
            createdAt: serverTimestamp(),
        });
        
        // This is where an actual email would be sent. For now, we simulate.
        showMessage(`Account created successfully! Your account is pending confirmation by an admin. You will not be able to log in until it is approved.`);
        // Force log out after registration to prevent unconfirmed access
        await signOut(auth);
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
    if (!currentUserId || currentUserRole !== 'farmer') {
        showMessage("You must be a signed-in farmer to list a product.");
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

/**
 * Sets up the real-time listener for products in the Firestore database.
 * @param {HTMLElement} productsListElement The DOM element to render products into.
 */
const setupProductListener = (productsListElement) => {
    const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
    
    onSnapshot(productsCollectionRef, (snapshot) => {
        productsListElement.innerHTML = '';
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
            productsListElement.appendChild(productItem);

            productItem.querySelector('.buy-button').addEventListener('click', () => {
                showMessage(`You've simulated buying "${product.name}". This feature would typically lead to a checkout process.`);
                console.log(`User ${currentUserId} wants to buy ${product.name}`);
            });
        });
    });
};

/**
 * Sets up the real-time listener for unconfirmed users for the admin dashboard.
 */
const setupAdminDashboardListener = () => {
    const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
    const q = query(usersCollectionRef, where("profile.user_data.isConfirmed", "==", false));

    onSnapshot(q, (snapshot) => {
        unconfirmedUsersList.innerHTML = '';
        if (snapshot.empty) {
            unconfirmedUsersList.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-500">No unconfirmed users found.</td></tr>`;
            return;
        }

        snapshot.forEach((docSnapshot) => {
            const userData = docSnapshot.data().profile.user_data;
            const userEmail = userData.email;
            const userRole = userData.role;
            const userId = docSnapshot.id;

            const tableRow = document.createElement('tr');
            tableRow.classList.add('hover:bg-gray-50');
            tableRow.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${userEmail}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${userRole}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button data-id="${userId}" class="confirm-button text-green-600 hover:text-green-900 transition-colors">Confirm</button>
                </td>
            `;
            unconfirmedUsersList.appendChild(tableRow);
        });

        // Add event listeners for the new "Confirm" buttons
        document.querySelectorAll('.confirm-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const targetId = e.target.dataset.id;
                try {
                    const userDocRef = doc(db, `artifacts/${appId}/users/${targetId}/profile/user_data`);
                    await updateDoc(userDocRef, { isConfirmed: true });
                    showMessage(`User with ID ${targetId} has been confirmed!`);
                } catch (error) {
                    console.error("Error confirming user:", error);
                    showMessage("Failed to confirm user. Please try again.");
                }
            });
        });
    });
};
