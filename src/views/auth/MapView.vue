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

const selectedDate = ref(new Date().toISOString().split('T')[0])
const services = ref({}) // All services grouped by date
const todaysServices = ref([])

const mapRef = ref(null)
const markers = ref({}) // Store markers for easy removal/update

const normalize = (name) => name.toLowerCase().replace(/\s+/g, '')

const serviceDialog = ref(false)
const selectedService = ref(null)

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

const showServiceDetails = (barangay) => {
  const normalizedBarangay = normalize(barangay)
  const today = selectedDate.value

  // Find all services for this barangay on the selected date
  const servicesForBarangay = todaysServices.value.filter(
    (s) => normalize(s.barangay) === normalizedBarangay,
  )

  if (servicesForBarangay.length > 0) {
    // If multiple services, show the first one with info about total count
    const service = servicesForBarangay[0]
    selectedService.value = {
      barangay: service.barangay,
      service: service.title,
      doctor: service.doctor,
      description: service.description,
      startTime: formatTime(service.start_date_time),
      endTime: formatTime(service.end_date_time),
      totalServices: servicesForBarangay.length,
    }
  } else {
    selectedService.value = {
      barangay: barangay,
      service: 'No services scheduled',
      description: '',
      totalServices: 0,
    }
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

  // Group services by date for easy access
  const grouped = {}
  data.forEach((service) => {
    // Ensure we have a valid date
    if (service.date) {
      if (!grouped[service.date]) {
        grouped[service.date] = []
      }
      grouped[service.date].push(service)
    }
  })

  services.value = grouped
  // Update today's services
  todaysServices.value = grouped[selectedDate.value] || []

  // Update markers after fetching services
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
  todaysServices.value = services.value[newDate] || []
  showBarangayMarkers()
})

onMounted(() => {
  // Initialize the map
  const map = L.map('map').setView([8.9475, 125.5406], 13)
  mapRef.value = map

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)

  // Fetch services and set up real-time updates
  fetchServices()
  setupRealtimeSubscription()

  // Set up a polling mechanism as backup in case realtime doesn't catch all changes
  const pollingInterval = setInterval(() => {
    fetchServices()
  }, 30000) // Poll every 30 seconds

  // Clean up on component unmount
  return () => {
    clearInterval(pollingInterval)
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

// Change selected date
const goToToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
}

const goToTomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  selectedDate.value = tomorrow.toISOString().split('T')[0]
}

const goToNextWeek = () => {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  selectedDate.value = nextWeek.toISOString().split('T')[0]
}
</script>

<template>
  <v-app>
    <v-app-bar app color="#9bd1f8" dark>
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
          :class="{ 'v-btn--active': selectedDate === new Date().toISOString().split('T')[0] }"
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
          <v-list>
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

            <v-divider />

            <v-list-item link @click="logout">
              <v-list-item-title class="text-red">Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-0 fill-height">
        <div id="map" class="map-container" />

        <!-- Map Legend -->
        <div class="map-legend">
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

        <!-- Zoom Control Buttons -->
        <div class="map-controls">
          <v-btn @click="zoomIn" class="map-btn zoom-in"><v-icon>mdi-plus</v-icon></v-btn>
          <v-btn @click="zoomOut" class="map-btn zoom-out"><v-icon>mdi-minus</v-icon></v-btn>
          <v-btn @click="resetView" class="map-btn reset-view">
            <v-icon>mdi-map-marker-radius</v-icon>
          </v-btn>
        </div>
      </v-container>
    </v-main>

    <!-- Service Details Dialog -->
    <v-dialog v-model="serviceDialog" max-width="600px">
      <v-card>
        <v-card-title class="service-title">
          <span v-if="selectedService?.totalServices === 0">No Services</span>
          <span v-else-if="selectedService?.totalServices === 1">Service Details</span>
          <span v-else>{{ selectedService?.totalServices }} Services Available</span>
        </v-card-title>

        <v-card-subtitle>Barangay {{ selectedService?.barangay }}</v-card-subtitle>

        <v-card-text v-if="selectedService?.totalServices > 0">
          <v-card class="pa-4 mb-3" color="#e6f2fc" flat rounded>
            <div class="text-primary font-weight-bold text-h6 mb-2">
              {{ selectedService?.service }}
            </div>
            <div class="mb-3">{{ selectedService?.description }}</div>

            <div v-if="selectedService?.doctor" class="d-flex align-center mb-2">
              <v-icon small class="mr-2">mdi-account</v-icon>
              <span>{{ selectedService?.doctor }}</span>
            </div>

            <div class="d-flex align-center">
              <v-icon small class="mr-2">mdi-clock-time-four</v-icon>
              <span> {{ selectedService?.startTime }} - {{ selectedService?.endTime }} </span>
            </div>
          </v-card>

          <div v-if="selectedService?.totalServices > 1" class="text-center">
            <v-btn color="primary" @click="router.push('/dashboard')">
              View All Services on Dashboard
            </v-btn>
          </div>
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

.map-btn:hover {
  background-color: #0288d1;
}

.map-legend {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: white;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 0.9rem;
  z-index: 10;
  max-width: 90vw;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.legend-marker {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #bbb;
  margin-right: 8px;
}

.legend-marker.active {
  background-color: #f44336;
}

@media (max-width: 600px) {
  .legend-title,
  .legend-item span {
    font-size: 12px;
  }

  .map-controls {
    top: 70px;
    left: 5px;
  }

  .map-btn {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .map-legend {
    padding: 8px 10px;
    font-size: 12px;
  }

  .v-toolbar-title {
    font-size: 16px !important;
  }

  .date-filter {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
    margin-right: 10px;
  }

  .date-label {
    font-size: 12px;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .map-controls {
    top: 75px;
    left: 8px;
  }

  .date-filter {
    flex-wrap: wrap;
    gap: 6px;
  }
}

@media (min-width: 961px) {
  .map-legend {
    bottom: 20px;
    left: 20px;
  }

  .map-controls {
    top: 80px;
    left: 20px;
  }

  .date-filter {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
}
</style>
