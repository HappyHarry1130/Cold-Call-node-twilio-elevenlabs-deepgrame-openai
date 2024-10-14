const axios = require('axios');

const siteName = 'toneagency'; // Replace with your actual site name
const projectId = '415549'; // Replace with your actual project ID
const BasicURL = `https://${siteName}.teamwork.com`;
const endpoint = `/projects/${projectId}/time/total.json`;
const authHeader = 'Basic dHdwXzBEcDJPUFAyUUtsRmRJampXOVU4bEpvdTlweHE6';

const params = {
    fromDate: '20230701', // Replace with your actual start date (YYYYMMDD)
    fromTime: '09:00',    // Replace with your actual start time (HH:MM)
    toDate: '20230708',   // Replace with your actual end date (YYYYMMDD)
    toTime: '17:00',      // Replace with your actual end time (HH:MM)
    //userId: 12345,        // Replace with the actual user ID
    projectType: 'active',// Replace with 'all', 'active', or 'archived'
    page: 1,              // Replace with the actual page number
    pageSize: 10          // Replace with the actual page size
};

axios.get(`${BasicURL}${endpoint}`, {
    headers: {
        'Authorization': authHeader
    },
    params: params
})
.then(response => {
    console.log(response.data.projects);
})
.catch(error => {
    console.error('Error making the request:', error);
});