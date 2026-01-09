// ============================================================================
// ADA CHATBOT RE-ENGAGEMENT - GTM DEPLOYMENT PACKAGE
// Version: 1.0.0
// Author: Nikolay Fotenyuk
// ============================================================================

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        adaHandle: 'supportnex', // Change this to your Ada handle
        firstPopupDelay: 18000,  // 18 seconds
        secondPopupDelay: 60000, // 60 seconds
        popupShowDelay: 500,     // Delay before showing popup
        autoOpenDelay: 2000,     // Delay before auto-opening chat (2 seconds)
        adaLoadTimeout: 10000,   // Timeout for Ada to load (10 seconds)
        zIndex: 100000           // Z-index for popup
    };

    // Translations
    const TRANSLATIONS = {
        fr: {
            firstPopup: {
                message: "👋 Toujours là ? Votre check-up PC gratuit vous attend !",
                button1: "Commencer maintenant",
                button2: "Non, merci"
            },
            secondPopup: {
                message: "👋 Je serai disponible si vous avez besoin d'aide pour l'installation ou l'activation de votre produit.",
                button1: "Commencer maintenant",
                button2: "Non, merci"
            }
        },
        en: {
            firstPopup: {
                message: "👋 Still there? Your free PC check-up is waiting!",
                button1: "Start now",
                button2: "No, thanks"
            },
            secondPopup: {
                message: "👋 I will be available if you need help with your product installation or activation.",
                button1: "Start now",
                button2: "No, thanks"
            }
        },
        de: {
            firstPopup: {
                message: "👋 Noch da? Ihr kostenloser PC-Check wartet!",
                button1: "Jetzt starten",
                button2: "Nein, danke"
            },
            secondPopup: {
                message: "👋 Ich stehe Ihnen gern zur Verfügung, falls Sie Hilfe bei der Installation oder Aktivierung Ihres Produkts benötigen.",
                button1: "Jetzt starten",
                button2: "Nein, danke"
            }
        },
        it: {
            firstPopup: {
                message: "👋 Sei ancora lì? Il tuo controllo gratuito del PC ti aspetta!",
                button1: "Inizia ora",
                button2: "No, grazie"
            },
            secondPopup: {
                message: "👋 Sarò disponibile se hai bisogno di aiuto con l’installazione o l’attivazione del tuo prodotto.",
                button1: "Inizia ora",
                button2: "No, grazie"
            }
        }
    };

    // State
    let conversationId = null;
    let inactivityTimer = null;
    let secondInactivityTimer = null;
    let firstPopupShown = false;
    let secondPopupShown = false;
    let popupElement = null;

    // Get browser language
    function getBrowserLanguage() {
        if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
            return navigator.languages[0];
        }
        return navigator.language || navigator.userLanguage || 'en';
    }

    const langCode = getBrowserLanguage().split('-')[0].toLowerCase();
    const currentLang = TRANSLATIONS[langCode] || TRANSLATIONS['en'];

    // Inject CSS
    function injectStyles() {
        const styles = `
            #ada-reengagement-popup {
                display: none;
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: 400px;
                max-width: calc(100vw - 40px);
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                padding: 20px;
                z-index: ${CONFIG.zIndex};
                font-family: Arial, sans-serif;
                box-sizing: border-box;
            }
            #ada-reengagement-popup.show {
                display: block;
                animation: ada-slideUp 0.3s ease-out;
            }
            @keyframes ada-slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            #ada-reengagement-popup h3 {
                margin: 0 0 15px 0;
                font-size: 16px;
                color: #333;
                font-weight: normal;
            }
            .ada-popup-button {
                display: block;
                width: 100%;
                padding: 12px;
                margin: 8px 0;
                border: 2px solid #4CAF50;
                border-radius: 6px;
                background: #4CAF50;
                color: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                transition: all 0.2s;
            }
            .ada-popup-button:hover {
                background: #45a049;
                border-color: #45a049;
            }
            .ada-popup-button.secondary {
                background: white;
                color: #999;
                border: none;
                font-weight: normal;
                padding: 10px;
            }
            .ada-popup-button.secondary:hover {
                background: #f5f5f5;
                color: #999;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Create popup HTML
    function createPopup() {
        const popup = document.createElement('div');
        popup.id = 'ada-reengagement-popup';
        popup.innerHTML = `
            <h3>${currentLang.firstPopup.message}</h3>
            <button class="ada-popup-button" id="ada-popup-btn1">${currentLang.firstPopup.button1}</button>
            <button class="ada-popup-button secondary" id="ada-popup-btn2">${currentLang.firstPopup.button2}</button>
        `;
        document.body.appendChild(popup);
        return popup;
    }

    // Update popup content
    function updatePopupContent(isFirstPopup) {
        if (!popupElement) return;

        const content = isFirstPopup ? currentLang.firstPopup : currentLang.secondPopup;
        const title = popupElement.querySelector('h3');
        const btn1 = popupElement.querySelector('#ada-popup-btn1');
        const btn2 = popupElement.querySelector('#ada-popup-btn2');

        if (title) title.innerHTML = content.message;
        if (btn1) btn1.textContent = content.button1;
        if (btn2) btn2.textContent = content.button2;
    }

    // Show popup
    function showPopup() {
        if (popupElement) {
            updatePopupContent(!secondPopupShown);
            popupElement.classList.add('show');
        }
    }

    // Hide popup
    function hidePopup() {
        if (popupElement) {
            popupElement.classList.remove('show');
        }
    }

    // Ensure chat drawer is open
    function ensureChatOpen() {
        return new Promise((resolve, reject) => {
            if (window.adaEmbed && typeof window.adaEmbed.getInfo === "function") {
                window.adaEmbed.getInfo().then(function (windowInfo) {
                    if (!windowInfo.isDrawerOpen && typeof window.adaEmbed.toggle === "function") {
                        window.adaEmbed.toggle();
                    }
                    resolve(windowInfo);
                }).catch(function (error) {
                    reject(error);
                });
            } else {
                reject(new Error("Ada Embed not ready"));
            }
        });
    }

    // Ensure Ada is loaded before executing callback
    function ensureAdaLoaded(callback) {
        let adaLoaded = false;

        const checkInterval = setInterval(() => {
            if (window.adaEmbed && typeof window.adaEmbed.toggle === "function") {
                adaLoaded = true;
                clearInterval(checkInterval);
                callback();
            }
        }, 100);

        // Timeout after configured time
        setTimeout(() => {
            if (!adaLoaded) {
                clearInterval(checkInterval);
                console.warn('[Ada Re-engagement] Ada Embed did not load within timeout');
            }
        }, CONFIG.adaLoadTimeout);
    }

    // Auto-open chat widget
    function autoOpenChat() {
        ensureAdaLoaded(() => {
            console.log('[Ada Re-engagement] Auto-opening chat widget');
            if (window.adaEmbed && typeof window.adaEmbed.toggle === "function") {
                window.adaEmbed.toggle();
            }
        });
    }

    // Reset inactivity timer
    function resetInactivityTimer() {
        if (firstPopupShown && secondPopupShown) {
            return;
        }

        if (inactivityTimer) clearTimeout(inactivityTimer);
        if (secondInactivityTimer) clearTimeout(secondInactivityTimer);

        if (firstPopupShown && !secondPopupShown) {
            // Reset second popup timer
            secondInactivityTimer = setTimeout(() => {
                if (secondPopupShown) return;

                console.log('[Ada Re-engagement] Second popup triggered after 1 minute');
                secondPopupShown = true;

                setTimeout(() => {
                    showPopup();
                }, CONFIG.popupShowDelay);
            }, CONFIG.secondPopupDelay);

            return;
        }

        // First popup timer
        inactivityTimer = setTimeout(() => {
            if (firstPopupShown) return;

            console.log('[Ada Re-engagement] First popup triggered after 18 seconds');
            firstPopupShown = true;

            setTimeout(() => {
                showPopup();
            }, CONFIG.popupShowDelay);

            // Start second popup timer
            if (!secondPopupShown) {
                secondInactivityTimer = setTimeout(() => {
                    if (secondPopupShown) return;

                    console.log('[Ada Re-engagement] Second popup triggered after 1 minute');
                    secondPopupShown = true;

                    setTimeout(() => {
                        showPopup();
                    }, CONFIG.popupShowDelay);
                }, CONFIG.secondPopupDelay);
            }
        }, CONFIG.firstPopupDelay);
    }

    // Initialize Ada integration
    function initAdaIntegration() {
        if (!window.adaEmbed) {
            console.error('[Ada Re-engagement] Ada Embed not found');
            return;
        }

        // Subscribe to conversation messages
        window.adaEmbed.subscribeEvent("ada:conversation:message", (data) => {
            conversationId = data.conversation_id;

            // Auto-dismiss popup if user interacts with chat
            if (popupElement && popupElement.classList.contains('show')) {
                console.log('[Ada Re-engagement] User interacted, auto-dismissing popup');
                hidePopup();
            }

            resetInactivityTimer();
        });

        // Subscribe to drawer toggle
        window.adaEmbed.subscribeEvent("ada:drawer_toggle", (data) => {
            // Popup stays open even when drawer is minimized
        });

        console.log('[Ada Re-engagement] Ada integration initialized');

        // Start inactivity timer
        resetInactivityTimer();

        // Auto-open chat after delay
        setTimeout(() => {
            autoOpenChat();
        }, CONFIG.autoOpenDelay);
    }

    // Setup button handlers
    function setupButtonHandlers() {
        const btn1 = document.getElementById('ada-popup-btn1');
        const btn2 = document.getElementById('ada-popup-btn2');

        if (btn1) {
            btn1.addEventListener('click', () => {
                console.log('[Ada Re-engagement] User clicked: Start now');
                resetInactivityTimer();
                ensureChatOpen().then(() => {
                    hidePopup();
                }).catch(() => {
                    hidePopup();
                });
            });
        }

        if (btn2) {
            btn2.addEventListener('click', () => {
                console.log('[Ada Re-engagement] User clicked: No thanks');
                hidePopup();
            });
        }
    }

    // Load Ada script
    function loadAdaScript() {
        if (document.getElementById('__ada')) {
            console.log('[Ada Re-engagement] Ada script already loaded');
            return;
        }

        const script = document.createElement('script');
        script.id = '__ada';
        script.setAttribute('data-handle', CONFIG.adaHandle);
        script.src = 'https://static.ada.support/embed2.js';
        document.head.appendChild(script);
    }

    // Initialize
    function init() {
        console.log('[Ada Re-engagement] Initializing...');

        // Inject styles
        injectStyles();

        // Create popup
        popupElement = createPopup();

        // Setup button handlers
        setupButtonHandlers();

        // Load Ada script
        loadAdaScript();

        // Setup Ada settings
        window.adaSettings = window.adaSettings || {};

        const originalCallback = window.adaSettings.onAdaEmbedLoaded;
        window.adaSettings.onAdaEmbedLoaded = function () {
            if (originalCallback) originalCallback();
            initAdaIntegration();
        };

        window.adaSettings.chatterTokenCallback = function (chatterToken) {
            console.log('[Ada Re-engagement] Chatter token provided');
            resetInactivityTimer();
        };

        console.log('[Ada Re-engagement] Initialization complete');
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();