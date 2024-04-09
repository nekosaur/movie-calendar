import { Ref, ref, watch } from 'vue'

export function useTmdb(title: Ref<string>) {
  const isLoading = ref(false)
  const tmdbDetails = ref<{ tmdb_url: string; imdb_url: string } | null>(null)

  watch(title, async () => {
    isLoading.value = true

    try {
      const fetched = await fetch(
        `/api/details?title=${encodeURIComponent(title.value)}`
      )

      const json = await fetched.json()

      tmdbDetails.value = json
    } catch (e) {
      // TODO: error handling
      console.error(e)
    } finally {
      isLoading.value = false
    }
  })

  return { isLoading, tmdbDetails }
}
