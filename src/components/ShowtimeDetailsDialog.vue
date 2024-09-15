<script setup lang="ts">
import { defineModel, toRef, PropType } from 'vue'
import { useTmdb } from '../hooks/useTmdb'
import { ShowtimeEvent } from '../hooks/useShowtimes'
import { useDisplay } from 'vuetify'
import ShowtimeTags from './ShowtimeTags.vue'

const show = defineModel<boolean>({ default: false })

const props = defineProps({
  showtime: {
    type: Object as PropType<ShowtimeEvent>,
    default: () => null
  }
})

const { tmdbDetails, isLoading } = useTmdb(
  toRef(() => props.showtime?.movie.title)
)

const { mobile } = useDisplay()
</script>

<template>
  <v-dialog v-model="show" max-width="800" :fullscreen="mobile">
    <v-card>
      <v-card-item>
        <v-card-title
          class="d-flex justify-space-between align-start"
          :style="{ 'white-space': 'initial' }"
        >
          {{ props.showtime?.movie.title }}

          <div v-if="!mobile">
            <ShowtimeTags :showtime="showtime" />
          </div>
          <div v-if="mobile">
            <v-btn
              size="small"
              variant="flat"
              icon="mdi-close"
              @click="show = false"
            />
          </div>
        </v-card-title>
      </v-card-item>

      <v-card-item class="pt-0">
        <ShowtimeTags :showtime="showtime" />
      </v-card-item>

      <v-card-text>
        <div v-html="props.showtime?.movie.synopsis" />
      </v-card-text>

      <v-card-actions>
        <v-progress-circular v-if="isLoading" indeterminate />

        <div v-if="!isLoading && tmdbDetails" class="d-flex align-center">
          <a
            v-if="tmdbDetails.imdb_url"
            :href="tmdbDetails.imdb_url"
            class="mr-4 d-flex"
            target="_blank"
          >
            <img src="/imdb-logo.png" height="36px" />
          </a>
          <a
            v-if="tmdbDetails.tmdb_url"
            :href="tmdbDetails.tmdb_url"
            class="d-flex"
            target="_blank"
          >
            <img src="/tmdb-logo.svg" height="36px" />
          </a>
        </div>

        <v-spacer></v-spacer>

        <v-btn
          variant="outlined"
          text="Boka biljett"
          target="_blank"
          :href="props.showtime?.url"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
