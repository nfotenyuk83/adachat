# Ada Chatbot Re-engagement - GTM Implementation Guide

**Version:** 1.0.0
**Author:** Nikolay Fotenyuk

## Overview
This package provides a self-contained solution for implementing Ada chatbot re-engagement popups through Google Tag Manager (GTM). The solution automatically opens the Ada chat widget on page load and triggers re-engagement popups after periods of inactivity.

## Features
- ✅ Auto-open chat widget on page load (configurable delay)
- ✅ Two-stage idle detection (18 seconds, then 1 minute)
- ✅ Multi-language support (FR, EN, DE - easily extendable)
- ✅ Responsive design
- ✅ Auto-dismissal on user interaction
- ✅ GTM-ready deployment
- ✅ No external dependencies
- ✅ Ada load detection with timeout handling

## Installation Steps

### Step 1: Create a Custom HTML Tag in GTM

1. Log in to your Google Tag Manager account
2. Navigate to **Tags** → **New**
3. Name your tag: `Ada Chatbot Re-engagement`
4. Click **Tag Configuration**
5. Select **Custom HTML**
6. Copy and paste the entire JavaScript code from the release package
7. Set **Tag Firing Options** to "Once per page"

### Step 2: Configure the Trigger

1. Click **Triggering**
2. Click the **+** icon to create a new trigger
3. Choose **Trigger Type**: `Page View - DOM Ready`
4. Set **This trigger fires on**: `All DOM Ready Events`
5. Or create a custom trigger based on your requirements (e.g., specific pages)

### Step 3: Configuration

Before deploying, update the configuration in the code:

```javascript
const CONFIG = {
    adaHandle: 'supportnex', // ⚠️ CHANGE THIS to your Ada handle
    firstPopupDelay: 18000,  // 18 seconds (adjust if needed)
    secondPopupDelay: 60000, // 60 seconds (adjust if needed)
    popupShowDelay: 500,     // Delay before showing popup
    autoOpenDelay: 2000,     // 2 seconds after Ada loads
    adaLoadTimeout: 10000,   // Max wait time for Ada to load (10 seconds)
    zIndex: 100000           // Z-index for popup overlay
};
```

### Step 4: Test in Preview Mode

1. Click **Preview** in GTM
2. Load your website
3. Verify the tag fires correctly
4. Test the complete flow:
   - **Auto-open**: Chat should open automatically after 2 seconds
   - Wait 18 seconds without interaction → First popup should appear
   - Interact with chat or dismiss the popup
   - Wait 1 minute → Second popup should appear
   - Test "Start now" button → Opens chat and dismisses popup
   - Test "No thanks" button → Only dismisses popup

### Step 5: Publish

1. Click **Submit** in GTM
2. Add a version name (e.g., "Ada Re-engagement v1.0")
3. Add a description
4. Click **Publish**

## Customization

### Adding More Languages

Add new language entries to the `TRANSLATIONS` object:

```javascript
const TRANSLATIONS = {
    // ... existing translations ...
    es: {  // Spanish
        firstPopup: {
            message: "👋 ¿Sigues ahí? ¡Tu chequeo gratuito de PC te está esperando!",
            button1: "Empezar ahora",
            button2: "No, gracias"
        },
        secondPopup: {
            message: "👋 Estaré disponible si necesitas ayuda con la instalación o activación de tu producto.",
            button1: "Empezar ahora",
            button2: "No, gracias"
        }
    }
};
```

### Adjusting Timing

Modify the `CONFIG` object:

```javascript
const CONFIG = {
    firstPopupDelay: 20000,  // 20 seconds instead of 18
    secondPopupDelay: 90000, // 90 seconds instead of 60
    autoOpenDelay: 5000,     // 5 seconds delay before auto-open
    adaLoadTimeout: 15000,   // 15 seconds max wait for Ada
    // ...
};
```

### Disabling Auto-Open

To disable the automatic chat opening on page load:

```javascript
// In the initAdaIntegration() function, comment out or remove:
// setTimeout(() => {
//     autoOpenChat();
// }, CONFIG.autoOpenDelay);
```

### Customizing Styling

Modify the CSS within the `injectStyles()` function:

```javascript
function injectStyles() {
    const styles = `
        #ada-reengagement-popup {
            /* Modify colors, sizes, positions here */
            bottom: 80px;
            right: 20px;
            width: 400px;
            /* ... */
        }
    `;
    // ...
}
```

## Behavior

### Auto-Open Chat
- Chat widget automatically opens after page load
- Default delay: 2 seconds after Ada is fully loaded
- Uses `ensureAdaLoaded()` to wait for Ada initialization
- Will timeout after 10 seconds if Ada doesn't load

### First Popup (18 seconds)
- Triggers after 18 seconds of chat inactivity
- Shows different message per language
- Resets timer on user interaction
- Auto-dismisses if user interacts with chat

### Second Popup (1 minute)
- Triggers 60 seconds after first popup is shown
- Uses different message than first popup
- Timer resets if user interacts with chat
- Both popups fire only once per session

### User Actions
- **"Start now"**: Opens chat drawer, dismisses popup, resets timer
- **"No thanks"**: Dismisses popup only
- **Chat interaction**: Auto-dismisses popup, resets timer
- **Drawer minimize**: Popup stays visible

## Technical Details

### Ada Load Detection
The script uses `ensureAdaLoaded()` which:
- Polls every 100ms for Ada Embed availability
- Checks for `window.adaEmbed.toggle` function
- Times out after 10 seconds (configurable)
- Prevents duplicate warnings if Ada is already loaded

### Timer Reset Logic
- **Before first popup**: Any chat interaction resets 18s timer
- **After first popup, before second**: Chat interaction resets 60s timer
- **After both popups**: Timers stop resetting
- **"Start now" click**: Resets active timer (first or second)

## Troubleshooting

### Tag Not Firing
- Check trigger configuration
- Verify tag is enabled
- Use GTM Preview mode to debug

### Popup Not Appearing
- Open browser console and look for `[Ada Re-engagement]` logs
- Verify Ada script is loading correctly
- Check for CSS conflicts (z-index issues)

### Chat Not Auto-Opening
- Check console for `[Ada Re-engagement] Auto-opening chat widget` message
- Verify `autoOpenDelay` is not set too high
- Ensure Ada script loads within `adaLoadTimeout` period
- Check for console warning: `Ada Embed did not load within timeout`

### Wrong Language Displaying
- Check browser language settings
- Verify language code is in TRANSLATIONS object
- Falls back to English if language not supported

### Ada Load Timeout Warning
If you see "Ada Embed did not load within timeout":
- Increase `adaLoadTimeout` in CONFIG (default: 10000ms)
- Check network tab to see if Ada script is blocked
- Verify `adaHandle` is correct

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Notes
- The script is self-contained and doesn't require external dependencies
- All styles are injected dynamically
- Works alongside existing Ada implementations
- Cookie-free solution (uses session state only)
- Auto-open chat happens once per page load
- Timers start counting after Ada is fully loaded
- Console logs are prefixed with `[Ada Re-engagement]` for easy debugging

## Version History
- **v1.0.0** - Initial release
  - FR, EN, DE language support
  - Auto-open chat functionality
  - Two-stage re-engagement (18s, 1m)
  - Ada load detection with timeout
  - GTM-ready deployment

## Support
For issues or questions, refer to Ada's official documentation or contact your Ada support team.

## Author
Nikolay Fotenyuk
