import { AgentConfig, AgentRole, ApiKeys, ModelProvider, WorkflowState } from '../types';

// 后端 AI 代理接口 URL
const getBackendUrl = () => '/api/ai';

/**
 * 核心函数：根据配置生成单个智能体的回复
 * 包含 Gemini, DeepSeek, Qwen 的调用逻辑
 */
export async function generateAgentResponse(
  config: AgentConfig,
  stockSymbol: string,
  apiKeys: ApiKeys,
  context: string = "",
  stockDataContext: string = ""
): Promise<string> {
  // 构建通用 Prompt 模板，强调使用实时数据和输出精简
  const prompt = `
    目标标的: ${stockSymbol} (A股 / 沪深)
    
    【实时行情数据 (来源: 聚合数据 API)】:
    ${stockDataContext}

    【系统身份与任务】:
    ${config.systemPrompt}
    
    【来自同事/下属的背景信息】:
    ${context ? context : "暂无前序背景，请基于独立视角分析。"}

    【严格执行指令】:
    1. 必须优先参考提供的【实时行情数据】，特别是价格、成交量和买卖盘口。
    2. 如果你是宏观/行业分析师，请结合个股数据与宏观知识。
    3. **输出必须极度精炼、专业，使用Markdown列表格式。**
    4. **严禁废话、客套话，直接给出结论和数据支撑。**
  `;

  try {
    // 1. 调用 GEMINI 模型
    if (config.modelProvider === ModelProvider.GEMINI) {
      const response = await fetch(`${getBackendUrl()}/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.modelName,
          prompt: prompt,
          temperature: config.temperature,
          tools: [{ googleSearch: {} }],
          apiKey: apiKeys.gemini // 传递前端 API Key
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API 错误: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Gemini] ${config.title} 已启用 Google Search Grounding`);
      return data.text || "生成内容失败 (Gemini)";
    }

    // 2. 调用 DEEPSEEK 模型
    if (config.modelProvider === ModelProvider.DEEPSEEK) {
      const response = await fetch(`${getBackendUrl()}/deepseek`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.modelName,
          systemPrompt: config.systemPrompt,
          prompt: prompt,
          temperature: config.temperature,
          apiKey: apiKeys.deepseek // 传递前端 API Key
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`DeepSeek API 错误: ${err.error || response.statusText}`);
      }

      const data = await response.json();
      return data.text || "生成内容失败 (DeepSeek)";
    }

    // 3. 调用 通义千问 (QWEN) 模型
    if (config.modelProvider === ModelProvider.QWEN) {
      const response = await fetch(`${getBackendUrl()}/qwen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.modelName,
          systemPrompt: config.systemPrompt,
          prompt: prompt,
          temperature: config.temperature,
          apiKey: apiKeys.qwen // 传递前端 API Key
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Qwen API 错误: ${err.error || response.statusText}`);
      }

      const data = await response.json();
      return data.text || "生成内容失败 (Qwen)";
    }

    return "不支持的模型提供商";

  } catch (error) {
    console.error(`Error generating response for ${config.title}:`, error);
    throw error; // 抛出错误以便 fallback 逻辑捕获
  }
}

/**
 * 辅助函数：安全生成（带降级机制）
 * 如果首选模型失败（如 key 错误），自动降级使用 Gemini
 */
async function safeGenerate(
    config: AgentConfig,
    stockSymbol: string,
    apiKeys: ApiKeys,
    context: string,
    stockDataContext: string
): Promise<string> {
    try {
        return await generateAgentResponse(config, stockSymbol, apiKeys, context, stockDataContext);
    } catch (e) {
        console.warn(`Primary model failed for ${config.title}. Falling back to DeepSeek.`, e);
        
        // 创建临时配置，强制使用 DeepSeek
        const fallbackConfig: AgentConfig = {
            ...config,
            modelProvider: ModelProvider.DEEPSEEK,
            modelName: 'deepseek-chat'
        };
        
        try {
            const result = await generateAgentResponse(fallbackConfig, stockSymbol, apiKeys, context, stockDataContext);
            return result + `\n\n*(注: 由于 ${config.modelProvider} 调用失败，本报告由 DeepSeek 应急生成)*`;
        } catch (fallbackError) {
            console.error(`Fallback to DeepSeek failed for ${config.title}.`, fallbackError);
            
            // 检查错误类型，给出更友好的错误提示
            let errorMessage = '';
            if (e instanceof Error) {
                if (e.message.includes('Insufficient Balance')) {
                    errorMessage = 'DeepSeek API 余额不足，请充值或更换 API Key';
                } else if (e.message.includes('API Key')) {
                    errorMessage = 'API Key 错误或无效';
                } else {
                    errorMessage = e.message;
                }
            } else {
                errorMessage = '未知错误';
            }
            
            // 生成基于股票数据的简单分析，作为最后的降级方案
            if (stockDataContext) {
                return `⚠️ **分析失败**\n\n原因: ${errorMessage}\n\n---\n\n**基于实时数据的简单分析**\n\n${stockDataContext}\n\n💡 提示: 请检查 API Key 配置或充值后重试`;
            } else {
                return `⚠️ **分析失败**\n\n原因: ${errorMessage}\n\n💡 提示: 请检查 API Key 配置或充值后重试`;
            }
        }
    }
}

/**
 * 第一阶段：并行分析师
 * 5位分析师同时根据实时数据进行分析
 */
export async function runAnalystsStage(
  stockSymbol: string, 
  configs: Record<AgentRole, AgentConfig>, 
  apiKeys: ApiKeys,
  stockDataContext: string
) {
  const analystRoles = [
    AgentRole.MACRO,
    AgentRole.INDUSTRY,
    AgentRole.TECHNICAL,
    AgentRole.FUNDS,
    AgentRole.FUNDAMENTAL
  ];

  // 并行执行所有 Promise
  const promises = analystRoles.map(role => 
    safeGenerate(configs[role], stockSymbol, apiKeys, "", stockDataContext).then(res => ({ role, res }))
  );

  const results = await Promise.all(promises);
  // 将结果数组转换为对象 { ROLE: content }
  return results.reduce((acc, curr) => ({ ...acc, [curr.role]: curr.res }), {});
}

/**
 * 第二阶段：经理整合
 * 两位总监分别整合 基本面 和 市场动能 信息
 */
export async function runManagersStage(
  stockSymbol: string, 
  outputs: WorkflowState['outputs'], 
  configs: Record<AgentRole, AgentConfig>, 
  apiKeys: ApiKeys,
  stockDataContext: string
) {
  // 基本面上下文：宏观 + 行业 + 估值
  const fundContext = `
    [宏观政策报告]: ${outputs[AgentRole.MACRO]}
    [行业轮动报告]: ${outputs[AgentRole.INDUSTRY]}
    [基本面估值报告]: ${outputs[AgentRole.FUNDAMENTAL]}
  `;
  
  // 动能上下文：技术 + 资金
  const momContext = `
    [技术分析报告]: ${outputs[AgentRole.TECHNICAL]}
    [资金流向报告]: ${outputs[AgentRole.FUNDS]}
  `;

  const [fundRes, momRes] = await Promise.all([
    safeGenerate(configs[AgentRole.MANAGER_FUNDAMENTAL], stockSymbol, apiKeys, fundContext, stockDataContext),
    safeGenerate(configs[AgentRole.MANAGER_MOMENTUM], stockSymbol, apiKeys, momContext, stockDataContext)
  ]);

  return {
    [AgentRole.MANAGER_FUNDAMENTAL]: fundRes,
    [AgentRole.MANAGER_MOMENTUM]: momRes
  };
}

/**
 * 第三阶段：风控评估
 * 两位风控总监基于前序报告寻找风险点
 */
export async function runRiskStage(
  stockSymbol: string, 
  outputs: WorkflowState['outputs'], 
  configs: Record<AgentRole, AgentConfig>, 
  apiKeys: ApiKeys,
  stockDataContext: string
) {
  // 系统风险关注宏观和总监结论
  const systemContext = `
    [宏观报告]: ${outputs[AgentRole.MACRO]}
    [基本面总监]: ${outputs[AgentRole.MANAGER_FUNDAMENTAL]}
    [动能总监]: ${outputs[AgentRole.MANAGER_MOMENTUM]}
  `;

  // 组合风险关注具体操作层面的技术与总监结论
  const portContext = `
    [基本面总监]: ${outputs[AgentRole.MANAGER_FUNDAMENTAL]}
    [动能总监]: ${outputs[AgentRole.MANAGER_MOMENTUM]}
    [技术报告]: ${outputs[AgentRole.TECHNICAL]}
  `;

  const [sysRes, portRes] = await Promise.all([
    safeGenerate(configs[AgentRole.RISK_SYSTEM], stockSymbol, apiKeys, systemContext, stockDataContext),
    safeGenerate(configs[AgentRole.RISK_PORTFOLIO], stockSymbol, apiKeys, portContext, stockDataContext)
  ]);

  return {
    [AgentRole.RISK_SYSTEM]: sysRes,
    [AgentRole.RISK_PORTFOLIO]: portRes
  };
}

/**
 * 第四阶段：总经理决策
 * 综合所有信息做出最终买卖决定
 */
export async function runGMStage(
  stockSymbol: string, 
  outputs: WorkflowState['outputs'], 
  configs: Record<AgentRole, AgentConfig>, 
  apiKeys: ApiKeys,
  stockDataContext: string
) {
  const context = `
    [基本面总监]: ${outputs[AgentRole.MANAGER_FUNDAMENTAL]}
    [动能总监]: ${outputs[AgentRole.MANAGER_MOMENTUM]}
    [系统性风险总监]: ${outputs[AgentRole.RISK_SYSTEM]}
    [组合风险总监]: ${outputs[AgentRole.RISK_PORTFOLIO]}
  `;

  const res = await safeGenerate(configs[AgentRole.GM], stockSymbol, apiKeys, context, stockDataContext);
  return { [AgentRole.GM]: res };
}