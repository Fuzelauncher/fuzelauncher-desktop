const fs = require('fs');
const { app, dialog, shell, ipcRenderer, TouchBar } = require('electron');
const path = require('path');

// IMPORTING MODULES
import * as fuzeLauncher from './modules.js'

// SETTING FIRSTLAUNCH LOCALSTORAGE ITEMS
fuzeLauncher.setFirstLaunchLocalStorageItems()

// SETTING UP SETTINGS
let settingsContent = fuzeLauncher.getSettings();
if (settingsContent.fuzelauncher['toggle-discordpresence'] === true) {
  fuzeLauncher.startDiscordPresence()
}

//MODS PATH
let modsPath = './.minecraft/mods';

// Check if the file path exists
if (!fs.existsSync(modsPath)) {
  // If it doesn't exist, create it
  fs.mkdirSync(modsPath, { recursive: true }); // Use { recursive: true } to create parent directories if they don't exist
  console.log(`[FUZELAUNCH] Folder "${modsPath}" created.`);

  localStorage.setItem('firstOpen', 'true')
} else {
  localStorage.setItem('firstOpen', 'false')
}

// WE WILL NOW START BUILDING THE MAIN PAGE
buildApp()

export async function buildApp() {
  fuzeLauncher.log('Starting to build main app')

  // LOAD MAIN PAGE HTML
  fetch('main.html')
    .then(response => response.text())
    .then(data => {
      document.body.innerHTML = data;

      // UPDATING MODS COUNT
      fuzeLauncher.checkForUpdates()

      // ADDING THE FUNCTION FOR CLOSE, SETTINGS, MINIMIZE BUTTON
      fuzeLauncher.addBarFunctions()

      // SETTING BASE LOCALSTORAGE ITEMS
      fuzeLauncher.setBaseLocalStorageItems()

      // AUTO-FILLING VERSION
      fuzeLauncher.autoFillVersionFromLocalStorage()

      // AUTO-SELECTING GAME TYPE
      fuzeLauncher.autoSelectGameTypeFromLocalStorage()

      // UPDATING MODS COUNT
      fuzeLauncher.updateNumberOfMods()

      // SHOWING WELCOME SCREEN IF NEW
      if(localStorage.getItem('firstOpen') !== "false") {
        fuzeLauncher.showWelcomeScreen();
        console.log('first open lol ' + localStorage.getItem('firstOpen'));
    }

      // WAITING FOR NEW MODS
      fs.watch(modsPath, (eventType, filename) => {
        if (eventType === 'rename' && filename) {
          fuzeLauncher.updateNumberOfMods()
        }
      });

      // VARIOUS MAIN PAGE EVENT LISTENERS
      const forgeButton = document.getElementById('forge');
      forgeButton.addEventListener('click', function () {
        fuzeLauncher.select('forge')
      })

      const vanillaButton = document.getElementById('vanilla');
      vanillaButton.addEventListener('click', function () {
        fuzeLauncher.select('vanilla')
      })

      const fabricButton = document.getElementById('fabric');
      fabricButton.addEventListener('click', function () {
        fuzeLauncher.select('fabric')
      })

      const versionInput = document.getElementById('version-input');
      versionInput.addEventListener('blur', function () {
        const inputValue = versionInput.value;
        localStorage.setItem('version', inputValue);
      });

      const explorerButton = document.getElementById('explorer');
      explorerButton.addEventListener('click', async () => {
        fuzeLauncher.log('Opened explorer')
        const modsPathFolder = path.resolve('./.minecraft/mods');
        shell.openPath(modsPathFolder);
      });

      // CLEAR ALL MODS
      const buttonClearAll = document.getElementById('clear');
      buttonClearAll.addEventListener('click', async () => {
        const directory = modsPath;

        fs.readdir(directory, (err, files) => {
          if (err) throw err;

          for (const file of files) {
            fs.unlink(`${directory}/${file}`, (err) => {
              if (err){
                fuzeLauncher.log('Erreur lors de la suppression des mods: ' + err)
                document.getElementById('mods-subtitle').textContent = "⚠ Une instance utilise les mods! Essaye de la fermer"
              }
            });
          }
        });

        fuzeLauncher.log('Cleared mods')
      });

      const buttonAdd = document.getElementById('add');
      const fileInput = document.getElementById('file-input');
      buttonAdd.addEventListener('click', () => {
        fileInput.click();
      });


      document.body.addEventListener("dragover", evt => {
        evt.preventDefault();
      });

      document.addEventListener('drop', function (event) {
        event.preventDefault();
        console.log(event.dataTransfer.files)
        fileInput.files = event.dataTransfer.files;

        fileInput.dispatchEvent(new Event('change'));
      });

      fileInput.addEventListener('change', async () => {
        // IF SHELL IS CLOSED
        if (!fileInput.files[0].path) return;
        const selectedFilePath = fileInput.files[0].path;
        const modsDirectory = path.resolve('./.minecraft/mods');

        // Check if the selected file has a valid extension
        const validExtensions = ['.jar', '.zip', '.rar', '.7z'];
        const fileExtension = path.extname(selectedFilePath);
        if (!validExtensions.includes(fileExtension)) {
          fuzeLauncher.invalidModExtensionFailure()
          return;
        }

        const targetPath = path.join(modsDirectory, path.basename(selectedFilePath));

        try {
          // Move the file to the target directory
          fs.copyFileSync(selectedFilePath, targetPath);
          fuzeLauncher.log('File moved successfully');

          if (fileExtension === '.zip') {
            document.getElementById('mods-subtitle').textContent = "EXTRACTION(S) ZIP EN COURS..."
            console.log(targetPath, modsDirectory)
            fuzeLauncher.extractZIP(targetPath, modsDirectory);
          }

          if (fileExtension === '.rar') {
            document.getElementById('mods-subtitle').textContent = "EXTRACTION(S) RAR EN COURS... 0%"
            console.log(targetPath, modsDirectory)
            fuzeLauncher.extractRAR(targetPath, modsDirectory);
          }

          if (fileExtension === '.7z') {
            document.getElementById('mods-subtitle').textContent = "EXTRACTION(S) 7z EN COURS... 0%"
            console.log(targetPath, modsDirectory)
            fuzeLauncher.extract7z(targetPath, modsDirectory);
          }
        } catch (error) {
          fuzeLauncher.log('Error with file:', error);
          fuzeLauncher.showError(error)
        }
      });

      document.getElementById('button-launch').addEventListener('click', async () => {
        launchGame()
      });
    });
}

// SETTINGS ---------------------
export function clickSettings() {

  fuzeLauncher.log('Settings button pressed')

  // SETTINGS ARE CLOSED 
  if (localStorage.getItem('settings-state') === 'closed') {
    fuzeLauncher.log('Settings are closed! Loading settings')
    openSettings()
  }

  // SETTINGS ARE OPENED
  else {
    fuzeLauncher.log('Settings are opened! Saving settings')
    saveSettings()
  }
}

function saveSettings() {
  // Construct the settings object
  const settings = {
    account: {
      type: document.querySelector('.button-secondary.item-selected').id,
      username: document.getElementById('username-input').value
    },
    ram: {
      min: document.getElementById('minram').value,
      max: document.getElementById('maxram').value
    },
    game: {
      'toggle-gamma': document.getElementById('toggle-gamma').getAttribute('toggle-status') === 'on',
      'toggle-fullscreen': document.getElementById('toggle-fullscreen').getAttribute('toggle-status') === 'on'
    },
    forgeSettings: {
      'toggle-lastforgeversion': document.getElementById('toggle-lastforgeversion').getAttribute('toggle-status') === 'on'
    },
    fuzelauncher: {
      'toggle-magiccopy': document.getElementById('toggle-magiccopy').getAttribute('toggle-status') === 'on',
      'toggle-quicklaunch': document.getElementById('toggle-quicklaunch').getAttribute('toggle-status') === 'on',
      'toggle-discordpresence': document.getElementById('toggle-discordpresence').getAttribute('toggle-status') === 'on'
    }
  };
  // Convert the settings object to JSON
  const settingsJSON = JSON.stringify(settings);


  // WE APPLY ON-DIRECT TOGGLES
  let currentSettings = fuzeLauncher.getSettings()

  console.log(settingsJSON)
  if (currentSettings.fuzelauncher['toggle-gamma'] === false) {
    if (settings.fuzelauncher['toggle-gamma'] === true) {
      fuzeLauncher.setMaxGamma()
    }
  } else {
    if (settings.fuzelauncher['toggle-gamma'] === false) {
      fuzeLauncher.setNormalGamma()
    }
  }

  // Save the JSON in local storage
  localStorage.setItem('settings-content', settingsJSON);

  // closing Settings
  buildApp()

}

// Attach the paste event listener to the whole document
document.addEventListener('paste', function (event) {

  let settingsContent = fuzeLauncher.getSettings();
  if (settingsContent.fuzelauncher['toggle-magiccopy'] === false) return;

  // Prevent the default paste behavior
  event.preventDefault();

  // Get the pasted text from the event's clipboardData
  const pastedText = (event.clipboardData || window.clipboardData).getData('text');

  // Call the function to extract event data from the pasted text
  const eventData = fuzeLauncher.extractEventData(pastedText);

  // Do something with the extracted event data
  fuzeLauncher.log('Version:', eventData.version);
  fuzeLauncher.log('Event Type:', eventData.eventType);
  fuzeLauncher.log('Require Mods:', eventData.requireMods);

  if (localStorage.getItem('settings-state') === 'open') {
    saveSettings()
  }

  if (eventData.version) {
    document.getElementById('version-input').value = eventData.version;
    localStorage.setItem('version', eventData.version)
  }
  fuzeLauncher.select(eventData.eventType.toLowerCase());
  if (eventData.requireMods == true) {
    document.getElementById('mods-subtitle').textContent = "CET EVENT A BESOIN DE MODS POUR SE CONNECTER!"
  }

  fuzeLauncher.windowEffect()
});



// Add an event listener to the launcher
document.addEventListener('keydown', function (event) {
  // Check if the pressed key is Enter (key code 13)
  if (event.keyCode === 13) {
    let settingsContent = fuzeLauncher.getSettings();
    if (settingsContent.fuzelauncher['toggle-quicklaunch'] === false) return;
    // Simulate a click on the launch button
    document.getElementById('button-launch').click();
  }
});

function openSettings() {

  // FETCHING SETTINGS PAGE
  fetch('settings.html')
    .then(response => response.text())
    .then(data => {
      document.body.innerHTML = data;

      //SETTING UP TOGGLES
      const toggleContainers = document.querySelectorAll(".toggle");

      toggleContainers.forEach(function (toggleContainer) {
        const movingToggle = toggleContainer.querySelector(".moving-toggle");
        const toggleStatus = toggleContainer.querySelector("#toggle-status");

        toggleContainer.addEventListener("click", function () {
          const currentStatus = toggleContainer.getAttribute("toggle-status");
          if (currentStatus === "off") {
            toggleContainer.setAttribute("toggle-status", "on");
            movingToggle.classList.remove("toggle-off");
            movingToggle.classList.add("toggle-on");
            toggleStatus.textContent = "OUI";
          } else {
            toggleContainer.setAttribute("toggle-status", "off");
            movingToggle.classList.remove("toggle-on");
            movingToggle.classList.add("toggle-off");
            toggleStatus.textContent = "NON";
          }
        });
      });

      let crackbtn = document.getElementById('crack')
      crackbtn.addEventListener('click', () => {
        fuzeLauncher.select('crack')
        document.getElementById('username-input').style = 'display: block;'
      })

      let msbtn = document.getElementById('microsoft')
      msbtn.addEventListener('click', () => {
        fuzeLauncher.select('microsoft')
        document.getElementById('username-input').style = 'display: none;'
      })

      let launchbtn = document.getElementById('button-launch')
      launchbtn.addEventListener('click', () => {
        saveSettings()
      })

      fuzeLauncher.addBarFunctions()

      localStorage.setItem('settings-state', 'open')

      const settingsJSON = localStorage.getItem('settings-content');

      if (settingsJSON) {
        const settings = fuzeLauncher.getSettings()

        // Set account type and username
        document.getElementById(settings.account.type).classList.add('item-selected');
        if (settings.account.type === 'crack') {
          document.getElementById('username-input').style = 'display: block'
        }
        document.getElementById('username-input').value = settings.account.username;

        // Set RAM values
        document.getElementById('minram').value = settings.ram.min;
        document.getElementById('maxram').value = settings.ram.max;

        // Set game toggle value
        const toggleGamma = document.getElementById('toggle-gamma');
        if (settings.game['toggle-gamma']) {
          toggleGamma.setAttribute('toggle-status', 'on');
          toggleGamma.querySelector('#toggle-status').textContent = 'OUI';
          toggleGamma.querySelector('.moving-toggle').classList.remove('toggle-off');
          toggleGamma.querySelector('.moving-toggle').classList.add('toggle-on');
        }

        const toggleFullscreen = document.getElementById('toggle-fullscreen');
        if (settings.game['toggle-fullscreen']) {
          toggleFullscreen.setAttribute('toggle-status', 'on');
          toggleFullscreen.querySelector('#toggle-status').textContent = 'OUI';
          toggleFullscreen.querySelector('.moving-toggle').classList.remove('toggle-off');
          toggleFullscreen.querySelector('.moving-toggle').classList.add('toggle-on');
        }

        // Set fuzelauncher toggle values
        const forgeToggles = [
          'toggle-lastforgeversion'
        ];

        for (const toggleName of forgeToggles) {
          const toggleElement = document.getElementById(toggleName);
          if (settings.forgeSettings[toggleName]) {
            toggleElement.setAttribute('toggle-status', 'on');
            toggleElement.querySelector('#toggle-status').textContent = 'OUI';
            toggleElement.querySelector('.moving-toggle').classList.remove('toggle-off');
            toggleElement.querySelector('.moving-toggle').classList.add('toggle-on');
          }
        }

        // Set fuzelauncher toggle values
        const fuzelauncherToggles = [
          'toggle-magiccopy',
          'toggle-quicklaunch',
          'toggle-discordpresence'
        ];

        for (const toggleName of fuzelauncherToggles) {
          const toggleElement = document.getElementById(toggleName);
          if (settings.fuzelauncher[toggleName]) {
            toggleElement.setAttribute('toggle-status', 'on');
            toggleElement.querySelector('#toggle-status').textContent = 'OUI';
            toggleElement.querySelector('.moving-toggle').classList.remove('toggle-off');
            toggleElement.querySelector('.moving-toggle').classList.add('toggle-on');
          }
        }
      }
    });
}

async function launchGame() {
  fuzeLauncher.log('Preparing for game launch!')

  const launchButton = document.getElementById('button-launch')
  const launchButtonText = document.getElementById('button-text')
  let settingsContent = fuzeLauncher.getSettings()

  let doFullScreen = settingsContent.game['toggle-fullscreen']

  if (localStorage.getItem('open') === 'true') {
    if(document.getElementById('button-text').textContent === "Lancer" || document.getElementById('button-text').textContent === "Jeu ouvert"){
      launchButton.classList.remove('button-primary-locked')
      localStorage.setItem('open', 'false')
      return;
    } else {
      fuzeLauncher.showDialog('info','Information','Attend d\'abord que l\'instance soit ouverte avant d\'en ouvrir une autre')
      return;
    }
  }
  launchButton.classList.add('button-primary-locked')
  launchButton.classList.remove('main-launch-btn')
  localStorage.setItem('open', 'true')
  launchButtonText.textContent = "CHARGEMENT DES LIBRARIES..."
  const { Client, Authenticator } = require("minecraft-launcher-core");
  const launcher = new Client();
  //Import the Auth class
  const { Auth } = require("msmc");

  launchButtonText.textContent = "CHARGEMENT DES VERSIONS..."

  //SETTING UP FILES
  var minram = settingsContent.ram.min + 'G'
  var maxram = settingsContent.ram.max + 'G'
  var version = document.getElementById('version-input').value
  if (version === '') {
    version = '1.16.5'
  }

  let authManager;
  if (settingsContent.account.type === "microsoft") {
    launchButtonText.textContent = "SELECTE UN COMPTE"

    //Create a new Auth manager
    authManager = new Auth("select_account");
  }

  // --------------------------------- VANILLA GAME LAUNCH --------------------------------- //

  if (document.querySelector('.item-selected').id === 'vanilla') {

    if (settingsContent.account.type === 'crack') {
      // Pulled from the Minecraft Launcher core docs.
      let opts = {
        clientPackage: null,
        // Simply call this function to convert the msmc Minecraft object into a mclc authorization object
        authorization: Authenticator.getAuth(settingsContent.account.username),
        root: "./.minecraft",
        version: {
          number: version,
          type: "release"
        },
        memory: {
          max: maxram,
          min: minram
        },
        window: {
          fullscreen: doFullScreen
        },
        overrides: {
          detached: false
        }
      };
      launchButtonText.textContent = "DÉMARRAGE..."
      fuzeLauncher.log("Starting!");
      launcher.launch(opts);

     launcher.on('debug', (e) => fuzeLauncher.handleDebug(e));
     launcher.on('progress', (e) => fuzeLauncher.handleProgress(e));
     launcher.on('data', (e) => fuzeLauncher.handleData(e));
     launcher.on('close', () => { fuzeLauncher.reactToClose() });
    } else {
      //Launch using the 'raw' gui framework (can be 'electron' or 'nwjs')
      authManager.launch("raw").then(async xboxManager => {
        //Generate the Minecraft login token
        const token = await xboxManager.getMinecraft();
        // Pulled from the Minecraft Launcher core docs.
        let opts = {
          clientPackage: null,
          // Simply call this function to convert the msmc Minecraft object into a mclc authorization object
          authorization: token.mclc(),
          root: "./.minecraft",
          version: {
            number: version,
            type: "release"
          },
          memory: {
            max: maxram,
            min: minram
          },
          window: {
            fullscreen: doFullScreen
          },
          overrides: {
            detached: false
          }
        };
        launchButtonText.textContent = "DÉMARRAGE..."
        fuzeLauncher.log("Starting!");
        launcher.launch(opts);

        launcher.on('debug', (e) => fuzeLauncher.handleDebug(e));
        launcher.on('progress', (e) => fuzeLauncher.handleProgress(e));
        launcher.on('data', (e) => fuzeLauncher.handleData(e));
        launcher.on('close', () => { fuzeLauncher.reactToClose() });
      });
    }

  } else {

    // --------------------------------- Fabric GAME LAUNCH --------------------------------- //

    if (document.querySelector('.item-selected').id === 'fabric') {

      const path = `..\\..\\.minecraft\\versions\\${version}-fabric`;

      fs.access(path, fs.constants.F_OK, (err) => {
        if (err) {
          launchButtonText.textContent = "Chargement Fabric"
          fuzeLauncher.log(`Fabric version does not exist! Getting file for version ${version}`);

          // GETTING FABRIC VERSION
          fetch("https://meta.fabricmc.net/v2/versions/loader")
            .then(response => response.json())
            .then(data => {
              if (Array.isArray(data) && data.length > 0) {
                const firstVersion = data[0].version;
                fetch(`https://meta.fabricmc.net/v2/versions/loader/${version}/${firstVersion}/profile/json`)
                  .then(response => response.json())
                  .then(data => {
                    const content = JSON.stringify(data, null, 2);
                    fuzeLauncher.log('Created Fabric JSON: ' + JSON.stringify(content));

                    const path = `..\\..\\.minecraft\\versions\\${version}-fabric\\${version}-fabric.json`;

                    fs.mkdir(`..\\..\\.minecraft\\versions\\${version}-fabric`, { recursive: true }, (err) => {
                      if (err) throw err;

                      fs.writeFile(path, content, (err) => {
                        if (err) throw err;
                        fuzeLauncher.log(`Created json for fabric ${version}`);
                      });
                    });
                  })
                  .catch(error => {
                    fuzeLauncher.log("[GETTINGFABRICVERSION] Error fetching data:", error);
                    fuzeLauncher.fabricJSONFailure()
                  });
              } else {
                fuzeLauncher.log("[GETTINGFABRICVERSION] No versions found.");
                fuzeLauncher.fabricJSONFailure()
              }
            })
            .catch(error => {
              fuzeLauncher.log("[GETTINGFABRICVERSION] Error fetching data:", error);
              fuzeLauncher.fabricJSONFailure()
            });

          if (settingsContent.account.type === 'crack') {
            //Launch using the 'raw' gui framework (can be 'electron' or 'nwjs')

            let opts = {
              clientPackage: null,
              // Simply call this function to convert the msmc Minecraft object into a mclc authorization object
              authorization: Authenticator.getAuth(settingsContent.account.username),
              root: "./.minecraft",
              version: {
                number: version,
                type: "release",
                custom: `${version}-fabric`
              },
              memory: {
                max: maxram,
                min: minram
              },
              window: {
                fullscreen: doFullScreen
              },
              overrides: {
                detached: false
              }
            };
            launchButtonText.textContent = "DÉMARRAGE..."
            fuzeLauncher.log("Starting!");
            launcher.launch(opts);

            launcher.on('debug', (e) => fuzeLauncher.handleDebug(e));
            launcher.on('progress', (e) => fuzeLauncher.handleProgress(e));
            launcher.on('data', (e) => fuzeLauncher.handleData(e));
            launcher.on('close', () => { fuzeLauncher.reactToClose() });
          } else {

            //Launch using the 'raw' gui framework (can be 'electron' or 'nwjs')
            authManager.launch("raw").then(async xboxManager => {
              //Generate the Minecraft login token
              const token = await xboxManager.getMinecraft();
              // Pulled from the Minecraft Launcher core docs.
              let opts = {
                clientPackage: null,
                // Simply call this function to convert the msmc Minecraft object into a mclc authorization object
                authorization: token.mclc(),
                root: "./.minecraft",
                version: {
                  number: version,
                  type: "release",
                  custom: `${version}-fabric`
                },
                memory: {
                  max: maxram,
                  min: minram
                },
                window: {
                  fullscreen: doFullScreen
                },
                overrides: {
                  detached: false
                }
              };
              launchButtonText.textContent = "DÉMARRAGE..."
              fuzeLauncher.log("Starting!");
              launcher.launch(opts);

              launcher.on('debug', (e) => fuzeLauncher.handleDebug(e));
              launcher.on('progress', (e) => fuzeLauncher.handleProgress(e));
              launcher.on('data', (e) => fuzeLauncher.handleData(e));
              launcher.on('close', () => { fuzeLauncher.reactToClose() });
            });
          }

        } else {

          fuzeLauncher.log(`Fabric version exists! Starting with version ${version}`)

          if (settingsContent.account.type === 'crack') {
            //Launch using the 'raw' gui framework (can be 'electron' or 'nwjs')
            // Pulled from the Minecraft Launcher core docs.
            let opts = {
              clientPackage: null,
              // Simply call this function to convert the msmc Minecraft object into a mclc authorization object
              authorization: Authenticator.getAuth(settingsContent.account.username),
              root: "./.minecraft",
              version: {
                number: version,
                type: "release",
                custom: `${version}-fabric`
              },
              memory: {
                max: maxram,
                min: minram
              },
              window: {
                fullscreen: doFullScreen
              },
              overrides: {
                detached: false
              }
            };
            launchButtonText.textContent = "DÉMARRAGE..."
            fuzeLauncher.log("Starting!");
            launcher.launch(opts);

            launcher.on('debug', (e) => fuzeLauncher.handleDebug(e));
            launcher.on('progress', (e) => fuzeLauncher.handleProgress(e));
            launcher.on('data', (e) => fuzeLauncher.handleData(e));
            launcher.on('close', () => { fuzeLauncher.reactToClose() });
          } else {
            //Launch using the 'raw' gui framework (can be 'electron' or 'nwjs')
            authManager.launch("raw").then(async xboxManager => {
              //Generate the Minecraft login token
              const token = await xboxManager.getMinecraft();
              // Pulled from the Minecraft Launcher core docs.
              let opts = {
                clientPackage: null,
                // Simply call this function to convert the msmc Minecraft object into a mclc authorization object
                authorization: token.mclc(),
                root: "./.minecraft",
                version: {
                  number: version,
                  type: "release",
                  custom: `${version}-fabric`
                },
                memory: {
                  max: maxram,
                  min: minram
                },
                window: {
                  fullscreen: doFullScreen
                },
                overrides: {
                  detached: false
                }
              };
              launchButtonText.textContent = "DÉMARRAGE..."
              fuzeLauncher.log("Starting!");
              launcher.launch(opts);

              launcher.on('debug', (e) => fuzeLauncher.handleDebug(e));
              launcher.on('progress', (e) => fuzeLauncher.handleProgress(e));
              launcher.on('data', (e) => fuzeLauncher.handleData(e));
              launcher.on('close', () => { fuzeLauncher.reactToClose() });
            });
          }

        }
      });

    }
    else {

      // --------------------------------- Forge GAME LAUNCH --------------------------------- //

      if (document.querySelector('.item-selected').id === 'forge') {
        launchForge(version, launchButton, settingsContent, doFullScreen, Authenticator, launcher, minram, maxram, authManager)
      }
    }
  }
}

function launchForge(version, launchButton, settingsContent, doFullScreen, Authenticator, launcher, minram, maxram, authManager) {


  const launchButtonText = document.getElementById('button-text')

  // FORGE VERSION FOLDER PATH
  const folderPath = `.\\.minecraft\\forgeJars`;

  // CHECKING IF FORGE PATH EXISTS
  fs.access(folderPath, fs.constants.F_OK, (err) => {
    if (err) {
      // FORGE PATH DOESN'T EXIST
      fuzeLauncher.log('Forge directory doesn\'t exist. You probably never launched forge using fuzeLauncher. Will be creating directory.')
      // CREATING FORGE PATH
      fs.mkdir(folderPath, { recursive: true }, (err) => {
        if (err) {
          fuzeLauncher.log('Error creating directory:', err);
          fuzeLauncher.forgeCreateFolderFailure();
        } else {
          fuzeLauncher.log('Forge directory created successfully!');
        }
      });
    }
  })

  let forgeFileName;

  if (fuzeLauncher.isVersionUnder113(version)) {
    forgeFileName = `forge-${version}-universal.jar`
  } else {
    forgeFileName = `forge-${version}-installer.jar`
  }

  // CHECKING IF FILE EXISTS
  const forgePath = `.\\.minecraft\\forgeJars\\${forgeFileName}`;


  fs.access(forgePath, fs.constants.F_OK, async (err) => {
    if (err) {
      fuzeLauncher.log(`[FUZELAUNCH] Forge version does not exist! Downloading forge jar for version ${version}`);
      launchButtonText.textContent = "Chargement Forge"

      const response = await fetch(`https://files.minecraftforge.net/net/minecraftforge/forge/index_${version}.html`);
      const html = await response.text();

      let downloadLink = '';

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      if (fuzeLauncher.isVersionUnder113(version)) {
        const universalLink = doc.querySelectorAll('.classifier-universal');
        if (universalLink) {
          if (settingsContent.forgeSettings['toggle-lastforgeversion']) {
            downloadLink = universalLink[0].parentElement.getAttribute('href');
          } else {
            downloadLink = universalLink[1].parentElement.getAttribute('href');
          }
        }
      } else {
        const boostedLink = doc.querySelectorAll('.link-boosted a');
        if (boostedLink) {
          if (settingsContent.forgeSettings['toggle-lastforgeversion']) {
            downloadLink = boostedLink[0].getAttribute('href');
          } else {
            downloadLink = boostedLink[1].getAttribute('href');
          }
        }
      }

      // We remove adfocus links.
      downloadLink = downloadLink.match(/url=(.+)/)[1];

      if (downloadLink === '') {
        fuzeLauncher.forgeDownloadFileFailure()
      }

      let forgeFileName;

      if (fuzeLauncher.isVersionUnder113(version)) {
        forgeFileName = `forge-${version}-universal.jar`
      } else {
        forgeFileName = `forge-${version}-installer.jar`
      }

      console.log(downloadLink)
      fuzeLauncher.downloadFile(downloadLink, '.\\.minecraft\\forgeJars', forgeFileName)
        .then(() => {

          fuzeLauncher.log(`Downloaded lastest Forge Jar for mc version ${version}`)

          launchForge(version, launchButton, settingsContent, doFullScreen, Authenticator, launcher, minram, maxram, authManager)
        })


    } else {
      fuzeLauncher.log(`[FUZELAUNCH] Forge version exists! Starting with version ${version}`)

      let forgeFileName;
      if (fuzeLauncher.isVersionUnder113(version)) {
        forgeFileName = `forge-${version}-universal.jar`
      } else {
        forgeFileName = `forge-${version}-installer.jar`
      }

      if (settingsContent.account.type === 'crack') {


        // Pulled from the Minecraft Launcher core docs.
        let opts = {
          clientPackage: null,
          // Simply call this function to convert the msmc Minecraft object into a mclc authorization object
          authorization: Authenticator.getAuth(settingsContent.account.username),
          root: "./.minecraft",
          version: {
            number: version,
            type: "release"
          },
          forge: `./.minecraft/forgeJars/${forgeFileName}`,
          memory: {
            max: maxram,
            min: minram
          },
          window: {
            fullscreen: doFullScreen
          },
          overrides: {
            detached: false
          }
        }
        launchButtonText.textContent = "DÉMARRAGE..."
        fuzeLauncher.log("[FUZELAUNCH] Starting!");
        launcher.launch(opts);

        launcher.on('debug', (e) => fuzeLauncher.handleDebug(e));
        launcher.on('progress', (e) => fuzeLauncher.handleProgress(e));
        launcher.on('data', (e) => fuzeLauncher.handleData(e));
        launcher.on('close', () => { fuzeLauncher.reactToClose() });

      } else {

        authManager.launch("raw").then(async xboxManager => {
          //Generate the Minecraft login token
          const token = await xboxManager.getMinecraft();
          // Pulled from the Minecraft Launcher core docs.
          let opts = {
            clientPackage: null,
            // Simply call this function to convert the msmc Minecraft object into a mclc authorization object
            authorization: token.mclc(),
            root: "./.minecraft",
            version: {
              number: version,
              type: "release"
            },
            forge: `./.minecraft/forgeJars/${forgeFileName}`,
            memory: {
              max: maxram,
              min: minram
            },
            window: {
              fullscreen: doFullScreen
            },
            overrides: {
              detached: false
            }
          };
          launchButtonText.textContent = "DÉMARRAGE..."
          fuzeLauncher.log("[FUZELAUNCH] Starting!");
          launcher.launch(opts);

          launcher.on('debug', (e) => fuzeLauncher.handleDebug(e));
          launcher.on('progress', (e) => fuzeLauncher.handleProgress(e));
          launcher.on('data', (e) => fuzeLauncher.handleData(e));
          launcher.on('close', () => { fuzeLauncher.reactToClose() });
        });
      }
    }
  });
}