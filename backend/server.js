// server.js - Node.js Backend Service for Form Submission and reCAPTCHA Validation

// Import necessary modules
const express = require('express'); // Web framework for Node.js
const bodyParser = require('body-parser'); // Middleware to parse incoming request bodies
const fetch = require('node-fetch'); // For making HTTP requests (or you can use 'axios')
const cors = require('cors'); // Middleware to enable Cross-Origin Resource Sharing

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000; // Define the port, use environment variable or default to 3000

// Middleware setup
// Enable CORS for all origins. In a production environment, you should restrict
// this to only your frontend's domain for better security.
// Example: cors({ origin: 'https://your-frontend-site.onrender.com' })
app.use(cors());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
// Parse JSON bodies (if you plan to send data as JSON from frontend)
app.use(bodyParser.json());

// --- Important: reCAPTCHA Secret Key ---
// This key should be stored securely as an environment variable on Render.com.
// DO NOT hardcode your secret key directly in the code for production environments.
// Render.com will inject this variable into your running service.
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// Define the API endpoint for form submission
app.post('/submit-form', async (req, res) => {
    // Extract data from the request body
    const { firstName, lastName, 'g-recaptcha-response': recaptchaToken } = req.body;

    // Log received data for debugging (remove or secure in production)
    console.log('Received form data:', { firstName, lastName, recaptchaToken });

    // Basic validation: Check if reCAPTCHA token is present
    if (!recaptchaToken) {
        console.error('reCAPTCHA token is missing.');
        return res.status(400).json({ success: false, message: 'reCAPTCHA token is missing.' });
    }

    // Basic validation: Check if secret key is configured
    if (!RECAPTCHA_SECRET_KEY) {
        console.error('reCAPTCHA secret key is not configured on the server.');
        return res.status(500).json({ success: false, message: 'Server configuration error: reCAPTCHA secret key missing.' });
    }

    try {
        // Prepare the data to send to Google reCAPTCHA API
        const verificationParams = new URLSearchParams();
        verificationParams.append('secret', RECAPTCHA_SECRET_KEY);
        verificationParams.append('response', recaptchaToken);

        // Send a POST request to Google reCAPTCHA API for verification
        const googleResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: verificationParams.toString()
        });

        const data = await googleResponse.json();

        // Log Google's response for debugging
        console.log('Google reCAPTCHA API response:', data);

        // Check if reCAPTCHA verification was successful
        if (data.success) {
            // reCAPTCHA passed. Now you can process the form data.
            // For example, save to a database, send an email, etc.
            console.log('reCAPTCHA verification successful. Processing form data...');
            // In a real application, you would perform actions here
            // e.g., saveUserToDatabase(firstName, lastName);
            // e.g., sendConfirmationEmail(firstName, lastName);

            // Send a success response back to the frontend
            res.json({ success: true, message: 'Form submitted and reCAPTCHA verified successfully!' });
        } else {
            // reCAPTCHA failed. Log errors from Google.
            console.error('reCAPTCHA verification failed. Error codes:', data['error-codes']);
            // Send an error response back to the frontend
            res.status(400).json({ success: false, message: 'reCAPTCHA verification failed.', errors: data['error-codes'] });
        }
    } catch (error) {
        // Catch any network or other errors during the verification process
        console.error('Error during reCAPTCHA verification:', error);
        res.status(500).json({ success: false, message: 'Server error during reCAPTCHA verification.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
