export interface Id {
  id: string
}

export interface BlobStore<T> {
  list: (options?: { prefix: string }) => Promise<string[]>
  get: (key: string) => Promise<T>
  set: (key: string, data: object) => Promise<void>
}
