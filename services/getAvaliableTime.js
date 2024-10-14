const axios = require('axios');

const token = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzIwOTEwMDYyLCJqdGkiOiJiMGVlZWVlYy00ODg5LTRmZTctOWRmMC02M2RiMWZjMmIyMDAiLCJ1c2VyX3V1aWQiOiIwOWIwODMyZC04YTlhLTQxNjEtYjViOC00OTVkMzE4MzRjMmEifQ.F3CNQQDsctcafFK7KRceeUsxN3plvGhyNfX0RStvT4mNDyfv7ujmdAEVuW1JncupibDQOcxF4oA7BnDIry-lBA';
const user = 'https://api.calendly.com/users/09b0832d-8a9a-4161-b5b8-495d31834c2a';

const params = { user: user };

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

const get_Evente_Uri = async () => {
  try {
    const response = await axios.get('https://api.calendly.com/event_types', { params, headers });
    if (response.status === 200) {
      const event_types = response.data.collection;
      return event_types[0]['uri'];
    }
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
};

const get_Avaliable_time = async () => {
    try {
      const eventUri = await get_Evente_Uri();
      
      // Calculate start_time and end_time
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Set start date to tomorrow
  
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7); // Set end date to 7 days after tomorrow
  
      const params = {
        event_type: eventUri, // Chosen from previous API response
        start_time: startDate.toISOString(), // Tomorrow's date in ISO format
        end_time: endDate.toISOString() // 7 days after tomorrow in ISO format
      };
  
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
  
      const response = await axios.get('https://api.calendly.com/event_type_available_times', { params, headers });
      if (response.status === 200) {
        const schedulingUrls = response.data.collection.map(item => item.scheduling_url);
        return schedulingUrls;
      }
    } catch (error) {
      console.error("Error:", error.response ? error.response.data : error.message);
    }
  };
  
  module.exports = {get_Avaliable_time};