<script setup lang="ts">
import { ref } from 'vue'
import { useShowtimes, ShowtimeEvent } from './hooks/useShowtimes'
import { useDate } from 'vuetify'
import { format } from 'date-fns'

const date = ref([new Date()])
const { showtimes } = useShowtimes()

// function format(date: Date) {
//   return `${date.getHours()}:${String(date.getUTCMinutes()).padStart(2, '0')}`
// }

// function formatMonth(date: Date) {
//   return `${date.getUTCMonth()}`
// }

const showShowtimeDetails = ref(false)
const showtimeDetails = ref<ShowtimeEvent | null>(null)

function handleShowtimeClick(showtime: ShowtimeEvent) {
  showShowtimeDetails.value = true
  showtimeDetails.value = showtime
}

const adapter = useDate()

function handleClickNext() {
  date.value = [adapter.addMonths(date.value[0], 1) as Date]
}

function handleClickPrevious() {
  date.value = [adapter.addMonths(date.value[0], -1) as Date]
}
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <div class="d-flex justify-space-between align-end mb-6">
          <h1 class="text-h1">Filmkalender</h1>
          <div class="d-flex align-items">
            <v-btn variant="outlined" class="mr-4" @click="handleClickPrevious"
              >Förra månaden</v-btn
            >
            <span class="text-h4 mr-4">{{ format(date[0], 'MMMM yyyy') }}</span>
            <v-btn variant="outlined" @click="handleClickNext"
              >Nästa månad</v-btn
            >
          </div>
        </div>
        <v-calendar
          v-model="date"
          view-mode="month"
          :events="showtimes"
          hide-week-number
          hide-header
        >
          <template #event="{ event }">
            <v-chip
              :class="['mb-2', event.soldOut && 'text-decoration-line-through']"
              tag="div"
              :color="event.theater === 'spegeln' ? '#2c412f' : '#cc0028'"
              density="compact"
              @click="() => handleShowtimeClick(event as any as ShowtimeEvent)"
            >
              {{ format((event as any as ShowtimeEvent).start, 'HH:mm') }}
              {{ (event as any as ShowtimeEvent).movie.title }}
            </v-chip>
          </template>
        </v-calendar>
      </v-container>
    </v-main>

    <v-dialog v-model="showShowtimeDetails" max-width="800">
      <v-card>
        <v-card-item>
          <v-card-title class="d-flex justify-space-between align-center">
            {{ showtimeDetails?.movie.title }}

            <div>
              <v-chip
                density="compact"
                class="text-capitalize"
                :color="
                  showtimeDetails?.theater === 'spegeln' ? '#2c412f' : '#cc0028'
                "
                >{{ showtimeDetails?.theater }}</v-chip
              >
              <template v-for="tag in showtimeDetails?.tags" :key="tag">
                <v-chip density="compact" class="ml-2">{{ tag }}</v-chip>
              </template>
            </div>
          </v-card-title>
        </v-card-item>

        <v-card-text>
          <div v-html="showtimeDetails?.movie.synopsis" />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            variant="outlined"
            text="Boka biljett"
            target="_blank"
            :href="showtimeDetails?.url"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style>
.v-chip__content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  display: block !important;
}

.v-calendar-weekly__head-weekday {
  font-weight: bold;
  background-color: #eee;
  padding-bottom: 8px !important;
}

.v-calendar-weekly__day-label {
  padding-top: 8px;
}

.v-calendar-weekly__day-content {
  padding: 8px;
}

.v-calendar-weekly__day-events-container {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
