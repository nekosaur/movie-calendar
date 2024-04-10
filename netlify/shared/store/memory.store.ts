import { BlobStore } from './store.interface'

export class MemoryStore<T = object> implements BlobStore<T> {
  private memory: Record<string, object>

  constructor() {
    this.memory = {}
  }

  public async list(options?: { prefix: string }) {
    const keys = Object.keys(this.memory)

    return options ? keys.filter((key) => key.startsWith(options.prefix)) : keys
  }

  public async get<T>(key: string) {
    return this.memory[key] as T
  }

  public async set(key: string, data: object) {
    this.memory[key] = data
  }
}
