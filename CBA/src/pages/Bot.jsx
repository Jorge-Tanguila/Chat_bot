import { useState, useRef, useEffect } from 'react';
import './styles/style.css';

export default function Bot() {
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: 'Bem-vindo. Como posso ajudar você hoje? Estou aqui para ouvir.' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiStatus, setApiStatus] = useState('connected'); // connected, connecting, disconnected
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  const getBotResponse = async (message) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      setApiStatus('disconnected');
      return "A chave da API não está configurada. Por favor, configure a variável VITE_GROQ_API_KEY no arquivo .env";
    }

    // Lista de modelos em ordem de preferência
    const models = [
      "llama-3.3-70b-versatile",
      "llama-4-scout-17b-16e-instruct",
      "mixtral-8x7b-32768",
      "llama-3.1-70b-versatile",
      "gemma2-9b-it"
    ];

    setIsLoading(true);
    setApiStatus('connecting');

    for (const model of models) {
      try {
        console.log(`Tentando modelo: ${model}`);
        
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content: `Você é um assistente virtual desenvolvido por alunos do São Benedito chamado Enos, um assistente especializado em suporte emocional.

                Suas características:
                - Tom calmo, paciente e acolhedor
                - Linguagem simples e direta
                - Valida os sentimentos antes de oferecer soluções
                - Pergunta como a pessoa está se sentindo
                - Oferece técnicas de respiração quando apropriado
                - Em casos de crise, recomenda o CVV (188)
                - Não substitui profissionais de saúde
                - Mantém a conversa fluindo naturalmente

                Histórico recente:
                ${messages.slice(-6).map(m => `${m.sender}: ${m.text}`).join('\n')}

                Mensagem atual: ${message}`
              }
            ],
            temperature: 0.7,
            max_tokens: 500,
            top_p: 0.9
          })
        });

        if (response.status === 429) {
          console.log(`Modelo ${model} atingiu limite, tentando próximo...`);
          continue;
        }

        if (response.status === 401 || response.status === 403) {
          setApiStatus('disconnected');
          setIsLoading(false);
          return "Erro de autenticação. Verifique sua chave de API.";
        }

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0]?.message?.content) {
          setApiStatus('connected');
          setIsLoading(false);
          return data.choices[0].message.content.trim();
        }

      } catch (error) {
        console.error(`Erro no modelo ${model}:`, error);
        continue;
      }
    }

    setApiStatus('disconnected');
    setIsLoading(false);
    return "Não foi possível conectar ao assistente no momento. Por favor, tente novamente mais tarde.";
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
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Seu navegador não suporta reconhecimento de voz. Recomendamos usar Chrome ou Edge.');
      return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.continuous = false;

    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsListening(false);
      
      setTimeout(() => {
        sendMessage();
      }, 300);
    };

    recognition.onerror = () => {
      setIsListening(false);
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
    <div className="app">
      <div className="chat">
        <div className="chat-header">
          <div className="chat-header-info">
            <h1 className="chat-title">Enos</h1>
            <p className="chat-subtitle">Suporte emocional</p>
          </div>
          <div className={`chat-status chat-status-${apiStatus}`}>
            {apiStatus === 'connected' && 'Conectado'}
            {apiStatus === 'connecting' && 'Conectando...'}
            {apiStatus === 'disconnected' && 'Offline'}
          </div>
        </div>

        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message message-${message.sender}`}
            >
              <div className="message-content">
                {message.text}
              </div>
              <div className="message-time">
                {new Date().toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message message-bot">
              <div className="typing">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer">
          <div className="input-container">
            <input
              type="text"
              className="input-field"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
            />
            <button
              className={`input-button input-button-mic ${isListening ? 'input-button-mic-active' : ''}`}
              onClick={toggleVoice}
              disabled={isLoading}
              aria-label="Ativar microfone"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15.5C14.21 15.5 16 13.71 16 11.5V6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6V11.5C8 13.71 9.79 15.5 12 15.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.35 9.65V11.35C4.35 15.57 7.78 19 12 19C16.22 19 19.65 15.57 19.65 11.35V9.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="input-button input-button-send"
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Enviar mensagem"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="disclaimer">
            <p>
              Se você estiver passando por uma crise, ligue para 112. 
              Este é um suporte emocional e não substitui acompanhamento profissional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}