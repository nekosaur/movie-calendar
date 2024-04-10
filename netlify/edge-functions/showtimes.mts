import type { Context } from '@netlify/edge-functions'
import { NetlifyStore } from '../shared/store/netlify.store.ts'
import type { Showtime } from '../shared/showtimes/showtime.schema.ts'
import type { Movie } from '../shared/movies/movie.schema.ts'

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

  return new Response(JSON.stringify(result), {
    headers: {
      'Netlify-CDN-Cache-Control':
        'public, max-age=0, stale-while-revalidate=86400'
    }
  })
}

export const config = { path: '/api/showtimes' }
