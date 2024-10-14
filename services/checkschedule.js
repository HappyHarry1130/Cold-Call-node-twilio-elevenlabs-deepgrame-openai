const fetch = require('node-fetch');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const chatGpt = async (message) => {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You write a promotional piece to see if a meeting has been scheduled or not after seeing the conversation.
                        If a schedule is set, print "Data: mm/dd/2024, Time: hh:mm", and if no schedule is set, print "Disqualified",
                         or if requested to call again or the call dropped, print "call again", 
                         when the ai is already switching to that campaign list, print "Start Campaign".`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

const getData_Calendly = async (message, calendarlink) => {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `If your text contains a date, You need to add 3 hours to the time. If it's 3am on August 5th, it will be 6am on August 5th.  and then you will need to convert the date to this format.
                                you can use this:  ${calendarlink}.
                                This is the final return format.: https://calendly.com/[XXX]/30min/2024-mm-ddThh:mm:ss
                                 You should just return the url from calendar link. No other explanation is needed
                                                    For example    https://calendly.com/parsival-araujo-saleup/30min/2024-07-31T17:00:00`
                    },
                    {
                        role: "user",
                        content: `${message}`
                    }
                ]
            })
        });

        const data = await response.json();
        console.log(data.choices[0].message.content);
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
module.exports = { chatGpt, getData_Calendly};