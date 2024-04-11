<script setup lang="ts">
import { ref } from 'vue'
import { useShowtimes, ShowtimeEvent } from './hooks/useShowtimes'
import { useDate } from 'vuetify'
import { format } from 'date-fns-tz'
import ShowtimeDetailsDialog from './components/ShowtimeDetailsDialog.vue'

const { showtimes, isLoading } = useShowtimes()
const date = ref([new Date()])

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
    <v-main class="d-flex flex-column">
      <div class="d-flex justify-space-between align-end mb-6">
        <h1 class="text-h1">Filmkalender</h1>
        <div class="d-flex align-items">
          <v-btn variant="outlined" class="mr-4" @click="handleClickPrevious"
            >Förra månaden</v-btn
          >
          <span class="text-h4 mr-4">{{ format(date[0], 'MMMM yyyy') }}</span>
          <v-btn variant="outlined" @click="handleClickNext">Nästa månad</v-btn>
        </div>
      </div>

      <div :style="{ position: 'relative', display: 'flex', flexGrow: 1 }">
        <v-calendar
          v-model="date"
          view-mode="month"
          :events="showtimes"
          hide-week-number
          hide-header
        >
          <template #event="{ event, day }">
            <!-- @vue-ignore day is only typed to object -->
            <v-chip
              v-if="!day?.isHidden"
              :class="['mb-2', event.soldOut && 'text-decoration-line-through']"
              tag="div"
              :color="event.theater === 'spegeln' ? '#2c412f' : '#cc0028'"
              density="compact"
              @click="() => handleShowtimeClick(event as any as ShowtimeEvent)"
            >
              {{
                format((event as any as ShowtimeEvent).start, 'HH:mm', {
                  timeZone: 'Europe/Stockholm'
                })
              }}
              {{ (event as any as ShowtimeEvent).movie.title }}
            </v-chip>
          </template>
        </v-calendar>

        <v-fade-transition>
          <div
            v-if="isLoading"
            class="d-flex align-center justify-center flex-grow-1 w-100 h-100"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              background: 'rgba(0, 0, 0, 0.05)'
            }"
          >
            <v-progress-circular indeterminate />
          </div>
        </v-fade-transition>
      </div>
    </v-main>

    <!-- @vue-ignore TODO: why is showtime complaining? it's the same type on both sides -->
    <ShowtimeDetailsDialog
      v-model="showShowtimeDetails"
      :showtime="showtimeDetails"
    ></ShowtimeDetailsDialog>
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

.v-calendar {
  flex-grow: 1;
  display: flex;
}

.v-calendar__container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.v-calendar-month__days {
  flex-grow: 1;
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
