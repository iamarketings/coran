import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`

setupCounter(document.querySelector('#counter'))

// PWA functionality
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineDetection();
  }

  // Register Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered successfully:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('PWA: Service Worker update found');
        });
      } catch (error) {
        console.error('PWA: Service Worker registration failed:', error);
      }
    }
  }

  // Setup Install Prompt
  setupInstallPrompt() {
    const installPrompt = document.getElementById('install-prompt');
    const installButton = document.getElementById('install-button');
    const dismissButton = document.getElementById('install-dismiss');

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Show install prompt after a delay
      setTimeout(() => {
        installPrompt.classList.remove('hidden');
      }, 3000);
    });

    // Install button click
    installButton.addEventListener('click', async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log('PWA: User choice:', outcome);
        this.deferredPrompt = null;
      }
      installPrompt.classList.add('hidden');
    });

    // Dismiss button click
    dismissButton.addEventListener('click', () => {
      installPrompt.classList.add('hidden');
      this.deferredPrompt = null;
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed');
      installPrompt.classList.add('hidden');
    });
  }

  // Setup Offline Detection
  setupOfflineDetection() {
    const offlineIndicator = document.getElementById('offline-indicator');

    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        offlineIndicator.classList.add('hidden');
        console.log('PWA: App is online');
      } else {
        offlineIndicator.classList.remove('hidden');
        console.log('PWA: App is offline');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
  }
}

// Initialize PWA
const pwa = new PWAManager();

// Additional PWA features
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  // Background sync support
  console.log('PWA: Background sync supported');
}

if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
  // Push notifications support
  console.log('PWA: Push notifications supported');
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('PWA: App became visible');
  } else {
    console.log('PWA: App became hidden');
  }
});