<script setup>
import { isAuthenticated } from '@/utils/supabase.js'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const drawer = ref(true)
const router = useRouter()
function logout() {
  router.push('/login')
}
const fileInput = ref(null)

function editAccount() {
  fileInput.value.click()
}

const selectedDate = ref('')
const newEvent = ref({
  title: '',
  description: '',
  barangay: '',
  doctor: '',
  startTime: '',
  endTime: '',
})
const events = ref({})
const dailyEvents = ref([])
const dialog = ref(false)

const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const monthYearLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }),
)

const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())

const blankDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  return Array.from({ length: firstDay }, (_, i) => i)
})

const getDate = (day) => {
  const date = new Date(currentYear.value, currentMonth.value, day)
  return date.toISOString().split('T')[0]
}

const isToday = (dateString) => {
  const todayDate = new Date()
  const todayFormatted = todayDate.toISOString().split('T')[0]
  return dateString === todayFormatted
}

const onDateClick = (date) => {
  selectedDate.value = date
  getEventsForDate()
}

const getEventsForDate = () => {
  dailyEvents.value = events.value[selectedDate.value] || []
}

const openEventDialog = () => {
  dialog.value = true
}

const addEvent = () => {
  const { title, description, barangay, doctor, startTime, endTime } = newEvent.value
  if (!title.trim()) return

  if (!events.value[selectedDate.value]) {
    events.value[selectedDate.value] = []
  }

  events.value[selectedDate.value].push({
    title,
    description,
    barangay,
    doctor,
    startTime,
    endTime,
  })
  localStorage.setItem('events', JSON.stringify(events.value))

  newEvent.value = {
    title: '',
    description: '',
    barangay: '',
    doctor: '',
    startTime: '',
    endTime: '',
  }
  dialog.value = false
  getEventsForDate()
}

const hasEvents = (date) => {
  return events.value[date] && events.value[date].length > 0
}

// Profile image logic
const profileImage = ref('https://via.placeholder.com/200')
// Removed unused profileFile declaration
const showChangePicture = ref(false)

const toggleChangePicture = () => {
  showChangePicture.value = !showChangePicture.value
}

const onFileSelected = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      // wala na (e) diri
      profileImage.value = reader.result // reader.result instead of e.target.result
      localStorage.setItem('profileImage', profileImage.value)
    }
    reader.readAsDataURL(file)
  }
}

onMounted(() => {
  const stored = localStorage.getItem('events')
  if (stored) {
    events.value = JSON.parse(stored)
  }

  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) {
    profileImage.value = storedImage
  }
})
const goToPrevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value -= 1
  } else {
    currentMonth.value -= 1
  }
}
const goToNextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value += 1
  } else {
    currentMonth.value += 1
  }
}
</script>
<template>
  <v-app class="dashboard-bg">
    <!-- Sidebar -->
    <v-navigation-drawer app permanent color="#47b8c7" dark>
      <v-container class="text-center py-5">
        <!-- Profile Picture as Clickable Circle -->
        <div style="position: relative; display: inline-block">
          <v-avatar
            size="80"
            class="mx-auto mb-4"
            @click="toggleChangePicture"
            style="cursor: pointer"
          >
            <img
              :src="profileImage"
              alt="Profile"
              width="80"
              height="80"
              style="object-fit: cover"
            />
          </v-avatar>

          <!-- Hidden File Input for Changing Profile Picture -->
          <v-file-input
            v-if="showChangePicture"
            v-model="profileFile"
            accept="image/*"
            label="Change Profile Picture"
            hide-details
            dense
            prepend-icon="mdi-camera"
            @change="onFileSelected"
            style="position: absolute; top: 0; left: 0; width: 80px; height: 80px; opacity: 0"
          />
        </div>

    </v-navigation-drawer>

    <v-app-bar app color="transparent" dark elevation="0">
      <v-app-bar-nav-icon @click="drawer = !drawer">
        <v-icon>{{ drawer ? 'mdi-arrow-left' : 'mdi-menu' }}</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>Dashboard</v-toolbar-title>
    </v-app-bar>
    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <v-row>
          <!-- Event Display -->
          <v-col cols="12" md="6">
            <v-card class="mb-4">
              <v-card-title>
                Service Today
                <v-spacer />
                <v-btn v-if="selectedDate" color="primary" @click="openEventDialog" small>
                  Add Service
                </v-btn>
              </v-card-title>
              <v-card-text>
                <v-list v-if="dailyEvents.length">
                  <v-list-item v-for="(event, index) in dailyEvents" :key="index">
                    <div>
                      <strong>{{ event.title }}</strong
                      ><br />
                      {{ event.description }}<br />
                      <em>Doctor: {{ event.doctor }}</em
                      ><br />
                      <em>Barangay: {{ event.barangay }}</em
                      ><br />
                      Time: {{ event.startTime }} - {{ event.endTime }}
                    </div>
                  </v-list-item>
                </v-list>
                <div v-else>No service for this day.</div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Calendar -->
          <v-col cols="12" md="6">
            <div class="calendar-wrapper">
              <div class="calendar-header">
                <v-btn icon @click="goToPrevMonth"><v-icon>mdi-chevron-left</v-icon></v-btn>
                <span>{{ monthYearLabel }}</span>
                <v-btn icon @click="goToNextMonth"><v-icon>mdi-chevron-right</v-icon></v-btn>
              </div>

              <div class="calendar-weekdays">
                <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
              </div>

              <div class="calendar-days">
                <div
                  v-for="blank in blankDays"
                  :key="'b-' + blank"
                  class="calendar-day empty"
                ></div>

                <div
                  v-for="day in daysInMonth"
                  :key="day"
                  class="calendar-day"
                  @click="onDateClick(getDate(day))"
                  :class="{ selected: selectedDate === getDate(day), today: isToday(getDate(day)) }"
                >
                  <span>{{ day }}</span>
                  <span v-if="hasEvents(getDate(day))" class="event-dot"></span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Add Event Dialog -->
        <v-dialog v-model="dialog" max-width="500">
          <v-card class="pa-4 pa-sm-6">
            <v-card-title>Add Event Today</v-card-title>
            <v-card-text>
              <v-text-field v-model="newEvent.title" label="Event Title" />
              <v-text-field v-model="newEvent.description" label="Description" />
              <v-text-field v-model="newEvent.doctor" label="Doctor's Name" />
              <v-text-field v-model="newEvent.barangay" label="Barangay" />
              <!-- TIME PICKERS -->
              <v-text-field v-model="newEvent.startTime" label="Start Time" type="time" />
              <v-text-field v-model="newEvent.endTime" label="End Time" type="time" />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn text @click="dialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="addEvent">Add</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>
<style scoped>
.dashboard-bg {
  background-image: url('C:\Users\berou\Desktop\team-collab\public\images\Background.png');
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
}
.calendar-wrapper {
  background-color: #e0fff4;
  border-radius: 12px;
  padding: 20px;
}

.calendar-header {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  color: white;
  background-color: #47b8c7;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-weekdays,
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  text-align: center;
}

@media (max-width: 600px) {
  .calendar-day {
    padding: 6px;
    font-size: 12px;
  }

  .calendar-header span {
    font-size: 16px;
  }

  .calendar-weekdays,
  .calendar-days {
    gap: 6px;
  }
}

.calendar-day {
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  position: relative;
}

.calendar-day.selected {
  background-color: #0288d1;
  color: white;
}

.calendar-day.today {
  background-color: #5da8ca;
  color: #0277bd;
  font-weight: bold;
}

.event-dot {
  width: 8px;
  height: 8px;
  background-color: rgb(84, 101, 255);
  border-radius: 50%;
  position: absolute;
  bottom: 4px;
  left: 50%; /* Center horizontally */
  transform: translateX(-50%); /* Adjust for perfect centering */
}


.empty {
  background-color: transparent;
}

.v-btn {
  margin-block: 12px;
}
</style>
