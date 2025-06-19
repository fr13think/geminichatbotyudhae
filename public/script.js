document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const htmlElement = document.documentElement;
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const themeToggle = document.getElementById('theme-toggle');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const promptSuggestions = document.getElementById('prompt-suggestions');

    // --- Inisialisasi ---
    const converter = new showdown.Converter({ noHeaderId: true, strikethrough: true, tables: true, tasklists: true, simpleLineBreaks: true });
    let chatHistory = [];
    let isStreaming = false;

    // --- Ikon SVG ---
    const sunIcon = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm-7.071 0a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-12 0a1 1 0 100-2H4a1 1 0 100 2h1zM4.95 6.464l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM15.05 13.536l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z"></path></svg>`;
    const moonIcon = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>`;

    // --- Fungsi Tema & Hapus Riwayat ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            htmlElement.classList.add('dark');
            themeToggle.innerHTML = sunIcon;
        } else {
            htmlElement.classList.remove('dark');
            themeToggle.innerHTML = moonIcon;
        }
        localStorage.setItem('theme', theme);
    };

    clearChatBtn.addEventListener('click', () => {
        if (isStreaming) return;
        if (confirm('Apakah Anda yakin ingin menghapus riwayat obrolan?')) {
            chatHistory = [];
            localStorage.removeItem('geminiChatHistory');
            loadChatHistory();
        }
    });

    themeToggle.addEventListener('click', () => {
        const newTheme = htmlElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // --- Fungsi Riwayat & Tampilan Chat ---
    const saveChatHistory = () => localStorage.setItem('geminiChatHistory', JSON.stringify(chatHistory));

    const loadChatHistory = () => {
        const savedHistory = localStorage.getItem('geminiChatHistory');
        chatBox.innerHTML = '';
        if (savedHistory && JSON.parse(savedHistory).length > 0) {
            chatHistory = JSON.parse(savedHistory);
            chatHistory.forEach(msg => addMessageToDOM(msg.parts[0].text, msg.role === 'user' ? 'user' : 'bot'));
        } else {
            chatHistory = [];
            addMessageToDOM('Hello! How can I help you today?', 'bot');
        }
        togglePromptSuggestions();
    };
    
    const addMessageToHistory = (message, sender) => {
        if (chatHistory.length === 1 && chatHistory[0].role === 'model') {
            chatHistory = [];
        }
        chatHistory.push({ role: sender === 'user' ? 'user' : 'model', parts: [{ text: message }] });
        saveChatHistory();
        togglePromptSuggestions();
    };
    
    const updateLastBotMessageInHistory = (message) => {
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'model') {
            chatHistory[chatHistory.length - 1].parts[0].text = message;
            saveChatHistory();
        }
    };

    const togglePromptSuggestions = () => {
        const hasUserMessages = chatHistory.some(msg => msg.role === 'user');
        promptSuggestions.style.display = !hasUserMessages ? 'block' : 'none';
    };

    const addMessageToDOM = (message, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        const messageText = document.createElement('div');
        messageText.classList.add('message-text');

        if (sender === 'user') {
            messageText.textContent = message;
        } else {
            messageText.innerHTML = converter.makeHtml(message);
        }
        
        messageElement.appendChild(messageText);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        if (sender === 'bot') addCopyButtons(messageElement);
        return messageElement;
    };
    
    const addCopyButtons = (messageElement) => {
        messageElement.querySelectorAll('pre').forEach(block => {
            if (block.querySelector('.copy-code-btn')) return;
            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.textContent = 'Copy';
            btn.onclick = () => {
                const code = block.querySelector('code').innerText;
                navigator.clipboard.writeText(code).then(() => {
                    btn.textContent = 'Copied!';
                    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
                });
            };
            block.appendChild(btn);
        });
    };

    // --- Fungsi Utama (Submit Form dengan Streaming) ---
    const handleFormSubmit = async (message) => {
        if (isStreaming) return;
        isStreaming = true;

        if (chatHistory.length === 0 || (chatHistory.length === 1 && chatHistory[0].role === 'model')) {
            chatBox.innerHTML = '';
            chatHistory = [];
        }

        addMessageToHistory(message, 'user');
        addMessageToDOM(message, 'user');
        userInput.value = '';

        const botMessageElement = addMessageToDOM('', 'bot');
        const botTextElement = botMessageElement.querySelector('.message-text');
        const cursorSpan = document.createElement('span');
        cursorSpan.className = 'blinking-cursor';
        cursorSpan.innerHTML = '&#9646;';
        botTextElement.appendChild(cursorSpan);
        
        addMessageToHistory('', 'bot');

        let fullResponse = "";

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: chatHistory }),
            });

            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.text) {
                                fullResponse += data.text;
                                botTextElement.innerHTML = converter.makeHtml(fullResponse) + cursorSpan.outerHTML;
                                chatBox.scrollTop = chatBox.scrollHeight;
                            }
                        } catch (e) {
                            console.error("Invalid JSON in stream chunk:", line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            botTextElement.innerHTML = converter.makeHtml("Maaf, terjadi kesalahan.");
            fullResponse = "Maaf, terjadi kesalahan.";
        } finally {
            cursorSpan.remove();
            addCopyButtons(botMessageElement);
            updateLastBotMessageInHistory(fullResponse || "Tidak ada respons.");
            isStreaming = false;
        }
    };

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userMessage = userInput.value.trim();
        if (userMessage) handleFormSubmit(userMessage);
    });

    promptSuggestions.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-btn')) {
            handleFormSubmit(e.target.textContent);
        }
    });

    // --- Inisialisasi Awal ---
    const preferredTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(preferredTheme);
    loadChatHistory();
});
