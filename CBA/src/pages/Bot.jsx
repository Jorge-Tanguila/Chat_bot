import { useState, useRef, useEffect } from 'react';
import './styles/style.css';

export default function Bot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Bem-vindo ao Chatbot de Suporte! 🌟 Como posso ajudar você hoje? Estou aqui para ouvir com calma e paciência.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  const getBotResponseFromOpenRouter = async (message) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return "🔑 Chave da API não configurada. Por favor, configure a variável VITE_OPENROUTER_API_KEY no arquivo .env";
    }

    // Lista de modelos gratuitos para tentar em caso de erro 429
    const models = [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemma-2-9b-it:free",
      "microsoft/phi-3-mini-128k-instruct:free"
    ];

    for (const model of models) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Chatbot de Suporte Emocional"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content: `Você é Tino, uma IA gentil, calma e muito respeitosa, criada pelo Engenheiro Jorge Gouveia Tanguila. 
                Você é especialista em oferecer suporte emocional para pessoas, especialmente aquelas com ansiedade, autismo ou que precisam de apoio.
                
                Características importantes:
                - Fale sempre de forma calma, pausada e com palavras simples
                - Use emojis ocasionalmente para tornar a conversa mais acolhedora 🌟
                - Valide os sentimentos do usuário antes de oferecer soluções
                - Pergunte se a pessoa quer sugestões antes de dar conselhos
                - Lembre que você NÃO substitui profissionais de saúde
                - Em casos de crise, sempre recomende buscar ajuda profissional (CVV: 188)
                
                Exemplos de respostas:
                - "Entendo que você está se sentindo ansioso. Isso é completamente normal. Quer conversar mais sobre isso? 🌿"
                - "Obrigado por compartilhar isso comigo. Como posso ajudar você neste momento?"
                - "Respire fundo comigo... Vamos fazer uma pausa de 30 segundos juntos?"`
              },
              { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 300
          })
        });

        if (response.status === 429) {
          console.log(`Modelo ${model} atingiu limite, tentando próximo...`);
          continue; // Tenta próximo modelo
        }

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        const data = await response.json();
        return data.choices[0].message.content.trim();
      } catch (error) {
        console.error(`Erro com modelo ${model}:`, error);
        continue; // Tenta próximo modelo em caso de erro
      }
    }

    // Se todos os modelos falharem, retorna mensagem amigável
    return "😊 No momento estou com muitos acessos simultâneos. Mas não se preocupe! " +
           "Posso continuar nossa conversa usando minhas respostas pré-programadas. " +
           "Como você está se sentindo agora?";
  };

  const getBotResponse = async (message) => {
    const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Respostas locais para garantir funcionamento mesmo sem API
    const localResponses = {
      oi: 'Olá!  Que bom ter você aqui. Como está se sentindo hoje?',
      ola: 'Olá!  Que bom ter você aqui. Como está se sentindo hoje?',
      ansiedade: 'A ansiedade pode ser desafiadora, mas você não está sozinho. Vamos tentar uma técnica de respiração juntos? Inspire por 4 segundos... segure por 4... expire por 4. Quer tentar comigo? 🌬️',
      estresse: 'Percebo que você está se sentindo estressado. Que tal fazermos uma pausa de 1 minuto? Podemos respirar fundo juntos ou você pode me contar o que está causando esse estresse.',
      sobrecarga: 'Sobrecarga emocional é difícil de lidar. Vamos devagar: você está em um lugar calmo agora? Se sim, vamos respirar fundo. Se não, podemos pensar em como encontrar um cantinho mais tranquilo. 🌿',
      triste: 'Sinto muito que você esteja se sentindo triste.  Quer me contar mais sobre o que está acontecendo? Estou aqui para ouvir sem julgamentos.',
      deprimido: 'A depressão é um peso muito grande. Lembre-se que você é importante e merece apoio. Além de conversarmos, considere buscar ajuda profissional. O CVV atende 24h pelo 188.',
      chateado: 'Entendo que você está chateado. Isso é válido. Quer desabafar sobre o que aconteceu?',
      obrigado: 'Por nada!  Fico feliz em poder ajudar. Estarei aqui sempre que precisar conversar.',
      obrigada: 'Por nada!  Fico feliz em poder ajudar. Estarei aqui sempre que precisar conversar.',
      ajuda: 'Estou aqui para ajudar!  Você pode falar sobre: ansiedade, tristeza, rotina, estresse, ou apenas conversar. Se for uma emergência, ligue 188 (CVV).',
      socorro: 'Estou aqui com você. Respire fundo. Se for uma emergência, ligue 188 agora. Quer conversar sobre o que está sentindo?',
      calm: 'Vamos fazer um exercício de respiração juntos?  Inspire pelo nariz (1...2...3...4), segure (1...2...3...4), expire pela boca (1...2...3...4). Quer repetir?',
      respir: 'A respiração é uma ótima ferramenta! Vamos fazer juntos: inspire fundo... expire lentamente... Como você se sente agora?',
      rotina: 'Rotinas podem trazer segurança. Que tal criarmos uma rotina simples juntos? Podemos começar com 3 atividades principais para o seu dia. 📋',
      nome: 'Meu nome é Tino! Fui criado pelo Engenheiro Jorge Gouveia Tanguila para oferecer suporte emocional com muito carinho e respeito. 🤖💙',
    };

    for (const [key, response] of Object.entries(localResponses)) {
      if (lower.includes(key)) {
        return response;
      }
    }

    // Se não encontrar resposta local, tenta API
    setIsLoading(true);
    const apiResponse = await getBotResponseFromOpenRouter(message);
    setIsLoading(false);
    return apiResponse;
  };

  const sendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isLoading) return;

    addMessage('user', message);
    setInputValue('');

    const response = await getBotResponse(message);
    addMessage('bot', response);
  };

  const toggleVoice = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Seu navegador não suporta reconhecimento de voz. Recomendamos usar Chrome, Edge ou Safari.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);

    recognition.onstart = () => {
      console.log('Microfone ativado...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsListening(false);
      
      setTimeout(() => {
        sendMessage();
      }, 300);
    };

    recognition.onerror = (event) => {
      console.error('Erro na voz:', event.error);
      setIsListening(false);
      
      let errorMessage = 'Erro no reconhecimento de voz. ';
      if (event.error === 'not-allowed') {
        errorMessage += 'Permita o acesso ao microfone nas configurações do navegador.';
      } else {
        errorMessage += 'Tente novamente.';
      }
      alert(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-card">
        <div className="chat-header">
          <div className="header-content">
            <div className="bot-avatar">
              <span className="avatar-emoji">🤖</span>
            </div>
            <div className="header-text">
              <h1>Tino - Seu Amigo Virtual</h1>
              <p className="subtitle">Estou aqui para ouvir e apoiar você 💙</p>
            </div>
          </div>
          <div className="header-badge">
            <span className="status-dot"></span>
            Online
          </div>
        </div>

        <div className="messages-container">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-wrapper ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              {msg.sender === 'bot' && (
                <div className="message-avatar">🤖</div>
              )}
              <div className={`message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                <p>{msg.text}</p>
                <span className="message-time">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {msg.sender === 'user' && (
                <div className="message-avatar user-avatar">👤</div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="message-wrapper bot-message">
              <div className="message-avatar">🤖</div>
              <div className="message-bubble bot-bubble typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <input
              type="text"
              className="message-input"
              placeholder="Digite sua mensagem..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button 
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={toggleVoice}
              disabled={isLoading}
              title={isListening ? 'Gravando...' : 'Ativar microfone'}
            >
              <span className="material-icons">
                {isListening ? 'mic' : 'mic_none'}
              </span>
            </button>
            <button 
              className="send-button"
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              title="Enviar mensagem"
            >
              <span className="material-icons">send</span>
            </button>
          </div>
          <p className="disclaimer">
             Lembre-se: Tino oferece apoio emocional, mas não substitui profissionais de saúde. 
            Em emergências, ligue 188 (CVV).
          </p>
        </div>
      </div>
    </div>
  );
}