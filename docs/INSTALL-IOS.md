# 钢琴小屋 iPhone 测试版安装

这是包含现有界面和功能的 iOS App。`PianoCottage-unsigned.ipa` 尚未签名，需要用自己的 Apple 账号签名后安装，不能在 Safari 下载后直接打开安装。

## Windows 安装（不需要付费开发者会员）

1. 在旧网页版的「我的」页面先「导出备份」，将 JSON 文件保存到「文件」。App 和 Safari 的本机数据相互独立，不会自动迁移。
2. 从 [Sideloadly 官网](https://sideloadly.io/)下载 Windows 版。按照官网安装要求准备 Apple 的设备驱动、iTunes / iCloud；如果电脑已经有这些软件，先核对现有版本，不要直接卸载或替换。
3. 用 USB 连接 iPhone，在手机上确认信任这台电脑。
4. 打开 Sideloadly，选中自己的 iPhone，把 `PianoCottage-unsigned.ipa` 拖入窗口。
5. 由你本人在该工具中登录 Apple 账号并完成验证码，点击 Start 开始签名安装。不要把密码、验证码或签名证书放入聊天或 GitHub。
6. 根据 iPhone 提示，在「设置 → 通用 → VPN 与设备管理」信任自己的开发者身份；系统要求时启用「设置 → 隐私与安全性 → 开发者模式」并按提示重启。
7. 打开「钢琴小屋」。第一次开始监听时允许麦克风访问。首次加载钢琴识别模型需要联网，声音在本机分析，不上传录音。
8. 如需迁移记录，在 App 的「我的 → 恢复备份」选择第 1 步的 JSON 文件。恢复会覆盖 App 当前的用户和练琴记录。

免费 Apple 账号的测试签名通常有效 **7 天**，到期需要重新签名。Sideloadly 支持自动刷新，但依赖电脑、配对和网络条件，不能保证电脑关机时仍自动刷新。更新时使用相同 Apple 账号与 App 标识，安装前导出备份，不要先删除旧 App。

这是个人测试安装，不是 App Store 或 TestFlight 发布。本版按要求不增加后台或熄屏监听能力。安装后的麦克风、照片选择、备份分享和安全区布局还需要在真实 iPhone 上确认。

## 工程与后续构建

- iOS 分支：`ios-app`；线上网页继续使用 `main`。
- 云端编译：GitHub Actions 的 **Build iPhone app**；成功后在该次运行的 Artifacts 下载 **PianoCottage-iPhone-unsigned**。
- 原生工程：`ios/App/App.xcodeproj`，采用 Capacitor 8 和 Swift Package Manager。
- Node.js 22+；在项目根目录运行 `npm ci`、`npm run ios:sync`。
- 本地编译需要 macOS 和 Xcode 26+。此 Windows 环境准备源码，GitHub 的 macOS runner 负责编译。
- App ID：`io.github.cathych1022.pianocottage`；个人签名工具可能为免费账号调整此标识。
- 不在仓库里保存 Apple 密码、证书、配置描述文件或签名密钥。当前云端编译不需要任何 Apple 凭据。

官方参考：[Capacitor iOS](https://capacitorjs.com/docs/ios)、[Sideloadly 安装与免费账号说明](https://sideloadly.io/)、[Apple 开发者模式](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device)。
