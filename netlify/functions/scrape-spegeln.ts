import type { Config } from '@netlify/functions'
import { parse } from 'node-html-parser'

import { MovieService } from '../shared/movies/movie.service'
import { NetlifyStore } from '../shared/store/netlify.store'
import { ShowtimeService } from '../shared/showtimes/showtime.service'

import { LogService } from '../shared/logs/log.service'
import {
  SpegelnNextData,
  SpegelnService
} from '../shared/services/spegeln.service'

export default async (_req: Request) => {
  const logService = new LogService(new NetlifyStore('logs'), 'scrape-spegeln')
  const movieService = new MovieService(new NetlifyStore('movies'))
  const showtimeService = new ShowtimeService(new NetlifyStore('showtimes'))
  const spegelnService = new SpegelnService(
    movieService,
    showtimeService,
    logService
  )

  const fetched = await fetch('https://biografspegeln.se/program')

  const text = await fetched.text()

  const html = parse(text)

  const script = html.querySelector('script#__NEXT_DATA__')

  if (!script) {
    return new Response('FAIL')
  }

  const json = JSON.parse(script?.rawText) as SpegelnNextData

  await spegelnService.process(json)

  console.log('OK!')

  return new Response('OK!')
}

export const config: Config = {
  schedule: '@daily'
}
