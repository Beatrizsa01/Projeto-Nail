const API_KEY = ""; // Chave da API fornecida pelo usuário
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// Elementos da UI
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const chatClose = document.getElementById('chat-close');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

// Histórico da conversa para manter o contexto
let chatHistory = [];

const systemPrompt = `Você é um assistente virtual do Studio 'Gloss Nail'. 
Seja sempre educado, prestativo e cordial. 

Nossos serviços incluem: 
- Unhas Clássicas (R$ 25,00).
- Banho de Gel (R$ 30,00).
- Alongamento Molde F1 (R$ 120,00).
- Alongamento Fibra de Vidro (R$ 140,00). 
- Manutenção Banho de Gel (R$ 70,00)
- Manutenção de Alongamentos (R$ 90,00)


Funcionamos de Segunda a Sábado, das 8h às 20h. O endereço é Rua Exemplo, 320 - Centro. 

REGRA IMPORTANTE PARA AGENDAMENTO:
Se o cliente quiser agendar um horário, você DEVE informá-lo para fechar o chat e clicar no botão "Agendar Horário" na página principal para escolher o profissional, o serviço, a data e a hora desejada. Não tente simular o agendamento. Responda de forma natural e concisa.`;

// Eventos de abrir e fechar o chat
chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden')) {
        chatInput.focus();
    }
});

chatClose.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
});

// Adicionar mensagem na interface
function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender);
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    
    // Rolar para baixo
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Mostrar/esconder indicador de digitação
function toggleTypingIndicator(show) {
    if (show) {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.id = 'typing-indicator';
        typingDiv.textContent = 'Digitando...';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Enviar mensagem para a API do Gemini
async function sendMessageToGemini(message) {
    // Adiciona a mensagem do usuário ao histórico
    chatHistory.push({
        role: "user",
        parts: [{ text: message }]
    });

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: chatHistory
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Erro da API:", errorData);
            throw new Error(`Erro ${response.status}: ${errorData.error ? errorData.error.message : 'Erro desconhecido'}`);
        }

        const data = await response.json();
        
        // Extrai a resposta do bot
        if (data.candidates && data.candidates.length > 0) {
            const botMessage = data.candidates[0].content.parts[0].text;
            
            // Adiciona a resposta ao histórico
            chatHistory.push({
                role: "model",
                parts: [{ text: botMessage }]
            });

            return botMessage;
        } else {
            return "Desculpe, a resposta veio vazia. Pode repetir?";
        }

    } catch (error) {
        console.error("Erro ao chamar o Gemini:", error);
        return `Erro de conexão ou API: ${error.message}`;
    }
}

// Lógica de envio
async function handleSend() {
    const text = chatInput.value.trim();
    if (text === '') return;

    // Limpa o input e exibe a mensagem do usuário
    chatInput.value = '';
    appendMessage(text, 'user');

    // Mostra indicador de digitação e chama a API
    toggleTypingIndicator(true);
    const botResponse = await sendMessageToGemini(text);
    toggleTypingIndicator(false);

    // Exibe a resposta do bot
    appendMessage(botResponse, 'bot');
}

chatSend.addEventListener('click', handleSend);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSend();
    }
});
