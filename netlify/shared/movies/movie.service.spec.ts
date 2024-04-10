import { beforeEach, describe, expect, test } from 'vitest'
import { MovieService } from './movie.service'
import { MemoryStore } from '../store/memory.store'
import { BlobStore, Id } from '../store/store.interface'
import { Movie } from './movie.schema'

describe('upsertMany', () => {
  let store: BlobStore<Movie & Id>
  let movieService: MovieService

  beforeEach(() => {
    store = new MemoryStore()
    movieService = new MovieService(store)
  })

  test('should add new movies', async () => {
    await movieService.upsertMany(
      [
        {
          title: 'Movie title',
          duration: 200,
          genres: ['Action'],
          sourceId: 'movie-id',
          sourceName: 'spegeln',
          synopsis: 'this is a synopsis',
          url: 'http://www.google.com'
        }
      ],
      'spegeln'
    )

    const keys = await store.list()

    expect(keys).toStrictEqual(['spegeln/movie-id'])
  })

  test('it should update existing movie', async () => {
    await movieService.upsertMany(
      [
        {
          title: 'Movie title',
          duration: 200,
          genres: ['Action'],
          sourceId: 'movie-id',
          sourceName: 'spegeln',
          synopsis: 'this is a synopsis',
          url: 'http://www.google.com'
        }
      ],
      'spegeln'
    )

    await movieService.upsertMany(
      [
        {
          title: 'Movie title',
          duration: 200,
          genres: ['Action', 'Comedy'],
          sourceId: 'movie-id',
          sourceName: 'spegeln',
          synopsis: 'this is a synopsis that has been updated',
          url: 'http://www.google.com'
        }
      ],
      'spegeln'
    )

    const keys = await store.list()

    const movie = await store.get(keys[0])

    expect(keys).toStrictEqual(['spegeln/movie-id'])
    expect(movie.synopsis).toBe('this is a synopsis that has been updated')
    expect(movie.genres).toStrictEqual(['Action', 'Comedy'])
  })
})
