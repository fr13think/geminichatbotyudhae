document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const htmlElement = document.documentElement;
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const themeToggle = document.getElementById('theme-toggle');
    const promptSuggestions = document.getElementById('prompt-suggestions');

    // --- Inisialisasi ---
    const converter = new showdown.Converter({ noHeaderId: true, strikethrough: true, tables: true, tasklists: true, simpleLineBreaks: true });
    let chatHistory = [];

    // --- Ikon untuk Tema ---
    const sunIcon = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm-7.071 0a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-12 0a1 1 0 100-2H4a1 1 0 100 2h1zM4.95 6.464l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM15.05 13.536l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z"></path></svg>`;
    const moonIcon = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>`;

    // --- Fungsi Tema ---
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

    themeToggle.addEventListener('click', () => {
        const isDark = htmlElement.classList.contains('dark');
        applyTheme(isDark ? 'light' : 'dark');
    });

    // --- Fungsi Riwayat & Tampilan Chat ---
    const saveChatHistory = () => localStorage.setItem('geminiChatHistory', JSON.stringify(chatHistory));

    const loadChatHistory = () => {
        const savedHistory = localStorage.getItem('geminiChatHistory');
        chatBox.innerHTML = ''; // Kosongkan chat box sebelum memuat riwayat
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            chatHistory.forEach(msg => addMessageToDOM(msg.message, msg.sender));
        } else {
            // Tambahkan pesan sambutan jika tidak ada riwayat
            addMessageToDOM('Hello! How can I help you today?', 'bot');
        }
        togglePromptSuggestions();
    };
    
    const addMessageToHistory = (message, sender) => {
        chatHistory.push({ message, sender });
        saveChatHistory();
        togglePromptSuggestions();
    };

    const togglePromptSuggestions = () => {
        promptSuggestions.style.display = chatHistory.length <= 1 ? 'block' : 'none';
    };

    const addMessageToDOM = (message, sender, isTyping = false) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        if (isTyping) messageElement.classList.add('typing');

        const messageText = document.createElement('div');
        messageText.classList.add('message-text');

        if (sender === 'bot') {
            messageText.innerHTML = converter.makeHtml(message);
        } else {
            messageText.textContent = message;
        }
        
        messageElement.appendChild(messageText);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        if (sender === 'bot' && !isTyping) {
            addCopyButtons(messageElement);
        }
        return messageElement;
    };
    
    // --- Fungsi Tombol Salin Kode ---
    const addCopyButtons = (messageElement) => {
        const codeBlocks = messageElement.querySelectorAll('pre');
        codeBlocks.forEach(block => {
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

    // --- Fungsi Utama (Submit Form) ---
    const handleFormSubmit = async (message) => {
        // Hapus pesan sambutan jika ini pesan pertama
        if (chatHistory.length === 0) {
            chatBox.innerHTML = '';
        }

        addMessageToHistory(message, 'user');
        addMessageToDOM(message, 'user');
        userInput.value = '';

        const botTypingElement = addMessageToDOM('...', 'bot', true);
        const botTextElement = botTypingElement.querySelector('.message-text');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
            
            const data = await response.json();
            
            addMessageToHistory(data.reply, 'bot');
            botTextElement.innerHTML = converter.makeHtml(data.reply);
            addCopyButtons(botTypingElement);

        } catch (error) {
            console.error('Error fetching from API:', error);
            const errorMessage = 'Maaf, terjadi kesalahan. Silakan coba lagi.';
            addMessageToHistory(errorMessage, 'bot');
            botTextElement.innerHTML = converter.makeHtml(errorMessage);
        } finally {
            botTypingElement.classList.remove('typing');
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    };

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userMessage = userInput.value.trim();
        if (userMessage) handleFormSubmit(userMessage);
    });

    // --- Event Listener untuk Contoh Pertanyaan ---
    promptSuggestions.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-btn')) {
            const message = e.target.textContent;
            handleFormSubmit(message);
        }
    });

    // --- Inisialisasi Saat Halaman Dimuat ---
    const preferredTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(preferredTheme);
    loadChatHistory();
});
