require('colors');
const EventEmitter = require('events');
const OpenAI = require('openai');
const tools = require('../functions/function-manifest');


const availableFunctions = {};
tools.forEach((tool) => {
  let functionName = tool.function.name;
  availableFunctions[functionName] = require(`../functions/${functionName}`);
});

const openaikey = process.env.OPENAI_API_KEY;


class GptService extends EventEmitter {
  constructor() {
    super();
    this.openai = new OpenAI({ apiKey: openaikey });
    this.userContext = [{'role': 'system', 'content':''},{'role': 'assistant', 'content':''}];
    this.partialResponseIndex = 0;
    this.activeStreams = {};
  }

  setCallSid(callSid) {
    this.userContext.push({ 'role': 'system', 'content': `callSid: ${callSid}` });
  }

  setUserContext(content, todo, notodo, fullname, ai_profile_name) {
    this.userContext.push({ 'role': 'system', 'content': `Use this script to engage in conversations with your users: '${content}'.
    You should provide accurate contact information, such as name, company, position, etc.` });
    this.userContext.push({ 'role': 'system', 'content': `You should keep your response short, in 1-2 sentences. You should sound like a real human being so talk like one. ${todo}` }); this.userContext.push({ 'role': 'system', 'content': `You should never say 'symbols' like '[], {}, #'. You should never say "AirPods".
    Do not use words like um, ahh, ehh, yea, umm, hmm. When you say the date, you should say the month, day, hour, and minute. Do not say the day of the week.
    For example, instead of saying "it's Friday at 10:00 AM", if Friday is August 3rd, say "it's August 3rd at 10:00 AM".
    Do not repeat your answers and do not repeat questions unless asked to please repeat. Always wait for the answer to the question before continuing.
    You should never make a sound that is boring or that is not a human sound.
    Never repeat questions at the beginning ${notodo}` });
    this.userContext.push({ 'role': 'system', 'content': `The name user's name is ${fullname} and their name is ${ai_profile_name}` });
    this.userContext.push({ 'role': 'system', 'content': ` you can suggest two options to the user to schedule using these available times. But we need to offer the user 3 hours less.
    For example, if 10 am on August 5th and 5 pm on August 7th were selected, the times you would use for conversations would be 7 am on August 5th and 2 pm on August 7th.
    Also, the time must be between 9:00 am and 7:00 pm.
    In this case, when providing the date, you should provide the month, day, hour, minute.` });
    }

  validateFunctionArgs(args) {
    try {
      return JSON.parse(args);
    } catch (error) {
      console.log('Aviso: Argumentos de função duplicados retornados pelo OpenAI:', args);
      if (args.indexOf('{') != args.lastIndexOf('{')) {
        return JSON.parse(args.substring(args.indexOf(''), args.indexOf('}') + 1));
      }
    }
  }

  updateUserContext(name, role, text) {
    if (name !== 'user') {
      this.userContext.push({ 'role': role, 'name': name, 'content': text });
    } else {
      this.userContext.push({ 'role': role, 'content': text });
    }
  }

  async completion(text, interactionCount, role = 'user', name = 'user', maxTokens = 100) {
    this.updateUserContext(name, role, text);

    if (this.activeStreams[interactionCount]) {
      this.activeStreams[interactionCount].abort = true;
    }

    const controller = new AbortController();
    this.activeStreams[interactionCount] = controller;
    // Passo 1: Enviar a transcrição do usuário para o Chat GPT
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: this.userContext,
      //tools: tools,
      stream: true,
      //max_tokens: 1000, // Define o número máximo de tokens
    });

    this.activeStreams[interactionCount] = { stream, abort: false };
    
    let completeResponse = '';
    let partialResponse = '';
    let finishReason = '';

    for await (const chunk of stream) {
      let content = chunk.choices[0]?.delta?.content || '';
      finishReason = chunk.choices[0].finish_reason;

      // Usamos completeResponse para userContext
      completeResponse += content;
      // Usamos partialResponse para fornecer um chunk para TTS
      partialResponse += content;
      // Emitir última resposta parcial e adicionar resposta completa ao userContext
      if ([' ', '.', ',', '?', '!', ';', ':', ' ', '-', '(', ')', '[', ']', '}', ' '].includes(content.trim().slice(-1)) || finishReason === 'stop') {
        const gptReply = {
          partialResponseIndex: this.partialResponseIndex,
          partialResponse
        };

        this.emit('gptreply', gptReply, interactionCount);
        this.partialResponseIndex++;
        partialResponse = '';
      }
    }
    this.userContext.push({ 'role': 'assistant', 'content': completeResponse });
    console.log(`GPT -> tamanho do user context: ${this.userContext.length}`.green);
    delete this.activeStreams[interactionCount];
  }

  stop(interactionCount) {
    if (this.activeStreams[interactionCount]) {
      this.activeStreams[interactionCount].abort();
      delete this.activeStreams[interactionCount];
      console.log(`Stopping GPT service for interaction ${interactionCount}`);
    }
  }
}

module.exports = { GptService };