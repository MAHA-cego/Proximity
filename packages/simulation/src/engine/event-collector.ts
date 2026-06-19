import type { GameEvent } from "../events";

export class EventCollector {
  private readonly events: GameEvent[] = [];

  public add(event: GameEvent): void {
    this.events.push(event);
  }

  public toArray(): readonly GameEvent[] {
    return this.events;
  }
}
