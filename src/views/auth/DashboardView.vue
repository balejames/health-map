<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

// Drawer & Routing
const drawer = ref(true)
const router = useRouter()

function logout() {
  router.push('/login')
}

// Profile Image Handling with Supabase
const profileImage = ref('https://via.placeholder.com/200') // Default placeholder
const showChangePicture = ref(false)
const fileInput = ref(null)

const toggleChangePicture = () => {
  showChangePicture.value = !showChangePicture.value
  if (showChangePicture.value) {
    setTimeout(() => fileInput.value?.click(), 100)
  }
}

const onFileSelected = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) return

  const userId = userData.user.id
  const fileExt = file.name.split('.').pop()
  const filePath = `avatars/${userId}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (!uploadError) {
    await getProfileImage()
  } else {
    console.error('Upload failed:', uploadError.message)
  }
}

const getProfileImage = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) return

  const userId = userData.user.id
  const extensions = ['jpg', 'jpeg', 'png', 'webp']

  for (const ext of extensions) {
    const { data } = supabase.storage.from('avatars').getPublicUrl(`avatars/${userId}.${ext}`)
    if (data?.publicUrl) {
      // Check if the image URL is valid by trying to load it
      const img = new Image()
      img.src = data.publicUrl + `?t=${Date.now()}` // 👈 Cache buster using timestamp
      img.onload = () => {
        profileImage.value = img.src
      }
      break // stop checking other extensions after success
    }
  }
}
// Calendar State
const selectedDate = ref('')
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
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
  return new Date(currentYear.value, currentMonth.value, day).toISOString().split('T')[0]
}

const isToday = (dateString) => {
  const today = new Date().toISOString().split('T')[0]
  return dateString === today
}

// Navigation Between Months
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

// Service Management
const services = ref({})
const dailyServices = ref([])
const newService = ref({
  title: '',
  description: '',
  barangay: '',
  doctor: '',
  startTime: '',
  endTime: '',
})

const dialog = ref(false)

const getServicesForDate = () => {
  dailyServices.value = services.value[selectedDate.value] || []
}

const onDateClick = (date) => {
  selectedDate.value = date
  getServicesForDate()
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

// Multi-delete Support
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

// Barangay Options
const barangayList = [
  { name: 'Ampayon' },
  { name: 'Ambago' },
  { name: 'Antongalon' },
  { name: 'Baan Km. 3' },
]

const barangayOptions = computed(() => barangayList.map((b) => b.name))

// Initial Mount
onMounted(async () => {
  const stored = localStorage.getItem('services')
  if (stored) {
    services.value = JSON.parse(stored)
  }

  await getProfileImage()
})
</script>
<template>
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
            <img
              :src="profileImage"
              alt="Profile"
              width="80"
              height="80"
              style="object-fit: cover"
            />
          </v-avatar>
          <input
            v-if="showChangePicture"
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="onFileSelected"
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 80px;
              height: 80px;
              opacity: 0;
              cursor: pointer;
            ; cursor: pointer"
          />
        </div>

        <!-- Navigation Buttons -->
        <v-btn block class="mt-9 mb-3" style="background-color: #bddde4" variant="elevated">
          <v-icon left>mdi-view-dashboard</v-icon> <b>Dashboard</b>
        </v-btn>
        <v-btn block class="mb-3" color="white" variant="text" @click="$router.push('/map')">
          <v-icon left>mdi-map</v-icon> <b>Map View</b>
        </v-btn>
        <v-spacer></v-spacer>
        <br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br />
        <v-btn block class="mt-9" color="white" variant="text" @click="logout">
          <v-icon left>mdi-logout</v-icon> <b>Log out</b>
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

        <!-- Add Service Dialog -->
        <v-dialog v-model="dialog" max-width="500">
          <v-card class="pa-4 pa-sm-6">
            <v-card-title class="service-title">
              Add Service
              <v-spacer />
            </v-card-title>

            <!-- Form part -->
            <v-card-text class="pa-4">
              <v-text-field
                v-model="newService.title"
                label="Service Title"
                placeholder="Enter service title"
              />
              <v-textarea
                v-model="newService.description"
                label="Description"
                placeholder="Enter service description"
                rows="2"
              />
              <v-text-field
                v-model="newService.doctor"
                label="Doctor"
                placeholder="Enter doctor's name"
              />
              <v-select
                v-model="newService.barangay"
                :items="barangayOptions"
                label="Barangay"
                placeholder="Select barangay"
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

            <!-- Action buttons -->
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

<script setup>
import { ref, computed, onMounted } from 'vue'

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
  })
)

const daysInMonth = computed(() =>
  new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
)

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
    reader.onload = (e) => {
      profileImage.value = e.target.result
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

<style scoped>
.dashboard-bg {
  background-image: url('public/images/Background.png');
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
</style>
