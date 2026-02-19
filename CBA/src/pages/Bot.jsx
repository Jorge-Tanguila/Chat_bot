import { useState, useRef, useEffect } from 'react';
import './styles/style.css';

export default function Bot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Bem-vindo! Como posso ajudar você hoje? Estou aqui para ouvir.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  // Lista ATUALIZADA de modelos gratuitos do OpenRouter (Fevereiro 2026)
  const FREE_MODELS = [
    "meta-llama/llama-4-maverick:free",    // Lançado Abril/2025 - 256K contexto [citation:2]
    "meta-llama/llama-4-scout:free",       // Lançado Abril/2025 - 512K contexto [citation:2]
    "openrouter/pony-alpha:free",          // Lançado Fevereiro/2026 - 200K contexto [citation:4]
    "google/gemini-2.5-pro-exp-03-25:free", // Experimental - 1M contexto [citation:5]
    "moonshotai/kimi-vl-a3b-thinking:free", // Eficiente para raciocínio [citation:5]
    "nvidia/llama-3.1-nemotron-nano-8b-v1:free", // Rápido para tarefas simples [citation:5]
    "deepseek/deepseek-v3.1-nex-n1:free"   // 131K contexto [citation:6]
  ];

  const getBotResponseFromOpenRouter = async (message) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      setApiAvailable(false);
      return "Configure a chave da API no arquivo .env (VITE_OPENROUTER_API_KEY)";
    }

    // Tenta cada modelo até um funcionar
    for (const model of FREE_MODELS) {
      try {
        console.log(`Tentando modelo: ${model}`);
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Chatbot de Suporte"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content: `Você é um assistente gentil e acolhedor para suporte emocional. 
                Fale de forma calma e use linguagem simples. 
                Valide os sentimentos da pessoa antes de oferecer conselhos.
                Em casos de crise, recomende o CVV (188).`
              },
              { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        // Se for 429 (limite de taxa), tenta próximo modelo
        if (response.status === 429) {
          console.log(`Modelo ${model} atingiu limite, tentando próximo...`);
          continue;
        }

        // Se for 404 (modelo não encontrado), tenta próximo
        if (response.status === 404) {
          console.log(`Modelo ${model} não encontrado, tentando próximo...`);
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setApiAvailable(true);
        return data.choices[0].message.content.trim();

      } catch (error) {
        console.error(`Erro com modelo ${model}:`, error.message);
        // Continua para o próximo modelo
      }
    }

    // Se todos os modelos falharem
    setApiAvailable(false);
    return "No momento estou com dificuldades de conexão. Mas podemos continuar conversando com minhas respostas preparadas. Como você está se sentindo?";
  };

  // Respostas locais completas (funcionam SEMPRE, mesmo sem API)
  const getLocalResponse = (message) => {
    const text = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Saudação
    if (text.includes('oi') || text.includes('olá') || text.includes('ola')) {
      return 'Olá! Como você está se sentindo hoje?';
    }
    
    // Ansiedade
    if (text.includes('ansiedade') || text.includes('ansioso') || text.includes('ansiosa')) {
      return 'A ansiedade pode ser difícil. Vamos respirar juntos? Inspire por 4 segundos, segure por 4, expire por 4. Quer tentar?';
    }
    
    // Tristeza
    if (text.includes('triste') || text.includes('deprimido') || text.includes('deprimida')) {
      return 'Sinto muito que você esteja se sentindo assim. Quer conversar sobre o que está acontecendo? Estou aqui para ouvir.';
    }
    
    // Estresse
    if (text.includes('estresse') || text.includes('stress') || text.includes('sobrecarga')) {
      return 'Estresse é pesado. Que tal fazermos uma pausa de um minuto? Respire fundo comigo.';
    }
    
    // Agradecimento
    if (text.includes('obrigado') || text.includes('obrigada')) {
      return 'Por nada! Estou aqui sempre que precisar.';
    }
    
    // Ajuda/Crise
    if (text.includes('ajuda') || text.includes('socorro') || text.includes('emergência')) {
      return 'Se você está em crise, ligue para o CVV: 188 (24 horas). Estou aqui para conversar também.';
    }
    
    // Respiração/Calma
    if (text.includes('calma') || text.includes('respirar') || text.includes('acalmar')) {
      return 'Vamos respirar juntos: inspire (1...2...3...4), segure (1...2...3...4), expire (1...2...3...4). Como se sente?';
    }
    
    // Rotina
    if (text.includes('rotina') || text.includes('organizar') || text.includes('tarefa')) {
      return 'Rotinas ajudam. Que tal listarmos 3 pequenas tarefas para hoje?';
    }
    
    // Nome
    if (text.includes('nome') || text.includes('chama')) {
      return 'Meu nome é Tino. Fui criado para oferecer suporte emocional.';
    }
    
    // Resposta padrão
    return 'Entendi. Conte-me mais sobre como você está se sentindo.';
  };

  const getBotResponse = async (message) => {
    // Primeiro tenta resposta local (mais rápida)
    const localResponse = getLocalResponse(message);
    
    // Se for uma saudação simples, usa resposta local mesmo
    if (message.length < 20) {
      return localResponse;
    }

    // Para mensagens mais complexas, tenta API
    setIsLoading(true);
    try {
      const apiResponse = await getBotResponseFromOpenRouter(message);
      setIsLoading(false);
      return apiResponse;
    } catch (error) {
      setIsLoading(false);
      // Se API falhar, usa resposta local
      return localResponse;
    }
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
      alert('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.');
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
      alert('Erro no microfone. Tente novamente.');
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
            <div className="bot-avatar">🤖</div>
            <div>
              <h2>Tino</h2>
              <p className="subtitle">Estou aqui para ouvir</p>
            </div>
          </div>
          <div className={`status-indicator ${apiAvailable ? 'online' : 'offline'}`}>
            {apiAvailable ? 'Conectado' : 'Modo offline'}
          </div>
        </div>

        <div className="messages-area">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">{msg.text}</div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
          />
          <button 
            className="voice-btn"
            onClick={toggleVoice}
            disabled={isLoading}
            title="Falar"
          >
            🎤
          </button>
          <button 
            className="send-btn"
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            title="Enviar"
          >
            ➤
          </button>
        </div>

        {!apiAvailable && (
          <div className="offline-notice">
            Modo offline ativo. Respostas locais funcionando normalmente.
          </div>
        )}
      </div>
    </div>
  );
}