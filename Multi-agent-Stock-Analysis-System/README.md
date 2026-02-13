# MaSAS AI - 多智能体股票分析决策系统(本地部署版)

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/React-19.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Express](https://img.shields.io/badge/Express-4.18-green)

**MaSAS AI** 是一个基于前沿大语言模型（LLM）技术的专业级 A 股市场分析系统。它模拟了一家顶级基金公司的完整投资委员会决策流程，由 **10 个不同角色的 AI 智能体** 组成，通过四阶段的严谨工作流，将实时行情数据转化为专业的投资决策。

## 核心特性

*   **👥 拟人化专家团队**：包含宏观、行业、技术、资金、基本面等 5 个维度的分析师，以及总监、风控和总经理角色。
*   **🚀 多模型协同 (Model Agnostic)**：支持混合调度 **Google Gemini 2.5/3.0**、**DeepSeek-R1 (Reasoner)** 和 **通义千问 (Qwen)** 模型。
*   **📈 实时数据驱动**：接入聚合数据 API，实时获取沪深 A 股的五档盘口、成交量及价格异动，确保分析基于实盘数据而非幻觉。
*   **⚡ 并行与串行工作流**：实现了复杂的异步工作流，既保证了基础分析的效率（并行），又确保了决策逻辑的连贯性（串行整合）。
*   **🎨 沉浸式 UI 体验**：采用赛博朋克风格的深色界面，配备打字机动画与机械键盘音效，提供极客般的交互体验。

---

## 🏛️ 智能体架构 (Agent Architecture)

系统共包含 10 位 AI 专家，分为四个层级：

### 第一阶段：专业分析师团队 (并行执行)
| 角色 | 职责 | 侧重点 |
| :--- | :--- | :--- |
| **🌐 宏观政策分析师** | 分析宏观经济数据与政策导向 | GDP, CPI, 货币政策, 系统性风险 |
| **📊 行业轮动专家** | 跟踪行业景气度与板块轮动 | 产业链上下游, 行业指数, 热点切换 |
| **📈 技术分析专家** | 基于 K 线与形态判断趋势 | 支撑/压力位, 趋势强度, 买卖点 |
| **💰 资金流向分析师** | 监控主力与散户资金博弈 | 北向资金, 融资融券, 盘口买卖单分析 |
| **📑 基本面估值分析师** | 深度挖掘财报与估值逻辑 | PE/PB, 财务健康度, 盈利预测 |

### 第二阶段：总监管理团队 (整合层)
| 角色 | 职责 |
| :--- | :--- |
| **👥 基本面研究总监** | 整合宏观、行业、个股基本面报告，消除分歧，形成价值判断。 |
| **⚡ 市场动能总监** | 结合技术面与资金面报告，判断市场情绪与短期爆发力。 |

### 第三阶段：风险控制团队 (审核层)
| 角色 | 职责 |
| :--- | :--- |
| **🛡️ 系统性风险总监** | 极度风险厌恶型。专注于寻找市场崩盘、流动性枯竭等黑天鹅风险。 |
| **⚖️ 组合风险总监** | 关注具体交易层面的风险，制定止损位、仓位上限和波动率控制。 |

### 第四阶段：最高决策层
| 角色 | 职责 |
| :--- | :--- |
| **⚖️ 投资决策总经理** | 拥有最终拍板权。权衡收益（总监报告）与风险（风控报告），给出最终操作指令（买入/卖出/观望）及仓位建议。 |

---

## ⚙️ 技术架构

### 项目结构
```
MaSAS/
├── server/                 # Express 后端服务器
│   ├── index.js           # 服务器入口
│   └── routes/            # API 路由
│       ├── gemini.js      # Gemini API
│       ├── deepseek.js    # DeepSeek API
│       ├── qwen.js        # Qwen API
│       └── stock.js       # 股票数据 API
├── components/            # React 组件
│   ├── AgentCard.tsx
│   └── StockInput.tsx
├── services/              # 前端服务层
│   ├── geminiService.ts
│   └── juheService.ts
├── App.tsx                # 主应用
├── constants.ts           # 配置常量
├── types.ts               # TypeScript 类型定义
├── .env                   # 环境变量（需要手动创建）
├── .env.example           # 环境变量模板
├── package.json
└── README.md
```

### 技术栈

**前端**
- **React 19** + **TypeScript 5.0**
- **Vite 6** 作为构建工具
- **Tailwind CSS** 设计
- **Recharts** 图表展示

**后端**
- **Express.js 4.18** REST API 服务器
- **Node.js 18+**
- 支持 **Google Gemini**、**DeepSeek**、**通义千问** API
- **聚合数据 API** 获取实时股票数据

**架构特点**
- ✅ 前后端分离，独立部署
- ✅ 前后端同时热重载
- ✅ 统一的环境变量管理
- ✅ 不依赖任何特定云平台
- ✅ 支持任何 Node.js 托管平台

---

# 🚀 快速开始

## 📋 前置要求

*   **Node.js 18+**
*   **npm** 或 **yarn**
*   至少需要以下 API 密钥：
    - Google Gemini API Key（必需）
    - DeepSeek API Key（必需）
    - 聚合数据 API Key（必需）
    - 通义千问 API Key（可选）

---

## 🎯 本地开发

### 步骤 1: 克隆项目

```bash
git clone https://github.com/cqyin-yt/Multi-agent-Stock-Analysis-System.git
cd Multi-agent-Stock-Analysis-System
```

### 步骤 2: 安装依赖

```bash
npm install
```

### 步骤 3: 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API 密钥：

```env
# Google Gemini API 配置（必需）
GEMINI_API_KEY=your_gemini_api_key_here

# DeepSeek API 配置（必需）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 聚合数据 API 配置（必需）
JUHE_API_KEY=your_juhe_api_key_here

# 通义千问 API 配置（可选）
QWEN_API_KEY=your_qwen_api_key_here
```

### 步骤 4: 启动开发服务器

```bash
npm run dev
```

此命令会同时启动：
- 🎨 **前端服务器**: http://localhost:3000
- 🔧 **后端 API 服务器**: http://localhost:3001

### 步骤 5: 访问应用

1. 打开浏览器访问 **http://localhost:3000**
2. 输入股票代码（如 `600519` 或 `sz000001`）
3. （可选）点击 "API 密钥配置" 覆盖默认配置
4. 点击 "启动系统" 开始分析

### 分开运行（可选）

如果需要分开启动前后端：

```bash
# 终端 1: 启动后端 API 服务器
npm run server:dev

# 终端 2: 启动前端开发服务器
npm run client:dev
```

---

## 🛠️ 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动前后端开发服务器 |
| `npm run server:dev` | 仅启动后端 API 服务器 |
| `npm run client:dev` | 仅启动前端开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |

---

## 📦 生产部署

### 方法 1: 本地构建

```bash
# 1. 构建项目
npm run build

# 2. 配置生产环境变量
cp .env.example .env
# 编辑 .env 填入生产环境的 API 密钥

# 3. 启动生产服务器
npm start
```

生产环境下，Express 会同时 serve 前端静态文件和提供 API 服务，运行在 `http://localhost:3001`。

### 方法 2: 云平台部署

支持部署到：
- **阿里云** ECS
- **腾讯云** 云服务器
- **Railway** - https://railway.app
- **Render** - https://render.com
- **Heroku** - https://heroku.com

部署步骤：
1. 上传代码到云平台
2. 运行 `npm install && npm run build`
3. 在平台配置环境变量（GEMINI_API_KEY, DEEPSEEK_API_KEY, JUHE_API_KEY）
4. 运行 `npm start`

---

## 🔍 故障排查

### 问题 1: 端口被占用

**错误信息**: `EADDRINUSE: address already in use :::3001`

**解决方案**:
```bash
# Windows PowerShell
netstat -ano | findstr :3001
taskkill /F /PID <进程ID>

# 或者修改端口
# 在 .env 文件中添加: PORT=3002
```

### 问题 2: API 密钥未生效

**解决方案**:
1. 检查 `.env` 文件是否在项目根目录
2. 检查环境变量名称是否正确（区分大小写）
3. 重启开发服务器

### 问题 3: 前端无法连接后端

**解决方案**:
1. 确保后端服务器正在运行（访问 http://localhost:3001/api/health）
2. 检查 `vite.config.ts` 中的代理配置
3. 清除浏览器缓存

---

## 🔑 API 密钥获取指南

### 1. Google Gemini API Key
- **获取地址**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **用途**: 用于宏观、行业、资金流向分析（支持联网搜索）
- **费用**: 有免费额度

### 2. DeepSeek API Key
- **获取地址**: [https://platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- **用途**: 用于技术分析、基本面估值、总监整合、风控评估、总经理决策
- **费用**: 按使用量付费，价格低廉

### 3. 聚合数据 API Key
- **获取地址**: [https://www.juhe.cn/](https://www.juhe.cn/)
- **用途**: 获取沪深股市实时行情数据（五档盘口、成交量等）
- **申请接口**: 需要在聚合数据平台申请"沪深股票-基本数据"接口
- **费用**: 有免费额度

### 4. 通义千问 API Key（可选）
- **获取地址**: [https://dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- **用途**: 备用 AI 模型（当前版本未强制使用）
- **费用**: 有免费额度

---

## 💡 前端手动输入 API 密钥

如果你不想在服务器配置环境变量，或者想使用临时的 API 密钥，可以：

1. 在首页点击 **"API 密钥配置（可选）"** 按钮展开配置面板
2. 输入你的 API 密钥（支持部分输入，未填写的将使用服务器默认配置）
3. 点击"启动系统"进行分析

> **安全提示**：前端输入的 API 密钥仅在当前会话中有效，不会被存储。

---

## ⚠️ 免责声明

本系统生成的所有分析报告、投资建议及决策结果均由人工智能模型自动生成，**仅供技术研究与辅助参考，不构成任何实质性的投资建议**。

*   股市有风险，投资需谨慎。
*   AI 模型可能会产生"幻觉"或基于过时信息进行推理。
*   请务必结合个人独立判断进行投资操作。

---

## 📄 License

MIT License

---

Developed with ❤️ by 张一依有把越女剑
