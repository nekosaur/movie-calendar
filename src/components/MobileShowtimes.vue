<script setup lang="ts">
import { computed } from 'vue'
import { Showtime } from '../hooks/useShowtimes'
import { useDate } from 'vuetify'
import { format } from 'date-fns-tz'
import ShowtimeTags from './ShowtimeTags.vue'

const { showtimes, date } = defineProps<{
  showtimes: Showtime[]
  date: Date[]
}>()

const emit = defineEmits<{
  (e: 'click', showtime: Showtime): void
}>()

const adapter = useDate()

const currentShowtimesByDate = computed(() => {
  if (!date.length) return []
  return Object.entries(
    showtimes
      .filter((showtime) => {
        console.log({ date: date[0] }, adapter.date(showtime.time))
        return adapter.isSameMonth(adapter.date(showtime.time), date[0])
      })
      .reduce(
        (obj, showtime) => {
          const key = format(showtime.time, 'cccc, MMMM do', {
            timeZone: 'Europe/Stockholm'
          })
          console.log(key)
          if (!obj[key]) {
            obj[key] = []
          }
          obj[key].push(showtime)
          return obj
        },
        {} as Record<string, Showtime[]>
      )
  ).map(([date, showtimes]) => ({
    date,
    showtimes
  }))
})
</script>

<template>
  <div class="pa-4 w-100">
    <div v-for="group in currentShowtimesByDate" :key="group.date" class="mb-4">
      <span class="text-h6 text-grey-darken-1">{{ group.date }}</span>
      <div>
        <div v-for="showtime in group.showtimes" :key="showtime.url">
          <v-card class="my-2 pa-2" @click="emit('click', showtime)">
            <div class="d-flex justify-space-between">
              <span class="text-subtitle-1 font-weight-bold">
                {{ showtime.movie.title }}
              </span>
              <span class="text-subtitle-1">{{
                format(showtime.time, 'HH:mm', {
                  timeZone: 'Europe/Stockholm'
                })
              }}</span>
            </div>
            <div class="pt-2">
              <ShowtimeTags :showtime="showtime" />
            </div>
          </v-card>
        </div>
      </div>
    </div>
  </div>
</template>
