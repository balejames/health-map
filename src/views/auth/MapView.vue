<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase.js'
import L from 'leaflet'
import { profileImage, updateProfileImage } from '@/utils/eventBus.js'

const router = useRouter()

const logout = async () => {
  await supabase.auth.signOut()
  router.push({ name: 'login' })
}

const fileInput = ref(null)
const showChangePicture = ref(false)
const isProfileMenuOpen = ref(false)
const isMobile = ref(window.innerWidth < 768) // Track if we're on mobile
const mobileDrawerOpen = ref(false) // For mobile navigation drawer

// Loading screen state
const isLoading = ref(true)
const loadingCanvasRef = ref(null)

// Watch for window resize to update mobile state
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

const toggleMobileDrawer = () => {
  mobileDrawerOpen.value = !mobileDrawerOpen.value
}

const toggleChangePicture = () => {
  fileInput.value.click()
}

const onFileSelected = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      // Use the shared update function from eventBus
      updateProfileImage(reader.result)
    }
    reader.readAsDataURL(file)
  }
}

const barangayCoordinates = {
  Ambago: [8.9724, 125.4946],
  Ampayon: [8.9592, 125.615],
  BaanKM3: [8.9491, 125.57809],
  Antongalon: [8.9493, 125.6209],
  Taligaman: [8.9409, 125.6289],
  Maon: [8.9316, 125.5447],
}

// Fixed: Use getFormattedDate to ensure consistent date format
const getFormattedDate = (dateObj) => {
  return (
    dateObj.getFullYear() +
    '-' +
    String(dateObj.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(dateObj.getDate()).padStart(2, '0')
  )
}

// Initialize with today's date in the correct format
const selectedDate = ref(getFormattedDate(new Date()))
const services = ref({}) // All services grouped by date
const todaysServices = ref([])

const mapRef = ref(null)
const markers = ref({}) // Store markers for easy removal/update

const normalize = (name) => name.toLowerCase().replace(/\s+/g, '')

const serviceDialog = ref(false)
const selectedBarangayServices = ref([])
const selectedBarangayName = ref('')

// Loading screen animation
const initLoadingAnimation = () => {
  if (!loadingCanvasRef.value) return

  const canvas = loadingCanvasRef.value
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // Create particles
  const particles = []
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: Math.random() * 1 - 0.5,
      speedY: Math.random() * 1 - 0.5,
      opacity: Math.random() * 0.5 + 0.5,
    })
  }

  // Animation function
  const animate = () => {
    if (!isLoading.value) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw particles
    particles.forEach((p) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()

      // Move particles
      p.x += p.speedX
      p.y += p.speedY

      // Loop particles
      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0
    })

    requestAnimationFrame(animate)
  }

  animate()
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

// Format Date function
const formatDate = (dateString) => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    if (isNaN(date)) return ''

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch (e) {
    console.error('Error formatting date:', e)
    return ''
  }
}

const showServiceDetails = (barangay) => {
  const normalizedBarangay = normalize(barangay)

  // Find all services for this barangay on the selected date
  const servicesForBarangay = todaysServices.value.filter(
    (s) => normalize(s.barangay) === normalizedBarangay,
  )

  selectedBarangayName.value = barangay

  if (servicesForBarangay.length > 0) {
    // Store all services for this barangay with formatted times
    selectedBarangayServices.value = servicesForBarangay.map((service) => ({
      title: service.title,
      description: service.description,
      doctor: service.doctor,
      startTime: formatTime(service.start_date_time),
      endTime: formatTime(service.end_date_time),
    }))
  } else {
    selectedBarangayServices.value = []
  }

  serviceDialog.value = true
}

// Clear existing markers from map
const clearMarkers = () => {
  for (const key in markers.value) {
    if (markers.value[key]) {
      mapRef.value.removeLayer(markers.value[key])
      delete markers.value[key]
    }
  }
}

const showBarangayMarkers = () => {
  clearMarkers()

  const activeBarangays = new Set()

  // Get all unique barangays with services for today
  todaysServices.value.forEach((service) => {
    if (service.barangay) {
      activeBarangays.add(normalize(service.barangay.trim()))
    }
  })

  // Add a normal marker for each barangay
  for (const [name, coords] of Object.entries(barangayCoordinates)) {
    const normalizedName = normalize(name)
    const hasService = activeBarangays.has(normalizedName)

    // Create a marker for each barangay
    const marker = L.marker(coords, {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="marker-pin ${hasService ? 'active' : ''}"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      }),
    })
      .addTo(mapRef.value)
      .bindPopup(
        `<b>Barangay ${name}</b>${hasService ? '<br><span class="service-available">Has service today</span>' : ''}`,
      )
      .on('click', () => showServiceDetails(name))

    markers.value[normalizedName] = marker

    // Add a red circle indicator for barangays with services
    if (hasService) {
      const circleMarker = L.circleMarker(coords, {
        radius: 15,
        color: '#f44336',
        fillColor: '#f44336',
        fillOpacity: 0.4,
        weight: 2,
      })
        .addTo(mapRef.value)
        .on('click', () => showServiceDetails(name))

      // Store the circle marker too
      markers.value[`${normalizedName}-circle`] = circleMarker
    }
  }
}

const fetchServices = async () => {
  const { data, error } = await supabase.from('services').select('*')
  if (error) {
    console.error('Error fetching services:', error)
    return
  }

  console.log('All services from API:', data)

  // Group services by date for easy access
  const grouped = {}
  data.forEach((service) => {
    // Ensure we have a valid date
    if (service.date) {
      // Normalize the date format to match what we use in the UI
      const dateKey = service.date

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(service)
    }
  })

  console.log('Grouped services by date:', grouped)
  console.log('Current selected date:', selectedDate.value)

  services.value = grouped
  // Update today's services
  todaysServices.value = grouped[selectedDate.value] || []

  console.log("Today's services:", todaysServices.value)

  // Update markers after fetching services - IMPORTANT: Only call if map is initialized
  if (mapRef.value) {
    showBarangayMarkers()
  }
}

// Set up Supabase real-time subscription for service changes
const setupRealtimeSubscription = () => {
  // First, unsubscribe if there's an existing subscription
  const channel = supabase
    .channel('services-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
      console.log('Realtime update received:', payload)
      // Always fetch all services when any change happens
      fetchServices()
    })
    .subscribe((status) => {
      console.log('Subscription status:', status)
    })
}

// Watch for date changes
watch(selectedDate, (newDate) => {
  console.log('Date changed to:', newDate)
  todaysServices.value = services.value[newDate] || []
  console.log('Updated services list:', todaysServices.value)
  showBarangayMarkers()
})

// Set user email
const userEmail = ref('')

onMounted(async () => {
  // Initialize loading screen
  initLoadingAnimation()

  // Make sure selectedDate is initialized with the proper format
  selectedDate.value = getFormattedDate(new Date())
  console.log('Initial selectedDate:', selectedDate.value)

  // Initialize the map first
  const map = L.map('map').setView([8.9475, 125.5406], 13)
  mapRef.value = map

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)

  // Fetch services first - IMPORTANT: await this to ensure data is loaded
  await fetchServices()

  // Now that we have the data and map initialized, explicitly show markers
  showBarangayMarkers()

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

  // Add window resize listener
  window.addEventListener('resize', handleResize)
  handleResize()

  // Hide loading screen after everything is loaded
  setTimeout(() => {
    isLoading.value = false
  }, 1500) // Add a small delay to ensure everything is loaded

  // Set up a polling mechanism as backup in case realtime doesn't catch all changes
  const pollingInterval = setInterval(() => {
    fetchServices()
  }, 30000)

  // Clean up on component unmount
  return () => {
    clearInterval(pollingInterval)
    window.removeEventListener('resize', handleResize)
  }
})

const zoomIn = () => {
  mapRef.value.zoomIn()
}

const zoomOut = () => {
  mapRef.value.zoomOut()
}

const resetView = () => {
  mapRef.value.setView([8.9475, 125.5406], 13)
}

// Change selected date with consistent formatting
const goToToday = () => {
  selectedDate.value = getFormattedDate(new Date())
  if (isMobile.value) mobileDrawerOpen.value = false
}

const goToTomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  selectedDate.value = getFormattedDate(tomorrow)
  if (isMobile.value) mobileDrawerOpen.value = false
}

const goToNextWeek = () => {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  selectedDate.value = getFormattedDate(nextWeek)
  if (isMobile.value) mobileDrawerOpen.value = false
}

const navigateTo = (route) => {
  router.push(route)
  if (isMobile.value) mobileDrawerOpen.value = false
}
</script>

<template>
  <!-- Loading Screen -->
  <div v-if="isLoading" class="loading-screen">
    <canvas ref="loadingCanvasRef" class="loading-canvas"></canvas>
    <div class="loading-content">
      <div class="loading-text">Checking map...</div>
      <div class="loading-spinner"></div>
    </div>
  </div>

  <v-app>
    <!-- Desktop App Bar -->
    <v-app-bar app color="#9bd1f8" dark v-if="!isMobile">
      <v-img
        src="/images/DASHBOARD-LOGO PIXIE .jpg"
        alt="Logo"
        contain
        max-width="40"
        max-height="40"
        class="ml-4 mr-2"
      />

      <v-toolbar-title
        class="white--text"
        @click="router.push('/dashboard')"
        style="padding-left: 0; margin-left: 10px; color: white; cursor: pointer"
      >
        Health Map
      </v-toolbar-title>

      <v-btn text style="color: white" @click="router.push('/dashboard')">Dashboard</v-btn>
      <v-btn text style="color: white" @click="router.push('/map')">Map View</v-btn>

      <v-spacer />

      <!-- Date Controls -->
      <div class="date-filter mr-4">
        <span class="mr-2 date-label">View services for: </span>
        <v-btn
          size="small"
          color="white"
          variant="text"
          @click="goToToday"
          :class="{ 'v-btn--active': selectedDate === getFormattedDate(new Date()) }"
        >
          Today
        </v-btn>
        <v-btn size="small" color="white" variant="text" @click="goToTomorrow">Tomorrow</v-btn>
        <v-btn size="small" color="white" variant="text" @click="goToNextWeek">Next Week</v-btn>
      </div>

      <!-- Profile Dropdown -->
      <v-menu v-model="isProfileMenuOpen" location="bottom end" offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar size="36">
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

    <!-- Mobile App Bar -->
    <v-app-bar app color="#9bd1f8" dark v-if="isMobile">
      <v-app-bar-nav-icon @click="toggleMobileDrawer" color="white"></v-app-bar-nav-icon>

      <v-img
        src="/images/DASHBOARD-LOGO PIXIE .jpg"
        alt="Logo"
        contain
        max-width="32"
        max-height="32"
        class="mr-2"
      />

      <v-toolbar-title
        class="white--text truncate-title"
        @click="router.push('/dashboard')"
        style="color: white; cursor: pointer"
      >
        Health Map
      </v-toolbar-title>

      <!-- Mobile Profile Menu -->
      <v-menu v-model="isProfileMenuOpen" location="bottom end">
        <template #activator="{ props }">
          <v-btn icon v-bind="props" size="small">
            <v-avatar size="32">
              <v-img :src="profileImage" alt="Profile Picture" />
            </v-avatar>
          </v-btn>
        </template>

        <v-card class="pa-2">
          <v-list>
            <v-list-item>
              <v-avatar size="48" class="mx-auto mb-2">
                <v-img :src="profileImage" alt="Profile Picture" />
              </v-avatar>
            </v-list-item>

            <v-list-item link @click="toggleChangePicture">
              <v-list-item-title>Change Profile Picture</v-list-item-title>
            </v-list-item>

            <v-divider />

            <v-list-item link @click="logout">
              <v-list-item-title class="text-red">Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer v-model="mobileDrawerOpen" temporary v-if="isMobile">
      <v-list>
        <v-list-item>
          <v-list-item-title class="text-h6">Health Map</v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item @click="navigateTo('/dashboard')">
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item>

        <v-list-item @click="navigateTo('/map')">
          <v-list-item-title>Map View</v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item-title class="px-4 py-2 text-subtitle-2">View services for:</v-list-item-title>

        <v-list-item @click="goToToday" :active="selectedDate === getFormattedDate(new Date())">
          <v-list-item-title>Today</v-list-item-title>
        </v-list-item>

        <v-list-item @click="goToTomorrow">
          <v-list-item-title>Tomorrow</v-list-item-title>
        </v-list-item>

        <v-list-item @click="goToNextWeek">
          <v-list-item-title>Next Week</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-0 fill-height">
        <div id="map" class="map-container" />

        <!-- Map Legend - Moved to Top Right -->
        <div class="map-legend" :class="{ 'map-legend-mobile': isMobile }">
          <div class="legend-title">Map Legend</div>
          <div class="legend-item">
            <div class="legend-marker active"></div>
            <span>Barangay with scheduled service</span>
          </div>
          <div class="legend-item">
            <div class="legend-marker"></div>
            <span>Barangay (no service scheduled)</span>
          </div>
        </div>

        <!-- Zoom Control Buttons - Responsive -->
        <div class="map-controls" :class="{ 'map-controls-mobile': isMobile }">
          <v-btn @click="zoomIn" class="map-btn zoom-in" :size="isMobile ? 'small' : 'default'">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <v-btn @click="zoomOut" class="map-btn zoom-out" :size="isMobile ? 'small' : 'default'">
            <v-icon>mdi-minus</v-icon>
          </v-btn>
          <v-btn
            @click="resetView"
            class="map-btn reset-view"
            :size="isMobile ? 'small' : 'default'"
          >
            <v-icon>mdi-map-marker-radius</v-icon>
          </v-btn>
        </div>

        <!-- Mobile Date Selector Fab -->
        <v-btn
          v-if="isMobile"
          class="date-fab"
          color="#9bd1f8"
          size="large"
          icon
          @click="toggleMobileDrawer"
        >
          <v-icon>mdi-calendar</v-icon>
        </v-btn>
      </v-container>
    </v-main>

    <!-- Service Details Dialog - Responsive -->
    <v-dialog v-model="serviceDialog" :max-width="isMobile ? '95%' : '600px'">
      <v-card class="text-center">
        <v-card-title class="service-title text-center">
          <span v-if="selectedBarangayServices.length === 0">No Services</span>
          <span v-else-if="selectedBarangayServices.length === 1">Service Details</span>
          <span v-else>{{ selectedBarangayServices.length }} Services Available</span>
        </v-card-title>

        <v-card-subtitle>
          Barangay <span class="text-h6 font-weight-bold">{{ selectedBarangayName }}</span>
        </v-card-subtitle>

        <v-card-text v-if="selectedBarangayServices.length > 0">
          <!-- Display all services in this barangay -->
          <v-card
            v-for="(service, index) in selectedBarangayServices"
            :key="index"
            class="pa-4 mb-3 mx-auto"
            color="#e6f2fc"
            flat
            rounded
          >
            <div class="text-primary font-weight-bold text-h6 mb-2 text-start">
              {{ service.title }}
            </div>
            <div class="mb-3 text-start">{{ service.description }}</div>

            <div class="d-flex align-center mb-2">
              <v-icon small class="mr-2">mdi-calendar</v-icon>
              <span>{{ formatDate(selectedDate) }}</span>
            </div>

            <div v-if="service.doctor" class="d-flex align-center mb-2">
              <v-icon small class="mr-2">mdi-account</v-icon>
              <span>{{ service.doctor }}</span>
            </div>

            <div class="d-flex align-center">
              <v-icon small class="mr-2">mdi-clock-time-four</v-icon>
              <span> {{ service.startTime }} - {{ service.endTime }} </span>
            </div>
          </v-card>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="serviceDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
.map-container {
  width: 100%;
  height: 100vh;
  min-height: 400px;
  border-radius: 8px;
  z-index: 1;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.map-controls {
  position: absolute;
  top: 80px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  z-index: 10;
}

.map-controls-mobile {
  top: 70px;
  left: 5px;
}

.map-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgb(84, 187, 228);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-controls-mobile .map-btn {
  width: 32px;
  height: 32px;
  margin-bottom: 3px;
}

.map-btn:hover {
  background-color: #0288d1;
}

.map-legend {
  position: absolute;
  top: 80px;
  right: 10px;
  background-color: white;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 0.9rem;
  z-index: 10;
  max-width: 90vw;
}

.map-legend-mobile {
  top: 70px;
  right: 10px;
  padding: 8px;
  max-width: 220px;
  font-size: 12px;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 8px;
}

.map-legend-mobile .legend-title {
  font-size: 12px;
  margin-bottom: 5px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.map-legend-mobile .legend-item {
  font-size: 10px;
  margin-bottom: 4px;
}

.legend-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ccc;
  margin-right: 8px;
}

.map-legend-mobile .legend-marker {
  width: 10px;
  height: 10px;
  margin-right: 5px;
}

.legend-marker.active {
  background-color: #f44336;
}

/* Custom marker styles - these will be applied globally but scoped to the markers */
:global(.custom-div-icon) {
  background: transparent;
  border: none;
}

:global(.marker-pin) {
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  background: #3388ff;
  position: absolute;
  transform: rotate(-45deg);
  left: 50%;
  top: 50%;
  margin: -15px 0 0 -15px;
}

:global(.marker-pin.active) {
  background: #f44336;
}

:global(.marker-pin::after) {
  content: '';
  width: 20px;
  height: 20px;
  margin: 5px 0 0 5px;
  background: #fff;
  position: absolute;
  border-radius: 50%;
}

:global(.service-available) {
  color: #f44336;
  font-weight: bold;
}

/* Responsive adjustments for different screen sizes */
@media (max-width: 600px) {
  .map-container {
    height: calc(100vh - 56px);
    border-radius: 0;
    border: none;
  }

  .service-title {
    font-size: 16px;
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .map-controls-mobile .map-btn {
    width: 28px;
    height: 28px;
  }

  .map-legend-mobile {
    max-width: 150px;
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  .map-container {
    height: calc(100vh - 48px);
  }

  .map-controls-mobile {
    top: 60px;
  }
}
</style>
