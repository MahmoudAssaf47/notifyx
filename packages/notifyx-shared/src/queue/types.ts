export interface QueueProvider {
  publish(topic: string, payload: unknown, maxAttempts?: number): Promise<string>;
  subscribe(topic: string, handler: (payload: string) => Promise<void>): void;
  startPolling(): void;
  stopPolling(): void;
}
