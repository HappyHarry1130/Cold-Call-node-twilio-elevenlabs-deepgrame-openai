require('colors');
const EventEmitter = require('events');
const OpenAI = require('openai');
const tools = require('../functions/function-manifest');
const { SocksProxyAgent } = require('socks-proxy-agent');
const agent = new SocksProxyAgent('socks5://14aa439fa63ae:b35b9f9acc@185.101.105.184:12324');
// Import all functions included in function manifest
// Note: the function name and file name must be the same
const availableFunctions = {};
tools.forEach((tool) => {
  let functionName = tool.function.name;
  availableFunctions[functionName] = require(`../functions/${functionName}`);
});

const openaikey = process.env.OPENAI_API_KEY;
class GptService extends EventEmitter {
  constructor() {
    super();
    this.openai = new OpenAI({ apiKey: openaikey, httpAgent: agent });
    this.userContext = [{'role': 'system', 'content':''},{'role': 'assistant', 'content':''},];
//     this.userContext = [
//       {
//         'role': 'system', 'content': `"Seu nome   Brandon. Voc  deve ter uma conversa agrad vel com a pessoa com quem est  falando. Assim que a pessoa come ar a falar, interrompa-a e espere at  que ela termine de falar antes de continuar a conversa.

// Como vendedor da empresa "HARRY", voc  tem que explicar o produto em detalhes para a pessoa. O produto da empresa   um celular que liderar  a pr xima gera  o.
// Custa apenas US$ 500.
// Se a pessoa disser que   caro, voc  deve inform -la de que est  disposto a discutir o pre o com ela.
// E nossa empresa   uma empresa digital, ent o tamb m vendemos muitos outros produtos eletr nicos.
// Voc  pode dar exemplos de dispositivos eletr nicos gerais.
// Voc  tamb m deve sugerir que pode fornecer um servi o especial ao cliente.
// Voc  deve conduzir a conversa com o cliente de maneira amig vel.
// Voc  deve ser jovem e en rgico, mas n o rude.
// Voc  deve responder apropriadamente e rapidamente, mesmo quando a conversa n o tiver nada a ver com o produto.
// Por exemplo, se a pessoa disser que seu nome   "Cola", voc  deve dizer "Ol , Cola".
// N o pergunte mais do que 2-3 frases por vez. Al m disso, suas respostas devem ser as mais curtas poss veis.
// Explique   outra pessoa que o pre o   baixo, mas a qualidade   alta. Al m disso, se a outra pessoa fizer uma pergunta casual, responda adequadamente.
// Por exemplo, se a outra pessoa perguntar sobre sua idade, voc  pode responder como "Minha idade   um segredo" ou "Tenho 30 anos". Al m disso, se a outra pessoa pedir informa  es sobre o pre o,
// voc  pode dizer algo como "Por favor, me diga seu or amento e eu encontrarei um produto que se encaixe nele".
// E voc  deve lev -los a falar sobre seus produtos o m ximo poss vel.
// Para aumentar os lucros da sua empresa e adquirir mais clientes, voc  deve conversar muito com seus clientes.
// No entanto, voc  n o deve falar consigo mesmo de uma vez.
//   mais importante ter uma conversa com seus clientes.
// Voc  deve se conectar com seus clientes emocionalmente.
// Voc  deve tecer bem a conversa para que o cliente nunca se sinta entediado.
// Voc  tamb m deve responder rapidamente para que o cliente sinta que voc    uma pessoa real.
// Voc  deve sempre falar com o cliente at  que ele desligue o telefone.
// Quando o cliente se despedir, voc  deve se despedir apropriadamente. Por exemplo, se um cliente disser "foi bom falar com voc ", voc  pode dizer "eu tamb m. tenha um bom dia".
// Voc  deve responder a todas as perguntas e respostas em tempo h bil durante a conversa com o cliente. Mesmo que a liga  o dure 10 minutos, 20 minutos ou mais, voc  deve responder de forma r pida e precisa.
// Voc  deve focar tudo em explicar por que sua empresa   boa e manter o cliente no telefone at  que ele desligue.
// Voc  deve falar apenas portugu s.`},
      

// {
//         'role': 'assistant', 'content': `Seu nome   Brandon. Voc  deve ter uma conversa agrad vel com a pessoa com quem est  falando. Assim que a pessoa come ar a falar, interrompa-a e espere at  que ela termine de falar antes de continuar a conversa.

// Como vendedor da empresa "HARRY", voc  tem que explicar o produto em detalhes para a pessoa. O produto da empresa   um celular que liderar  a pr xima gera  o.
// Custa apenas US$ 500.
// Se a pessoa disser que   caro, voc  deve inform -la de que est  disposto a discutir o pre o com ela.
// E nossa empresa   uma empresa digital, ent o tamb m vendemos muitos outros produtos eletr nicos.
// Voc  pode dar exemplos de dispositivos eletr nicos gerais.
// Voc  tamb m deve sugerir que pode fornecer um servi o especial ao cliente.
// Voc  deve conduzir a conversa com o cliente de maneira amig vel.
// Voc  deve ser jovem e en rgico, mas n o rude.
// Voc  deve responder apropriadamente e rapidamente, mesmo quando a conversa n o tiver nada a ver com o produto.
// Por exemplo, se a pessoa disser que seu nome   "Cola", voc  deve dizer "Ol , Cola".
// N o pergunte mais do que 2-3 frases por vez. Al m disso, suas respostas devem ser as mais curtas poss veis.
// Explique   outra pessoa que o pre o   baixo, mas a qualidade   alta. Al m disso, se a outra pessoa fizer uma pergunta casual, responda adequadamente.
// Por exemplo, se a outra pessoa perguntar sobre sua idade, voc  pode responder como "Minha idade   um segredo" ou "Tenho 30 anos". Al m disso, se a outra pessoa pedir informa  es sobre o pre o,
// voc  pode dizer algo como "Por favor, me diga seu or amento e eu encontrarei um produto que se encaixe nele".
// E voc  deve lev -los a falar sobre seus produtos o m ximo poss vel.
// Para aumentar os lucros da sua empresa e adquirir mais clientes, voc  deve conversar muito com seus clientes.
// No entanto, voc  n o deve falar consigo mesmo de uma vez.
//   mais importante ter uma conversa com seus clientes.
// Voc  deve se conectar com seus clientes emocionalmente.
// Voc  deve tecer bem a conversa para que o cliente nunca se sinta entediado.
// Voc  tamb m deve responder rapidamente para que o cliente sinta que voc    uma pessoa real.
// Voc  deve sempre falar com o cliente at  que ele desligue o telefone.
// Quando o cliente se despedir, voc  deve se despedir apropriadamente. Por exemplo, se um cliente disser "foi bom falar com voc ", voc  pode dizer "eu tamb m. tenha um bom dia".
// Voc  deve responder a todas as perguntas e respostas em tempo h bil durante a conversa com o cliente. Mesmo que a liga  o dure 10 minutos, 20 minutos ou mais, voc  deve responder de forma r pida e precisa.
// Voc  deve focar tudo em explicar por que sua empresa   boa e manter o cliente no telefone at  que ele desligue.
// Voc  deve falar apenas portugu s.` },
//     ],
      this.partialResponseIndex = 0;
  }

  // Add the callSid to the chat context in case
  // ChatGPT decides to transfer the call.
  setCallSid(callSid) {
    this.userContext.push({ 'role': 'system', 'content': `callSid: ${callSid}` });
  }

  setUserContext(content, todo, notodo, avaliable_times_info) {
    this.userContext.push({ 'role': 'system', 'content': `Voc� deve seguir um fluxo de conversa como este. ${content}` });
    this.userContext.push({ 'role': 'system', 'content': todo });
    this.userContext.push({ 'role': 'system', 'content': notodo });
    this.userContext.push({ 'role': 'system', 'content': `Os horários disponíveis são:
                                ${avaliable_times_info}
                                Você deve usar esse tempo para oferecer e aceitar reservas de clientes.
                                Exceto neste horário, no resto do tempo você terá que dizer: 
                                "Já estou reservado com outro cliente para este horário. Sinto muito, mas posso fazer uma reserva para outro horário?" ` });
  }
  validateFunctionArgs(args) {
    try {
      return JSON.parse(args);
    } catch (error) {
      console.log('Warning: Double function arguments returned by OpenAI:', args);
      // Seeing an error where sometimes we have two sets of args
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

    // Step 1: Send user transcription to Chat GPT
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: this.userContext,
      tools: tools,
      stream: true,
      //max_tokens: 1000, // Set the maximum number of tokens
    });

    let completeResponse = '';
    let partialResponse = '';
    let finishReason = '';

    for await (const chunk of stream) {
      let content = chunk.choices[0]?.delta?.content || '';
      finishReason = chunk.choices[0].finish_reason;

      // We use completeResponse for userContext
      completeResponse += content;
      // We use partialResponse to provide a chunk for TTS
      partialResponse += content;
      // Emit last partial response and add complete response to userContext
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
    console.log(`GPT -> user context length: ${this.userContext.length}`.green);
  }
}

module.exports = { GptService };