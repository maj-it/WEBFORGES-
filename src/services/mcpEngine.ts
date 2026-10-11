import path from 'path';
import fs from 'node:fs/promises';
import { existsSync, readdirSync, statSync } from 'node:fs';

export type HealthStatusLevel = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  name: string;
  status: HealthStatusLevel;
  latency?: number;
  details?: any;
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  schema: Record<string, string>;
  execute: (params: any) => Promise<any>;
  healthCheck?: () => Promise<HealthCheckResult>;
  repair?: (error?: any) => Promise<void>;
}

export interface MCPResource {
  name: string;
  uri: string;
  description?: string;
  read: () => Promise<any> | any;
}

export interface RepairLogEntry {
  id: string;
  timestamp: string;
  timeFormatted: string;
  toolOrSystem: string;
  strategy: string;
  description: string;
  success: boolean;
  error?: string;
}

export interface ToolExecutionLog {
  tool: string;
  timestamp: string;
  latency: number;
  success: boolean;
  error?: string;
}

export class MCPEngine {
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private repairLogs: RepairLogEntry[] = [];
  private executionLogs: ToolExecutionLog[] = [];
  private repairHandlers: Map<string, () => Promise<void>> = new Map();

  constructor() {
    this.initDefaultRepairStrategies();
  }

  registerTool(tool: MCPTool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  listTools() {
    return Array.from(this.tools.values()).map(t => {
      // Find latest execution stats
      const latest = this.executionLogs.filter(l => l.tool === t.name).slice(-1)[0];
      return {
        name: t.name,
        description: t.description,
        schema: t.schema,
        lastExecution: latest || null
      };
    });
  }

  registerResource(resource: MCPResource) {
    this.resources.set(resource.name, resource);
  }

  async readResource(name: string) {
    const res = this.resources.get(name);
    if (!res) throw new Error(`MCP Resource ${name} not found`);
    return await res.read();
  }

  listResources() {
    return Array.from(this.resources.values()).map(r => ({
      name: r.name,
      uri: r.uri,
      description: r.description
    }));
  }

  registerRepairStrategy(errorType: string, handler: () => Promise<void>) {
    this.repairHandlers.set(errorType, handler);
  }

  private initDefaultRepairStrategies() {
    // Stored in engine, supplemented by server implementation
  }

  async executeTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool ${name} not found`);

    let lastError: any;
    const startTime = Date.now();

    for (let i = 0; i < 3; i++) {
      const stepStart = Date.now();
      try {
        const result = await tool.execute(params);
        const duration = Date.now() - stepStart;
        await this.logSuccess(name, params, duration);
        return result;
      } catch (err: any) {
        lastError = err;
        const duration = Date.now() - stepStart;
        await this.logFailure(name, params, err, duration);
        await this.selfRepair(name, err);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }

    throw lastError;
  }

  classifyError(error: any): string {
    const msg = (error?.message || String(error) || '').toLowerCase();
    if (msg.includes('ollama') && (msg.includes('econnrefused') || msg.includes('unreachable') || msg.includes('down'))) {
      return 'OLLAMA_DOWN';
    }
    if (msg.includes('timeout') || msg.includes('aborted') || msg.includes('etimedout')) {
      return 'OLLAMA_TIMEOUT';
    }
    if (msg.includes('json') || msg.includes('parse') || msg.includes('syntaxerror')) {
      return 'PARSE_ERROR';
    }
    if (msg.includes('enospc') || msg.includes('disk full') || msg.includes('quota')) {
      return 'DISK_FULL';
    }
    if (msg.includes('memory') || msg.includes('emfile') || msg.includes('heap') || msg.includes('out of memory')) {
      return 'MEMORY_EXCEEDED';
    }
    if (msg.includes('firebase') || msg.includes('permission-denied') || msg.includes('unavailable')) {
      return 'FIREBASE_ERROR';
    }
    if (msg.includes('rate limit') || msg.includes('429') || msg.includes('throttled')) {
      return 'RATE_LIMITED';
    }
    return 'GENERIC_ERROR';
  }

  async selfRepair(toolName: string, error: any) {
    const errorType = this.classifyError(error);
    const tool = this.tools.get(toolName);

    try {
      // 1. Tool specific repair if provided
      if (tool && tool.repair) {
        await tool.repair(error);
      }

      // 2. Global strategy repair
      const globalStrategy = this.repairHandlers.get(errorType);
      if (globalStrategy) {
        await globalStrategy();
      }

      await this.logRepair(toolName, errorType, `Auto-repaired using strategy: ${errorType}`, true);
    } catch (repairErr: any) {
      await this.logRepair(toolName, errorType, `Repair attempt failed: ${repairErr.message}`, false, repairErr.message);
    }
  }

  async logSuccess(name: string, params: any, latency: number) {
    this.executionLogs.push({
      tool: name,
      timestamp: new Date().toISOString(),
      latency,
      success: true
    });
    if (this.executionLogs.length > 200) this.executionLogs.shift();
  }

  async logFailure(name: string, params: any, error: any, latency: number) {
    this.executionLogs.push({
      tool: name,
      timestamp: new Date().toISOString(),
      latency,
      success: false,
      error: error?.message || String(error)
    });
    if (this.executionLogs.length > 200) this.executionLogs.shift();
  }

  async logRepair(toolOrSystem: string, strategy: string, description: string, success: boolean, error?: string) {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.repairLogs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: now.toISOString(),
      timeFormatted,
      toolOrSystem,
      strategy,
      description,
      success,
      error
    });
    if (this.repairLogs.length > 100) this.repairLogs.pop();
  }

  getRepairLogs() {
    return this.repairLogs;
  }
}
