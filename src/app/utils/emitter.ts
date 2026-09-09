export type Listener<T> = (payload: T) => void;

/**
 * Minimal typed event emitter. Replaces Node's `events` module, which only
 * worked because webpack was polyfilling it into the renderer bundle.
 */
export default class Emitter<T = void> {
  private listeners = new Set<Listener<T>>();

  /** Subscribe. Returns an unsubscribe function. */
  on(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    return () => this.off(fn);
  }

  off(fn: Listener<T>): void {
    this.listeners.delete(fn);
  }

  emit(payload: T): void {
    this.listeners.forEach((fn) => fn(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}
