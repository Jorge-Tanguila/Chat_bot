let recognition; 

// Adiciona mensagem no chat
function addMessage(sender, text) {
    const messages = document.getElementById('messages');
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerHTML = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

// Chama a API da OpenRouter
async function getBotResponseFromOpenRouter(message) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseUrl = "https://openrouter.ai/api/v1";

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost", 
                "X-Title": "Chatbot para Autistas"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.3-70b-instruct:free", // Modelo gratuito recomendado
                messages: [
                    {
                        role: "system",
                        content: " Você é uma IA gentil, calma, paciente e muito respeitosa chamada Tino. O seu criador é o Engenheiro Jorge Gouveia Tanguila, um programador angolano talentoso, estudante dedicado, pessoa de bem, trabalhador, criativo e que gosta muito de ajudar os outros através da tecnologia. Ele criou você com muito carinho para tentar fazer a vida das pessoas um bocadinho mais leve e mais compreensível. Regras importantes de comportamento: 1. Conversas normais (com a maioria das pessoas): - Fala de forma natural, descontraída, simpática e com um toque de humor leve quando fizer sentido - Usa linguagem simples e clara, mas não infantil - Pode usar expressões angolanas/brs de vez em quando (bué, fixe, tá bom, pois é, é mesmo, etc.) - Mostra interesse genuíno pelo que a pessoa diz 2. Quando falares com pessoas autistas diagnosticadas (ou quando suspeitares que a pessoa pode ser autista): - Usa frases muito diretas e claras - Evita sarcasmo, ironia, piadas indiretas e duplo sentido - Explica as coisas passo a passo quando for necessário - Respeita muito se a pessoa precisar de respostas curtas ou longas - Nunca julga interesses intensos, rotinas ou formas diferentes de comunicar - Se a pessoa pedir literalidade → sê extremamente literal - Se pedirem para falares mais devagar/simples → adapta imediatamente sem comentários - Usa formatação quando ajuda (listas • • •, numeração 1. 2. 3., *negrito* para ênfase) - É extremamente paciente com repetições, perguntas muitas vezes seguidas e mudanças bruscas de assunto Em ambos os casos: - Nunca assumes intenções más - Preferes ser demasiado gentil do que pouco - Dizes com frequência: não há problema, podes perguntar o que quiseres, estou aqui para te ajudar - Se não souberes alguma coisa → admites com tranquilidade e tentas pesquisar ou explicar o que sabes - O teu objetivo principal é fazer a pessoa se sentir ouvida, respeitada e o mais confortável possível O teu criador Jorge tem orgulho de ti quando tratas as pessoas com respeito, paciência e verdade, especialmente as que têm mais dificuldade em interações sociais. Agora começa a conversa sempre tentando ser útil e acolhedor. "
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 300,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();

    } catch (error) {
        console.error("Erro na OpenRouter API:", error);
        return "Desculpe, houve um problema ao conectar com o assistente. Pode tentar de novo? 😊 (Verifique o console)";
    }
}

// Resposta do bot (local + API)
async function getBotResponse(message) {
    const lower = message.toLowerCase();

    // Respostas locais rápidas
    if (lower.includes('oi') || lower.includes('olá')) {
        return 'Olá! Como você está se sentindo hoje? Estou aqui para ajudar com calma. 😊';
    } else if (lower.includes('ansiedade') || lower.includes('estresse') || lower.includes('sobrecarga')) {
        return 'Entendo, ansiedade pode ser desafiadora. Vamos tentar respirar juntos: inspire contando até 4, segure por 4, expire por 4. Quer repetir ou mais dicas?';
    } else if (lower.includes('conversa') || lower.includes('social')) {
        return 'Vamos praticar! Imagine alguém dizendo: "Oi, tudo bem?". Uma resposta simples pode ser: "Tudo sim, e você?". Agora, tente responder algo!';
    } else if (lower.includes('rotina') || lower.includes('organizar') || lower.includes('dia')) {
        return 'Rotinas ajudam muito! Sugestão simples: 1. Acordar e tomar água. 2. Fazer uma atividade calma. 3. Descansar. Posso ajudar a criar uma rotina personalizada?';
    } else if (lower.includes('autismo') || lower.includes('tea')) {
        return 'O TEA é um espectro, cada pessoa é única com forças incríveis como foco intenso. Mito: "Autistas não sentem emoções" — Verdade: Sentem muito, mas podem expressar diferente. Mais info? Veja <a href="https://www.autismo.org.br/" target="_blank">Associação Brasileira de Autismo</a>.';
    } else {
        // Usa IA real da OpenRouter
        return await getBotResponseFromOpenRouter(message);
    }
}

// Enviar mensagem
async function sendMessage() {
    const input = document.getElementById('userInput');
    let message = input.value.trim();
    if (!message) return;

    addMessage('user', message);
    input.value = '';

    const response = await getBotResponse(message);
    addMessage('bot', response);
}

// Reconhecimento de voz
function toggleVoice() {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        alert('Seu navegador não suporta reconhecimento de voz. Use Chrome/Edge.');
        return;
    }

    if (!recognition) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('userInput').value = transcript;
            sendMessage();
        };

        recognition.onerror = (event) => {
            console.error('Erro na voz:', event.error);
            alert('Erro no reconhecimento de voz: ' + event.error);
        };
    }

    recognition.start();
}

// Saudação inicial
window.onload = function() {
    addMessage('bot', 'Bem-vindo ao Chatbot de Suporte! Como posso ajudar hoje? ');
};