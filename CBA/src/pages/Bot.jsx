import { useState, useRef, useEffect } from 'react';
import './styles/style.css';

export default function Bot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Bem-vindo ao Chatbot de Suporte! Como posso ajudar hoje? 😊' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  const getBotResponseFromOpenRouter = async (message) => {
    //const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY; 
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return "Erro: Chave da API não configurada. Configure a variável OPENROUTER_API_KEY no .env";
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost",
          "X-Title": "Chatbot para Autistas"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            {
              role: "system",
              content: `Você é uma IA gentil, calma, paciente e muito respeitosa chamada Tino. 
Seu criador é o Engenheiro Jorge Gouveia Tanguila... (coloque aqui todo o prompt longo que você tinha)`
            },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) throw new Error(`Erro ${response.status}`);

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Erro na API:", error);
      return "Desculpe, houve um problema ao conectar com o assistente. Pode tentar de novo? 😊";
    }
  };

  // Respostas locais rápidas + API
  const getBotResponse = async (message) => {
    const lower = message.toLowerCase();

    if (lower.includes('oi') || lower.includes('olá')) {
      return 'Olá! Como você está se sentindo hoje? Estou aqui para ajudar com calma. 😊';
    }
    if (lower.includes('ansiedade') || lower.includes('estresse') || lower.includes('sobrecarga')) {
      return 'Entendo, ansiedade pode ser desafiadora. Vamos tentar respirar juntos: inspire contando até 4, segure por 4, expire por 4. Quer repetir ou mais dicas?';
    }
    // ... adicione os outros ifs que você tinha

    // Se não for resposta local → usa API
    return await getBotResponseFromOpenRouter(message);
  };


  const sendMessage = async () => {
    const message = inputValue.trim();
    if (!message) return;

    addMessage('user', message);
    setInputValue('');

    const response = await getBotResponse(message);
    addMessage('bot', response);
  };

  
  const toggleVoice = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Seu navegador não suporta reconhecimento de voz. Use Chrome/Edge.');
      return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'pt-PT'; // ou 'pt-BR' dependendo do sotaque desejado
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      sendMessage(); // envia automaticamente
    };

    recognition.onerror = (event) => {
      console.error('Erro na voz:', event.error);
      alert('Erro no reconhecimento de voz: ' + event.error);
    };

    recognition.start();
  };

  // Enviar com Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div id="chatbox">
        <div id="header">
          <h2>Chatbot de Suporte para Autistas</h2>
          <p>Olá! Estou aqui para ajudar com conversas, emoções e rotinas. Não substituo um profissional.</p>
        </div>

        <div id="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.sender === 'user' ? 'user' : 'bot'}`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div id="input-area">
          <input
            type="text"
            id="userInput"
            placeholder="Digite sua mensagem..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={sendMessage} title="Enviar">
            <i className="material-icons">send</i>
          </button>
          <button onClick={toggleVoice} title="Falar">
            <i className="material-icons">mic</i>
          </button>
        </div>
      </div>
    </div>
  );
}