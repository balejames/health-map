<template>
  <v-app>
    <!-- Sidebar -->
    <v-navigation-drawer app permanent color="#03a9f4" dark>
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

        <!-- Navigation Buttons -->
        <v-btn block class="mt-9 mb-3" style="background-color: #0288d1" variant="elevated">
          <v-icon left>mdi-view-dashboard</v-icon> Dashboard
        </v-btn>
        <v-btn block class="mb-3" color="white" variant="text">
          <v-icon left>mdi-map</v-icon> Map View
        </v-btn>
        <v-btn block class="mb-3" color="white" variant="text">
          <v-icon left>mdi-comment-question</v-icon> Inquiry
        </v-btn>
        <v-btn block class="mt-9" color="white" variant="text">
          <v-icon left>mdi-logout</v-icon> Log out
        </v-btn>
      </v-container>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12" md="8" offset-md="2">
            <!-- Event Display -->
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
                    <v-list-item-content>
                      <div>
                        <strong>{{ event.title }}</strong>
                      </div>
                      <div>{{ event.description }}</div>
                      <div>
                        <em>Doctor: {{ event.doctor }}</em>
                      </div>
                      <div>Time: {{ event.startTime }} - {{ event.endTime }}</div>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
                <div v-else>No service for this day.</div>
              </v-card-text>
            </v-card>

            <!-- Calendar -->
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
                  :class="{
                    selected: selectedDate === getDate(day),
                    today: getDate(day) === getDate(today.getDate()), // Check if it's today's date
                  }"
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
          <v-card>
            <v-card-title>Add Event Today</v-card-title>
            <v-card-text>
              <v-text-field v-model="newEvent.title" label="Event Title" />
              <v-text-field v-model="newEvent.description" label="Description" />
              <v-text-field v-model="newEvent.doctor" label="Doctor's Name" />
              <v-text-field v-model="newEvent.startTime" label="Start Time (e.g. 9:00 AM)" />
              <v-text-field v-model="newEvent.endTime" label="End Time (e.g. 11:00 AM)" />
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

<script setup>
import { ref, onMounted, computed } from 'vue'

const selectedDate = ref('')
const newEvent = ref({
  title: '',
  description: '',
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

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const blankDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  return Array.from({ length: firstDay }, (_, i) => i)
})

const getDate = (day) => {
  const date = new Date(currentYear.value, currentMonth.value, day)
  return date.toISOString().split('T')[0]
}

const goToNextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const goToPrevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const hasEvents = (date) => {
  return events.value[date] && events.value[date].length > 0
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

const onDateClick = (date) => {
  selectedDate.value = date
  getEventsForDate()
}

const openEventDialog = () => {
  dialog.value = true
}

const getEventsForDate = () => {
  dailyEvents.value = events.value[selectedDate.value] || []
}

const addEvent = () => {
  const { title, description, doctor, startTime, endTime } = newEvent.value
  if (!title.trim()) return

  if (!events.value[selectedDate.value]) {
    events.value[selectedDate.value] = []
  }

  events.value[selectedDate.value].push({ title, description, doctor, startTime, endTime })
  localStorage.setItem('events', JSON.stringify(events.value))

  newEvent.value = { title: '', description: '', doctor: '', startTime: '', endTime: '' }
  dialog.value = false
  getEventsForDate()
}

const profileImage = ref('https://via.placeholder.com/200')
const profileFile = ref(null)
const showChangePicture = ref(false)

const toggleChangePicture = () => {
  showChangePicture.value = !showChangePicture.value
}

const onFileSelected = () => {
  if (profileFile.value) {
    const reader = new FileReader()
    reader.onload = (e) => {
      profileImage.value = e.target.result
      localStorage.setItem('profileImage', profileImage.value)
    }
    reader.readAsDataURL(profileFile.value)
  }
}
</script>

<style scoped>
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
  background-color: #00bcd4;
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

.weekday {
  font-weight: bold;
  color: #333;
}

.calendar-day {
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.calendar-day.selected {
  background-color: #0288d1;
  color: white;
}

.calendar-day.today {
  background-color: #b3e5fc; /* Light blue color */
  color: #0277bd; /* Dark blue for text */
  font-weight: bold;
}

.event-dot {
  width: 8px;
  height: 8px;
  background-color: red;
  border-radius: 50%;
  position: absolute;
  bottom: 4px;
  right: 4px;
}

.empty {
  background-color: transparent;
}

.v-btn {
  margin-top: 12px;
}
</style>
