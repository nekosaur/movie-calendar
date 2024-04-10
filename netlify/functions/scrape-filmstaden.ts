import type { Config } from '@netlify/functions'
import type { Movie } from '../shared/movies/movie.schema'
import type { Showtime } from '../shared/showtimes/showtime.schema'
import { MovieService } from '../shared/movies/movie.service'
import { NetlifyStore } from '../shared/store/netlify.store'
import { ShowtimeService } from '../shared/showtimes/showtime.service'

type FilmstadenMovieJson = {
  items: {
    ncgId: string
    filmMainId: string
    title: string
    originalTitle: string
    releaseDate: string
    specialMovie: boolean
    length: number
    genres: {
      name: string
    }[]
    slug: string
    longDescription: string
  }[]
}

type FilmstadenShowJson = {
  items: {
    mId: string // movie id
    mvId: string // movie version id
    utc: string // time
    ct: string // biograf
    st: string // salong
  }[]
}

async function scrapeMovies() {
  const movieService = new MovieService(new NetlifyStore('movies'))

  const fetched = await fetch(
    'https://services.cinema-api.com/movie/upcoming/sv/1/1024/false'
  )

  const data = (await fetched.json()) as FilmstadenMovieJson

  const models = data.items
    .filter(
      (item) =>
        item.title.toLowerCase().includes('klassiker') || item.specialMovie
    )
    .map<Movie>((item) => ({
      title: item.title,
      sourceId: item.ncgId,
      sourceName: 'filmstaden',
      duration: item.length,
      genres: item.genres ? item.genres.map((genre) => genre.name) : [],
      url: `https://www.filmstaden.se/film/${item.slug}`,
      synopsis: item.longDescription
    }))

  const movies = await movieService.upsertMany(models, 'filmstaden')

  return movies
}

async function scrapeShowtimes(movies: Movie[]) {
  const showtimeService = new ShowtimeService(new NetlifyStore('showtimes'))

  const moviesBySourceId = new Map(
    movies.map((movie) => [movie.sourceId, movie])
  )

  const fetched = await fetch(
    'https://services.cinema-api.com/show/stripped/sv/1/1024/?CountryAlias=se&CityAlias=MA&Channel=Web'
  )

  const data = (await fetched.json()) as FilmstadenShowJson

  const models = data.items
    .filter((showtime) => moviesBySourceId.has(showtime.mId))
    .map<Showtime>((showtime) => ({
      time: new Date(showtime.utc),
      theater: 'filmstaden',
      movie: `filmstaden/${moviesBySourceId.get(showtime.mId)!.sourceId}`,
      soldOut: false,
      tags: [],
      url: moviesBySourceId.get(showtime.mId)!.url
    }))

  const result = showtimeService.upsertMany(models, 'filmstaden')

  return result
}

export default async (_req: Request) => {
  const movies = await scrapeMovies()

  await scrapeShowtimes(movies)

  console.log('OK!')

  return new Response('OK!')
}

// export const config: Config = {
//   schedule: '@hourly'
// }
