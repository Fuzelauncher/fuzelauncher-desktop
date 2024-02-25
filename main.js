//Importation des modules
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron")
const path = require("path")

app.whenReady().then(() => createWindow());

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        maximizable: false,
        resizable: false,
        autoHideMenuBar: true,
        frame: false,
        title: "Fuzelauncher",
        icon: "./src/img/icon.png",
        height: 600,
        width: 550,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
    });

    mainWindow.loadURL(path.join(__dirname, "./src/routes/index.html"))
}

app.on('activate', () => {
    if (mainWindow === null) {
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

ipcMain.handle("showDialog", (e, type, title, message) => {
    const options = {
        type: type,
        title: title,
        message: message,
        buttons: ['Support et Bugs', 'OK']
    };

    dialog.showMessageBox(mainWindow, options).then((response) =>{
        if (response.response === 0) {
            shell.openExternal('https://github.com/yourusername/yourproject/issues/new');
        }
    })
});

ipcMain.handle("showError", (e, title, message) => {
    dialog.showErrorBox(title, message);
});