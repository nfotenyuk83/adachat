// ============================================================================
// ADA CHATBOT RE-ENGAGEMENT - GTM DEPLOYMENT PACKAGE (ES5)
// Version: 1.0.0
// Author: Nikolay Fotenyuk
// ECMAScript 5 Compatible - Works with GTM's Custom HTML tags
// ============================================================================

(function() {
    'use strict';
    
    // Configuration
    var CONFIG = {
        adaHandle: 'supportnex', // Change this to your Ada handle
        firstPopupDelay: 18000,  // 18 seconds
        secondPopupDelay: 60000, // 60 seconds
        popupShowDelay: 500,     // Delay before showing popup
        autoOpenDelay: 2000,     // Delay before auto-opening chat (2 seconds)
        adaLoadTimeout: 10000,   // Timeout for Ada to load (10 seconds)
        zIndex: 100000           // Z-index for popup
    };
    
    // Translations
    var TRANSLATIONS = {
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
    var conversationId = null;
    var inactivityTimer = null;
    var secondInactivityTimer = null;
    var firstPopupShown = false;
    var secondPopupShown = false;
    var popupElement = null;
    
    // Get browser language
    function getBrowserLanguage() {
        if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
            return navigator.languages[0];
        }
        return navigator.language || navigator.userLanguage || 'en';
    }
    
    var langCode = getBrowserLanguage().split('-')[0].toLowerCase();
    var currentLang = TRANSLATIONS[langCode] || TRANSLATIONS['en'];
    
    // Inject CSS
    function injectStyles() {
        var styles = '#ada-reengagement-popup { display: none; position: fixed; bottom: 80px; right: 20px; width: 400px; max-width: calc(100vw - 40px); background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); padding: 20px; z-index: ' + CONFIG.zIndex + '; font-family: Arial, sans-serif; box-sizing: border-box; } #ada-reengagement-popup.show { display: block; animation: ada-slideUp 0.3s ease-out; } @keyframes ada-slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } #ada-reengagement-popup h3 { margin: 0 0 15px 0; font-size: 16px; color: #333; font-weight: normal; } .ada-popup-button { display: block; width: 100%; padding: 12px; margin: 8px 0; border: 2px solid #4CAF50; border-radius: 6px; background: #4CAF50; color: white; cursor: pointer; font-size: 14px; font-weight: bold; text-align: center; transition: all 0.2s; } .ada-popup-button:hover { background: #45a049; border-color: #45a049; } .ada-popup-button.secondary { background: white; color: #999; border: none; font-weight: normal; padding: 10px; } .ada-popup-button.secondary:hover { background: #f5f5f5; color: #999; }';
        
        var styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        if (styleSheet.styleSheet) {
            styleSheet.styleSheet.cssText = styles;
        } else {
            styleSheet.appendChild(document.createTextNode(styles));
        }
        document.head.appendChild(styleSheet);
    }
    
    // Create popup HTML
    function createPopup() {
        var popup = document.createElement('div');
        popup.id = 'ada-reengagement-popup';
        popup.innerHTML = '<h3>' + currentLang.firstPopup.message + '</h3><button class="ada-popup-button" id="ada-popup-btn1">' + currentLang.firstPopup.button1 + '</button><button class="ada-popup-button secondary" id="ada-popup-btn2">' + currentLang.firstPopup.button2 + '</button>';
        document.body.appendChild(popup);
        return popup;
    }
    
    // Update popup content
    function updatePopupContent(isFirstPopup) {
        if (!popupElement) return;
        
        var content = isFirstPopup ? currentLang.firstPopup : currentLang.secondPopup;
        var title = popupElement.querySelector('h3');
        var btn1 = popupElement.querySelector('#ada-popup-btn1');
        var btn2 = popupElement.querySelector('#ada-popup-btn2');
        
        if (title) title.innerHTML = content.message;
        if (btn1) btn1.textContent = content.button1;
        if (btn2) btn2.textContent = content.button2;
    }
    
    // Show popup
    function showPopup() {
        if (popupElement) {
            updatePopupContent(!secondPopupShown);
            popupElement.className = popupElement.className + ' show';
        }
    }
    
    // Hide popup
    function hidePopup() {
        if (popupElement) {
            popupElement.className = popupElement.className.replace(' show', '');
        }
    }
    
    // Ensure chat drawer is open
    function ensureChatOpen() {
        if (window.adaEmbed && typeof window.adaEmbed.getInfo === "function") {
            window.adaEmbed.getInfo().then(function(windowInfo) {
                if (!windowInfo.isDrawerOpen && typeof window.adaEmbed.toggle === "function") {
                    window.adaEmbed.toggle();
                }
            }).catch(function(error) {
                console.error('[Ada Re-engagement] Error opening chat:', error);
            });
        }
    }
    
    // Ensure Ada is loaded before executing callback
    function ensureAdaLoaded(callback) {
        var adaLoaded = false;
        
        var checkInterval = setInterval(function() {
            if (window.adaEmbed && typeof window.adaEmbed.toggle === "function") {
                adaLoaded = true;
                clearInterval(checkInterval);
                callback();
            }
        }, 100);
        
        // Timeout after configured time
        setTimeout(function() {
            if (!adaLoaded) {
                clearInterval(checkInterval);
                console.warn('[Ada Re-engagement] Ada Embed did not load within timeout');
            }
        }, CONFIG.adaLoadTimeout);
    }
    
    // Auto-open chat widget
    function autoOpenChat() {
        ensureAdaLoaded(function() {
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
            secondInactivityTimer = setTimeout(function() {
                if (secondPopupShown) return;
                
                console.log('[Ada Re-engagement] Second popup triggered after 1 minute');
                secondPopupShown = true;
                
                setTimeout(function() {
                    showPopup();
                }, CONFIG.popupShowDelay);
            }, CONFIG.secondPopupDelay);
            
            return;
        }
        
        // First popup timer
        inactivityTimer = setTimeout(function() {
            if (firstPopupShown) return;
            
            console.log('[Ada Re-engagement] First popup triggered after 18 seconds');
            firstPopupShown = true;
            
            setTimeout(function() {
                showPopup();
            }, CONFIG.popupShowDelay);
            
            // Start second popup timer
            if (!secondPopupShown) {
                secondInactivityTimer = setTimeout(function() {
                    if (secondPopupShown) return;
                    
                    console.log('[Ada Re-engagement] Second popup triggered after 1 minute');
                    secondPopupShown = true;
                    
                    setTimeout(function() {
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
        window.adaEmbed.subscribeEvent("ada:conversation:message", function(data) {
            conversationId = data.conversation_id;
            
            // Auto-dismiss popup if user interacts with chat
            if (popupElement && popupElement.className.indexOf('show') !== -1) {
                console.log('[Ada Re-engagement] User interacted, auto-dismissing popup');
                hidePopup();
            }
            
            resetInactivityTimer();
        });
        
        // Subscribe to drawer toggle
        window.adaEmbed.subscribeEvent("ada:drawer_toggle", function(data) {
            // Popup stays open even when drawer is minimized
        });
        
        console.log('[Ada Re-engagement] Ada integration initialized');
        
        // Start inactivity timer
        resetInactivityTimer();
        
        // Auto-open chat after delay
        setTimeout(function() {
            autoOpenChat();
        }, CONFIG.autoOpenDelay);
    }
    
    // Setup button handlers
    function setupButtonHandlers() {
        var btn1 = document.getElementById('ada-popup-btn1');
        var btn2 = document.getElementById('ada-popup-btn2');
        
        if (btn1) {
            btn1.addEventListener('click', function() {
                console.log('[Ada Re-engagement] User clicked: Start now');
                resetInactivityTimer();
                ensureChatOpen();
                hidePopup();
            });
        }
        
        if (btn2) {
            btn2.addEventListener('click', function() {
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
        
        var script = document.createElement('script');
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
        
        var originalCallback = window.adaSettings.onAdaEmbedLoaded;
        window.adaSettings.onAdaEmbedLoaded = function() {
            if (originalCallback) originalCallback();
            initAdaIntegration();
        };
        
        window.adaSettings.chatterTokenCallback = function(chatterToken) {
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