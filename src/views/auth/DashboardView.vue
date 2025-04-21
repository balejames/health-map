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
        <v-btn block class="mb-3" color="white" variant="text" @click="$router.push('/map')">
          <v-icon left>mdi-map</v-icon> Map View
        </v-btn>
        <v-btn block class="mb-3" color="white" variant="text" @click="$router.push('/inquiry')">
          <v-icon left>mdi-comment-question</v-icon> Inquiry
        </v-btn>
        <v-btn block class="mt-9" color="white" variant="text" @click="$router.push('/login')">
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
                      <div>
                        <em>Barangay: {{ event.barangay }}</em>
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
              <v-text-field v-model="newEvent.barangay" label="Barangay" />
              <!-- Added Barangay field -->
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

const addEvent = async () => {
  const { title, description, barangay, doctor, startTime, endTime } = newEvent.value
  if (!title.trim()) return

  // Update the local events object
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

  // Send the event to the backend via a POST request (JSON)
  try {
    const response = await fetch('http://localhost/save_event.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        barangay,
        doctor,
        startTime,
        endTime,
        date: selectedDate.value,
      }),
    })

    const result = await response.json()
    if (result.success) {
      alert('Event saved successfully!')
    } else {
      alert('Failed to save event.')
    }
  } catch (error) {
    console.error('Error saving event:', error)
    alert('Something went wrong.')
  }

  // Reset the form and close the dialog
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

const profileImage = ref('https://via.placeholder.com/150')
const profileFile = ref(null)
const showChangePicture = ref(false)

const toggleChangePicture = () => {
  showChangePicture.value = !showChangePicture.value
}

const onFileSelected = (file) => {
  const reader = new FileReader()
  reader.onload = () => {
    profileImage.value = reader.result
    localStorage.setItem('profileImage', reader.result)
  }
  reader.readAsDataURL(file)
}
</script>

<style scoped>
/* Calendar Styles */
.calendar-wrapper {
  margin-top: 20px;
  font-family: 'Roboto', sans-serif;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  margin-top: 10px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  text-align: center;
  padding: 10px;
  cursor: pointer;
}

.calendar-day.selected {
  background-color: #0288d1;
  color: white;
}

.calendar-day.today {
  background-color: #f1c40f;
  color: white;
}

.event-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  background-color: red;
  border-radius: 50%;
  position: absolute;
  top: 5px;
  right: 5px;
}
</style>
