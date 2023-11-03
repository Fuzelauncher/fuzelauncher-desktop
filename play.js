// renderer.js

const button = document.getElementById('button-launch')

button.addEventListener('click', async () => {
	if (localStorage.getItem('open') === 'true') return;
	button.classList.add('button-primary-locked')
	button.classList.remove('main-launch-btn')
	localStorage.setItem('open', 'true')
	button.textContent = "LOADING LIBRAIRIES..."
	const { Client } = require("minecraft-launcher-core");
	const launcher = new Client();
	//Import the Auth class
	const { Auth } = require("msmc");

	button.textContent = "SETTING UP VERSIONS..."

	//SETTING UP FILES
	var minram = document.getElementById('minram').value + 'G'
	var maxram = document.getElementById('maxram').value + 'G'
	var version = document.getElementById('version').value
	if (version === '') {
		version = '1.16.5'
	}

	button.textContent = "SELECT ACCOUNT"

	//Create a new Auth manager
	const authManager = new Auth("select_account");

	// --------------------------------- VANILLA GAME LAUNCH --------------------------------- //

	if (document.querySelector('.item-selected').id === 'vanilla') {

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
				overrides: {
					detached: false
				}
			};
			button.textContent = "STARTING..."
			console.log("[FUZELAUNCH] Starting!");
			launcher.launch(opts);
			button.textContent = "GAME ACTIVE"

			launcher.on('debug', (e) => console.log(e));
			launcher.on('data', (e) => console.log(e));
			launcher.on('close', () => {
				console.log('Minecraft has been closed');
				button.textContent = "TRY TO LAUNCH"
				button.classList.remove('button-primary-locked')
				button.classList.add('main-launch-btn')
				localStorage.setItem('open', 'false')
			});
		});
	} else {

		// --------------------------------- Fabric GAME LAUNCH --------------------------------- //

		if (document.querySelector('.item-selected').id === 'fabric') {

			const path = `.minecraft\\versions\\${version}-fabric`;

			fs.access(path, fs.constants.F_OK, (err) => {
				if (err) {
					console.log(`[FUZELAUNCH] Fabric version does not exist! Creating a file for version ${version}`);

					const content = '{  "id": "' + version + '",  "inheritsFrom": "' + version + '",  "releaseTime": "2023-04-15T16:38:53+0000",  "time": "2023-04-15T16:38:53+0000",  "type": "release",  "minecraftArguments": "--username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}",  "libraries": [    {      "name": "net.fabricmc:tiny-mappings-parser:0.3.0+build.17",      "url": "https://maven.fabricmc.net/"    },    {      "name": "net.fabricmc:sponge-mixin:0.12.4+mixin.0.8.5",      "url": "https://maven.fabricmc.net/"    },    {      "name": "net.fabricmc:tiny-remapper:0.8.2",      "url": "https://maven.fabricmc.net/"    },    {      "name": "net.fabricmc:access-widener:2.1.0",      "url": "https://maven.fabricmc.net/"    },    {      "name": "org.ow2.asm:asm:9.4",      "url": "https://maven.fabricmc.net/"    },    {      "name": "org.ow2.asm:asm-analysis:9.4",      "url": "https://maven.fabricmc.net/"    },    {      "name": "org.ow2.asm:asm-commons:9.4",      "url": "https://maven.fabricmc.net/"    },    {      "name": "org.ow2.asm:asm-tree:9.4",      "url": "https://maven.fabricmc.net/"    },    {      "name": "org.ow2.asm:asm-util:9.4",      "url": "https://maven.fabricmc.net/"    },    {      "name": "net.fabricmc:intermediary:' + version + '",      "url": "https://maven.fabricmc.net/"    },    {      "name": "net.fabricmc:fabric-loader:0.14.19",      "url": "https://maven.fabricmc.net/"    }  ],  "mainClass": "net.fabricmc.loader.impl.launch.knot.KnotClient"}';
                    const path = `.minecraft\\versions\\${version}-fabric\\${version}-fabric.json`


                    fs.mkdir(`.minecraft\\versions\\${version}-fabric`, { recursive: true }, (err) => {
                    if (err) throw err;

                    fs.writeFile(path, content, (err) => {
                   if (err) throw err;
                     console.log(`[FUZELAUNCH] Created json for fabric ${version}`);
                    });
                    });

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
							overrides: {
								detached: false
							}
						};
						button.textContent = "STARTING..."
						console.log("[FUZELAUNCH] Starting!");
						launcher.launch(opts);
						button.textContent = "GAME ACTIVE"

						launcher.on('debug', (e) => console.log(e));
						launcher.on('data', (e) => console.log(e));
						launcher.on('close', () => {
							console.log('[FUZELAUNCH] Minecraft has been closed');
							button.textContent = "TRY TO LAUNCH"
							button.classList.remove('button-primary-locked')
							button.classList.add('main-launch-btn')
							localStorage.setItem('open', 'false')
						});
					});

				} else {

					console.log(`[FUZELAUNCH] Fabric version exists! Starting with version ${version}`)
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
							overrides: {
								detached: false
							}
						};
						button.textContent = "STARTING..."
						console.log("[FUZELAUNCH] Starting!");
						launcher.launch(opts);
						button.textContent = "GAME ACTIVE"

						launcher.on('debug', (e) => console.log(e));
						launcher.on('data', (e) => console.log(e));
						launcher.on('close', () => {
							console.log('[FUZELAUNCH] Minecraft has been closed');
							button.textContent = "TRY TO LAUNCH"
							button.classList.remove('button-primary-locked')
							button.classList.add('main-launch-btn')
							localStorage.setItem('open', 'false')
						});
					});

				}
			});

		}
        else{

            // --------------------------------- Forge GAME LAUNCH --------------------------------- //

            if (document.querySelector('.item-selected').id === 'forge') {

                const path = `.minecraft\\versions\\${version}-forge`;

                fs.access(path, fs.constants.F_OK, (err) => {
                  if (err) {
                    console.log(`[FUZELAUNCH] Forge version does not exist! Downloading forge jar for version ${version}`);
                  } else {
                    console.log(`[FUZELAUNCH] Forge version exists! Starting with version ${version}`)

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
                            forge: "1.16.5-forge",
							memory: {
								max: maxram,
								min: minram
							},
							overrides: {
								detached: false
							}
						};
						button.textContent = "STARTING..."
						console.log("[FUZELAUNCH] Starting!");
						launcher.launch(opts);
						button.textContent = "GAME ACTIVE"

						launcher.on('debug', (e) => console.log(e));
						launcher.on('data', (e) => console.log(e));
						launcher.on('close', () => {
							console.log('[FUZELAUNCH] Minecraft has been closed');
							button.textContent = "TRY TO LAUNCH"
							button.classList.remove('button-primary-locked')
							button.classList.add('main-launch-btn')
							localStorage.setItem('open', 'false')
						});
					});
                  }
                });
            }
        }
	}
    
})