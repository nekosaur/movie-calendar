import type { Config } from '@netlify/functions'
import { withDatabase } from '../shared/db'
import { MovieModel } from '../shared/movies/movie.schema'
import type { Movie } from '../shared/movies/movie.schema'
import axios from 'axios'
import { ShowtimeModel } from '../shared/showtimes/showtime.schema'
import type { Showtime } from '../shared/showtimes/showtime.schema'

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
  const response = await axios.get(
    'https://services.cinema-api.com/movie/upcoming/sv/1/1024/false'
  )

  const data = response.data as FilmstadenMovieJson

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

  // @ts-expect-error foo
  await MovieModel.upsertMany(models, {
    matchFields: ['sourceId']
  })

  const movies = await MovieModel.find({
    sourceId: models.map((model) => model.sourceId),
    sourceName: 'filmstaden'
  })

  return movies
}

async function scrapeShowtimes(movies: Movie[]) {
  const moviesBySourceId = new Map(
    movies.map((movie) => [movie.sourceId, movie])
  )

  const response = await axios.get(
    'https://services.cinema-api.com/show/stripped/sv/1/1024/?CountryAlias=se&CityAlias=MA&Channel=Web'
  )

  const data = response.data as FilmstadenShowJson

  const models = data.items
    .filter((showtime) => moviesBySourceId.has(showtime.mId))
    .map<Showtime>((showtime) => ({
      time: new Date(showtime.utc),
      theater: 'filmstaden',
      movie: moviesBySourceId.get(showtime.mId),
      soldOut: false,
      tags: [],
      url: moviesBySourceId.get(showtime.mId)?.url
    }))

  // @ts-expect-error foo
  const result = ShowtimeModel.upsertMany(models, {
    matchFields: ['movie', 'time']
  })

  return result
}

export default async (_req: Request) => {
  return withDatabase(async () => {
    const movies = await scrapeMovies()

    await scrapeShowtimes(movies)

    return new Response('OK!')
  })
}

export const config: Config = {
  schedule: '@hourly'
}
