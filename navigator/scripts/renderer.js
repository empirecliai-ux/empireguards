const addressBar = document.getElementById('address-bar');
const loadingScreen = document.getElementById('loading-screen');
const novaBtn = document.getElementById('nova-btn');
const voiceOverlay = document.getElementById('voice-overlay');
const newTabBtn = document.getElementById('new-tab-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');

// Initialize Window Manager
const panesContainer = document.getElementById('panes-container');
const windowManager = new WindowManager(panesContainer);

class EmpireNavigatorRenderer {
    constructor() {
        this.isListening = false;
        this.recognition = null;

        this.initializeVoiceRecognition();
        this.setupEventListeners();
        this.hideLoadingScreen();

        // Create initial pane
        windowManager.createPane('https://www.google.com');
    }

    initializeVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                console.log('🎤 Nova listening...');
                this.isListening = true;
                novaBtn.classList.add('listening');
                voiceOverlay.classList.add('active');
            };

            this.recognition.onresult = (event) => {
                const command = event.results[0][0].transcript;
                console.log('🗣️ Voice Command:', command);
                this.handleVoiceCommand(command);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                novaBtn.classList.remove('listening');
                voiceOverlay.classList.remove('active');
            };

            this.recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.isListening = false;
                novaBtn.classList.remove('listening');
                voiceOverlay.classList.remove('active');
            };
        }
    }

    setupEventListeners() {
        // Update UI when active pane changes
        document.addEventListener('pane-activated', (e) => {
            const pane = e.detail.pane;
            if (pane && pane.webview) {
                // We use setTimeout because getURL might not be available immediately if it just started loading
                setTimeout(() => {
                    try {
                        const url = pane.webview.getURL() || pane.webview.getAttribute('src');
                        addressBar.value = url === 'undefined' ? '' : url;
                        this.updateNavigationButtons();
                    } catch (err) {
                        const src = pane.webview.getAttribute('src');
                        addressBar.value = src === 'undefined' ? '' : src;
                    }
                }, 100);
            }
        });

        // Listen for internal navigation updates
        document.addEventListener('pane-navigated', (e) => {
            addressBar.value = e.detail.url;
            this.updateNavigationButtons();
        });

        document.addEventListener('all-panes-closed', () => {
            addressBar.value = '';
            backBtn.disabled = true;
            forwardBtn.disabled = true;
        });

        // New Tab Button
        if (newTabBtn) {
            newTabBtn.addEventListener('click', () => {
                windowManager.createPane('https://www.google.com');
            });
        }

        // Empire status updates
        setInterval(() => {
            this.updateEmpireStatus();
        }, 5000);
    }

    hideLoadingScreen() {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 3000);
    }

    handleVoiceCommand(command) {
        const cmd = command.toLowerCase();

        // Update voice overlay
        document.getElementById('voice-command-text').textContent = `"${command}"`;

        // Send to main process
        window.empireApi.invokeCommand(command);

        // Handle locally
        if (cmd.includes('navigate to') || cmd.includes('go to')) {
            const site = cmd.replace(/navigate to|go to/g, '').trim();
            this.navigateToSite(site);
        } else if (cmd.includes('new tab') || cmd.includes('new window')) {
            windowManager.createPane('https://www.google.com');
        } else if (cmd.includes('refresh') || cmd.includes('reload')) {
            if (windowManager.activePane && windowManager.activePane.webview) {
                windowManager.activePane.webview.reload();
            }
        } else if (cmd.includes('back')) {
            if (windowManager.activePane && windowManager.activePane.webview) {
                windowManager.activePane.webview.goBack();
            }
        } else if (cmd.includes('forward')) {
            if (windowManager.activePane && windowManager.activePane.webview) {
                windowManager.activePane.webview.goForward();
            }
        }
    }

    navigateToSite(site) {
        let url = site;

        if (!url.includes('http')) {
            if (url.includes('.')) {
                url = `https://${url}`;
            } else {
                const shortcuts = {
                    'github': 'https://github.com',
                    'gmail': 'https://gmail.com',
                    'teams': 'https://teams.microsoft.com',
                    'discord': 'https://discord.com',
                    'youtube': 'https://youtube.com'
                };
                url = shortcuts[url] || `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            }
        }

        if (windowManager.activePane && windowManager.activePane.webview) {
            windowManager.activePane.webview.setAttribute('src', url);
            addressBar.value = url;
        } else {
            windowManager.createPane(url);
        }
    }

    updateNavigationButtons() {
        if (windowManager.activePane && windowManager.activePane.webview) {
            try {
                backBtn.disabled = !windowManager.activePane.webview.canGoBack();
                forwardBtn.disabled = !windowManager.activePane.webview.canGoForward();
            } catch (e) {
                backBtn.disabled = true;
                forwardBtn.disabled = true;
            }
        } else {
            backBtn.disabled = true;
            forwardBtn.disabled = true;
        }
    }

    async updateEmpireStatus() {
        try {
            const status = await window.empireApi.getEmpireStatus();
            // Update agent count and status indicators
            document.getElementById('agent-count').textContent = `${status.agents} AGENTS`;
        } catch (error) {
            console.error('Failed to update Empire status:', error);
        }
    }
}

// Global Functions attached to window for HTML event handlers
window.activateNova = function() {
    if (empireNavigator.recognition && !empireNavigator.isListening) {
        empireNavigator.recognition.start();
    }
}

window.toggleSocietas = function() {
    window.empireApi.invokeCommand('show societas');
}

window.handleAddressBar = function(event) {
    if (event.key === 'Enter') {
        const url = addressBar.value;
        empireNavigator.navigateToSite(url);
    }
}

window.goBack = function() {
    if (windowManager.activePane && windowManager.activePane.webview) {
        windowManager.activePane.webview.goBack();
    }
}

window.goForward = function() {
    if (windowManager.activePane && windowManager.activePane.webview) {
        windowManager.activePane.webview.goForward();
    }
}

window.refresh = function() {
    if (windowManager.activePane && windowManager.activePane.webview) {
        windowManager.activePane.webview.reload();
    }
}

window.minimizeWindow = function() {
    window.empireApi.minimize();
}

window.maximizeWindow = function() {
    window.empireApi.maximize();
}

window.closeWindow = function() {
    window.empireApi.close();
}

// Initialize Empire Navigator
const empireNavigator = new EmpireNavigatorRenderer();

// Empire Easter Eggs
document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+E = Empire Command Palette
    if (event.ctrlKey && event.shiftKey && event.key === 'e') {
        activateNova();
    }

    // Ctrl+Shift+S = Show Societas
    if (event.ctrlKey && event.shiftKey && event.key === 's') {
        toggleSocietas();
    }
});

console.log('🏛️ Empire Navigator initialized');
console.log('🎤 Say "Hey Nova" or click the microphone');
console.log('💬 Press Ctrl+Shift+S for Societas');
