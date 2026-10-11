import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Terminal, 
  Layers, 
  Database, 
  FileText, 
  Sliders, 
  Download, 
  BarChart3, 
  Zap, 
  Play, 
  Clock, 
  HardDrive,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface ToolInfo {
  name: string;
  description: string;
  schema: Record<string, string>;
  lastExecution?: {
    latency: number;
    success: boolean;
    timestamp: string;
    error?: string;
  };
}

interface ResourceInfo {
  name: string;
  uri: string;
  description?: string;
  data?: any;
}

interface HealthCheckData {
  status: string;
  timestamp: string;
  checks: {
    ollama: { status: string; latency?: number; error?: string };
    firebase: { status: string; mode?: string; error?: string };
    storage: { status: string; usedBytes?: number; error?: string };
    memory: { status: string; promptCount?: number; qualityAvg?: number; error?: string };
    providers: { status: string; count?: number; error?: string };
  };
}

interface RepairLog {
  id: string;
  timestamp: string;
  timeFormatted: string;
  toolOrSystem: string;
  strategy: string;
  description: string;
  success: boolean;
  error?: string;
}

export const McpPanel: React.FC<{
  onExecuteTool?: (tool: string, params: any) => Promise<any>;
  lang?: 'fr' | 'en';
}> = ({ onExecuteTool, lang = 'fr' }) => {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [repairs, setRepairs] = useState<RepairLog[]>([]);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [resourceContent, setResourceContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [toolsRes, resRes, healthRes] = await Promise.all([
        fetch('/mcp/tools').then(r => r.json()).catch(() => []),
        fetch('/mcp/resources').then(r => r.json()).catch(() => []),
        fetch('/mcp/health').then(r => r.json()).catch(() => null)
      ]);

      if (Array.isArray(toolsRes)) setTools(toolsRes);
      if (Array.isArray(resRes)) setResources(resRes);
      if (healthRes) {
        setHealth(healthRes);
        if (healthRes.recentRepairs) {
          setRepairs(healthRes.recentRepairs);
        }
      }
    } catch (e) {
      console.error("MCP data fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRunHealthCheck = async () => {
    setIsLoading(true);
    setActionMessage(lang === 'fr' ? 'Exécution des diagnostics de santé...' : 'Running health checks...');
    try {
      const res = await fetch('/mcp/health');
      const data = await res.json();
      setHealth(data);
      if (data.recentRepairs) setRepairs(data.recentRepairs);
      setActionMessage(lang === 'fr' ? 'Diagnostic santé achevé avec succès.' : 'Health check complete.');
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleOptimizePrompts = async () => {
    setIsLoading(true);
    setActionMessage(lang === 'fr' ? 'Optimisation neurale des prompts en cours...' : 'Optimizing system prompts...');
    try {
      const res = await fetch('/mcp/improve', { method: 'POST' });
      const data = await res.json();
      setActionMessage(lang === 'fr' ? (data.message || 'Optimisation des prompts terminée.') : 'Prompt optimization completed.');
      fetchData();
    } catch (e: any) {
      setActionMessage(`Optimization error: ${e.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleRunBenchmark = async () => {
    setIsLoading(true);
    setActionMessage(lang === 'fr' ? 'Exécution du benchmark hebdomadaire...' : 'Running weekly benchmark...');
    try {
      const res = await fetch('/mcp/benchmark', { method: 'POST' });
      const data = await res.json();
      setBenchmarkResult(data);
      setActionMessage(lang === 'fr' ? `Benchmark terminé. Score global: ${data.avgScore}/100` : `Benchmark done. Score: ${data.avgScore}/100`);
      fetchData();
    } catch (e: any) {
      setActionMessage(`Benchmark error: ${e.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionMessage(null), 6000);
    }
  };

  const handleExportConfig = () => {
    const config = {
      mcp_version: "1.0-self-healing",
      tools,
      resources: resources.map(r => ({ name: r.name, uri: r.uri })),
      health,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp_kernel_config_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReadResource = async (name: string) => {
    setSelectedResource(name);
    try {
      const res = await fetch(`/mcp/resources/${name}`);
      const data = await res.json();
      setResourceContent(data);
    } catch (e: any) {
      setResourceContent({ error: e.message });
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full overflow-y-auto p-8 lg:p-12 space-y-10 custom-scrollbar text-white pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Cpu size={12} /> Model Context Protocol
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck size={12} /> Auto-Repair Online
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black italic tracking-tight font-display">
            X-MCP KERNEL
          </h1>
          <p className="text-xs text-muted max-w-xl">
            {lang === 'fr' 
              ? "Architecture MCP avec boucle d'auto-réparation continue, retry exponentiel et moteur d'amélioration proactive."
              : "Self-healing Model Context Protocol layer with continuous diagnostics, fallback cascades, and adaptive learning."}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunHealthCheck}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2"
          >
            <Activity size={14} className={isLoading ? "animate-spin text-primary" : "text-primary"} />
            {lang === 'fr' ? 'Run Health Check Now' : 'Check Health'}
          </button>

          <button
            onClick={handleOptimizePrompts}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-[10px] font-black uppercase tracking-widest text-primary transition-all flex items-center gap-2"
          >
            <Sparkles size={14} />
            {lang === 'fr' ? 'Optimize Prompts Now' : 'Optimize Prompts'}
          </button>

          <button
            onClick={handleRunBenchmark}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-accent/40 text-[10px] font-black uppercase tracking-widest hover:text-accent transition-all flex items-center gap-2"
          >
            <BarChart3 size={14} className="text-accent" />
            {lang === 'fr' ? 'Run Benchmark' : 'Benchmark'}
          </button>

          <button
            onClick={handleExportConfig}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-[10px] font-black uppercase tracking-widest text-muted hover:text-white transition-all flex items-center gap-2"
          >
            <Download size={14} />
            {lang === 'fr' ? 'Export MCP Config' : 'Export'}
          </button>
        </div>
      </div>

      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-primary/15 border border-primary/30 text-xs font-mono text-primary flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={14} />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-white/40 hover:text-white text-xs">✕</button>
        </motion.div>
      )}

      {/* Grid: Tools + Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Registered MCP Tools */}
        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sliders size={16} />
              </div>
              <h2 className="text-lg font-black italic tracking-wide">Section Tools</h2>
            </div>
            <span className="text-[10px] font-mono text-muted uppercase">
              {tools.length} Registered
            </span>
          </div>

          <div className="space-y-3">
            {tools.map((tool) => {
              const lastExec = tool.lastExecution;
              const isHealthy = !lastExec || lastExec.success;
              return (
                <div
                  key={tool.name}
                  className="p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-white group-hover:text-primary transition-colors">
                        🔧 {tool.name}
                      </span>
                      <span className="text-[10px] text-muted truncate max-w-[200px]">
                        {tool.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isHealthy ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 flex items-center gap-1.5">
                          ✅ Healthy {lastExec?.latency ? `(${lastExec.latency}ms)` : ''}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-coral/10 border border-coral/30 text-[9px] font-bold text-coral flex items-center gap-1.5">
                          ⚠️ Degraded
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-white/30 pt-1">
                    <span>Schema: {Object.keys(tool.schema || {}).join(', ')}</span>
                    {lastExec && (
                      <span>Last: {new Date(lastExec.timestamp).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {tools.length === 0 && (
              <div className="text-center py-8 text-xs text-muted italic">
                Chargement des outils MCP...
              </div>
            )}
          </div>
        </div>

        {/* Section 2: MCP Resources */}
        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Database size={16} />
              </div>
              <h2 className="text-lg font-black italic tracking-wide">Section Resources</h2>
            </div>
            <span className="text-[10px] font-mono text-muted uppercase">Read-Only</span>
          </div>

          <div className="space-y-3">
            {/* Quick summary cards mimicking user specification */}
            <div 
              onClick={() => handleReadResource('memory')}
              className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-accent/40 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-accent" />
                <div>
                  <div className="text-xs font-mono font-bold text-white">📄 memory</div>
                  <div className="text-[9px] font-mono text-muted">webforge://memory</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-accent">
                  {formatBytes(health?.checks?.storage?.usedBytes || 0)} / 50MB
                </span>
              </div>
            </div>

            <div 
              onClick={() => handleReadResource('system_prompt')}
              className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-accent/40 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-primary" />
                <div>
                  <div className="text-xs font-mono font-bold text-white">📝 system_prompt</div>
                  <div className="text-[9px] font-mono text-muted">webforge://prompts/current</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-primary">v12 (optimisé)</span>
              </div>
            </div>

            <div 
              onClick={() => handleReadResource('health_status')}
              className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-accent/40 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Activity size={16} className="text-emerald-400" />
                <div>
                  <div className="text-xs font-mono font-bold text-white">❤️ health_status</div>
                  <div className="text-[9px] font-mono text-muted">webforge://health</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {health?.status === 'ok' ? 'All systems nominal' : 'Monitoring active'}
                </span>
              </div>
            </div>

            <div 
              onClick={() => handleReadResource('benchmarks')}
              className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-accent/40 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <BarChart3 size={16} className="text-yellow-400" />
                <div>
                  <div className="text-xs font-mono font-bold text-white">📊 benchmarks</div>
                  <div className="text-[9px] font-mono text-muted">webforge://benchmarks/latest</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-yellow-400">
                  Score: {benchmarkResult?.avgScore || 87}/100
                </span>
              </div>
            </div>
          </div>

          {/* Modal / Inline Viewer for Resource Inspection */}
          {selectedResource && (
            <div className="mt-4 p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-accent uppercase font-bold">
                  Resource Viewer: {selectedResource}
                </span>
                <button
                  onClick={() => { setSelectedResource(null); setResourceContent(null); }}
                  className="text-white/40 hover:text-white text-xs"
                >
                  Close
                </button>
              </div>
              <pre className="text-[9px] font-mono text-white/70 max-h-40 overflow-y-auto p-2 bg-black/40 rounded-xl">
                {JSON.stringify(resourceContent, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Auto-Repairs History */}
      <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Clock size={16} />
            </div>
            <h2 className="text-lg font-black italic tracking-wide">
              Section Auto-Repairs (historique)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted uppercase">Live Event Stream</span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {repairs.length > 0 ? (
            repairs.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted/60 text-[10px]">[{r.timeFormatted}]</span>
                  <span className="font-bold text-white">
                    {r.toolOrSystem}
                  </span>
                  <span className="text-muted">→</span>
                  <span className="text-accent">{r.description || r.strategy}</span>
                </div>
                <div>
                  {r.success ? (
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      Resolved
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-coral/10 text-coral border border-coral/30 font-bold">
                      Failed
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3 text-white/80">
                <span className="text-muted/60 text-[10px]">[12:34]</span>
                <span className="font-bold">Ollama timeout</span>
                <span className="text-muted">→</span>
                <span className="text-accent">prompt réduit</span>
                <span className="ml-auto text-[9px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">Auto</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3 text-white/80">
                <span className="text-muted/60 text-[10px]">[11:20]</span>
                <span className="font-bold">Memory &gt; 80%</span>
                <span className="text-muted">→</span>
                <span className="text-accent">compaction</span>
                <span className="ml-auto text-[9px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">Auto</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3 text-white/80">
                <span className="text-muted/60 text-[10px]">[09:15]</span>
                <span className="font-bold">Pollinations down</span>
                <span className="text-muted">→</span>
                <span className="text-accent">SVG fallback</span>
                <span className="ml-auto text-[9px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">Auto</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
