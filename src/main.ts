import { createApp } from 'vue'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VCalendar } from 'vuetify/labs/VCalendar'
import { sv } from 'vuetify/locale'

const vuetify = createVuetify({
  components: {
    ...components,
    VCalendar
  },
  directives,
  locale: {
    locale: 'sv',
    messages: {
      sv
    }
  }
})

createApp(App).use(vuetify).mount('#app')
