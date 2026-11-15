# 钢琴小屋：Windows 开发、iPhone 安装的免费 PWA

## 直接装到 iPhone（不需要 Mac / Apple 开发者会员）
1. 在 Windows 上解压本项目。
2. 注册 GitHub，创建一个**公开**仓库（比如 `piano-cottage`）。
3. 把本文件夹的 `index.html`、`app.js`、`sw.js`、`manifest.webmanifest`、`icon.svg` 上传到仓库**根目录**。
4. 仓库 Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save。
5. 等 Pages 部署成功后，用 iPhone **Safari** 打开 GitHub Pages 显示的 HTTPS 地址（通常是 `https://用户名.github.io/piano-cottage/`）。
6. 点击 Safari 分享按钮 → 添加到主屏幕 → 添加。现在主屏幕有“钢琴小屋”图标。
7. 打开该图标 → “开始监听” → 同意麦克风权限。请保持页面在前台、屏幕点亮。

如只在 Windows 本地预览：进入本文件夹运行 `py -m http.server 8000`，再在 Windows 浏览器访问 `http://localhost:8000/`。本地网址不能直接用于 iPhone 麦克风访问；手机需要部署后的 HTTPS 网址。

## 功能说明
- 按“开始监听”后自动识别可能的钢琴音符；识别到声音开始计时。
- 连续五秒未识别到音符自动暂停，重新识别到音符继续累计。
- 五秒等待期算在练习时间里；暂停时不算。
- 今日与近七日统计存在 iPhone 当前浏览器本地存储，清缓存可能丢失记录。
- “重置”只重置本次显示计时，不清除历史记录。
- 数据/音频不上传、不保留原始录音；无需服务器或API。

## 重要限制
- 使用 Web Audio 频谱峰值和谐波启发式检测，不是真正训练的钢琴分类模型。其它音乐、播放的钢琴声、部分语音或乐器可能被错判；安静环境效果较好。不能保证所有钢琴音都能识别。
- iOS Safari / 主屏幕 PWA 后台及锁屏录音不可靠。本版本需要保持前台且屏幕点亮。
- 真正的 iOS 原生 App 可在 Windows 用 Expo + EAS 云端编译，但安装到真机通常需要 Apple Developer Program 付费会员。
- 这不是 IPA 文件，也不是 App Store 原生程序。

## 使用 Codex
将本文件夹在 Codex 中打开，告诉 Codex：“基于当前 PWA 继续完善钢琴音识别准确率、每日统计和童话 UI；保留 5 秒规则，并保持兼容 iOS Safari。”
