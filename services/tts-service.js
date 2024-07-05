require('dotenv').config();
const { Buffer } = require('node:buffer');
const EventEmitter = require('events');
const fetch = require('node-fetch');
const axios = require('axios');

class TextToSpeechService extends EventEmitter {
  constructor() {
    super();
    this.nextExpectedIndex = 0;
    this.speechBuffer = {};
  }

  async generate(gptReply, interactionCount) {
    const { partialResponseIndex, partialResponse } = gptReply;
    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/JNI7HKGyqNaHqfihNoCi/stream?output_format=ulaw_8000&optimize_streaming_latency=3`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': "sk_bc7a172cae9b09d75cf6cc83ed1284c37f06d781bbec0333", // Use environment variable for API key
              'Content-Type': 'application/json',
              accept: 'audio/wav',
            },
            body: JSON.stringify({
              model_id: 'eleven_multilingual_v2',
              text: partialResponse,
              voice_settings: {
                stability: 0.3,
                similarity_boost: 0.8,
                style_exaggeration: 0.3,
              },
            }),
          }
        );

        if (response.status === 200) {
          const audioArrayBuffer = await response.arrayBuffer();
          this.emit('speech', partialResponseIndex, Buffer.from(audioArrayBuffer).toString('base64'), partialResponse, interactionCount);
          break; // Exit the loop if the request is successful
        } else if (response.status === 429) {
          console.log('Rate limited. Retrying...');
          attempt++;
          const retryAfter = response.headers.get('Retry-After') || 2 ** attempt; // Use Retry-After header if available, otherwise exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        } else {
          console.log('Eleven Labs Error:');
          console.log(response);
          break; // Exit the loop if the error is not rate limiting
        }
      } catch (err) {
        console.error('Error occurred in XI Labs TextToSpeech service');
        console.error(err);
        break; // Exit the loop on other errors
      }
    }
  }
}

module.exports = { TextToSpeechService };