import type { LogService } from './logs/log.service'

export async function parseJSON<T>(
  response: Response,
  logService: LogService
): Promise<T> {
  try {
    const json = (await response.json()) as unknown as T

    return json
  } catch (e) {
    const text = await response.text()
    await logService.create({ message: text, level: 'ERROR', date: new Date() })
    throw e
  }
}
