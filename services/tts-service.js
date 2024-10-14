require('dotenv').config();
const { Buffer } = require('node:buffer');
const EventEmitter = require('events');
const fetch = require('node-fetch');
const axios = require('axios');
const { isNull } = require('node:util');

class TextToSpeechService extends EventEmitter {
  constructor() {
    super();
    this.nextExpectedIndex = 0;
    this.speechBuffer = {};
    this.abortControllers = {}; // To keep track of AbortControllers for each interactionCount
  }

  async generate(gptReply, interactionCount, voiceId, stability, similarity_boost, style_exaggeration) {
    console.log(`stability : ${stability}, similarity_boost: ${similarity_boost}, style_exaggeration: ${style_exaggeration}`);
    const { partialResponseIndex, partialResponse } = gptReply;
    const maxRetries = 5;
    let attempt = 0;

    // Create a new AbortController for this interactionCount
    const abortController = new AbortController();
    this.abortControllers[interactionCount] = abortController;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=ulaw_8000&optimize_streaming_latency=3`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': process.env.ELEVEN_LABS_API_KEY, 
              'Content-Type': 'application/json',
              accept: 'audio/wav',
            },
            body: JSON.stringify({
              model_id: 'eleven_multilingual_v2',
              text: partialResponse,
              voice_settings: {
                stability: stability/100, 
                similarity_boost: similarity_boost/100,
                style: style_exaggeration/100,
              },
            }),
            signal: abortController.signal // Attach the signal to the fetch request
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
        if (err.name === 'AbortError') {
          console.log(`TTS generation for interaction count ${interactionCount} was aborted.`);
        } else {
          console.error('Error occurred in XI Labs TextToSpeech service');
          console.error(err);
        }
        break; // Exit the loop on other errors
      }
    }

    // Clean up the AbortController after the request is done
    delete this.abortControllers[interactionCount];
  }

  stop(interactionCount) {
    if (this.abortControllers[interactionCount]) {
      this.abortControllers[interactionCount].abort();
      delete this.abortControllers[interactionCount];
      console.log(`Stopped TTS for interaction count: ${interactionCount}`);
    }
  }
}

module.exports = { TextToSpeechService };