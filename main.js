//Importation des modules
const { app, BrowserWindow, ipcMain} = require("electron")
const path = require("path")

app.whenReady().then(() => createWindow());

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        maximizable: false,
        resizable: false,
        autoHideMenuBar: true,
        frame: false,
        title: "FuzeLauncher",
        icon: path.join(__dirname, 'icon.png'),
        height: 600,
        width: 550,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
    });

    mainWindow.loadURL(path.join(__dirname,"index.html"))
}

app.on('activate',()=>{
    if(mainWindow === null){
        createWindow()
    }
})

ipcMain.on('minimize', () => {
    mainWindow.minimize();
});

ipcMain.on('close', () => {
    mainWindow.close();
});

app.on("window-all-closed", () => {
    app.quit();
})