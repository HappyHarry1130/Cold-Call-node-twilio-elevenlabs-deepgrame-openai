require('dotenv').config();
require('colors');

const express = require('express');
const ExpressWs = require('express-ws');
const bodyParser = require('body-parser');
const { chromium } = require('playwright');
const WebSocket = require('ws');
const { GptService } = require('./services/gpt-service');
const { StreamService } = require('./services/stream-service');
const { TranscriptionService } = require('./services/transcription-service');
const { TextToSpeechService } = require('./services/tts-service');
const { recordingService } = require('./services/recording-service');
const cors = require('cors');
const { chatGpt, getData_Calendly } = require('./services/checkschedule');
const { get_Avaliable_time } = require('./services/getAvaliableTime');
const { makeschedule } = require('./services/make-schedule');
const makeCallRouter = require('./makeCall');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

var communicationtext = '';
var phonenumberlist;
var contact_id= '';
var campaign_id= '';
var avaliable_times_info;
var ai_profile_name = 'Brandon';
var fullname = "Elina";

var content = '';
var todo = '';
var notodo = '';
var email = '';
var company = '';
var contact_company = '';
var contact_position = '';
var callstatus;
const app = express();
ExpressWs(app);

const PORT = process.env.PORT || 3000;
app.use(cors({
  origin: 'https://saleup.com.br'
}));
app.use(bodyParser.json());
app.use('/api', makeCallRouter);

console.log(process.env.TWILIO_ACCOUNT_SID);

const options = { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false };
const formatter = new Intl.DateTimeFormat([], options);
const brazilHour = parseInt(formatter.format(new Date()), 10);

let timeOfDay;
if (brazilHour >= 5 && brazilHour < 12) {
    timeOfDay = 'Bom dia!';
} else if (brazilHour >= 12 && brazilHour < 18) {
    timeOfDay = 'Boa tarde!';
} else {
    timeOfDay = 'Boa noite!';
}

app.post('/incoming', (req, res) => {
  const phonenumber = req.query.phonenumber; 
  content = req.query.content; 
  todo = req.query.todo; 
  notodo = req.query.notodo; 
  fullname = req.query.fullname; 
  ai_profile_name = req.query.ai_profile_name;
  email = req.query.email;
  company = req.body.company;
  contact_position = req.body.contact_position;
  contact_company = req.body.contact_company;

  try {
    callstatus = 'Not answered';
    const response = new VoiceResponse();
    const connect = response.connect();
    connect.stream({ url: `wss://${process.env.SERVER}/connection` });
    const ws = new WebSocket(`wss://${process.env.SERVER}/connection`);
    ws.on('open', function open() {    
      ws.send(JSON.stringify({ event: 'start', phonenumber: phonenumber }));
    });
    res.type('text/xml');
    res.end(response.toString());
  } catch (err) {
    console.log(err);
  }
});

app.ws('/connection', (ws) => {
  console.log("connection");
  try {
    ws.on('error', console.error);
    ws.on('close', async () => {
      console.log('WebSocket connection fdsfsf closed');
      console.log(`Context : ${communicationtext}`);
      callstatus = await chatGpt(communicationtext);
      updateData();
      if (app.locals.clientWs && app.locals.clientWs.readyState === app.locals.clientWs.OPEN) {        
        console.log('Sending tts-speech event to client');
        app.locals.clientWs.send(JSON.stringify({
          event: 'aftercall',
          callstatus: callstatus,
        }));
      }
      const schedule_date_time = await getData_Calendly(callstatus);      
      console.log(callstatus);
      console.log(schedule_date_time);
      makeschedule(schedule_date_time, fullname, email);
    });

    let streamSid;
    let callSid;
    let phonenumber;
    const gptService = new GptService();
    const streamService = new StreamService(ws);
    const transcriptionService = new TranscriptionService();
    const ttsService = new TextToSpeechService({});
    let marks = [];
    let interactionCount = 0;
    var contact;
    contact= {
      name: fullname,
      position : contact_position,
      company : contact_company,
    }
    
    // Incoming from MediaStream
    ws.on('message', function message(data) {
      const msg = JSON.parse(data);
      if (msg.event === 'start' && msg.start && msg.start.streamSid) {
        console.log('start');
        streamSid = msg.start.streamSid;
        callSid = msg.start.callSid;
        phonenumber = msg.start.phonenumber;
        console.log(`Received phonenumber: ${phonenumber}`); 
        console.log(streamSid);
        streamService.setStreamSid(streamSid);
        gptService.setCallSid(callSid);
        gptService.setUserContext(content, todo, notodo, avaliable_times_info, fullname, contact);   
        // Set RECORDING_ENABLED='true' in .env to record calls
        recordingService(ttsService, callSid).then(() => {
          console.log(`Twilio -> Starting Media Stream for ${streamSid}`.underline.red);
          if (app.locals.clientWs && app.locals.clientWs.readyState === app.locals.clientWs.OPEN) {
            app.locals.clientWs.send(JSON.stringify({
              event: 'start',
              streamSid,
              phonenumber,
              callSid,
              campaign_id: campaign_id,
              contact_id, 
              phonenumberlist 
            }));
          }
          const aiProfileNameText = ai_profile_name ? `Eu sou ${ai_profile_name}.` : '';
          ttsService.generate({ partialResponseIndex: null, partialResponse: `Olá, ${fullname}. ${timeOfDay} ${aiProfileNameText}` }, 0);
        });
      } else if (msg.event === 'media') {
        transcriptionService.send(msg.media.payload);
      } else if (msg.event === 'mark') {
        const label = msg.mark.name;
        console.log(`Twilio -> Audio completed mark (${msg.sequenceNumber}): ${label}`.red);
        marks = marks.filter(m => m !== msg.mark.name);
      } else if (msg.event === 'stop') {
        console.log(`Twilio -> Media stream ${streamSid} ended.`.underline.red);
        if (app.locals.clientWs && app.locals.clientWs.readyState === app.locals.clientWs.OPEN) {
          app.locals.clientWs.send(JSON.stringify({
            event: 'stop',
            streamSid,
            campaign_id: campaign_id,
            callSid,
            contact_id,
            phonenumberlist
          }));
        }
      }
    });
  
    transcriptionService.on('utterance', async (text) => {
      if(marks.length > 0 && text?.length > 5) {
        console.log('Twilio -> Interruption, Clearing stream'.red);
        ws.send(
          JSON.stringify({
            streamSid,
            event: 'clear',
          })
        );
      }
    });
  
    transcriptionService.on('transcription', async (text) => {
      if (!text) { return; }
      console.log(`Interaction ${interactionCount} : STT -> GPT: ${text}`.yellow);
      communicationtext += `SDR: ${text}\n`;
      // Send the transcription details to the client
      if (app.locals.clientWs && app.locals.clientWs.readyState === app.locals.clientWs.OPEN) {
        console.log('Sending transcription event to client');
        app.locals.clientWs.send(JSON.stringify({
          event: 'transcription',
          interactionCount,
          text
        }));
      }
      gptService.completion(text, interactionCount);
      interactionCount += 1;
    });
    
    gptService.on('gptreply', async (gptReply, icount) => {
      console.log(`Interaction ${icount}: GPT -> TTS: ${gptReply.partialResponse}`.green );

      // Send GPT reply to the client
      if (app.locals.clientWs && app.locals.clientWs.readyState === app.locals.clientWs.OPEN) {
        console.log('Sending gpt-reply event to client');
        app.locals.clientWs.send(JSON.stringify({
          event: 'gpt-reply',
          icount,
          gptReply
        }));
      }
      ttsService.generate(gptReply, icount);
    });
  
    ttsService.on('speech', (responseIndex, audio, label, icount) => {
      console.log(`Interaction ${icount}: TTS -> TWILIO: ${label}`.blue);
      communicationtext += `Customer: ${label}\n`;
      streamService.buffer(responseIndex, audio);
      // Send TTS speech to the client
      if (app.locals.clientWs && app.locals.clientWs.readyState === app.locals.clientWs.OPEN) {        
        console.log('Sending tts-speech event to client');
        app.locals.clientWs.send(JSON.stringify({
          event: 'tts-speech',
          responseIndex,
          audio,
          label,
          icount
        }));
      }
    });  
    streamService.on('audiosent', (markLabel) => {
      marks.push(markLabel);
    });
  } catch (err) {
    console.log(err);
  }
});

app.ws('/client-connection', (ws) => {
  console.log("Client connected");
  ws.on('message', (message) => {
    console.log('Received message from client:', message);
  });
  ws.on('close', async () => {
    try {
      
    } catch (error) {
      console.error('Error getting schedule status:', error);
    }
    console.log('Client disconnected');
  });

  // Store the WebSocket connection for later use
  app.locals.clientWs = ws;
});

function updateData() {
  fetch("https://saleup.com.br/version-test/api/1.1/wf/update-data", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({
          eventType: communicationtext,
          contactID: contact_id,
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

app.listen(PORT);
console.log(`Server running on port ${PORT}`);