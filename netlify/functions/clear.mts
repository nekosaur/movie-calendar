import { NetlifyStore } from '../shared/store/netlify.store.ts'

export default async (_req: Request) => {
  const moviesStore = new NetlifyStore('movies')
  await moviesStore.clear()

  const showtimeStore = new NetlifyStore('showtimes')
  await showtimeStore.clear()

  return new Response('OK!')
}
