import type { LogService } from './logs/log.service'

export async function parseJSON<T>(
  response: Response,
  logService: LogService
): Promise<T> {
  let text: string | null = null
  try {
    text = await response.text()
    const json = JSON.parse(text)

    return json as unknown as T
  } catch (e) {
    await logService.create({
      message: text ?? e?.message ?? 'Unknown error',
      level: 'ERROR',
      date: new Date()
    })
    throw e
  }
}
