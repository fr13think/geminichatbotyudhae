document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    // Inisialisasi converter Showdown
    const converter = new showdown.Converter();

    /**
     * Menambahkan pesan ke kotak obrolan.
     * @param {string} message - Isi pesan.
     * @param {string} sender - Pengirim pesan ('user' atau 'bot').
     * @param {boolean} returnElement - Jika true, kembalikan elemen DOM yang dibuat.
     * @returns {HTMLElement|undefined} - Elemen pesan jika returnElement adalah true.
     */
    const addMessage = (message, sender, returnElement = false) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        
        const messageText = document.createElement('div');
        messageText.classList.add('message-text');

        // Proses pesan bot sebagai HTML dari Markdown, pesan pengguna sebagai teks biasa.
        if (sender === 'bot') {
            const htmlContent = converter.makeHtml(message);
            messageText.innerHTML = htmlContent;
        } else {
            messageText.textContent = message;
        }
        
        messageElement.appendChild(messageText);
        chatBox.appendChild(messageElement);

        // Selalu scroll ke pesan terbaru
        chatBox.scrollTop = chatBox.scrollHeight;

        // Kembalikan elemen jika diminta
        if (returnElement) {
            return messageElement;
        }
    };

    // Menangani pengiriman form
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        userInput.value = '';

        // --- UI/UX YANG DISEMPURNAKAN ---
        
        // 1. Buat gelembung indikator "mengetik" dan simpan referensinya.
        const botMessageElement = addMessage('...', 'bot', true);
        
        // 2. Tambahkan kelas 'typing' untuk memicu animasi CSS.
        botMessageElement.classList.add('typing'); 

        // 3. Dapatkan referensi ke elemen bagian dalam yang menampung teks.
        const botTextElement = botMessageElement.querySelector('.message-text');
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // 4. Perbarui konten gelembung yang ada dengan respons akhir.
            const finalHtmlContent = converter.makeHtml(data.reply);
            botTextElement.innerHTML = finalHtmlContent;

        } catch (error) {
            console.error('Error fetching from API:', error);
            // 5. Atau perbarui dengan pesan error jika terjadi masalah.
            botTextElement.innerHTML = converter.makeHtml('Maaf, terjadi kesalahan. Silakan coba lagi.');
        } finally {
            // 6. Hapus kelas 'typing' untuk menghentikan animasi.
            botMessageElement.classList.remove('typing');
            // Pastikan tampilan scroll ke bawah, karena konten baru mungkin lebih besar.
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });
});
