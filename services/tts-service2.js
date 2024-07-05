require('dotenv').config();
const { Buffer } = require('node:buffer');
const EventEmitter = require('events');
const WebSocket = require('ws');

// ... existing code ...

class TextToSpeechService extends EventEmitter {
  constructor() {
    super();
    this.nextExpectedIndex = 0;
    this.speechBuffer = {};
  }

  async generate(gptReply, interactionCount) {
    const { partialResponseIndex, partialResponse } = gptReply;
    const voiceId = 'JNI7HKGyqNaHqfihNoCi';
    const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_monolingual_v1&output_format=ulaw_8000&optimize_streaming_latency=4`;

    const ws = new WebSocket(uri, {
      headers: {
        'xi-api-key': process.env.XI_API_KEY, // Ensure this is set correctly in your .env file
        'Content-Type': 'application/json',
      },
    });

    ws.on('open', () => {
      ws.send(JSON.stringify({
        text: ' ',
        voice_settings: {
          stability: 1,
          similarity_boost: true,
        },
        xi_api_key: process.env.XI_API_KEY,
      }));

      // Send the initial text
      ws.send(JSON.stringify({
        text: partialResponse,
        try_trigger_generation: true,
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.audio) {
        this.emit('speech', partialResponseIndex, Buffer.from(message.audio, 'base64').toString('base64'), partialResponse, interactionCount);
      } else if (message.isFinal) {
        ws.close();
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  }

  async streamText(textIterator, interactionCount) {
    const voiceId = 'JNI7HKGyqNaHqfihNoCi';
    const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_monolingual_v1&output_format=ulaw_8000&optimize_streaming_latency=4`;

    const ws = new WebSocket(uri, {
      headers: {
        'xi-api-key': process.env.XI_API_KEY, // Ensure this is set correctly in your .env file
        'Content-Type': 'application/json',
      },
    });

    ws.on('open', async () => {
      ws.send(JSON.stringify({
        text: ' ',
        voice_settings: {
          stability: 1,
          similarity_boost: true,
        },
        xi_api_key: process.env.XI_API_KEY,
      }));

      for await (const textChunk of textIterator) {
        ws.send(JSON.stringify({
          text: textChunk,
          try_trigger_generation: true,
        }));
      }

      ws.send(JSON.stringify({
        text: '',
        try_trigger_generation: true,
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.audio) {
        this.emit('speech', Buffer.from(message.audio, 'base64').toString('base64'), interactionCount);
      } else if (message.isFinal) {
        ws.close();
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  }
}

module.exports = { TextToSpeechService };