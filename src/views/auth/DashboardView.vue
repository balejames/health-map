<script setup>
import { formActionDefault, supabase } from '@/utils/supabase.js'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const drawer = ref(true)
const router = useRouter()
const formAction = ref({ ...formActionDefault })

const logout = async () => {
  formAction.value = { ...formActionDefault }
  formAction.value.formProcess = true

  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error logging out:', error)
    return
  }
  formAction.value.formProcess = false
  router.replace('/')
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

// Barangay List (Dropdown)
const barangayList = [
  { name: 'Ampayon' },
  { name: 'Ambago' },
  { name: 'Antongalon' },
  { name: 'Baan Km. 3' },
  { name: 'Maon' },
  { name: 'Taligaman' },
]

const barangayOptions = computed(() => barangayList.map((b) => b.name))

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

  if (
    !title.trim() ||
    !description.trim() ||
    !barangay ||
    !doctor.trim() ||
    !startTime ||
    !endTime
  ) {
    alert('Please fill out all fields before saving.')
    return
  }

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

// Multiple Delete Support
const deleteDialog = ref(false)
const selectedServices = ref([])

const openDeleteServiceDialog = () => {
  selectedServices.value = []
  deleteDialog.value = true
}

const deleteSelectedServices = () => {
  if (selectedServices.value.length) {
    if (confirm(`Are you sure you want to delete ${selectedServices.value.length} service(s)?`)) {
      dailyServices.value = dailyServices.value.filter(
        (_, index) => !selectedServices.value.includes(index),
      )
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
const profileImage = ref('/images/TemporaryProfile.jpg')
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
<template>
  <v-app class="dashboard-bg">
    <!-- Top Bar -->
    <v-app-bar app color="#9bd1f8" dark elevate-on-scroll>
      <v-img
        src="/images/DASHBOARD-LOGO PIXIE .jpg"
        alt="Logo"
        contain
        max-width="40"
        max-height="40"
        class="ml-4 mr-2"
      ></v-img>

      <v-toolbar-title class="white-text">Dashboard</v-toolbar-title>

      <!-- Navigation Buttons -->
      <v-btn text @click="router.push('/dashboard')">Dashboard</v-btn>
      <v-btn text @click="router.push('/map')">Map View</v-btn>
      <v-btn text @click="router.push('/residents')">Resident View</v-btn>

      <v-spacer></v-spacer>

      <!-- Profile Menu -->
      <v-menu v-model="isProfileMenuOpen" location="bottom end" offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <!-- Use the profile image here -->
            <v-avatar size="32">
              <v-img :src="profileImage" alt="Profile Picture" />
            </v-avatar>
          </v-btn>
        </template>

        <v-card class="w-64 pa-2">
          <v-list>
            <!-- Profile Picture -->
            <v-list-item>
              <v-avatar size="64" class="mx-auto mb-2">
                <v-img :src="profileImage" alt="Profile Picture" />
              </v-avatar>
            </v-list-item>

            <!-- Trigger File Input -->
            <v-list-item link @click="toggleChangePicture">
              <v-list-item-title>Change Profile Picture</v-list-item-title>
            </v-list-item>

            <!-- Hidden File Input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="onFileSelected"
              style="display: none"
            />

            <v-divider></v-divider>

            <!-- Logout -->
            <v-list-item link @click="logout">
              <v-list-item-title class="text-red">Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <!-- Carousel -->
        <v-carousel>
          <v-carousel-item src="/images/CAROUSELWELCOME.png" cover></v-carousel-item>
          <v-carousel-item src="/images/CAROUSELWELCOME2.png" cover></v-carousel-item>
        </v-carousel>

        <v-row>
          <!-- Service Today Column -->
            <v-col cols="12" md="6" class="pt-6">
            <!-- Services Card -->
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

          <!-- Calendar Column -->
          <v-col cols="12" md="6" class="pt-6">
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
                  <span v-if="hasServices(getDate(day))" class="service-dot"></span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Delete Service Dialog -->
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

                  <div>
                    <div class="text-subtitle-1 font-weight-medium">{{ service.title }}</div>
                    <div class="text-body-2">{{ service.description }}</div>
                  </div>
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

        <!-- Add Service Dialog -->
        <v-dialog v-model="dialog" max-width="500">
          <v-card class="pa-4 pa-sm-6">
            <v-card-title class="service-title">
              Add Service
              <v-spacer />
            </v-card-title>

            <v-card-text class="pa-4">
              <v-text-field v-model="newService.title" label="Service Title" />
              <v-textarea v-model="newService.description" label="Description" rows="2" />
              <v-text-field v-model="newService.doctor" label="Doctor" />
              <v-select
                v-model="newService.barangay"
                :items="barangayOptions"
                label="Barangay"
              />
              <v-row>
                <v-col cols="6">
                  <v-text-field v-model="newService.startTime" label="Start Time" type="time" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="newService.endTime" label="End Time" type="time" />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions class="pa-4">
              <v-spacer />
              <v-btn text @click="dialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="addService">Save Service</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.dashboard-bg {
  background-image: url('/images/DashboardBackground.png');
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

.toolbar-title {
  font-size: 24px;
  font-weight: bold;
  color: white;
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
  background-color: #b3e5fc;
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
  background-color: rgb(84, 101, 255);
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

.v-avatar {
  transition: transform 0.3s ease;
}

.v-avatar:hover {
  transform: scale(1.1);
}

.v-navigation-drawer {
  background: linear-gradient(135deg, #9bd1f8, #bddde4);
}

.v-btn:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

.v-btn.text:hover {
  color: #f44336;
}

.v-dialog .v-card {
  border-radius: 12px;
  padding: 16px;
  background-color: #fff;
}

.v-card-title {
  font-weight: 600;
  font-size: 20px;
  color: #333;
}

.v-card-subtitle {
  color: #555;
}

.v-file-input {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.v-file-input:focus {
  opacity: 1;
}

.v-app-bar {
  background: transparent;
  /* box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); */
}
</style>
