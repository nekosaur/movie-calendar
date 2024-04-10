import { BlobStore } from '../store/store.interface'
import { uuid } from '../uuid'
import { Showtime } from './showtime.schema'

interface Id {
  id: string
}

export class ShowtimeService {
  constructor(private showtimeStore: BlobStore<Showtime & Id>) {}

  public async upsertMany(models: Showtime[], prefix: string) {
    const showtimesList = await this.showtimeStore.list({ prefix })

    const existingShowtimeIds = new Set(showtimesList)

    const promises = models.map<Promise<Showtime & Id>>(async (model) => {
      const key = `${prefix}/${model.movie}/${model.time.getTime()}`

      if (existingShowtimeIds.has(key)) {
        const existingModel = this.showtimeStore.get(key)

        const updatedModel = {
          ...existingModel,
          ...model
        }

        await this.showtimeStore.set(key, updatedModel)

        return updatedModel
      }

      const modelWithId = { id: uuid(), ...model }

      await this.showtimeStore.set(key, modelWithId)

      return modelWithId
    })

    return Promise.all(promises)
  }
}
