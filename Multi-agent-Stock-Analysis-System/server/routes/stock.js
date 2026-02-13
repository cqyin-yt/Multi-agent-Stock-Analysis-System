import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();
const JUHE_BASE_URL = 'http://web.juhe.cn/finance/stock/hs';

// 动态获取环境变量，避免模块加载时机问题
function getJuheApiKey() {
  return process.env.JUHE_API_KEY;
}

router.post('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { apiKey } = req.body;

    if (!symbol) {
      return res.status(400).json({ success: false, error: '缺少股票代码' });
    }

    // 优先使用前端传递的 API Key，其次使用环境变量
    const effectiveApiKey = apiKey || getJuheApiKey();

    if (!effectiveApiKey) {
      return res.status(500).json({
        success: false,
        error: '未配置聚合数据 API Key。请在前端输入 API Key 或在服务器设置环境变量 JUHE_API_KEY'
      });
    }

    // 格式化股票代码
    let gid = symbol.toLowerCase();
    if (!gid.startsWith('sh') && !gid.startsWith('sz')) {
      if (gid.startsWith('6')) {
        gid = `sh${gid}`;
      } else {
        gid = `sz${gid}`;
      }
    }

    const url = `${JUHE_BASE_URL}?gid=${gid}&key=${effectiveApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log('聚合数据 API 响应:', data);

    if (data.resultcode !== '200') {
      let errorMessage = data.reason || '未知错误';
      
      // 针对不同错误码提供更详细的提示
      if (data.error_code) {
        switch (data.error_code) {
          case 10001:
          case 10002:
          case 10003:
            errorMessage = `API Key 错误: ${errorMessage}。请检查聚合数据 API Key 是否正确配置。`;
            break;
          case 10012:
            errorMessage = `API 调用次数限制: ${errorMessage}。请检查聚合数据 API 的调用限制。`;
            break;
          case 201101:
          case 201102:
            errorMessage = `股票代码错误: ${errorMessage}。请检查股票代码是否正确。`;
            break;
          default:
            errorMessage = `聚合数据 API 错误 (${data.error_code}): ${errorMessage}`;
        }
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage
      });
    }

    return res.json({
      success: true,
      data: data.result[0]
    });
  } catch (error) {
    console.error('获取股票数据失败:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

export default router;
