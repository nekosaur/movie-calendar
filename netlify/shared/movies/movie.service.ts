import { BlobStore, Id } from '../store/store.interface'
import { uuid } from '../uuid'
import { Movie } from './movie.schema'

export class MovieService {
  constructor(private movieStore: BlobStore<Movie & Id>) {}

  public async upsertMany(models: Movie[], prefix: string) {
    const moviesList = await this.movieStore.list({ prefix })

    const existingMovieIds = new Set(moviesList)

    const promises = models.map<Promise<Movie & Id>>(async (model) => {
      const key = `${prefix}/${model.sourceId}`

      if (existingMovieIds.has(key)) {
        const existingModel = this.movieStore.get(key)

        const updatedModel = {
          ...existingModel,
          ...model
        }

        await this.movieStore.set(key, updatedModel)

        return updatedModel
      }

      const modelWithId = { id: uuid(), ...model }

      await this.movieStore.set(key, modelWithId)

      return modelWithId
    })

    return Promise.all(promises)
  }
}
