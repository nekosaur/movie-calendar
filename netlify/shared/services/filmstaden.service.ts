import { LogService } from '../logs/log.service'
import { Movie } from '../movies/movie.schema'
import { MovieService } from '../movies/movie.service'
import { Showtime } from '../showtimes/showtime.schema'
import { ShowtimeService } from '../showtimes/showtime.service'

export type FilmstadenMovieJson = {
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

export type FilmstadenShowtimesJson = {
  items: {
    mId: string // movie id
    mvId: string // movie version id
    utc: string // time
    ct: string // biograf
    st: string // salong
  }[]
}

export class FilmstadenService {
  constructor(
    private movieService: MovieService,
    private showtimeService: ShowtimeService,
    private logService: LogService
  ) {}

  public async process(
    movieJson: FilmstadenMovieJson,
    showtimesJson: FilmstadenShowtimesJson
  ) {
    const movieModels = movieJson.items
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

    const movies = await this.movieService.upsertMany(movieModels, 'filmstaden')

    const moviesBySourceId = new Map(
      movies.map((movie) => [movie.sourceId, movie])
    )

    const showtimeModels = showtimesJson.items
      .filter((showtime) => moviesBySourceId.has(showtime.mId))
      .map<Showtime>((showtime) => ({
        time: new Date(showtime.utc),
        theater: 'filmstaden',
        movie: `filmstaden/${moviesBySourceId.get(showtime.mId)!.sourceId}`,
        soldOut: false,
        tags: [],
        url: moviesBySourceId.get(showtime.mId)!.url
      }))

    await this.showtimeService.upsertMany(showtimeModels, 'filmstaden')

    return true
  }
}
