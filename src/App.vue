<script setup lang="ts">
import { ref } from 'vue';
import { useShowtimes, Showtime } from "./hooks/useShowtimes"
import { useDate } from 'vuetify';

const date = ref([new Date()]);
const { showtimes } = useShowtimes();

function format(date: Date) {
  return `${date.getHours()}:${String(date.getUTCMinutes()).padStart(2, "0")}`
}

const showShowtimeDetails = ref(false)
const showtimeDetails = ref<Showtime | null>(null)

function handleShowtimeClick (showtime: Showtime) {
  showShowtimeDetails.value = true
  showtimeDetails.value = showtime
}

const adapter = useDate()

function handleClickNext () {
  date.value = [adapter.addMonths(date.value[0], 1) as Date]
}

function handleClickPrevious () {
  date.value = [adapter.addMonths(date.value[0], -1) as Date]
}

</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <div class="d-flex justify-space-between align-end mb-6">
          <h1 class="text-h1">Filmkalender</h1>
          <div>
            <v-btn variant="outlined" @click="handleClickPrevious" class="mr-4">Förra månaden</v-btn>
            <v-btn variant="outlined" @click="handleClickNext">Nästa månad</v-btn>
          </div>
        </div>
        <v-calendar view-mode="month" v-model="date" :events="showtimes" hide-week-number hide-header>
          <!-- <template #event="{ event }"  >
            <v-chip
              :class="[
                'mb-2',
                event.soldOut && 'text-decoration-line-through',
              ]"
              tag="div"
              :color="event.theater === 'spegeln' ? '#2c412f' : '#cc0028'"
              density="compact"
              @click="() => handleShowtimeClick(event)"
            >
              {{format(event.start)}} {{event.movie.title}}
            </v-chip>
          </template> -->
        </v-calendar>
      </v-container>
    </v-main>

    <v-dialog v-model="showShowtimeDetails" max-width="500">
      <v-card>
        <v-card-item>
          <v-card-title class="d-flex justify-space-between align-center">
            {{showtimeDetails?.movie.title}}

            <template v-for="tag in showtimeDetails?.tags">
              <v-chip density="compact">{{ tag }}</v-chip>
            </template>
          </v-card-title>
        </v-card-item>
        <!-- <v-card-text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </v-card-text> -->

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
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
    display: block;
  }

  .v-calendar-weekly__head-weekday {
    font-weight: bold;
    background-color: #eee;
    padding-bottom: 8px;
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
