const axios = require('axios');

// Replace with your actual Teamwork API key
const API_KEY = '0Dp2OPP2QKlFdIjjW9U8lJou9pxq';
const BASE_URL = 'https://toneagency.teamwork.com/';

async function getAllUserIDs() {
    const url = `${BASE_URL}/people.json`;
    const headers = {
        'Authorization': `Bearer ${API_KEY}`
    };

    try {
        const response = await axios.get(url, { headers });
        const users = response.data['people'];

        users.forEach(user => {
            const userId = user['id'];
            const userName = user['first-name'] + ' ' + user['last-name'];
            console.log(`User ID: ${userId}, Name: ${userName}`);
        });
    } catch (error) {
        if (error.response) {
            console.error(`Failed to fetch users: ${error.response.status} - ${error.response.statusText}`);
        } else {
            console.error(`Error: ${error.message}`);
        }
    }
}

getAllUserIDs();
