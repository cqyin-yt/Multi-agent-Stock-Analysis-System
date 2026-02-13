import express from 'express';
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

const router = express.Router();

// 动态获取环境变量，避免模块加载时机问题
function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY;
}

function getVolcanoApiKey() {
  return process.env.VOLCANO_API_KEY;
}

function getVolcanoEndpoint() {
  return process.env.VOLCANO_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
}

router.post('/', async (req, res) => {
  try {
    const { model, prompt, temperature, tools, apiKey, useVolcano } = req.body;

    // 优先使用前端传递的 API Key，其次使用环境变量
    const effectiveApiKey = apiKey || getGeminiApiKey() || getVolcanoApiKey();

    if (!effectiveApiKey) {
      return res.status(500).json({
        success: false,
        error: '未配置 API Key。请在前端输入 API Key 或在服务器设置环境变量'
      });
    }

    // 检查是否使用火山方舟
    const isVolcano = useVolcano || process.env.USE_VOLCANO === 'true';

    if (isVolcano) {
      // 使用火山方舟 API
      const endpoint = getVolcanoEndpoint();
      const volcanoModel = model || 'ep-20240919170326-56hgz'; // 默认火山方舟模型
      
      console.log('[Gemini] 使用火山方舟 API:', volcanoModel);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`
        },
        body: JSON.stringify({
          model: volcanoModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: temperature || 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`火山方舟 API 错误: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return res.json({
        success: true,
        text: data.choices?.[0]?.message?.content || ''
      });
    } else {
      // 使用原生 Google Gemini API
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      
      const response = await ai.models.generateContent({
        model: model || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: temperature || 0.7,
          tools: tools || [{ googleSearch: {} }]
        }
      });

      return res.json({
        success: true,
        text: response.text || ''
      });
    }
  } catch (error) {
    console.error('[Gemini] 请求失败:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
