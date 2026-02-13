import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入 API 路由
import geminiRouter from './routes/gemini.js';
import deepseekRouter from './routes/deepseek.js';
import qwenRouter from './routes/qwen.js';
import stockRouter from './routes/stock.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/ai/gemini', geminiRouter);
app.use('/api/ai/deepseek', deepseekRouter);
app.use('/api/ai/qwen', qwenRouter);
app.use('/api/stock', stockRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MaSAS API Server is running' });
});

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 MaSAS API Server 运行在 http://localhost:${PORT}`);
  console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`🔑 DeepSeek API: ${process.env.DEEPSEEK_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
  console.log(`🔑 Juhe API: ${process.env.JUHE_API_KEY ? '已配置 ✓' : '未配置 ✗'}`);
});
