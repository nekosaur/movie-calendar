import { getStore } from '@netlify/blobs'
import { BlobStore } from './store.interface.ts'

export class NetlifyStore<T> implements BlobStore<T> {
  private store: ReturnType<typeof getStore>

  constructor(private storeName: string) {
    this.store = getStore(storeName)
  }

  public async list(options?: { prefix: string }) {
    const response = await this.store.list(options)

    return response.blobs.map((blob) => blob.key)
  }

  public async get(key: string) {
    return this.store.get(key, { type: 'json' }) as T
  }

  public async set(key: string, data: object) {
    return this.store.setJSON(key, data)
  }

  public async clear() {
    const keys = await this.list()

    await Promise.all(keys.map((key) => this.store.delete(key)))
  }
}
