// Main Application
class EimemesChatApp {
    constructor() {
        this.currentChatId = null;
        this.chats = new Map();
        this.currentMessages = [];
        this.isGenerating = false;
        this.abortController = null;
        this.currentModel = 'llama3-8b-8192';
        this.temperature = 0.7;
        this.maxTokens = 1024;
        this.streamEnabled = true;
        this.darkMode = true;
        
        this.init();
    }
    
    async init() {
        // Wait for dependencies
        await this.waitForDependencies();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load settings
        this.loadSettings();
        
        // Check auth state
        this.setupAuthListener();
        
        // Hide loading screen
        this.hideLoading();
    }
    
    async waitForDependencies() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Wait for Firebase
        await new Promise(resolve => {
            const checkFirebase = () => {
                if (window.firebaseAuth) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }
    
    setupEventListeners() {
        // Chat input
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        messageInput.addEventListener('input', () => this.adjustTextareaHeight(messageInput));
        messageInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        stopBtn.addEventListener('click', () => this.stopGeneration());
        
        // New chat
        document.getElementById('newChatBtn')?.addEventListener('click', () => this.startNewChat());
        document.getElementById('clearChatBtn')?.addEventListener('click', () => this.clearChat());
        
        // Model selection
        document.getElementById('modelSelect')?.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.saveSettings();
        });
        
        // Example prompts
        document.querySelectorAll('.example-prompt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.dataset.prompt;
                document.getElementById('messageInput').value = prompt;
                this.adjustTextareaHeight(document.getElementById('messageInput'));
                this.sendMessage();
            });
        });
        
        // Settings modal
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettings());
        document.getElementById('closeSettings')?.addEventListener('click', () => this.hideSettings());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        document.getElementById('deleteAccountBtn')?.addEventListener('click', () => this.deleteAccount());
        
        // Menu toggle
        document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleSidebar());
        
        // Settings controls
        document.getElementById('modelSetting')?.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('temperatureSetting')?.addEventListener('input', (e) => {
            this.temperature = parseFloat(e.target.value);
            document.getElementById('tempValue').textContent = this.temperature.toFixed(1);
            this.saveSettings();
        });
        
        document.getElementById('maxTokensSetting')?.addEventListener('input', (e) => {
            this.maxTokens = parseInt(e.target.value);
            document.getElementById('tokensValue').textContent = this.maxTokens;
            this.saveSettings();
        });
        
        document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });
        
        document.getElementById('streamingToggle')?.addEventListener('change', (e) => {
            this.streamEnabled = e.target.checked;
            this.saveSettings();
        });
        
        // Attach and voice buttons
        document.getElementById('attachBtn')?.addEventListener('click', () => this.showToast('File attachment coming soon!', 'info'));
        document.getElementById('micBtn')?.addEventListener('click', () => this.showToast('Voice input coming soon!', 'info'));
        
        // Forgot password
        document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });
        
        // Close modal on backdrop click
        document.getElementById('settingsModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.hideSettings();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && e.ctrlKey) {
                e.preventDefault();
                document.getElementById('messageInput').focus();
            }
            
            if (e.key === 'Escape' && this.isGenerating) {
                this.stopGeneration();
            }
        });
    }
    
    setupAuthListener() {
        authManager.addListener((event, user) => {
            if (event === 'login') {
                this.handleUserLogin(user);
            } else if (event === 'logout') {
                this.handleUserLogout();
            }
        });
        
        // Check initial auth state
        if (authManager.isAuthenticated()) {
            this.handleUserLogin(authManager.getCurrentUser());
        }
    }
    
    async handleUserLogin(user) {
        try {
            // Update UI
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('appScreen').classList.remove('hidden');
            
            // Update user info
            this.updateUserInfo(user);
            
            // Get backend token
            const token = await user.getIdToken();
            localStorage.setItem('backend_token', token);
            
            // Load chat history
            await this.loadChatHistory();
            
            // Load available models
            await this.loadAvailableModels();
            
            this.showToast('Welcome to EimemesChat AI!', 'success');
            
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Error during login', 'error');
        }
    }
    
    handleUserLogout() {
        // Update UI
        document.getElementById('appScreen').classList.add('hidden');
        document.getElementById('authScreen').classList.remove('hidden');
        
        // Clear data
        this.currentChatId = null;
        this.chats.clear();
        this.currentMessages = [];
        
        // Clear token
        localStorage.removeItem('backend_token');
        
        // Reset forms
        this.clearAuthForms();
        
        // Hide settings modal if open
        this.hideSettings();
        
        this.showToast('Logged out successfully', 'info');
    }
    
    updateUserInfo(user) {
        const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=10a37f&color=fff`;
        const name = user.displayName || user.email.split('@')[0];
        const email = user.email;
        
        // Update avatar
        const avatarImg = document.getElementById('userAvatar');
        if (avatarImg) {
            avatarImg.src = avatar;
            avatarImg.alt = `${name}'s avatar`;
        }
        
        // Update name and email
        document.getElementById('userName').textContent = name;
        document.getElementById('userEmail').textContent = email;
    }
    
    clearAuthForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.querySelector('#loginEmail').value = '';
            loginForm.querySelector('#loginPassword').value = '';
        }
        
        if (registerForm) {
            registerForm.querySelector('#registerName').value = '';
            registerForm.querySelector('#registerEmail').value = '';
            registerForm.querySelector('#registerPassword').value = '';
            registerForm.querySelector('#confirmPassword').value = '';
            registerForm.querySelector('#agreeTerms').checked = false;
        }
        
        // Show login form by default
        this.showLoginForm();
    }
    
    async loadAvailableModels() {
        try {
            const token = localStorage.getItem('backend_token');
            if (!token) return;
            
            const response = await fetch(`${BACKEND_URL}/chat/models`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateModelSelectors(data.models);
            }
        } catch (error) {
            console.error('Failed to load models:', error);
        }
    }
    
    updateModelSelectors(models) {
        const modelSelect = document.getElementById('modelSelect');
        const modelSetting = document.getElementById('modelSetting');
        
        if (!modelSelect || !modelSetting) return;
        
        // Clear existing options except first
        while (modelSelect.options.length > 0) {
            modelSelect.remove(0);
        }
        
        while (modelSetting.options.length > 0) {
            modelSetting.remove(0);
        }
        
        // Add new options
        models.forEach(model => {
            const option1 = document.createElement('option');
            option1.value = model.id;
            option1.textContent = model.name;
            modelSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = model.id;
            option2.textContent = model.name;
            modelSetting.appendChild(option2);
        });
        
        // Select current model
        modelSelect.value = this.currentModel;
        modelSetting.value = this.currentModel;
    }
    
    async loadChatHistory() {
        try {
            const token = localStorage.getItem('backend_token');
            if (!token) return;
            
            const response = await fetch(`${BACKEND_URL}/chat/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.renderChatHistory(data.chats);
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }
    
    renderChatHistory(chats) {
        const historyContainer = document.getElementById('chatHistory');
        if (!historyContainer) return;
        
        if (chats.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-comments"></i>
                    <p>No chat history yet</p>
                </div>
            `;
            return;
        }
        
        historyContainer.innerHTML = '';
        
        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'chat-history-item';
            if (chat.id === this.currentChatId) {
                item.classList.add('active');
            }
            
            item.innerHTML = `
                <i class="fas fa-comment"></i>
                <span>${chat.title || 'New Chat'}</span>
            `;
            
            item.addEventListener('click', () => this.loadChat(chat.id));
            
            historyContainer.appendChild(item);
        });
    }
    
    async loadChat(chatId) {
        // TODO: Implement chat loading from backend
        console.log('Loading chat:', chatId);
    }
    
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message || this.isGenerating) return;
        
        // Clear input
        input.value = '';
        this.adjustTextareaHeight(input);
        
        // Add user message to UI
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Disable send button, enable stop button
        this.setGeneratingState(true);
        
        try {
            if (this.streamEnabled) {
                await this.streamResponse(message);
            } else {
                await this.getCompleteResponse(message);
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.showToast(error.message || 'Failed to get response', 'error');
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
        } finally {
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Re-enable send button
            this.setGeneratingState(false);
            
            // Scroll to bottom
            this.scrollToBottom();
        }
    }
    
    async streamResponse(message) {
        const token = localStorage.getItem('backend_token');
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        this.abortController = new AbortController();
        
        const response = await fetch(`${BACKEND_URL}/chat/completion`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                model: this.currentModel,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                stream: true
            }),
            signal: this.abortController.signal
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Add AI message container
        const messageId = this.addMessage('', 'ai', true);
        const messageElement = document.getElementById(`message-${messageId}`);
        const textElement = messageElement.querySelector('.message-text');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    
                    if (data === '[DONE]') {
                        // Save complete message to history
                        await this.saveMessageToHistory(messageId, accumulatedText);
                        return;
                    }
                    
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.content) {
                            accumulatedText += parsed.content;
                            textElement.textContent = accumulatedText;
                            
                            // Auto-scroll while streaming
                            this.scrollToBottom();
                            
                            // Render markdown if needed
                            this.renderMarkdown(textElement);
                        }
                    } catch (e) {
                        console.error('Error parsing stream data:', e);
                    }
                }
            }
        }
    }
    
    async getCompleteResponse(message) {
        const token = localStorage.getItem('backend_token');
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(`${BACKEND_URL}/chat/completion`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                model: this.currentModel,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                stream: false
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Add AI message
        this.addMessage(data.response, 'ai');
        
        // Save to history
        await this.saveChatToHistory(message, data.response);
    }
    
    async saveChatToHistory(userMessage, aiResponse) {
        try {
            const token = localStorage.getItem('backend_token');
            if (!token) return;
            
            // TODO: Implement saving to backend
            // This would involve creating/updating a chat document in your database
            
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }
    
    async saveMessageToHistory(messageId, content) {
        // TODO: Implement message saving
    }
    
    addMessage(text, role, streaming = false) {
        const chatContainer = document.getElementById('chatContainer');
        const welcomeMessage = document.getElementById('welcomeMessage');
        
        // Hide welcome message if it's the first message
        if (welcomeMessage && !welcomeMessage.classList.contains('hidden')) {
            welcomeMessage.classList.add('hidden');
        }
        
        const messageId = Date.now();
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${role}`;
        messageDiv.id = `message-${messageId}`;
        
        let avatarIcon = 'fas fa-user';
        let avatarBg = 'linear-gradient(135deg, #5436da, #36d1da)';
        
        if (role === 'ai') {
            avatarIcon = 'fas fa-robot';
            avatarBg = 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))';
        }
        
        messageDiv.innerHTML = `
            <div class="message-avatar" style="background: ${avatarBg}">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${streaming ? '' : this.formatMessage(text)}</div>
                <div class="message-meta">
    