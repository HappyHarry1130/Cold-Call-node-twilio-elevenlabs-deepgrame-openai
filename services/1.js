const transcription = "Your transcription text here";
const contactID = "Your contact ID here";
const campaign_id = "Your campaign ID here";
const callstatus = "Your call status here";

// Function to send the POST request
function updateData() {
    fetch("https://saleup.com.br/version-test/api/1.1/wf/update-data", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            eventType: transcription,
            contactID: contactID,
            campaign_id: campaign_id,
            callstatus: callstatus, // Include the transcription if available
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Call the function to send the request
updateData();