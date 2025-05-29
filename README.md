# Key Vault Utils

一个用于生成和恢复加密助记词备份的工具应用。

## 功能特性

### 🏠 首页

- 提供"生成备份"和"恢复备份"两个主要功能入口

### 📝 生成备份

- 支持输入 12 个或 24 个助记词
- 实时显示当前输入的单词数量
- 使用密码加密助记词
- 生成二维码备份图片
- 支持保存二维码到本地

### 🔍 恢复备份

- **上传图片**：支持上传包含备份二维码的图片文件
- **使用摄像头**：支持实时摄像头扫描二维码
- 自动检测二维码并解密
- 输入密码后恢复原始助记词

## 技术栈

- **框架**: React + TypeScript
- **UI 库**: Ant Design
- **加密**: KeyVaultCrypto (Argon2 + Scrypt + AES-256-GCM)
- **二维码**:
  - 生成: qrcode
  - 识别: @paulmillr/qr
- **图像处理**: jpeg-js
- **构建工具**: Vite

## 项目结构

```
src/
├── components/
│   └── Layout.tsx          # 公用布局组件
├── pages/
│   ├── Home.tsx           # 首页入口
│   ├── Generator.tsx      # 生成备份页面
│   └── Recovery.tsx       # 恢复备份页面
├── lib/
│   └── KeyVaultCrypto.ts  # 加密工具类
├── assets/                # 静态资源
└── App.tsx               # 主应用组件
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建到 dist/index.html 文件
pnpm build
```

## 安全特性

- 使用 Argon2id + Scrypt 双重密钥派生
- AES-256-GCM 对称加密
- 客户端本地加密，密码不会传输
- 支持 12/24 单词助记词标准
