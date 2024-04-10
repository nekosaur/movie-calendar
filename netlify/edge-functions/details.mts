import { Context } from '@netlify/edge-functions'

type SearchResponse = {
  page: number
  results: {
    id: number
    title: string
  }[]
  total_pages: number
  total_results: number
}

type ExternalIdsResponse = {
  id: number
  imdb_id: string
}

export default async (req: Request, _context: Context) => {
  const headers = {
    Authorization: `Bearer ${Netlify.env.get('TMDB_API_TOKEN')}`,
    Accept: 'application/json'
  }

  const url = new URL(req.url)
  const searchParams = new URLSearchParams(url.search)
  const title = String(searchParams.get('title'))
    .replace(/^Cine:|-\sKlassiker$/, '')
    .trim()

  const searchResponse = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${title}&include_adult=false&language=sv-SE&page=1`,
    {
      method: 'GET',
      headers
    }
  )

  const searchJson = (await searchResponse.json()) as SearchResponse

  // TODO: some validation that first result is the correct one?
  if (searchJson.results.length) {
    const externals = await fetch(
      `https://api.themoviedb.org/3/movie/${searchJson.results[0].id}/external_ids`,
      { method: 'GET', headers }
    )

    const externalsJson = (await externals.json()) as ExternalIdsResponse

    return new Response(
      JSON.stringify({
        tmdb_url: `https://www.themoviedb.org/movie/${externalsJson.id}`,
        imdb_url: externalsJson.imdb_id
          ? `https://www.imdb.com/title/${externalsJson.imdb_id}`
          : null
      }),
      {
        headers: {
          'Netlify-CDN-Cache-Control':
            'public, max-age=0, stale-while-revalidate=86400'
        }
      }
    )
  }

  return new Response(
    JSON.stringify({
      tmdb_url: null,
      imdb_url: null
    }),
    {
      headers: {
        'Netlify-CDN-Cache-Control':
          'public, max-age=0, stale-while-revalidate=86400'
      }
    }
  )
}

export const config = { path: '/api/details' }
