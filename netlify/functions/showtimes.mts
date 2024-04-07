import type { Context } from '@netlify/functions'
import { ShowtimeModel } from '../shared/showtimes/showtime.schema'
import '../shared/movies/movie.schema'
import { withDatabase } from '../shared/db'

export default async (_req: Request, _context: Context) => {
  return withDatabase(async () => {
    const showtimes = await ShowtimeModel.find().populate('movie').exec()

    return new Response(JSON.stringify(showtimes))
  })
}
