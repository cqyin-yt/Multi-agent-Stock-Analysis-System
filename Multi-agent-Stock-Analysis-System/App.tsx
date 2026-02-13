import React, { useState } from 'react';
import { AgentRole, AnalysisStatus, WorkflowState, AgentConfig, ApiKeys } from './types';
import { runAnalystsStage, runManagersStage, runRiskStage, runGMStage } from './services/geminiService';
import { fetchStockData, formatStockDataForPrompt } from './services/juheService';
import StockInput from './components/StockInput';
import AgentCard from './components/AgentCard';
import { DEFAULT_AGENTS } from './constants';
import { LayoutDashboard, BrainCircuit, ShieldCheck, Gavel, RefreshCw, AlertTriangle, Settings2, Database } from 'lucide-react';

// 初始状态定义
const initialState: WorkflowState = {
  status: AnalysisStatus.IDLE,
  currentStep: 0,
  stockSymbol: '',
  stockDataContext: '',
  outputs: {},
  agentConfigs: JSON.parse(JSON.stringify(DEFAULT_AGENTS)), // 深拷贝默认配置
  apiKeys: {}
};

const App: React.FC = () => {
  const [state, setState] = useState<WorkflowState>(initialState);

  // 处理空闲状态下的配置修改（温度、模型等）
  const handleConfigChange = (role: AgentRole, newConfig: AgentConfig) => {
    setState(prev => ({
      ...prev,
      agentConfigs: {
        ...prev.agentConfigs,
        [role]: newConfig
      }
    }));
  };

  // 验证股票代码是否为沪深股市代码
  const validateStockCode = (symbol: string): { valid: boolean; message?: string } => {
    const code = symbol.trim().toLowerCase();
    
    // 带前缀的验证
    if (code.startsWith('sh') || code.startsWith('sz')) {
      const num = code.substring(2);
      if (!/^\d{6}$/.test(num)) {
        return { valid: false, message: '股票代码格式错误，应为6位数字（如: sh600519, sz000001）' };
      }
      return { valid: true };
    }
    
    // 不带前缀的验证
    if (!/^\d{6}$/.test(code)) {
      return { valid: false, message: '股票代码应为6位数字（如: 600519, 000001, 300750）' };
    }
    
    // 验证沪深市场代码规则
    const firstDigit = code.charAt(0);
    if (!['0', '1', '2', '3', '6', '8', '9'].includes(firstDigit)) {
      return { valid: false, message: '不是有效的沪深股市代码（沪市以6/9开头，深市以0/2/3开头）' };
    }
    
    return { valid: true };
  };

  // 主分析流程触发函数
  const handleAnalyze = async (symbol: string, apiKeys: ApiKeys) => {
    // 1. 验证股票代码
    const validation = validateStockCode(symbol);
    if (!validation.valid) {
      setState(prev => ({
        ...prev,
        status: AnalysisStatus.ERROR,
        error: validation.message
      }));
      return;
    }

    // 2. 初始化状态
    setState(prev => ({
      ...prev,
      status: AnalysisStatus.FETCHING_DATA,
      currentStep: 0,
      stockSymbol: symbol,
      outputs: {},
      apiKeys: apiKeys,
      error: undefined
    }));

    let stockDataContext = "";
    try {
      // 步骤 0: 从聚合数据 API 获取实时行情，传递 API Key
      const stockData = await fetchStockData(symbol, apiKeys.juhe);
      
      // 3. 检查数据获取是否成功
      if (!stockData) {
        setState(prev => ({
          ...prev,
          status: AnalysisStatus.ERROR,
          error: `无法获取股票 ${symbol.toUpperCase()} 的实时数据。请检查：\n1. 股票代码是否正确（如: 600519, 000001, 300750）\n2. 是否为沪深股市代码（不支持港股/美股）\n3. API服务是否正常`
        }));
        return; // 停止分析流程
      }
      
      stockDataContext = formatStockDataForPrompt(stockData);
      console.log(`[MaSAS] 成功获取 ${stockData.name} (${stockData.gid}) 的实时数据`);
      
      // 更新状态，准备开始第一阶段分析
      setState(prev => ({
        ...prev,
        status: AnalysisStatus.RUNNING,
        currentStep: 1,
        stockDataContext: stockDataContext
      }));

      // 步骤 1: 5位分析师并行分析 (Analysts)
      const analystResults = await runAnalystsStage(symbol, state.agentConfigs, apiKeys, stockDataContext);
      setState(prev => ({
        ...prev,
        currentStep: 2,
        outputs: { ...prev.outputs, ...analystResults }
      }));

      // 步骤 2: 2位总监整合报告 (Managers)
      // 需要将步骤1的结果传递给经理
      const outputsAfterStep1 = { ...state.outputs, ...analystResults };
      const managerResults = await runManagersStage(symbol, outputsAfterStep1, state.agentConfigs, apiKeys, stockDataContext);
      setState(prev => ({
        ...prev,
        currentStep: 3,
        outputs: { ...prev.outputs, ...managerResults }
      }));

      // 步骤 3: 风控团队评估 (Risk)
      const outputsAfterStep2 = { ...outputsAfterStep1, ...managerResults };
      const riskResults = await runRiskStage(symbol, outputsAfterStep2, state.agentConfigs, apiKeys, stockDataContext);
      setState(prev => ({
        ...prev,
        currentStep: 4,
        outputs: { ...prev.outputs, ...riskResults }
      }));

      // 步骤 4: 总经理最终决策 (GM)
      const outputsAfterStep3 = { ...outputsAfterStep2, ...riskResults };
      const gmResult = await runGMStage(symbol, outputsAfterStep3, state.agentConfigs, apiKeys, stockDataContext);
      setState(prev => ({
        ...prev,
        status: AnalysisStatus.COMPLETED,
        currentStep: 5, // 流程结束
        outputs: { ...prev.outputs, ...gmResult }
      }));

    } catch (error) {
      console.error("工作流执行失败", error);
      setState(prev => ({
        ...prev,
        status: AnalysisStatus.ERROR,
        error: error instanceof Error ? error.message : "发生未知错误"
      }));
    }
  };

  // 重置系统状态
  const reset = () => {
    // 保留用户自定义的配置(agentConfigs)和key，仅重置输出和状态
    setState(prev => ({
      ...initialState,
      agentConfigs: prev.agentConfigs, 
      apiKeys: prev.apiKeys
    }));
  };

  // 辅助函数：判断当前阶段是否正在加载
  const isStepLoading = (stepIndex: number) => state.status === AnalysisStatus.RUNNING && state.currentStep === stepIndex;
  // 辅助函数：判断当前阶段是否等待中
  const isStepPending = (stepIndex: number) => state.status === AnalysisStatus.IDLE || state.status === AnalysisStatus.FETCHING_DATA || (state.status === AnalysisStatus.RUNNING && state.currentStep < stepIndex);

  return (
    <div className="min-h-screen bg-slate-950 pb-20 overflow-x-hidden">
      {/* 顶部导航栏 */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs md:text-sm shrink-0">
              AC
            </div>
            <h1 className="text-base md:text-lg font-bold text-slate-100 tracking-tight whitespace-nowrap">
              MaSAS <span className="text-blue-500">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             {state.status !== AnalysisStatus.IDLE && (
                <button onClick={reset} className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 rounded px-2 py-1 md:border-none">
                    <RefreshCw className="w-3 h-3 md:w-4 md:h-4" /> 
                    <span className="hidden md:inline">重置系统</span>
                    <span className="md:hidden">重置</span>
                </button>
             )}
             <div className="hidden md:block h-4 w-[1px] bg-slate-700"></div>
             <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-slate-500">
                <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${state.status === AnalysisStatus.RUNNING || state.status === AnalysisStatus.FETCHING_DATA ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></span>
                <span className="hidden md:inline">状态: </span>
                {state.status === AnalysisStatus.FETCHING_DATA ? '获取数据...' : state.status}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* 输入区域：仅在空闲时显示 */}
        {state.status === AnalysisStatus.IDLE && (
           <div className="flex flex-col items-center justify-center mb-8 md:mb-16 animate-fade-in-up mt-4 md:mt-10">
              <h2 className="text-2xl md:text-5xl font-bold text-center text-white mb-4 md:mb-6 tracking-tight leading-tight">
                多智能体股票分析决策系统<br />
                <span className="text-lg md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 block mt-2 md:mt-4 font-normal">
                   Institutional Grade Multi-Agent System
                </span>
              </h2>
              <p className="text-slate-400 max-w-xl text-center mb-8 md:mb-10 text-sm md:text-lg px-2">
                部署由10位AI专家组成的决策委员会。接入聚合数据API实时行情，全方位扫描A股投资机会。
              </p>
              <StockInput onAnalyze={handleAnalyze} disabled={false} />
           </div>
        )}

        {/* 结果展示区域 */}
        <div className="space-y-8 md:space-y-12 animate-fade-in">
             {state.status !== AnalysisStatus.IDLE && (
                 <div className="flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
                            分析标的: <span className="font-mono text-blue-400 bg-blue-400/10 px-3 py-1 rounded">{state.stockSymbol.toUpperCase()}</span>
                        </h2>
                        {state.error && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1.5 rounded border border-red-500/20 text-xs md:text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                {state.error}
                            </div>
                        )}
                    </div>
                    {/* 数据源状态指示器 */}
                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800 w-fit">
                        <Database className="w-3 h-3 text-blue-500" />
                        <span>数据源: 聚合数据 API (Juhe Data) {state.stockDataContext.includes("无法获取") ? "(连接失败 - 使用AI估算)" : "(连接成功 - 实时数据已注入)"}</span>
                    </div>
                 </div>
             )}

             {/* 第一阶段：5位分析师 */}
             <section>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-wider">
                        <LayoutDashboard className="w-4 h-4" /> 第一阶段：并行专业分析
                    </div>
                    {state.status === AnalysisStatus.IDLE && (
                        <div className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1">
                            <Settings2 className="w-3 h-3" /> 可配置参数
                        </div>
                    )}
                </div>
                {/* 移动端: 自动高度; 桌面端: 自动高度以适应内容 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                    {[AgentRole.MACRO, AgentRole.INDUSTRY, AgentRole.TECHNICAL, AgentRole.FUNDS, AgentRole.FUNDAMENTAL].map(role => (
                        <div key={role} className="h-[400px] md:h-[450px]">
                            <AgentCard 
                                config={state.agentConfigs[role]}
                                content={state.outputs[role]} 
                                isLoading={isStepLoading(1)}
                                isPending={isStepPending(1)}
                                isConfigMode={state.status === AnalysisStatus.IDLE}
                                onConfigChange={(newConfig) => handleConfigChange(role, newConfig)}
                            />
                        </div>
                    ))}
                </div>
             </section>

             {/* 第二阶段：2位经理 */}
             <section>
                <div className="flex items-center gap-2 mb-3 md:mb-4 text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-wider">
                    <BrainCircuit className="w-4 h-4" /> 第二阶段：策略整合
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {[AgentRole.MANAGER_FUNDAMENTAL, AgentRole.MANAGER_MOMENTUM].map(role => (
                        <div key={role} className="h-[400px]">
                            <AgentCard 
                                config={state.agentConfigs[role]}
                                content={state.outputs[role]} 
                                isLoading={isStepLoading(2)}
                                isPending={isStepPending(2)}
                                isConfigMode={state.status === AnalysisStatus.IDLE}
                                onConfigChange={(newConfig) => handleConfigChange(role, newConfig)}
                            />
                        </div>
                    ))}
                </div>
             </section>

             {/* 第三阶段：2位风控 */}
             <section>
                <div className="flex items-center gap-2 mb-3 md:mb-4 text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" /> 第三阶段：风控评估
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {[AgentRole.RISK_SYSTEM, AgentRole.RISK_PORTFOLIO].map(role => (
                        <div key={role} className="h-[400px]">
                            <AgentCard 
                                config={state.agentConfigs[role]}
                                content={state.outputs[role]} 
                                isLoading={isStepLoading(3)}
                                isPending={isStepPending(3)}
                                isConfigMode={state.status === AnalysisStatus.IDLE}
                                onConfigChange={(newConfig) => handleConfigChange(role, newConfig)}
                            />
                        </div>
                    ))}
                </div>
             </section>

             {/* 第四阶段：总经理 */}
             <section>
                <div className="flex items-center gap-2 mb-3 md:mb-4 text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-wider">
                    <Gavel className="w-4 h-4" /> 第四阶段：最终决策
                </div>
                <div className="h-[400px]">
                    <AgentCard 
                        config={state.agentConfigs[AgentRole.GM]}
                        content={state.outputs[AgentRole.GM]} 
                        isLoading={isStepLoading(4)}
                        isPending={isStepPending(4)}
                        isConfigMode={state.status === AnalysisStatus.IDLE}
                        onConfigChange={(newConfig) => handleConfigChange(AgentRole.GM, newConfig)}
                    />
                </div>
             </section>
        </div>
      </main>
    </div>
  );
};

export default App;