
// 智能体角色枚举
export enum AgentRole {
  MACRO = 'MACRO',
  INDUSTRY = 'INDUSTRY',
  TECHNICAL = 'TECHNICAL',
  FUNDS = 'FUNDS',
  FUNDAMENTAL = 'FUNDAMENTAL',
  MANAGER_FUNDAMENTAL = 'MANAGER_FUNDAMENTAL',
  MANAGER_MOMENTUM = 'MANAGER_MOMENTUM',
  RISK_SYSTEM = 'RISK_SYSTEM',
  RISK_PORTFOLIO = 'RISK_PORTFOLIO',
  GM = 'GM'
}

// 分析流程状态
export enum AnalysisStatus {
  IDLE = 'IDLE',          // 空闲
  FETCHING_DATA = 'FETCHING_DATA', // 正在获取API数据
  RUNNING = 'RUNNING',    // AI分析进行中
  COMPLETED = 'COMPLETED',// 完成
  ERROR = 'ERROR'         // 出错
}

// 模型提供商
export enum ModelProvider {
  GEMINI = 'GEMINI',
  DEEPSEEK = 'DEEPSEEK',
  QWEN = 'QWEN'
}

// 智能体配置接口
export interface AgentConfig {
  id: AgentRole;
  name: string;        // 英文名
  title: string;       // 中文展示名
  description: string; // 职责描述
  icon: string;        // 图标名
  color: string;       // 主题色
  temperature: number; // 随机性参数
  systemPrompt: string;// 系统提示词
  modelProvider: ModelProvider; // 使用的模型厂商
  modelName: string;   // 具体模型名称
}

// 智能体输出结果
export interface AgentOutput {
  role: AgentRole;
  content: string;
  timestamp: number;
}

// API 密钥存储
export interface ApiKeys {
  gemini?: string;
  deepseek?: string;
  qwen?: string;
  juhe?: string;
}

// 全局工作流状态
export interface WorkflowState {
  status: AnalysisStatus;
  currentStep: number; // 0: Idle, 1: Analysts, 2: Managers, 3: Risk, 4: GM
  stockSymbol: string;
  stockDataContext: string; // 存储格式化后的聚合数据
  outputs: Partial<Record<AgentRole, string>>; // 各智能体的输出内容
  error?: string;
  agentConfigs: Record<AgentRole, AgentConfig>; // 可动态修改的配置
  apiKeys: ApiKeys;
}