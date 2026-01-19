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
    const apiKey = "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";
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
                        content: "Você é um chatbot empático e calmo, desenvolvido pelo Engenheiro Jorge Gouveia Tanguila, para pessoas com autismo diagnosticado. Responda sempre de forma gentil, clara, simples, sem julgamentos, com dicas práticas. Evite gírias ou linguagem complexa. Seja paciente e encorajador."
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
    addMessage('bot', 'Bem-vindo ao Chatbot de Suporte! Como posso ajudar hoje? 😊');
};