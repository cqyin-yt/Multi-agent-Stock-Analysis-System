import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// 动态获取环境变量，避免模块加载时机问题
function getDeepSeekApiKey() {
  return process.env.DEEPSEEK_API_KEY;
}

router.post('/', async (req, res) => {
  try {
    const { model, systemPrompt, prompt, temperature, apiKey } = req.body;

    // 优先使用前端传递的 API Key，其次使用环境变量
    const effectiveApiKey = apiKey || getDeepSeekApiKey();

    if (!effectiveApiKey) {
      return res.status(500).json({
        success: false,
        error: '未配置 DeepSeek API Key。请在前端输入 API Key 或在服务器设置环境变量 DEEPSEEK_API_KEY'
      });
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
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
      throw new Error(`DeepSeek API 错误: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return res.json({
      success: true,
      text: data.choices?.[0]?.message?.content || ''
    });
  } catch (error) {
    console.error('[DeepSeek] 请求失败:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
