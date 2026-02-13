import React, { useState } from 'react';
import { Search, Loader2, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { ApiKeys } from '../types';

interface StockInputProps {
  onAnalyze: (symbol: string, apiKeys: ApiKeys) => void;
  disabled: boolean;
}

const StockInput: React.FC<StockInputProps> = ({ onAnalyze, disabled }) => {
  const [symbol, setSymbol] = useState('');
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    deepseek: '',
    qwen: '',
    juhe: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      // 传递用户输入的 API Keys，如果用户未输入，则使用后端环境变量
      onAnalyze(symbol.trim(), apiKeys);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-10">
        <form onSubmit={handleSubmit}>
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
            <div className="pl-4 text-slate-400">
                <Search className="w-5 h-5" />
            </div>
            <input
                type="text"
                className="w-full bg-transparent px-4 py-4 text-white placeholder-slate-500 focus:outline-none font-mono tracking-wider uppercase"
                placeholder="请输入沪深股票代码 (如: 600519, 000001, 300750)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                disabled={disabled}
            />
            <button
                type="submit"
                disabled={disabled || !symbol.trim()}
                className="m-1 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {disabled ? '分析中...' : '启动系统'}
            </button>
            </div>
        </div>
        </form>
        
        {/* API 配置区域 */}
        <div className="mt-4">
            <button
                type="button"
                onClick={() => setShowApiConfig(!showApiConfig)}
                className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors text-slate-300 text-sm"
            >
                <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <span>API 密钥配置（可选）</span>
                </div>
                {showApiConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showApiConfig && (
                <div className="mt-2 p-4 bg-slate-800/30 border border-slate-700 rounded-lg space-y-3 animate-fade-in">
                    <p className="text-xs text-slate-400 mb-3">
                        💡 如果不填写，系统将使用服务器配置的默认 API 密钥。填写后将优先使用您的密钥。
                    </p>
                    
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">DeepSeek API Key</label>
                        <input
                            type="password"
                            className="w-full bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            placeholder="选填，用于 DeepSeek 模型调用"
                            value={apiKeys.deepseek || ''}
                            onChange={(e) => setApiKeys({...apiKeys, deepseek: e.target.value})}
                            disabled={disabled}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">聚合数据 API Key</label>
                        <input
                            type="password"
                            className="w-full bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            placeholder="选填，用于获取实时股票数据"
                            value={apiKeys.juhe || ''}
                            onChange={(e) => setApiKeys({...apiKeys, juhe: e.target.value})}
                            disabled={disabled}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">通义千问 API Key（可选）</label>
                        <input
                            type="password"
                            className="w-full bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            placeholder="选填，用于 Qwen 模型调用"
                            value={apiKeys.qwen || ''}
                            onChange={(e) => setApiKeys({...apiKeys, qwen: e.target.value})}
                            disabled={disabled}
                        />
                    </div>
                </div>
            )}
        </div>

        <div className="mt-3 text-center">
            <p className="text-xs text-slate-500">
                💡 仅支持沪深股市代码
            </p>
        </div>
    </div>
  );
};

export default StockInput;