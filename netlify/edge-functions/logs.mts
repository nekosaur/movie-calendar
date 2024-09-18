import type { Config, Context } from '@netlify/edge-functions'
import { NetlifyStore } from '../shared/store/netlify.store.ts'
import type { Log } from '../shared/logs/log.schema.ts'

export default async (_req: Request, _context: Context) => {
  const logStore = new NetlifyStore<Log>('logs')
  const logs = await logStore.list()

  return new Response(JSON.stringify(logs), {
    headers: {
      'Netlify-CDN-Cache-Control':
        'public, max-age=0, stale-while-revalidate=86400'
    }
  })
}

export const config: Config = { cache: 'manual', path: '/api/logs' }
