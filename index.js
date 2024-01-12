const { app, BrowserWindow, session, globalShortcut, screen, Menu, shell, dialog } = require("electron")
const fs = require("fs")
const path = require("path")

const configPath = path.join(app.getPath("userData"), "config.txt")

let configValue = {}
if (fs.existsSync(configPath)) {
  try {
    const str = fs.readFileSync(configPath, "utf8")
    if (str) {
      configValue = JSON.parse(str)
    }
  } catch (error) {
    setTimeout(() => {
      dialog.showErrorBox("error", "配置文件格式错误")
    }, 10000)
  }
} else {
  fs.writeFileSync(configPath, '{"tips":修改配置文件后,重启软件生效}')
}

const { proxy = "", url = "https://yiyan.baidu.com", hotkey = "CommandOrControl+Shift+o", size = [800, 600] } = configValue

const [width, height] = size

const createWindow = () => {
  if (proxy) {
    session.defaultSession.setProxy({ proxyRules: proxy })
  }

  const win = new BrowserWindow({
    width,
    height,
    transparent: false,
  })

  let timer = null
  win.on("resize", () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const newSize = win.getSize() // 获取新的窗口尺寸 [width, height]
      configValue.size = newSize
      fs.writeFileSync(configPath, JSON.stringify(configValue))
      fs.writeFile
    }, 500)
  })

  if (hotkey) {
    globalShortcut.register(hotkey, () => {
      if (win.isVisible() && win.isFocused()) {
        win.hide()
      } else {
        const { x, y } = screen.getCursorScreenPoint()
        const currentDisplay = screen.getDisplayNearestPoint({ x, y })
        win.setPosition(currentDisplay.workArea.x, currentDisplay.workArea.y)
        // Center window relatively to that display
        win.center()
        // Display the window
        win.show()
        win.focus()
      }
    })
  }

  function createMenu() {
    const template = [
      {
        label: "我的应用",
        submenu: [
          {
            label: "关于",
            click: () => {
              shell.openExternal("https://github.com/AblerSong/oneTab")
            },
          },
          { type: "separator" },
          { label: "隐藏", role: "hide" },
          { label: "隐藏其他", role: "hideOthers" },
          { type: "separator" },
          { label: "服务", role: "services" },
          { label: "退出", accelerator: "Command+Q", role: "quit" },
        ],
      },
      {
        label: "编辑",
        submenu: [
          { label: "复制", accelerator: "CmdOrCtrl+C", role: "copy" },
          { label: "粘贴", accelerator: "CmdOrCtrl+V", role: "paste" },
          { label: "剪切", accelerator: "CmdOrCtrl+X", role: "cut" },
          { label: "撤销", accelerator: "CmdOrCtrl+Z", role: "undo" },
          { label: "重做", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
          { label: "全选", accelerator: "CmdOrCtrl+A", role: "selectAll" },
        ],
      },
      {
        label: "设置",
        submenu: [
          {
            label: "配置文件",
            click: () => {
              shell.openPath(configPath)
            },
          },
          {
            label: "重新加载",
            click: () => {
              win.reload()
            },
          },
          {
            label: "清理缓存",
            click: () => {
              session.defaultSession.clearStorageData()
              win.reload()
            },
          },
          { type: "separator" },
          {
            label: "浏览器打开",
            click: () => {
              shell.openExternal(url)
            },
          },
        ],
      },
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }

  createMenu()

  win.loadURL(url)
}

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("will-quit", function () {
  // 注销所有全局快捷键
  globalShortcut.unregisterAll()
})
