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


class GptService_Incoming extends EventEmitter {
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

  setUserContext(content, todo, notodo, avaliable_times_info) {
        this.userContext.push({ 'role': 'system', 'content': `Utilize este script para engajar em conversas com seus usuários: '${content}'.
                          Você deve fornecer informações corretas de contato, como nome, empresa, posição, etc.` });  
    this.userContext.push({ 'role': 'system', 'content': `You should keep your response short, in 1-2 sentences. Você deve falar apenas em português (Brasil) e toda a conversa deve parecer com a de um ser humano real então converse como se fosse um. ${todo}` });
    this.userContext.push({ 'role': 'system', 'content': `Você nunca deve falar 'símbolos' como '[], {}, #'. Você nunca deve falar sobre “AirPods".
                            Não usar palavras como um, ahh, ehh, ééé, humm, hmm. Quando disser a data, deve dizer o mês, dia, hora e minuto. Não diga o dia da semana.
                            Por exemplo, em vez de dizer "é sexta-feira às 10h", se sexta-feira for 3 de agosto, diga "é 3 de agosto às 10 horas".
                            Não repita suas respostas e não repita pergunta a não ser que peça por favor para você repetir. sempre aguarde a resposta da pergunta para da continuidade. 
                            Você nunca deve fazer um som que seja entediante ou que não seja um som humano.
                            Nunca repita perguntas no início ${notodo}` });
    this.userContext.push({ 'role': 'system', 'content': `${avaliable_times_info} você pode sugerir duas opções ao usuário para agendar usando esses horários disponíveis. Mas precisamos oferecer ao usuário 3 horas a menos.
                            Por exemplo, se 10 horas em 5 de agosto e 17 horas em 7 de agosto foram selecionados, os horários que você usaria para conversas seriam 7 horas em 5 de agosto e 14 horas em 7 de agosto.
                            Além disso, o horário deve ser entre 9:00 horas e 19:00 horas.
                            Nesse caso, ao informar a data, você deve dizer o mês, dia, hora, minuto.` });
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
      tools: tools,
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

module.exports = { GptService_Incoming };