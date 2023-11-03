const { ipcRenderer } = require('electron');

console.log('[FUZELAUNCHER] Building App')
fetch('main.html')
.then(response => response.text())
.then(data => {
    document.body.innerHTML = data;
});

// Initialize Frame Buttons
const minimizeBtn = document.querySelector('.custom-frame-btn-minus');
minimizeBtn.addEventListener('click', () => {
  ipcRenderer.send('minimize');
});

const closeBtn = document.querySelector('.custom-frame-btn-close');
closeBtn.addEventListener('click', () => {
  ipcRenderer.send('close');
});

const settingsBtn = document.querySelector('.custom-frame-btn-settings');
settingsBtn.addEventListener('click', () => {
  openSettings()
});

console.log('[FUZELAUNCH] Setting localStorage values')
localStorage.setItem('open', 'false')
localStorage.setItem('settings-state', 'closed')
console.log('[FUZELAUNCH] Ready!')