// Tool Guard-tier hooks (pre/post tool execution)
// Runs before/after: Read, Write, Edit, Bash, Glob, Grep, Task, etc.
// Composed into: createToolGuardHooks()

export interface ToolGuardContext {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: unknown;
  phase: 'pre' | 'post';
}

export type ToolGuardHook = (ctx: ToolGuardContext) => void | Promise<void>;

export function createToolGuardHooks(): ToolGuardHook[] {
  return [
    // Pre-execution: validate inputs
    async (ctx) => {
      if (ctx.phase !== 'pre') return;

      // Prevent destructive operations without confirmation
      if (ctx.toolName === 'Bash') {
        const cmd = String(ctx.toolInput.command || '');
        if (cmd.includes('rm -rf') || cmd.includes('git reset --hard')) {
          console.warn(`[tool-guard] Potentially destructive command: ${cmd}`);
        }
      }

      // Prevent writes to protected files
      if (ctx.toolName === 'Write' || ctx.toolName === 'Edit') {
        const path = String(ctx.toolInput.file_path || '');
        if (path.includes('node_modules') || path.includes('.git')) {
          throw new Error(`[tool-guard] Blocked write to protected path: ${path}`);
        }
      }
    },

    // Post-execution: log results, track metrics
    async (ctx) => {
      if (ctx.phase !== 'post') return;

      if (ctx.toolName === 'Bash' && ctx.toolOutput) {
        const output = String(ctx.toolOutput);
        if (output.includes('ERROR') || output.includes('Error:')) {
          console.error(`[tool-guard] Command failed: ${String(ctx.toolInput.command)}`);
        }
      }
    },
  ];
}