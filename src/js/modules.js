// IMPORTING MODULES
import * as mainApp from './app.js';
const sevenBin = require('7zip-bin')
const { extractFull } = require('node-7z');
const https = require('https');
const fs = require('fs');
const path = require('path');
const unrar = require("node-unrar-js");
const { ipcRenderer } = require("electron")
const unzipper = require('unzipper');

export function startDiscordPresence() {

  const DiscordRPC = require('discord-urpc');

  const uRPC = new DiscordRPC({ clientID: '1145736310338879588', debug: true });

  uRPC.on('ready', () => {
    const args = {
      pid: process.pid,
      activity: {
        details: 'Le launcher MC ultra rapide pour',
        state: 'être le premier sur les évents.',
        timestamps: {
          start: new Date().getTime() / 1000
        },
        assets: {
          large_image: 'big',
          large_text: 'Fuzelauncher dézippe automatiquement vos mods, détecte automatiquement la version & le modloader',
        },
        buttons: [
          {
            "label": "▶ Découvrir Fuzelauncher",
            "url": "https://fuzelauncher.netlify.app/"
          }
        ],
        // party,
        // secrets,
        instance: false
      }
    };

    uRPC.send('SET_ACTIVITY', args);
  });
}

export function getSettings() {
  return JSON.parse(localStorage.getItem('settings-content'));
}

export function log(log) {
  console.log('[FUZELAUNCHER] ' + log)
}

export function addBarFunctions() {
  const { ipcRenderer } = require('electron');

  log('Adding bar functions')

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
    mainApp.clickSettings()
  });
}

export function reactToClose() {
  let launchButton = document.getElementById('button-launch');
  const launchButtonText = document.getElementById('button-text')
  log('Minecraft has been closed');
  launchButtonText.textContent = "LANCER"
  document.getElementById('mods-subtitle').textContent = "Ajoute des mods si l'évent en a besoin"
  launchButton.classList.remove('button-primary-locked')
  launchButton.classList.add('main-launch-btn')
  localStorage.setItem('open', 'false')
}

export function setBaseLocalStorageItems() {
  localStorage.setItem('open', 'false')
  localStorage.setItem('settings-state', 'closed')
}

export function setFirstLaunchLocalStorageItems() {
  if (!localStorage.getItem('gameType')) {
    localStorage.setItem('gameType', 'vanilla')
  }
  if (!localStorage.getItem('settings-content')) {
    localStorage.setItem('settings-content', `{"account":{"type":"microsoft","username":""},"ram":{"min":"4","max":"6"},"game":{"toggle-gamma":false,"toggle-fullscreen":false},"forgeSettings":{"toggle-lastforgeversion":false},"fuzelauncher":{"toggle-magiccopy":true,"toggle-quicklaunch":true,"toggle-discordpresence":true}}`)
  }
}

export function autoFillVersionFromLocalStorage() {
  if (localStorage.getItem('version')) {
    document.getElementById('version-input').value = localStorage.getItem('version');
  }
}

export function autoSelectGameTypeFromLocalStorage() {
  if (localStorage.getItem('gameType')) {
    select(localStorage.getItem('gameType'))
  }
}

export function select(button) {
  if (document.querySelector('.item-selected')) {
    document.querySelector('.item-selected').classList.remove('item-selected')
  }
  var element = document.getElementById(button)
  element.classList.add('item-selected')

  // FOR GAME TYPES
  if (button === 'vanilla' || button === 'forge' || button === 'fabric') {
    localStorage.setItem('gameType', button);
  }
}


export function windowEffect() {
  // Apply the magic copy effect to .app and body
  const appElement = document.querySelector('.app');
  if (appElement) {
    appElement.classList.add('magic-copy-effect');
    // Remove the class after a short delay (1.5 seconds)
    setTimeout(function () {
      appElement.classList.remove('magic-copy-effect');
    }, 750);
  }

  document.body.classList.add('magic-copy-effect');
  // Remove the class after a short delay (1.5 seconds)
  setTimeout(function () {
    document.body.classList.remove('magic-copy-effect');
  }, 750);
}

export function extractEventData(message) {
  const versionRegex = /1\.\d+\.\d+/;
  const forgeRegex = /Forge/i;
  const fabricRegex = /Fabric/i;
  const modsRegex = /\b(?:mods?|moddé)\b/i;

  const versionMatch = message.match(versionRegex);
  const forgeMatch = message.match(forgeRegex);
  const fabricMatch = message.match(fabricRegex);
  const modsMatch = message.match(modsRegex);

  const version = versionMatch ? versionMatch[0] : null;
  const eventType = forgeMatch ? 'Forge' : (fabricMatch ? 'Fabric' : 'Vanilla');
  const requireMods = modsMatch !== null;

  return { version, eventType, requireMods };
}

export function setMaxGamma() {
  log('Setting max gamma')
}


export function setNormalGamma() {
  log('Setting normal gamma')
}

export function fabricJSONFailure() {
  document.getElementById('button-text').textContent = "ERREUR FABRIC"
  ipcRenderer.invoke("showError", "FuzeLauncher ne parvient pas à lancer Fabric avec cette version. Merci de vérifier la version mise, votre connection internet, et si FuzeLauncher est à jour.");
  location.reload()
}

export function isVersionUnder113(version) {
  // Parse the version string into major, minor, and patch components
  const [major, minor, patch] = version.split('.').map(Number);

  // Compare the major and minor version numbers
  if (major < 1 || (major === 1 && minor < 13)) {
    return true; // Version is under 1.13
  } else {
    return false; // Version is 1.13 or higher
  }
}

export function forgeCreateFolderFailure() {
  document.getElementById('button-text').textContent = "ERREUR FORGE"
  ipcRenderer.invoke("showError", "Impossible de lancer Forge", "FuzeLauncher ne parvient pas à créer le dossier .minecraft/forge. Une permission manquante? Essayez de le creer vous meme. Si ca ne fonctione toujours pas, verifiez les mises a jour.");
  location.reload()
}

export function forgeDownloadFileFailure() {
  document.getElementById('button-text').textContent = "ERREUR FORGE"
  ipcRenderer.invoke("showError", "Impossible de lancer Forge", "FuzeLauncher ne parvient pas à lancer Forge avec cette version. Merci de vérifier la version mise, votre connection internet, et si FuzeLauncher est à jour.");
  location.reload()
}

export function invalidModExtensionFailure() {
  ipcRenderer.invoke("showError", "Type de mod invalide", "Seulement les fichiers .jar, .zip, .rar et .7z sont acceptés pour le moment");
}

export function showWelcomeScreen() {

  let welcomeScreen = document.createElement('div')
  welcomeScreen.setAttribute('class', 'welcome-screen')

  let welcomeHeader = document.createElement('div')
  welcomeHeader.setAttribute('class', 'welcome-header')

  let welcomeLogo = document.createElement('img')
  welcomeLogo.setAttribute('class', 'welcome-logo')
  welcomeLogo.setAttribute('src', '../img/icon.png')

  let welcomeTitle = document.createElement('p')
  welcomeTitle.setAttribute('class', 'welcome-title')
  welcomeTitle.textContent = "Bienvenue sur le Fuzelauncher"

  let welcomeBar = document.createElement('div')
  welcomeBar.setAttribute('class', 'welcome-bar')

  let welcomeContent = document.createElement('div')
  welcomeContent.setAttribute('class', 'welcome-content')

  // BLOCK 1 : MODS
  let welcomeBlock1 = document.createElement('div')
  welcomeBlock1.setAttribute('class', 'welcome-block')

  let iconbox1 = document.createElement('div')
  iconbox1.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-file-import" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 13v-8a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-5.5m-9.5 -2h7m-3 -3l3 3l-3 3" /></svg>`
  iconbox1.setAttribute('class', 'icon-box')

  let blockText1 = document.createElement('div')
  blockText1.setAttribute('class', 'welcome-blocktext')

  let blockMain1 = document.createElement('div')
  blockMain1.setAttribute('class', 'welcome-blocktitle')
  blockMain1.textContent = "Glissez les mods sur le launcher"

  let blockSecond1 = document.createElement('div')
  blockSecond1.setAttribute('class', 'welcome-blocksubtitle')
  blockSecond1.textContent = "Prenez vos mods (.jar, .zip, .rar) depuis vos fichiers et lachez les sur le launcher pour les ajouter"

  blockText1.append(blockMain1, blockSecond1)
  welcomeBlock1.append(iconbox1, blockText1)

  // BLOCK 2 : MAGICCOPY
  let welcomeBlock2 = document.createElement('div')
  welcomeBlock2.setAttribute('class', 'welcome-block')

  let iconbox2 = document.createElement('div')
  iconbox2.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-copy" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg>`
  iconbox2.setAttribute('class', 'icon-box')

  let blockText2 = document.createElement('div')
  blockText2.setAttribute('class', 'welcome-blocktext')

  let blockMain2 = document.createElement('div')
  blockMain2.setAttribute('class', 'welcome-blocktitle')
  blockMain2.textContent = "MagicCopy"

  let blockSecond2 = document.createElement('div')
  blockSecond2.setAttribute('class', 'welcome-blocksubtitle')
  blockSecond2.textContent = "Copiez le message d'event et faites CTRL + V sur le launcher pour remplir automatiquement"

  blockText2.append(blockMain2, blockSecond2)
  welcomeBlock2.append(iconbox2, blockText2)

  // BLOCK 3 : MULTIPLE INSTANCES
  let welcomeBlock3 = document.createElement('div')
  welcomeBlock3.setAttribute('class', 'welcome-block')

  let iconbox3 = document.createElement('div')
  iconbox3.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pointer" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7.904 17.563a1.2 1.2 0 0 0 2.228 .308l2.09 -3.093l4.907 4.907a1.067 1.067 0 0 0 1.509 0l1.047 -1.047a1.067 1.067 0 0 0 0 -1.509l-4.907 -4.907l3.113 -2.09a1.2 1.2 0 0 0 -.309 -2.228l-13.582 -3.904l3.904 13.563z" /></svg>`
  iconbox3.setAttribute('class', 'icon-box')

  let blockText3 = document.createElement('div')
  blockText3.setAttribute('class', 'welcome-blocktext')

  let blockMain3 = document.createElement('div')
  blockMain3.setAttribute('class', 'welcome-blocktitle')
  blockMain3.textContent = "Lancer plusieurs instances"

  let blockSecond3 = document.createElement('div')
  blockSecond3.setAttribute('class', 'welcome-blocksubtitle')
  blockSecond3.textContent = "Vous pouvez avoir plusieurs Minecraft en même temps en recliquant sur le bouton lancer afin de le réactiver"

  blockText3.append(blockMain3, blockSecond3)
  welcomeBlock3.append(iconbox3, blockText3)

  // end

  let welcomeButtons = document.createElement('div')
  welcomeButtons.setAttribute('class', 'welcome-buttons')

  let continueButton = document.createElement('a')
  continueButton.setAttribute('class', 'button-primary continue-button')
  continueButton.textContent = "Continuer"

  continueButton.addEventListener("click", hideWelcomeScreen);

  let fader = document.createElement('div')
  fader.setAttribute('class', 'fader')

  fader.addEventListener("click", hideWelcomeScreen);

  welcomeHeader.append(welcomeLogo, welcomeTitle, welcomeBar)
  welcomeContent.append(welcomeBlock1, welcomeBlock2, welcomeBlock3)
  welcomeButtons.append(continueButton)
  welcomeScreen.append(welcomeHeader, welcomeContent, welcomeButtons)
  document.body.querySelector('.app').append(fader, welcomeScreen)
}

export function hideWelcomeScreen() {
  document.querySelector('.welcome-screen').remove()
  document.querySelector('.fader').remove()

  localStorage.setItem('firstOpen', 'false')
}


export function downloadFile(link, downloadPath, fileName) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(path.join(downloadPath, fileName));

    https.get(link, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', error => {
        fs.unlinkSync(path.join(downloadPath, fileName));
        reject(error);
      });
    }).on('error', error => {
      showError(error)
      reject(error);
    });
  });
}

export function checkForUpdates() {
  fetch('https://pastebin.com/raw/supsCpU3')
    .then(response => response.text())
    .then(data => {
      if (!localStorage.getItem('fuzeVersion')) {
        localStorage.setItem('fuzeVersion', data)
      } else {
        if (localStorage.getItem('fuzeVersion') !== data) {
          alert(`T\'es pas a la derniere maj alors si tout casse c\'est ta faute va telecharger la derniere version sur le github (t'es sur la ${localStorage.getItem('fuzeVersion')} la derniere c'est la ${data})`)
        }
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showError(error)
    });
}

export function updateNumberOfMods() {
  const modsPath = './.minecraft/mods';

  fs.readdir(modsPath, (err, files) => {
    if (err) {
      log('Une erreur est survenue lors du chargement du nombre de mods: ' + err)
      return;
    }

    const fileCount = files.length;
    if (document.getElementById('numberOfMods')) {
      document.getElementById('numberOfMods').textContent = fileCount;
    }
  });
}

export function showError(err) {
  ipcRenderer.invoke("showError", "Une erreur est survenue", `Si tu ne parviens pas à la régler/tu ne sais pas d\'ou ca vient, fait une issue sur le GitHub.\n${err}`);
}

export function showDialog(type, title, message) {
  ipcRenderer.invoke("showDialog", type, title, message);
}

/*
export async function extractRAR(inputFilePath, outputDirectory) {
  try {
    // Lire le contenu du fichier RAR
    const rarBuffer = Uint8Array.from(fs.readFileSync(inputFilePath)).buffer;
 
    // Créer un extracteur à partir des données du RAR
    const extractor = await unrar.createExtractorFromData({ data: rarBuffer });
 
    // Extraire les fichiers dans le dossier de sortie
    const extracted = extractor.extract({ targetPath: outputDirectory });

    console.log(rarBuffer, extracted, extractor)
    // const extracted = extractor.extract({ targetPath: outputDirectory });
 
    console.log("Fichiers extraits :");
    for (const file of extracted.files) {
      console.log("- ", file.fileHeader.name);
    }
  } catch (error) {
    if (error instanceof unrar.UnrarError) {
      console.error("Erreur lors de l'extraction :", error.reason);
      showError(error)
    } else {
      console.error("Erreur inattendue :", error);
      showError(error)
    }
  }
}

export function extractRAR3(rarFilePath, extractDir) {
  // Create the extraction directory if it doesn't exist
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir);
  }
 
  // Open the RAR archive
  const archive = unrar.createExtractorFromFile(rarFilePath);
 
  // Extract all files from the archive
  const extractedFiles = archive.extractAll(extractDir);
 
  return extractedFiles;
}


export async function extractRAR2(inputFilePath, outputDirectory) {
  try {

        // Lire le contenu du fichier RAR
        const rarBuffer = Uint8Array.from(fs.readFileSync(inputFilePath)).buffer;
 
        // Créer un extracteur à partir des données du RAR
        const extractor = await unrar.createExtractorFromData({ data: rarBuffer });
   const list = extractor.getFileList() //line 81
   const fileHeaders = [...list.fileHeaders] 
   console.log(extractor, list, fileHeaders)
   for (let index = 0; index < fileHeaders.length; index++) {
      const item = fileHeaders[index]
      if (!item.flags.directory) {
        let extracted = extractor.extract({ files: [item.name] })
        let files = [...extracted.files]
        let ws = fs.createWriteStream(`${outputDirectory}\\${item.name}`)
        console.log(ws)
        console.log(files[0].extraction)
        var string = new TextDecoder().decode(files[0].extraction);
        console.log(string)
  //      str(files[0].extraction).pipe(ws)
      }
    }
  } catch (error) {
    if (error instanceof unrar.UnrarError) {
      console.error("Erreur lors de l'extraction :", error.reason);
    } else {
      console.error("Erreur inattendue :", error);
    }
  }
}
*/

export async function extractRAR(inputFilePath, outputDirectory) {
  try {
    // Lire le contenu du fichier RAR
    const rarBuffer = Uint8Array.from(fs.readFileSync(inputFilePath)).buffer;

    // Créer un extracteur à partir des données du RAR
    const extractor = await unrar.createExtractorFromData({ data: rarBuffer });

    const list = extractor.getFileList();
    const fileHeaders = [...list.fileHeaders];
    const totalFiles = fileHeaders.length;
    let extractedFiles = 0;

    for (let index = 0; index < totalFiles; index++) {
      const item = fileHeaders[index];
      if (!item.flags.directory) {
        let extracted = extractor.extract({ files: [item.name] });
        let files = [...extracted.files];

        // Écrire le contenu extrait dans un fichier
        if (files.length > 0 && files[0].extraction) {
          let extractedContent = files[0].extraction;
          let outputPath = path.join(outputDirectory, item.name);

          // Utiliser fs.writeFile pour écrire le contenu dans le fichier
          fs.writeFileSync(outputPath, extractedContent);

          console.log(`Contenu extrait de ${item.name} écrit dans ${outputPath}`);

          // Increment the count of extracted files
          extractedFiles++;

          // Calculate the percentage
          const percent = Math.floor((extractedFiles / totalFiles) * 100);

          // Update the text content with the current percentage
          document.getElementById('mods-subtitle').textContent = `EXTRACTION(S) RAR EN COURS... ${percent}%`;
          log(`Extracting RAR file... ${percent}%`)
        }
      }
    }

    // Set the text content to indicate extraction completion
    document.getElementById('mods-subtitle').textContent = "Ajoute des mods si l'event en a besoin";
    log(`RAR file extracted`)
    fs.unlinkSync(inputFilePath);
  } catch (error) {
    if (error instanceof unrar.UnrarError) {
      console.error("Erreur lors de l'extraction :", error.reason);
      showError(error)
    } else {
      console.error("Erreur inattendue :", error);
      showError(error)
    }
  }
}

export async function extract7z(inputFilePath, outputDirectory) {
  try {
    const pathTo7zip = sevenBin.path7za
    const seven = extractFull(inputFilePath, outputDirectory, {
      $bin: pathTo7zip,
      $progress: true
    })
    seven.on('progress', function (progress) {
      document.getElementById('mods-subtitle').textContent = `EXTRACTION(S) 7z EN COURS... ${progress.percent}%`;
      log(`Extracting 7z file... ${progress.percent}%`)
    })
    seven.on('end', function () {
      document.getElementById('mods-subtitle').textContent = "Ajoute des mods si l'event en a besoin";
      log('7z file extracted')
      fs.unlinkSync(inputFilePath);
    })
  } catch (error) {
    console.error("Erreur inattendue :", error);
    showError(error)
  }
}

export async function extractZIP(inputFilePath, outputDirectory) {
  try {
    // Extract the zip file
    await new Promise((resolve, reject) => {
      const zipStream = fs.createReadStream(inputFilePath)
        .pipe(unzipper.Extract({ path: outputDirectory }));

      zipStream.on('close', () => {
        log('Zip file extracted');
        // Delete the original zip file
        fs.unlinkSync(inputFilePath);
        document.getElementById('mods-subtitle').textContent = "Ajoute des mods si l'event en a besoin";
        resolve();
      });

      zipStream.on('error', (err) => {
        console.error("Erreur inattendue :", err);
        showError(err)
      });
    });
  } catch (error) {
    console.error("Erreur inattendue :", error);
    showError(error)
  }
}

// MINECRAFT LOGS
export function handleData(e){
  if(e.includes("Setting user:")){
    document.getElementById('button-text').textContent = "Jeu ouvert"
    if(document.getElementById('progressBar')){
      document.getElementById('progressBar').remove()
    }
  }
  console.log(e)
}

  // MINECRAFT LAUNCHER CORE LOGS
export function handleDebug(e) {
  if(e === "[MCLC]: Downloaded assets"){
    document.getElementById('button-text').textContent = "Ouverture..."
    if(document.getElementById('progressBar')){
      document.getElementById('progressBar').remove()
    }
  }
  if(e.includes("[MSMC]: Failed to close window!")){
    document.getElementById('button-launch').classList.remove('button-primary-locked')
    localStorage.setItem('open', 'false')
    document.getElementById('button-text').textContent = "Lancer"
  }
  console.log(e)
}

export function handleProgress(e) {

  if (!document.getElementById('progressBar')) {
    // Create the progress bar in the launch button
    let progressBar = document.createElement('div')
    progressBar.setAttribute('class', 'button-primary progress-bar')
    progressBar.setAttribute('id', 'progressBar')

    document.getElementById('button-launch').append(progressBar)
  }

  let currentTask = e.task // ex: 202
  let totalTasks = e.total // ex: 2000
  let progressType = e.type // ex:  assets

  // Calculate the progress percentage
  let progress = (currentTask / totalTasks) * 60;

  // Update the progress bar width
  document.getElementById('progressBar').style.width = progress + '%';
  document.getElementById('button-text').textContent = `CHARGEMENT ${progressType} (${currentTask}/${totalTasks})`

  console.log(e)
}