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
        <p class="text-white font-weight-bold text-h6 mt-2">HealthMap</p>
      </div>
      <div class="mb-4">
        <v-btn icon class="mb-6">
          <v-icon size="36" color="white">mdi-calendar</v-icon>
        </v-btn>
        <v-btn icon>
          <v-icon size="36" color="white">mdi-map-marker</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>
    <!--Calendar-->
    <
  </v-app>
</template>

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

<style scoped>
.calendar-wrapper {
  width: 100%;
  max-width: 900px;
  background-color: #d3d3d3;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.calendar-cell {
  width: calc(100% / 7);
  height: 110px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 8px;
  border: 1px solid #999;
  box-sizing: border-box;
}

.calendar-cell:hover {
  background-color: #e0e0e0;
  transition: 0.2s;
}
</style>
