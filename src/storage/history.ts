// Command-pattern history for undo/redo.
// Stores operations (patches) instead of full state snapshots,
// reducing memory usage and improving performance.

export type HistoryCommand =
  | { type: 'add-todo'; id: string }
  | { type: 'delete-todo'; snapshot: unknown }
  | { type: 'update-todo'; id: string; prev: Record<string, unknown>; next: Record<string, unknown> }
  | { type: 'toggle-todo'; id: string }
  | { type: 'reorder-todos'; prevOrder: string[]; nextOrder: string[] }
  | { type: 'add-note'; id: string }
  | { type: 'delete-note'; snapshot: unknown }
  | { type: 'update-note'; id: string; prev: Record<string, unknown>; next: Record<string, unknown> }
  | { type: 'reorder-notes'; prevOrder: string[]; nextOrder: string[] };

export class History {
  private past: HistoryCommand[][] = [];
  private future: HistoryCommand[][] = [];
  private batch: HistoryCommand[] | null = null;
  private readonly limit: number;

  constructor(limit = 50) {
    this.limit = limit;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  startBatch(): void {
    this.batch = [];
  }

  commitBatch(): void {
    if (this.batch && this.batch.length > 0) {
      this.push(this.batch);
    }
    this.batch = null;
  }

  cancelBatch(): void {
    this.batch = null;
  }

  push(command: HistoryCommand | HistoryCommand[]): void {
    const cmds = Array.isArray(command) ? command : [command];
    if (this.batch) {
      this.batch.push(...cmds);
      return;
    }
    this.past.push(cmds);
    if (this.past.length > this.limit) {
      this.past.shift();
    }
    this.future = [];
  }

  undo(): HistoryCommand[] | null {
    const cmds = this.past.pop();
    if (!cmds) return null;
    this.future.push(cmds);
    return cmds;
  }

  redo(): HistoryCommand[] | null {
    const cmds = this.future.pop();
    if (!cmds) return null;
    this.past.push(cmds);
    return cmds;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }

  toJSON(): { past: HistoryCommand[][]; future: HistoryCommand[][] } {
    return { past: this.past, future: this.future };
  }

  static fromJSON(json: { past: HistoryCommand[][]; future: HistoryCommand[][] }): History {
    const h = new History();
    h.past = json.past ?? [];
    h.future = json.future ?? [];
    return h;
  }
}
