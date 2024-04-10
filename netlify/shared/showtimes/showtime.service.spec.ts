import { beforeEach, describe, expect, test } from 'vitest'
import { ShowtimeService } from './showtime.service'
import { MemoryStore } from '../store/memory.store'
import { BlobStore, Id } from '../store/store.interface'
import { Showtime } from './showtime.schema'

describe('upsertMany', () => {
  let store: BlobStore<Showtime & Id>
  let showtimeService: ShowtimeService

  beforeEach(() => {
    store = new MemoryStore()
    showtimeService = new ShowtimeService(store)
  })

  test('should add new showtimes', async () => {
    const date = new Date(2024, 0, 1, 12, 0, 0)
    await showtimeService.upsertMany(
      [
        {
          time: date,
          movie: 'movie-id',
          soldOut: false,
          tags: ['tag'],
          theater: 'spegeln',
          url: 'http://www.google.com'
        }
      ],
      'spegeln'
    )

    const keys = await store.list()

    expect(keys).toStrictEqual([`spegeln/movie-id/${date.getTime()}`])
  })

  test('it should update existing showtime', async () => {
    const date = new Date(2024, 0, 1, 12, 0, 0)

    await showtimeService.upsertMany(
      [
        {
          time: date,
          movie: 'movie-id',
          soldOut: false,
          tags: ['tag'],
          theater: 'spegeln',
          url: 'http://www.google.com'
        }
      ],
      'spegeln'
    )

    await showtimeService.upsertMany(
      [
        {
          time: date,
          movie: 'movie-id',
          soldOut: false,
          tags: ['tag', 'new-tag'],
          theater: 'spegeln',
          url: 'http://www.sydsvenskan.se'
        }
      ],
      'spegeln'
    )

    const keys = await store.list()

    const showtime = await store.get(keys[0])

    expect(keys).toStrictEqual([`spegeln/movie-id/${date.getTime()}`])
    expect(showtime.url).toBe('http://www.sydsvenskan.se')
    expect(showtime.tags).toStrictEqual(['tag', 'new-tag'])
  })
})
