const axios = require('axios');



const siteName = 'toneagency';  // Replace with your actual site name
const userId = '50433'; // Replace with the actual user ID
const BasicURL = `https://${siteName}.teamwork.com`;
const endpoint = `/people/${userId}/loggedtime.json`;
const authHeader = 'Basic dHdwXzBEcDJPUFAyUUtsRmRJampXOVU4bEpvdTlweHE6';

// Define the query parameters
const params = {
    m: '06',         // Month (e.g., '07' for July)
    y: '2024',       // Year (e.g., '2024')
    page: 1,         // Page number (e.g., '1')
    pageSize: 10     // Number of entries per page (e.g., '10')
};

axios.get(`${BasicURL}${endpoint}`, {
    headers: {
        'Authorization': authHeader
    },
    params: params
})
.then(response => {
    console.log(response.data.user);
})
.catch(error => {
    console.error('Error making the request:', error);
});