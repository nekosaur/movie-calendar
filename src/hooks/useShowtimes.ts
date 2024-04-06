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

type ShowtimeEvent = {
  start: Date;
  end: Date;
} & Showtime;

export function useShowtimes() {
  const showtimes = ref<ShowtimeEvent[]>([]);

  async function load() {
    const response = await axios.get<Showtime[]>("/api/showtimes")

    console.log(response.data);
    showtimes.value = response.data.map((showtime: Showtime) => ({
      start: new Date(showtime.time),
      end: new Date(showtime.time),
      ...showtime,
    })).sort((a, b) => a.start.getTime() - b.start.getTime())
  }

  onMounted(() => {
    load();
  })

  return { showtimes }
}
