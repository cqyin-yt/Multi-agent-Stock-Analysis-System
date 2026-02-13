import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// 动态获取环境变量，避免模块加载时机问题
function getQwenApiKey() {
  return process.env.QWEN_API_KEY;
}

router.post('/', async (req, res) => {
  try {
    const { model, systemPrompt, prompt, temperature, apiKey } = req.body;

    // 优先使用前端传递的 API Key，其次使用环境变量
    const effectiveApiKey = apiKey || getQwenApiKey();

    if (!effectiveApiKey) {
      return res.status(400).json({
        success: false,
        error: '未配置 Qwen API Key。请在前端输入 API Key 或在服务器设置环境变量 QWEN_API_KEY'
      });
    }

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`
      },
      body: JSON.stringify({
        model: model || 'qwen-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: temperature || 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Qwen API 错误: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return res.json({
      success: true,
      text: data.choices?.[0]?.message?.content || ''
    });
  } catch (error) {
    console.error('[Qwen] 请求失败:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
