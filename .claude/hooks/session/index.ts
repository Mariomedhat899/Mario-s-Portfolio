// Session-tier hooks (lifecycle events)
// Runs on: session.start, session.idle, session.end, chat.params, chat.message
// Composed into: createSessionHooks()

export interface SessionHookContext {
  projectDir: string;
  sessionId: string;
}

export type SessionHook = (ctx: SessionHookContext) => void | Promise<void>;

export function createSessionHooks(): SessionHook[] {
  return [
    // Session start: ensure dev env ready
    async (ctx) => {
      console.log(`[session] start: ${ctx.sessionId}`);
    },

    // Chat params: could inject model preferences
    (ctx) => {
      // Example: force specific model for certain tasks
    },

    // Session idle: auto-save, compact context
    async (ctx) => {
      console.log(`[session] idle: ${ctx.sessionId}`);
    },

    // Session end: cleanup
    async (ctx) => {
      console.log(`[session] end: ${ctx.sessionId}`);
    },
  ];
}