import axios from 'axios'
import { onMounted, ref } from 'vue'

export type Showtime = {
  theater: string;
  url: string;
  movie: {
    title: string;
    url: string;
    genres: string[];
    duration: number;
  }
  time: Date;
  tags: string[];
}

export function useShowtimes() {
  const showtimes = ref([]);

  async function load() {
    const response = await axios.get("/api/showtimes")

    console.log(response.data);
    showtimes.value = response.data.map((showtime: Showtime) => ({
      start: new Date(showtime.time),
      end: new Date(showtime.time),
      ...showtime,
    })).sort((a, b) => a.start - b.start)
  }

  onMounted(() => {
    load();
  })

  return { showtimes }
}
