import { EventEmitter } from 'events';

class CustomEventEmitter {
  private eventEmitter = new EventEmitter();
  private lastDisplaySets: any = null;
  private frameIndex: string | null = null;

  emitDisplaySets(displaySets: any) {
    this.lastDisplaySets = displaySets;
    this.eventEmitter.emit('viewportDataLoaded', displaySets);
  }

  getLastDisplaySets() {
    return this.lastDisplaySets;
  }

  emitFrameIndex(frameIndex: string) {
    this.frameIndex = frameIndex;
    this.eventEmitter.emit('frameIndexChanged', frameIndex);
  }
  getFrameIndex() {
    return this.frameIndex;
  }

  // Attach an event listener
  on(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(event, listener);
  }

  // Remove an event listener
  off(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.off(event, listener);
  }

  // Clear all listeners for an event
  clearListeners(event: string) {
    this.eventEmitter.removeAllListeners(event);
  }
}

const eventEmitter = new CustomEventEmitter();
export default eventEmitter;
