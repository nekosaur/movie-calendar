<script setup lang="ts">
import { Showtime } from '../hooks/useShowtimes'
const { showtime } = defineProps<{ showtime?: Showtime }>()
</script>

<template>
  <v-chip
    density="compact"
    class="text-capitalize"
    :color="showtime?.theater === 'spegeln' ? '#2c412f' : '#cc0028'"
    >{{ showtime?.theater }}</v-chip
  >
  <template v-for="tag in showtime?.tags" :key="tag">
    <v-chip density="compact" class="ml-2">{{ tag }}</v-chip>
  </template>
</template>
