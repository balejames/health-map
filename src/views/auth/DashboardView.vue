<script setup>
import { formActionDefault, supabase } from '@/utils/supabase.js'
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { profileImage, updateProfileImage } from '@/utils/eventBus.js'
import { VCarousel, VCarouselItem } from 'vuetify/components'

const drawer = ref(true)
const router = useRouter()
const formAction = ref({ ...formActionDefault })
const mobileMenuOpen = ref(false)
const isLoading = ref(true)
const loadingCanvasRef = ref(null)

// Loading Screen Animation
let animationFrameId = null
let particles = []

const initLoadingScreen = () => {
  const canvas = loadingCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // Create particles
  particles = []
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 5 + 1,
      color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
    })
  }

  const animate = () => {
    if (!isLoading.value) {
      cancelAnimationFrame(animationFrameId)
      return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#0dceda')
    gradient.addColorStop(1, '#42a5f5')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw and update particles
    particles.forEach((particle) => {
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fillStyle = particle.color
      ctx.fill()

      // Update position
      particle.x += particle.vx
      particle.y += particle.vy

      // Bounce off walls
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
    })

    animationFrameId = requestAnimationFrame(animate)
  }

  animate()
}

// Handle window resize for canvas
const handleResize = () => {
  if (loadingCanvasRef.value) {
    loadingCanvasRef.value.width = window.innerWidth
    loadingCanvasRef.value.height = window.innerHeight
  }
}

// Logout Logic
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

// Check if there are services for a given date
const hasServices = (date) => {
  return services.value[date] && services.value[date].length > 0
}

// Reactive form for New Service
const selectedDate = ref('')
const newService = ref({
  title: '',
  description: '',
  barangay: '',
  doctor: '',
  startTime: '',
  endTime: '',
  date: '',
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

// Date Management for Calendar
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

// Updated getDate function that correctly handles day conversions
const getDate = (day) => {
  // Create a date object with the specified year, month, and day
  const date = new Date(currentYear.value, currentMonth.value, day)

  // Format using local methods to avoid timezone issues
  const formattedDate =
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')

  return formattedDate
}

// Function to get today's date string in Philippines timezone
const getToday = () => {
  const today = new Date()
  return (
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0')
  )
}

// Updated isToday function that uses local timezone
const isToday = (dateString) => {
  return dateString === getToday()
}

// Make sure onDateClick is handling the date correctly
const onDateClick = (date) => {
  console.log('Clicked date:', date) // Add this for debugging
  selectedDate.value = date
  getServicesForDate()
}

// Ensure getServicesForDate is also working as expected
const getServicesForDate = () => {
  console.log('Getting services for:', selectedDate.value) // Add this for debugging
  dailyServices.value = services.value[selectedDate.value] || []
}

// Format Time for Display
const formatTime = (timeInput) => {
  if (!timeInput) return ''

  try {
    // Handle ISO string format from Supabase timestamptz
    const date = new Date(timeInput)
    if (isNaN(date)) return '' // Invalid date

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch (e) {
    console.error('Error formatting time:', e)
    return ''
  }
}

// Open Add Service Dialog
const openServiceDialog = () => {
  // Initialize form with selected date
  newService.value.date = selectedDate.value
  dialog.value = true
}

// Add Service to Supabase
const addService = async () => {
  try {
    // Use the form's date field instead of selectedDate
    const serviceDate = newService.value.date || selectedDate.value

    // Create ISO format timestamp strings that include timezone info
    const startDateTime = new Date(`${serviceDate}T${newService.value.startTime}:00`)
    const endDateTime = new Date(`${serviceDate}T${newService.value.endTime}:00`)

    // Format for timestamptz in Supabase
    const startTimestamptz = startDateTime.toISOString()
    const endTimestamptz = endDateTime.toISOString()

    // Form validation
    if (
      !newService.value.title ||
      !newService.value.barangay ||
      !serviceDate ||
      !newService.value.startTime ||
      !newService.value.endTime
    ) {
      alert('Please fill in all required fields (title, barangay, date, start and end time)')
      return
    }

    const { data, error } = await supabase.from('services').insert([
      {
        title: newService.value.title,
        description: newService.value.description,
        doctor: newService.value.doctor,
        barangay: newService.value.barangay,
        start_date_time: startTimestamptz,
        end_date_time: endTimestamptz,
        date: serviceDate,
      },
    ])

    if (error) {
      console.error('Failed to add service:', error.message)
      alert('Failed to add service: ' + error.message)
      return
    }

    console.log('Service added:', data)
    dialog.value = false
    await fetchServices()
    resetServiceForm()
  } catch (e) {
    console.error('Unexpected error while adding service:', e)
    alert('Unexpected error while adding service')
  }
}

// Fetch Services from Supabase
const fetchServices = async () => {
  const { data, error } = await supabase.from('services').select('*')

  if (error) {
    console.error('Error fetching services:', error.message)
    return
  }

  const grouped = {}
  data.forEach((service) => {
    if (!grouped[service.date]) {
      grouped[service.date] = []
    }
    grouped[service.date].push(service)
  })

  services.value = grouped
  getServicesForDate()
}

// Reset Service Form
const resetServiceForm = () => {
  newService.value.title = ''
  newService.value.description = ''
  newService.value.doctor = ''
  newService.value.barangay = ''
  newService.value.startTime = ''
  newService.value.endTime = ''
  newService.value.date = ''
}

const deleteDialog = ref(false)
const selectedServices = ref([])

const openDeleteServiceDialog = () => {
  selectedServices.value = []
  deleteDialog.value = true
}

const deleteSelectedServices = async () => {
  try {
    const servicesToDelete = selectedServices.value
      .map((i) => dailyServices.value[i]?.id)
      .filter(Boolean)

    if (!servicesToDelete.length) {
      console.log('No services selected for deletion')
      return
    }
    const { error } = await supabase.from('services').delete().in('id', servicesToDelete)

    if (error) {
      console.error('Error deleting services:', error)
      alert('Failed to delete services: ' + error.message)
      return
    }

    console.log(`${servicesToDelete.length} service(s) deleted successfully`)
    deleteDialog.value = false

    await fetchServices()
  } catch (e) {
    console.error('Unexpected error while deleting services:', e)
    alert('An unexpected error occurred while deleting services')
  }
}

// Profile image logic
const fileInput = ref(null)
const showChangePicture = ref(false)
const isProfileMenuOpen = ref(false)

const toggleChangePicture = () => {
  fileInput.value.click()
}

const onFileSelected = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      updateProfileImage(reader.result)
    }
    reader.readAsDataURL(file)
  }
}

// Calendar Navigation
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

// Set up Supabase subscription for real-time updates
const setupRealtimeSubscription = () => {
  supabase
    .channel('services-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
      console.log('Realtime update:', payload)
      fetchServices()
    })
    .subscribe()
}
// Set user email
const userEmail = ref('')
// On component mount
onMounted(async () => {
  // Initialize loading screen
  window.addEventListener('resize', handleResize)
  initLoadingScreen()

  // Simulate loading (you can adjust timing or use actual data fetch completion)
  setTimeout(() => {
    isLoading.value = false
  }, 2500)

  selectedDate.value = new Date().toISOString().split('T')[0]
  await fetchServices()
  setupRealtimeSubscription()

  // Fetch user data (email)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Failed to get user:', error.message)
    return
  }

  // Set user email
  userEmail.value = user?.email || 'No email'
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <!-- Loading Screen -->
  <div v-if="isLoading" class="loading-screen">
    <canvas ref="loadingCanvasRef" class="loading-canvas"></canvas>
    <div class="loading-content">
      <div class="loading-text">Loading...</div>
      <div class="loading-spinner"></div>
    </div>
  </div>

  <v-app class="dashboard-bg">
    <!-- Top Bar -->
    <v-app-bar app color="#9bd1f8" dark elevate-on-scroll>
      <!-- Mobile Menu Button -->
      <v-app-bar-nav-icon
        class="show-on-small"
        @click="mobileMenuOpen = !mobileMenuOpen"
      ></v-app-bar-nav-icon>

      <v-img
        src="/images/DASHBOARD-LOGO PIXIE .jpg"
        alt="Logo"
        contain
        max-width="40"
        max-height="40"
        class="ml-4 mr-2"
      ></v-img>

      <v-toolbar-title
        class="white--text"
        @click="router.push('/dashboard')"
        style="padding-left: 0; margin-left: 10px; color: white; cursor: pointer"
      >
        Health Map
      </v-toolbar-title>

      <!-- Navigation Buttons -->
      <v-btn text style="color: white" @click="router.push('/dashboard')" class="hide-on-small"
        >Dashboard</v-btn
      >
      <v-btn text style="color: white" @click="router.push('/map')" class="hide-on-small"
        >Map View</v-btn
      >
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
          <v-list class="d-flex flex-column align-center justify-center">
            <!-- Profile Picture -->
            <v-row justify="center" align="center">
              <v-col cols="12" class="d-flex justify-center">
                <v-avatar size="100" class="mb-2">
                  <v-img :src="profileImage" alt="Profile Picture" />
                </v-avatar>
              </v-col>
            </v-row>
            <!-- Email and Caption below profile picture -->
            <v-list-item class="text-center">
              <v-list-item-title class="text-h6 font-weight-bold">{{
                userEmail
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption text-grey"
                >Your registered email</v-list-item-subtitle
              >
            </v-list-item>

            <!-- Trigger File Input -->
            <v-list-item link @click="toggleChangePicture" class="text-center">
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
            <v-list-item link @click="logout" class="text-center">
              <v-list-item-title class="text-red">Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="mobile-container">
        <!-- Carousel -->
        <v-carousel hide-delimiters height="300px" class="responsive-carousel">
          <v-carousel-item src="/images/CAROUSEL1.png" cover></v-carousel-item>
          <v-carousel-item src="/images/CAROUSEL2.png" cover></v-carousel-item>
        </v-carousel>

        <v-row class="flex-column-mobile">
          <!-- Service Today Column -->
          <v-col cols="12" md="6" class="pt-6">
            <!-- Services Card -->
            <v-card class="mb-4 mobile-card">
              <v-card-title class="service-title mobile-title">
                {{ selectedDate === getToday() ? 'Service Today' : 'Services for ' + selectedDate }}
                <v-spacer />
              </v-card-title>

              <v-divider></v-divider>

              <v-card-text>
                <v-list v-if="dailyServices.length" dense>
                  <v-list-item v-for="(service, index) in dailyServices" :key="index">
                    <v-card class="pa-4 mobile-service-card" color="#e6f2fc" flat rounded>
                      <div>
                        <div class="text-primary font-weight-bold text-h6 mobile-text">
                          {{ service.title }}
                        </div>
                        <div class="mb-2 mobile-desc">{{ service.description }}</div>

                        <div class="d-flex align-center mb-1">
                          <v-icon small class="mr-2">mdi-account</v-icon>
                          <span class="mobile-info">{{ service.doctor }}</span>
                        </div>

                        <div class="d-flex align-center mb-1">
                          <v-icon small class="mr-2">mdi-map-marker</v-icon>
                          <span class="mobile-info">{{ service.barangay }}</span>
                        </div>

                        <div class="d-flex align-center">
                          <v-icon small class="mr-2">mdi-clock-time-four</v-icon>
                          <span class="mobile-info">
                            {{ formatTime(service.start_date_time) }} -
                            {{ formatTime(service.end_date_time) }}
                          </span>
                        </div>
                      </div>
                    </v-card>
                  </v-list-item>
                </v-list>

                <div v-else>No service for this day.</div>

                <div class="d-flex mt-4 mobile-buttons" v-if="selectedDate">
                  <v-btn color="#5da8ca" small class="mr-2 mobile-btn" @click="openServiceDialog">
                    Add
                  </v-btn>
                  <v-btn
                    color="error"
                    small
                    class="mobile-btn"
                    @click="openDeleteServiceDialog"
                    :disabled="!dailyServices.length"
                  >
                    Delete
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Calendar Column -->
          <v-col cols="12" md="6" class="pt-6">
            <div class="calendar-wrapper mobile-calendar">
              <div class="calendar-header mobile-calendar-header">
                <v-btn icon @click="goToPrevMonth"><v-icon>mdi-chevron-left</v-icon></v-btn>
                <span class="mobile-month">{{ monthYearLabel }}</span>
                <v-btn icon @click="goToNextMonth"><v-icon>mdi-chevron-right</v-icon></v-btn>
              </div>

              <div class="calendar-weekdays mobile-weekdays">
                <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
              </div>

              <div class="calendar-days mobile-days">
                <div
                  v-for="blank in blankDays"
                  :key="'b-' + blank"
                  class="calendar-day empty"
                ></div>

                <div
                  v-for="day in daysInMonth"
                  :key="day"
                  class="calendar-day mobile-day"
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
        <v-dialog v-model="deleteDialog" max-width="500px" class="mobile-dialog">
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
        <v-dialog v-model="dialog" max-width="500" class="mobile-dialog">
          <v-card class="pa-4 pa-sm-6">
            <v-card-title class="service-title">
              Add Service
              <v-spacer />
            </v-card-title>

            <v-card-text class="pa-4">
              <v-text-field v-model="newService.title" label="Service Title" required />
              <v-textarea v-model="newService.description" label="Description" rows="2" />
              <v-text-field v-model="newService.doctor" label="Doctor" />
              <v-select
                v-model="newService.barangay"
                :items="barangayOptions"
                label="Barangay"
                required
                :rules="[(v) => !!v || 'Barangay is required']"
              />

              <!-- Add date picker -->
              <v-text-field
                v-model="newService.date"
                label="Date"
                type="date"
                :min="new Date().toISOString().split('T')[0]"
                required
              />

              <v-row class="mobile-time-inputs">
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newService.startTime"
                    label="Start Time"
                    type="time"
                    required
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newService.endTime"
                    label="End Time"
                    type="time"
                    required
                  />
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
    <!-- Mobile Navigation Menu -->
    <v-navigation-drawer v-model="mobileMenuOpen" temporary>
      <v-list>
        <v-list-item>
          <v-list-item-title class="text-h6">Health Map</v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item @click="(router.push('/dashboard'), (mobileMenuOpen = false))">
          <v-icon class="mr-2" icon="mdi-view-dashboard" />
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item>

        <v-list-item @click="(router.push('/map'), (mobileMenuOpen = false))">
          <v-icon class="mr-2" icon="mdi-map" />
          <v-list-item-title>Map View</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </v-app>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #0dceda;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.loading-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  color: white;
  font-size: 3rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.98);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

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
  background-color: rgb(255, 0, 0);
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

@media (max-width: 600px) {
  .v-carousel {
    height: 200px !important;
  }
}

/* New mobile responsive styles */
@media (max-width: 960px) {
  .flex-column-mobile {
    flex-direction: column-reverse !important;
  }

  .mobile-container {
    padding: 8px !important;
  }

  .responsive-carousel {
    height: 180px !important;
    margin-bottom: 0 !important;
  }

  .mobile-calendar {
    padding: 12px !important;
    margin-bottom: 16px;
  }

  .mobile-calendar-header {
    padding: 8px !important;
    font-size: 16px !important;
  }

  .mobile-month {
    font-size: 16px !important;
  }

  .mobile-weekdays {
    gap: 4px !important;
    font-size: 12px !important;
  }

  .mobile-days {
    gap: 4px !important;
  }

  .mobile-day {
    padding: 5px !important;
    font-size: 12px !important;
    min-height: 30px !important;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .mobile-card {
    margin-bottom: 16px !important;
  }

  .mobile-title {
    font-size: 16px !important;
    padding: 12px !important;
  }

  .mobile-text {
    font-size: 14px !important;
  }

  .mobile-desc {
    font-size: 13px !important;
  }

  .mobile-info {
    font-size: 12px !important;
  }

  .mobile-service-card {
    padding: 8px !important;
  }

  .mobile-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }

  .mobile-btn {
    margin: 4px !important;
    width: 100px;
  }

  .mobile-dialog {
    width: 95% !important;
    max-width: 95% !important;
    margin: 0 auto;
  }

  .mobile-time-inputs {
    flex-direction: column !important;
  }

  .hide-on-small {
    display: none !important;
  }

  .show-on-small {
    display: none !important;
  }
}

@media (max-width: 960px) {
  .show-on-small {
    display: flex !important;
  }
}

@media (max-width: 480px) {
  .v-toolbar-title {
    font-size: 18px !important;
  }

  .mobile-day {
    padding: 3px !important;
    font-size: 10px !important;
    min-height: 24px !important;
  }

  .service-dot {
    width: 6px !important;
    height: 6px !important;
  }

  .responsive-carousel {
    height: 150px !important;
  }
}

/* Fix for smaller iPhones */
@media (max-width: 375px) {
  .mobile-calendar {
    padding: 8px !important;
  }

  .mobile-days {
    gap: 2px !important;
  }

  .mobile-day {
    padding: 2px !important;
    font-size: 9px !important;
    min-height: 22px !important;
  }
}
</style>
