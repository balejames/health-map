<script setup>
import { isAuthenticated } from '@/utils/supabase.js'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const drawer = ref(true) // control sidebar visibility
const router = useRouter()

function logout() {
  router.push('/login')
}

const fileInput = ref(null)
function editAccount() {
  fileInput.value.click()
}
const selectedDate = ref('')
const newService = ref({
  title: '',
  description: '',
  barangay: '',
  doctor: '',
  startTime: '',
  endTime: '',
})
const services = ref({})
const dailyServices = ref([])
const dialog = ref(false)

const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const monthYearLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
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
  getServicesForDate()
}

const getServicesForDate = () => {
  dailyServices.value = services.value[selectedDate.value] || []
}

const openServiceDialog = () => {
  dialog.value = true
}

const addService = () => {
  const { title, description, barangay, doctor, startTime, endTime } = newService.value
  if (!title.trim()) return

  if (!services.value[selectedDate.value]) {
    services.value[selectedDate.value] = []
  }

  services.value[selectedDate.value].push({
    title,
    description,
    barangay,
    doctor,
    startTime,
    endTime,
  })
  localStorage.setItem('services', JSON.stringify(services.value))

  newService.value = {
    title: '',
    description: '',
    barangay: '',
    doctor: '',
    startTime: '',
    endTime: '',
  }
  dialog.value = false
  getServicesForDate()
}

// 🆕 Multiple Delete Support
const deleteDialog = ref(false)
const selectedServices = ref([])

const openDeleteServiceDialog = () => {
  selectedServices.value = [] // clear selection kada open
  deleteDialog.value = true
}

const deleteSelectedServices = () => {
  if (selectedServices.value.length) {
    if (confirm(`Are you sure you want to delete ${selectedServices.value.length} service(s)?`)) {
      dailyServices.value = dailyServices.value.filter((_, index) => !selectedServices.value.includes(index))
      services.value[selectedDate.value] = dailyServices.value
      localStorage.setItem('services', JSON.stringify(services.value))
    }
  }
  deleteDialog.value = false
}

const hasServices = (date) => {
  return services.value[date] && services.value[date].length > 0
}

// Profile image logic
const profileImage = ref('https://via.placeholder.com/200')
const showChangePicture = ref(false)

const toggleChangePicture = () => {
  showChangePicture.value = !showChangePicture.value
}

const onFileSelected = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      profileImage.value = reader.result
      localStorage.setItem('profileImage', profileImage.value)
    }
    reader.readAsDataURL(file)
  }
}

onMounted(() => {
  const stored = localStorage.getItem('services')
  if (stored) {
    services.value = JSON.parse(stored)
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

]<template>
  <v-app class="dashboard-bg">
    <!-- Sidebar -->
    <v-navigation-drawer v-model="drawer" app color="#9bd1f8" dark>
      <v-container class="text-center py-5">
        <!-- Profile Picture -->
        <div style="position: relative; display: inline-block">
          <v-avatar
            size="80"
            class="mx-auto mb-4"
            @click="toggleChangePicture"
            style="cursor: pointer"
          >
            <img :src="profileImage" alt="Profile" width="80" height="80" style="object-fit: cover" />
          </v-avatar>
          <input
            v-if="showChangePicture"
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="onFileSelected"
            style="position: absolute; top: 0; left: 0; width: 80px; height: 80px; opacity: 0; cursor: pointer"
          />
        </div>

        <!-- Navigation Buttons -->
        <v-btn block class="mt-9 mb-3" style="background-color: #BDDDE4" variant="elevated">
          <v-icon left>mdi-view-dashboard</v-icon> Dashboard
        </v-btn>
        <v-btn block class="mb-3" color="white" variant="text" @click="$router.push('/map')">
          <v-icon left>mdi-map</v-icon> Map View
        </v-btn>
        <v-spacer></v-spacer>
        <br><br><br><br><br>
        <br><br><br><br><br>
        <v-btn block class="mt-9" color="white" variant="text" @click="logout">
          <v-icon left>mdi-logout</v-icon> Log out
        </v-btn>
      </v-container>
    </v-navigation-drawer>

    <!-- Topbar -->
    <v-app-bar app color="transparent" dark elevation="0">
      <v-app-bar-nav-icon @click="drawer = !drawer">
        <v-icon>{{ drawer ? 'mdi-menu-open' : 'mdi-menu' }}</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>Dashboard</v-toolbar-title>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <v-row>
       <!-- Service Display -->
<v-col cols="12" md="6">
  <v-card class="mb-4">
    <v-card-title class="service-title">
      Service Today
      <v-spacer />
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text>
      <v-list v-if="dailyServices.length" dense>
        <v-list-item v-for="(service, index) in dailyServices" :key="index">
          <v-card class="pa-4" color="#e6f2fc" flat rounded>
            <div>
              <div class="text-primary font-weight-bold text-h6">{{ service.title }}</div>
              <div class="mb-2">{{ service.description }}</div>

              <div class="d-flex align-center mb-1">
                <v-icon small class="mr-2">mdi-account</v-icon>
                <span>{{ service.doctor }}</span>
              </div>

              <div class="d-flex align-center mb-1">
                <v-icon small class="mr-2">mdi-map-marker</v-icon>
                <span>{{ service.barangay }}</span>
              </div>

              <div class="d-flex align-center">
                <v-icon small class="mr-2">mdi-clock-time-four</v-icon>
                <span>{{ service.startTime }} - {{ service.endTime }}</span>
              </div>
            </div>
          </v-card>
        </v-list-item>
      </v-list>

      <div v-else>No service for this day.</div>

      <div class="d-flex mt-4" v-if="selectedDate">
        <v-btn color="#5da8ca" small class="mr-2" @click="openServiceDialog">
          Add New Service
        </v-btn>
        <v-btn color="error" small @click="openDeleteServiceDialog">
          Delete Service
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</v-col>

<!-- Diri ibutang ang bag-ong delete dialog -->
<v-dialog v-model="deleteDialog" max-width="500px">
  <v-card>
    <v-card-title>Select Service(s) to Delete</v-card-title>
    <v-card-text>
      <v-list dense>
        <v-list-item
          v-for="(service, index) in dailyServices"
          :key="index"
          class="hoverable"
        >
          <v-list-item-action>
            <v-checkbox
              v-model="selectedServices"
              :value="index"
              color="error"
              hide-details
            ></v-checkbox>
          </v-list-item-action>

          <v-list-item-content>
            <v-list-item-title>{{ service.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ service.description }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn text @click="deleteDialog = false">Cancel</v-btn>
      <v-btn color="error" text @click="deleteSelectedServices">Delete</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
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
                <div v-for="blank in blankDays" :key="'b-' + blank" class="calendar-day empty"></div>
                <div
                  v-for="day in daysInMonth"
                  :key="day"
                  class="calendar-day"
                  @click="onDateClick(getDate(day))"
                  :class="{ selected: selectedDate === getDate(day), today: isToday(getDate(day)) }"
                >
                  <span>{{ day }}</span>
                  <span v-if="hasServices(getDate(day))" class="service-dot"></span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Add Service Dialog -->
        <v-dialog v-model="dialog" max-width="500">
          <v-card class="pa-4 pa-sm-6">
            <v-card-title>Add Service Today</v-card-title>
            <v-card-text>
              <v-text-field v-model="newService.title" label="Service Title" />
              <v-text-field v-model="newService.description" label="Description" />
              <v-text-field v-model="newService.doctor" label="Doctor's Name" />
              <v-text-field v-model="newService.barangay" label="Barangay" />
              <v-row>
                <v-col cols="6">
                  <v-text-field v-model="newService.startTime" label="Start Time" type="time" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="newService.endTime" label="End Time" type="time" />
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn text @click="dialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="addService">Add</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.dashboard-bg {
  background-image: url('C:/Users/berou/Desktop/team-collab/public/images/Background.png');
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

.service-dot {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background-color: rgb(94, 153, 221);
  border-radius: 50%;
}

.empty {
  background-color: transparent;
}

.v-btn {
  margin-block: 12px;
}

.service-title {
  background-color: #9bd1f8;
  font-weight: bold;
  color: #ffffff;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 20px;
  padding: 16px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
</style>

