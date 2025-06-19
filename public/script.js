document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const htmlElement = document.documentElement;
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const themeToggle = document.getElementById('theme-toggle');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const promptSuggestions = document.getElementById('prompt-suggestions');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadOptions = document.getElementById('upload-options');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const previewIconContainer = document.getElementById('preview-icon-container');
    const filePreviewName = document.getElementById('file-preview-name');
    const removeFileBtn = document.getElementById('remove-file-btn');

    // --- Inisialisasi ---
    const converter = new showdown.Converter({ noHeaderId: true, strikethrough: true, tables: true, tasklists: true, simpleLineBreaks: true });
    let chatHistory = [];
    let isStreaming = false;
    let attachedFile = null;

    // --- Ikon SVG ---
    const sunIcon = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm-7.071 0a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-12 0a1 1 0 100-2H4a1 1 0 100 2h1zM4.95 6.464l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM15.05 13.536l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z"></path></svg>`;
    const moonIcon = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>`;
    const fileIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`;

    // --- Fungsi Upload & Pratinjau File ---
    uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        uploadOptions.classList.toggle('hidden');
    });

    document.addEventListener('click', () => uploadOptions.classList.add('hidden'));

    uploadOptions.addEventListener('click', (e) => {
        const button = e.target.closest('.upload-option-btn');
        if (button) {
            const type = button.dataset.type;
            const acceptTypes = {
                image: 'image/*',
                audio: 'audio/*',
                video: 'video/*',
                // **DIPERBAIKI**: Membatasi jenis dokumen yang didukung
                document: '.pdf, .txt, text/plain, application/pdf'
            };
            fileInput.accept = acceptTypes[type] || '*/*';
            fileInput.click();
            uploadOptions.classList.add('hidden');
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                attachedFile = {
                    data: event.target.result,
                    mimeType: file.type,
                    name: file.name
                };
                
                previewIconContainer.innerHTML = `<img id="file-preview-img" src="" class="w-10 h-10 rounded-md object-cover hidden">`;
                const filePreviewImg = document.getElementById('file-preview-img');

                if (file.type.startsWith('image/')) {
                    filePreviewImg.src = event.target.result;
                    filePreviewImg.classList.remove('hidden');
                } else {
                    previewIconContainer.innerHTML = fileIcon;
                }
                filePreviewName.textContent = file.name;
                filePreviewContainer.classList.remove('hidden');
                
                userInput.focus();
            };
            reader.readAsDataURL(file);
        }
    });

    removeFileBtn.addEventListener('click', () => {
        attachedFile = null;
        fileInput.value = '';
        filePreviewContainer.classList.add('hidden');
    });

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
            chatHistory.forEach(msg => {
                const messageData = msg.parts[0].text.split('||attachment:');
                const text = messageData[0];
                const attachment = messageData[1] ? JSON.parse(atob(messageData[1])) : null;
                addMessageToDOM(text, msg.role === 'user' ? 'user' : 'bot', attachment);
            });
        } else {
            chatHistory = [];
            addMessageToDOM('Hello! How can I help you today?', 'bot');
        }
        togglePromptSuggestions();
    };
    
    const addMessageToHistory = (message, sender, attachment) => {
        if (chatHistory.length === 1 && chatHistory[0].role === 'model') {
            chatHistory = [];
        }
        let messageContent = message;
        if (attachment) {
            const attachmentMetadata = { name: attachment.name, mimeType: attachment.mimeType, data: attachment.data };
            messageContent += `||attachment:${btoa(JSON.stringify(attachmentMetadata))}`;
        }
        chatHistory.push({ role: sender === 'user' ? 'user' : 'model', parts: [{ text: messageContent }] });
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

    const addMessageToDOM = (message, sender, attachment = null) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        const messageText = document.createElement('div');
        messageText.classList.add('message-text');

        if (attachment) {
            let attachmentPreview;
            if (attachment.mimeType.startsWith('image/')) {
                attachmentPreview = document.createElement('img');
                attachmentPreview.src = attachment.data || `data:image/svg+xml,${encodeURIComponent(fileIcon)}`;
                attachmentPreview.className = 'w-full max-w-xs rounded-lg mb-2';
            } else {
                attachmentPreview = document.createElement('div');
                attachmentPreview.className = 'attachment-preview';
                attachmentPreview.innerHTML = `<svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span class="truncate">${attachment.name}</span>`;
            }
            messageText.appendChild(attachmentPreview);
        }

        const textContentDiv = document.createElement('div');
        if (sender === 'user') {
            textContentDiv.textContent = message;
        } else {
            textContentDiv.innerHTML = converter.makeHtml(message);
        }
        messageText.appendChild(textContentDiv);
        
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

    // --- Fungsi Utama (Submit Form Diperbarui) ---
    const handleFormSubmit = async (message) => {
        if (isStreaming) return;
        if (!message && !attachedFile) return;
        isStreaming = true;

        if (chatHistory.length === 0 || (chatHistory.length === 1 && chatHistory[0].role === 'model')) {
            chatBox.innerHTML = '';
            chatHistory = [];
        }

        const currentFile = attachedFile;
        addMessageToHistory(message, 'user', currentFile);
        addMessageToDOM(message, 'user', currentFile);
        
        userInput.value = '';
        removeFileBtn.click();

        const botMessageElement = addMessageToDOM('', 'bot');
        const textContentDiv = botMessageElement.querySelector('.message-text > div:last-child');
        const cursorSpan = document.createElement('span');
        cursorSpan.className = 'blinking-cursor';
        cursorSpan.innerHTML = '&#9646;';
        textContentDiv.appendChild(cursorSpan);
        
        addMessageToHistory('', 'bot');
        let fullResponse = "";

        try {
            const historyForApi = chatHistory.slice(0, -2).map(msg => {
                const [text] = msg.parts[0].text.split('||attachment:');
                return { role: msg.role, parts: [{ text }] };
            });

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    history: historyForApi,
                    message: message, 
                    file: currentFile 
                }),
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
                                textContentDiv.innerHTML = converter.makeHtml(fullResponse) + cursorSpan.outerHTML;
                                chatBox.scrollTop = chatBox.scrollHeight;
                            }
                        } catch (e) { console.error("Invalid JSON:", line); }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            textContentDiv.innerHTML = converter.makeHtml("Maaf, terjadi kesalahan.");
            fullResponse = "Maaf, terjadi kesalahan.";
        } finally {
            cursorSpan.remove();
            addCopyButtons(botMessageElement);
            updateLastBotMessageInHistory(fullResponse || "Tidak ada respons.");
            isStreaming = false;
        }
    };
    
    // --- Inisialisasi dan event listener lainnya ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(userInput.value.trim());
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // **PERBAIKAN BUG**: Pastikan menu upload tertutup sebelum submit
            if (!uploadOptions.classList.contains('hidden')) {
                uploadOptions.classList.add('hidden');
                return;
            }
            handleFormSubmit(userInput.value.trim());
        }
    });
    
    promptSuggestions.addEventListener('click', (e) => { 
        if (e.target.classList.contains('suggestion-btn')) { 
            handleFormSubmit(e.target.textContent); 
        }
    });
    
    const preferredTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(preferredTheme);
    loadChatHistory();
});
