import type { Context } from '@netlify/edge-functions'
import { NetlifyStore } from '../shared/store/netlify.store'
import type { Showtime } from '../shared/showtimes/showtime.schema'
import type { Movie } from '../shared/movies/movie.schema'

export default async (_req: Request, _context: Context) => {
  const showtimeStore = new NetlifyStore<Showtime>('showtimes')
  const movieStore = new NetlifyStore<Movie>('movies')
  const showtimes = await showtimeStore.list()

  console.log('len', showtimes.length)

  const promises = showtimes.map(async (showtimeKey) => {
    const showtime = await showtimeStore.get(showtimeKey)
    const movie = await movieStore.get(showtime.movie)

    return {
      ...showtime,
      movie
    }
  })

  const result = await Promise.all(promises)

  return new Response(JSON.stringify(result))
}

export const config = { path: '/api/showtimes-edge' }
