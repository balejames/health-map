<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
const router = useRouter()

const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const currentDate = ref(new Date())
const currentMonth = ref(currentDate.value.getMonth())
const currentYear = ref(currentDate.value.getFullYear())

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const lastDate = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const daysArray = Array(firstDay).fill('')
  for (let i = 1; i <= lastDate; i++) {
    daysArray.push(i)
  }
  return daysArray
})

const nextMonth = () => {
  currentMonth.value++
  if (currentMonth.value > 11) {
    currentMonth.value = 0
    currentYear.value++
  }
}

const prevMonth = () => {
  currentMonth.value--
  if (currentMonth.value < 0) {
    currentMonth.value = 11
    currentYear.value--
  }
}

const eventDialog = ref(false)
const selectedDay = ref(null)
const currentEvents = ref([])
const events = reactive({})

const eventForm = reactive({
  service: '',
  description: '',
  doctor: '',
  barangay: '',
  time: '',
})

// Load events from localStorage when the page loads
const loadEventsFromLocalStorage = () => {
  const storedEvents = localStorage.getItem('events')
  if (storedEvents) {
    Object.assign(events, JSON.parse(storedEvents))
  }
}

const saveEventsToLocalStorage = () => {
  localStorage.setItem('events', JSON.stringify(events))
}

const selectDay = (day) => {
  if (!day) return
  selectedDay.value = day
  const key = `${currentYear.value}-${currentMonth.value}-${day}`
  currentEvents.value = events[key] || []
  Object.assign(eventForm, {
    service: '',
    description: '',
    doctor: '',
    barangay: '',
    time: '',
  })
  eventDialog.value = true
}

const saveEvent = () => {
  const key = `${currentYear.value}-${currentMonth.value}-${selectedDay.value}`
  if (!events[key]) events[key] = []
  if (eventForm.service.trim() !== '') {
    events[key].push({
      service: eventForm.service.trim(),
      description: eventForm.description.trim(),
      doctor: eventForm.doctor.trim(),
      barangay: eventForm.barangay.trim(),
      time: eventForm.time.trim(),
    })
  }
  currentEvents.value = events[key]
  // Save updated events to localStorage
  saveEventsToLocalStorage()
  Object.assign(eventForm, {
    service: '',
    description: '',
    doctor: '',
    barangay: '',
    time: '',
  })
}

// Load events from localStorage when the component is mounted
loadEventsFromLocalStorage()

// Watch for any changes in the events and save them to localStorage
watch(events, saveEventsToLocalStorage, { deep: true })
</script>

<template>
  <v-container fluid class="pa-0 ma-0 d-flex" style="min-height: 100vh">
    <!-- Sidebar -->
    <v-col
      cols="2"
      class="d-flex flex-column justify-space-between align-center py-10"
      style="background-color: #00d1d1"
    >
      <div class="mt-4">
        <v-img src="@/assets/healthmap-logo.png" contain width="80" />
        <h1 class="text-white font-weight-bold text-h6 mt-2">HealthMap</h1>
      </div>
      <div class="mb-4">
        <v-btn icon class="mb-6">
          <v-icon size="36" color="white">mdi-calendar</v-icon>
        </v-btn>
        <v-btn icon>
          <v-icon size="36" color="white">mdi-map-marker</v-icon>
        </v-btn>
      </div>
    </v-col>

    <!-- Calendar -->
    <v-col cols="10" class="pa-10">
      <div class="calendar-wrapper mx-auto">
        <!-- Header -->
        <div
          class="calendar-header d-flex justify-space-between align-center px-6 py-4"
          style="background-color: black; color: white"
        >
          <h2 class="text-h5 font-weight-bold">{{ monthNames[currentMonth] }} {{ currentYear }}</h2>
          <div>
            <v-btn icon @click="prevMonth">
              <v-icon>mdi-chevron-double-left</v-icon>
            </v-btn>
            <v-btn icon @click="nextMonth">
              <v-icon>mdi-chevron-double-right</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Days of Week -->
        <div class="d-flex text-center text-subtitle-2 font-weight-bold">
          <div class="calendar-cell" v-for="day in days" :key="day">
            {{ day }}
          </div>
        </div>

        <!-- Dates -->
        <div class="d-flex flex-wrap text-center">
          <div
            class="calendar-cell"
            v-for="(day, index) in calendarDays"
            :key="index"
            @click="selectDay(day)"
            style="cursor: pointer"
          >
            <span v-if="day" class="font-weight-bold">{{ day }}</span>
            <div
              v-if="events[`${currentYear}-${currentMonth}-${day}`]"
              class="mt-1 text-caption text-left"
              style="color: #333; font-size: 12px"
            >
              <div v-for="(ev, i) in events[`${currentYear}-${currentMonth}-${day}`]" :key="i">
                • {{ ev.service }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-col>

    <!-- Event Details and Add Dialog -->
    <v-dialog v-model="eventDialog" max-width="600">
      <v-card>
        <v-card-title class="font-weight-bold">
          Events for {{ monthNames[currentMonth] }} {{ selectedDay }}
        </v-card-title>
        <v-card-text>
          <div v-if="currentEvents.length" class="mb-4">
            <v-expansion-panels multiple>
              <v-expansion-panel v-for="(ev, index) in currentEvents" :key="index">
                <v-expansion-panel-title>
                  {{ ev.service }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p><strong>Description:</strong> {{ ev.description }}</p>
                  <p><strong>Doctor:</strong> {{ ev.doctor }}</p>
                  <p><strong>Barangay:</strong> {{ ev.barangay }}</p>
                  <p><strong>Time:</strong> {{ ev.time }}</p>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <v-divider class="my-4"></v-divider>

          <p class="text-subtitle-2 font-weight-bold mb-2">Add New Event:</p>
          <v-text-field label="Service" v-model="eventForm.service" clearable></v-text-field>
          <v-text-field
            label="Description"
            v-model="eventForm.description"
            clearable
          ></v-text-field>
          <v-text-field label="Doctor" v-model="eventForm.doctor" clearable></v-text-field>
          <v-text-field label="Barangay" v-model="eventForm.barangay" clearable></v-text-field>
          <v-text-field label="Time" v-model="eventForm.time" clearable></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="eventDialog = false">Close</v-btn>
          <v-btn color="primary" @click="saveEvent">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Counter Example -->
    <v-col cols="12" class="text-center">
      <p>Counter: {{ counter.count }}</p>
      <p>Double Count: {{ counter.doubleCount }}</p>
      <v-btn color="success" @click="counter.increment">Increment</v-btn>
    </v-col>
  </v-container>
</template>

<style scoped>
.calendar-wrapper {
  width: 100%;
  max-width: 900px;
  background-color: #d3d3d3;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.calendar-cell {
  width: calc(100% / 7);
  height: 90px;
  display: flex;
  flex-direction: column;
  align-items: flex-center;
  justify-content: flex-center;
  padding: 8px;
  border: 1px solid #999;
  box-sizing: border-box;
}

.calendar-cell:hover {
  background-color: #e0e0e0;
  transition: 0.2s;
}
</style>
