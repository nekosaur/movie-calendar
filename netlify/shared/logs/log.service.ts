import { BlobStore, Id } from '../store/store.interface.ts'
import { uuid } from '../uuid.ts'
import { Log } from './log.schema.ts'
import { format } from 'date-fns-tz'

export class LogService {
  constructor(
    private logStore: BlobStore<Log & Id>,
    private prefix: string
  ) {}

  public async create(model: Log) {
    const key = `${this.prefix}/${format(model.date, 'yyyy-MM-dd')}`
    await this.logStore.set(key, { id: uuid(), model })
  }
}
