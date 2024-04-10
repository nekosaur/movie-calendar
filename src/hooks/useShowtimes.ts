import { onMounted, ref } from 'vue'
// import { toZonedTime } from 'date-fns-tz'

export type Showtime = {
  theater: string
  url: string
  movie: {
    title: string
    url: string
    genres: string[]
    duration: number
    synopsis: string
  }
  time: Date
  tags: string[]
}

export type ShowtimeEvent = {
  start: Date
  end: Date
} & Showtime

const waitAndExecute = (cb: () => void, ms: number) =>
  new Promise((resolve) =>
    setTimeout(() => {
      resolve(cb())
    }, ms)
  )

export function useShowtimes() {
  const isLoading = ref(false)
  const showtimes = ref<ShowtimeEvent[]>([])

  let hasFetched = false
  async function load() {
    try {
      hasFetched = false
      waitAndExecute(() => {
        !hasFetched && (isLoading.value = true)
      }, 300)

      const response = await fetch('/api/showtimes')

      hasFetched = true

      const json = (await response.json()) as Showtime[]

      showtimes.value = json
        .map((showtime: Showtime) => ({
          start: new Date(showtime.time),
          end: new Date(showtime.time),
          ...showtime
        }))
        .sort((a, b) => a.start.getTime() - b.start.getTime())
    } catch (e) {
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    load()
  })

  return { showtimes, isLoading }
}
