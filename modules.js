// IMPORTING MODULES
import * as mainApp from './initialize.js';
const https = require('https');
const fs = require('fs');
const path = require('path');
const unrar = require("node-unrar-js");

export function startDiscordPresence() {

    const DiscordRPC = require('discord-urpc');

    const uRPC = new DiscordRPC({ clientID: '1145736310338879588', debug: true });

    uRPC.on('ready', () => {
        const args = {
            pid: process.pid,
            activity: {
                details: 'Le launcher ultra rapide pour',
                state: 'etre le premier sur l\'event.',
                timestamps: {
                    start: new Date().getTime() / 1000
                },
                assets: {
                    large_image: 'big',
                    large_text: '100% des gagnants du cashprize etaient sur l\'event. Ne loupe plus ta chance',
                },
                buttons: [
                    {
                        "label": "▶ Installer FuzeLauncher",
                        "url": "https://pastebin.com/raw/v4AUdq7f"
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
    log('Minecraft has been closed');
    launchButton.textContent = "LANCER"
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
        localStorage.setItem('settings-content', `{"account":{"type":"microsoft","username":""},"ram":{"min":"4","max":"6"},"game":{"toggle-gamma":false,"toggle-fullscreen":false},"fuzelauncher":{"toggle-magiccopy":true,"toggle-quicklaunch":true,"toggle-discordpresence":true}}`)
    }
}

export function autoFillVersionFromLocalStorage() {
    if (localStorage.getItem('version')) {
        document.getElementById('version-input').value = localStorage.getItem('version');
    }
}

export function autoSelectGameTypeFromLocalStorage() {
    if (localStorage.getItem('gameType')) {
        document.getElementById(localStorage.getItem('gameType')).classList.add('item-selected')
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
    document.getElementById('button-launch').textContent = "ERREUR FABRIC"
    alert('FuzeLauncher ne parvient pas à lancer Fabric avec cette version. Merci de vérifier la version mise, votre connection internet, et si FuzeLauncher est à jour.')
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
    document.getElementById('button-launch').textContent = "ERREUR FORGE"
    alert('FuzeLauncher ne parvient pas à créer le dossier .minecraft/forge. Une permission manquante? Essayez de le creer vous meme. Si ca ne fonctione toujours pas, verifiez les mises a jour.')
    location.reload()
}

export function forgeDownloadFileFailure() {
    document.getElementById('button-launch').textContent = "ERREUR FORGE"
    alert('FuzeLauncher ne parvient pas à lancer Forge avec cette version. Merci de vérifier la version mise, votre connection internet, et si FuzeLauncher est à jour.')
    location.reload()
}

export function invalidModExtensionFailure() {
    alert('Seulement les fichiers .jar, .zip, et .rar sont acceptés')
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
            reject(error);
        });
    });
}

export function checkForUpdates(){
  fetch('https://pastebin.com/raw/supsCpU3')
  .then(response => response.text())
  .then(data => {
    if(!localStorage.getItem('fuzeVersion')){
      localStorage.setItem('fuzeVersion', data)
    } else{
      if(localStorage.getItem('fuzeVersion') !== data){
        alert(`T\'es pas a la derniere maj alors si tout casse c\'est ta faute va telecharger la derniere version sur le github (t sur la ${localStorage.getItem('fuzeVersion')} la derniere c ${data}))`)
      }
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

export function updateNumberOfMods(){
    const modsPath = './.minecraft/mods';

    fs.readdir(modsPath, (err, files) => {
  if (err) {
    log('Une erreur est survenue lors du chargement du nombre de mods: ' + err)
    return;
  }

  const fileCount = files.length;
  if(document.getElementById('numberOfMods')){
    document.getElementById('numberOfMods').textContent= fileCount;
  }
});
}

export function showError(err){
    alert('Une erreur est survenue. Si tu ne parviens pas à la régler/tu ne sais pas d\'ou ca vient, fait une issue sur le GitHub ou sur le serveur Discord. Les liens sont en bas dans paramètres. \n' + err)
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
      } else {
        console.error("Erreur inattendue :", error);
      }
    }
  }
  /*
  
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

  export async function extractRAR2(inputFilePath, outputDirectory) {
    try {
      // Lire le contenu du fichier RAR
      const rarBuffer = Uint8Array.from(fs.readFileSync(inputFilePath)).buffer;
  
      // Créer un extracteur à partir des données du RAR
      const extractor = await unrar.createExtractorFromData({ data: rarBuffer });
      
      const list = extractor.getFileList();
      const fileHeaders = [...list.fileHeaders];
      console.log(extractor, list, fileHeaders);
      
      for (let index = 0; index < fileHeaders.length; index++) {
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
          }
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