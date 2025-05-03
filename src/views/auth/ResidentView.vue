<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { formActionDefault, supabase } from '@/utils/supabase.js'

const router = useRouter()
const formAction = ref({ ...formActionDefault })
const isProfileMenuOpen = ref(false)
const profileImage = ref('/images/TemporaryProfile.jpg')
const profileFile = ref(null)
const fileInput = ref(null)
const map = ref(null)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const services = ref([])
const selectedBarangay = ref(null)
const loading = ref(true)
const showServiceCard = ref(false)
const selectedBarangayServices = ref([])
const showAllServices = ref(false)
const serviceFilter = ref({
  barangay: '',
  date: new Date().toISOString().split('T')[0],
  doctor: '',
})

// Barangay coordinates
const barangayCoordinates = {
  Ambago: [8.9724, 125.4946],
  Ampayon: [8.9592, 125.615],
  BaanKM3: [8.9491, 125.57809],
  Antongalon: [8.9493, 125.6209],
  Taligaman: [8.9409, 125.6289],
  Maon: [8.9316, 125.5447],
}

// Main color theme for consistent styling
const themeColor = '#0dceda'
const secondaryColor = '#9bd1f8'

// Computed property for services per barangay
const servicesPerBarangay = computed(() => {
  const counts = {}
  services.value.forEach((service) => {
    if (!counts[service.barangay]) {
      counts[service.barangay] = 0
    }
    counts[service.barangay]++
  })
  return counts
})

// Filtered services
const filteredServices = computed(() => {
  return services.value.filter((service) => {
    // Filter by barangay if specified
    if (serviceFilter.value.barangay && service.barangay !== serviceFilter.value.barangay) {
      return false
    }

    // Filter by date if specified
    if (serviceFilter.value.date) {
      const serviceDate = new Date(service.service_date).toISOString().split('T')[0]
      const filterDate = new Date(serviceFilter.value.date).toISOString().split('T')[0]
      if (serviceDate !== filterDate) {
        return false
      }
    }

    // Filter by doctor if specified
    if (
      serviceFilter.value.doctor &&
      !service.provider_name?.toLowerCase().includes(serviceFilter.value.doctor.toLowerCase())
    ) {
      return false
    }

    return true
  })
})

// Unique barangay and doctor lists for filters
const uniqueBarangays = computed(() => {
  const barangays = new Set()
  services.value.forEach((service) => {
    if (service.barangay) barangays.add(service.barangay)
  })
  return Array.from(barangays).sort()
})

const uniqueDoctors = computed(() => {
  const doctors = new Set()
  services.value.forEach((service) => {
    if (service.provider_name) doctors.add(service.provider_name)
  })
  return Array.from(doctors).sort()
})

// Reset filters
const resetFilters = () => {
  serviceFilter.value = {
    barangay: '',
    date: new Date().toISOString().split('T')[0],
    doctor: '',
  }
}

// Logout Logic
const logout = async () => {
  formAction.value = { ...formActionDefault, formProcess: true }

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Error logging out:', error)
  } finally {
    formAction.value.formProcess = false
    await router.replace('/login')
  }
}

// Profile management
const triggerFileInput = () => {
  fileInput.value?.click()
}

const onFileSelected = (event) => {
  profileFile.value = event.target.files[0]
  if (profileFile.value) {
    const reader = new FileReader()
    reader.onload = (e) => {
      profileImage.value = e.target.result
      localStorage.setItem('profileImage', profileImage.value)
    }
    reader.readAsDataURL(profileFile.value)
  }
}

// Map controls
const zoomIn = () => map.value?.zoomIn()
const zoomOut = () => map.value?.zoomOut()
const resetMapView = () => map.value?.setView([8.9475, 125.5406], 13)

// Service handling
const fetchServices = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    services.value = data || []
  } catch (error) {
    console.error('Error fetching services:', error)
  } finally {
    loading.value = false
  }
}

const addServiceMarkers = () => {
  if (!map.value) return

  // Add markers for each barangay with the count of services
  Object.entries(barangayCoordinates).forEach(([barangay, coords]) => {
    const count = servicesPerBarangay.value[barangay] || 0
    const markerColor = count > 0 ? themeColor : '#cccccc'
    const markerSize = count > 0 ? 10 + Math.min(count, 10) : 8

    L.circleMarker(coords, {
      radius: markerSize,
      color: markerColor,
      fillColor: markerColor,
      fillOpacity: 0.7,
    })
      .addTo(map.value)
      .bindPopup(`<b>Barangay ${barangay}</b><br>${count} services available`)
      .on('click', () => showBarangayServices(barangay))
  })
}

const showBarangayServices = (barangay) => {
  selectedBarangay.value = barangay
  selectedBarangayServices.value = services.value.filter((service) => service.barangay === barangay)
  showServiceCard.value = true
}

const closeServiceCard = () => {
  showServiceCard.value = false
}

const toggleAllServices = () => {
  showAllServices.value = !showAllServices.value
}

// Event handling
const addEventMarkers = () => {
  const storedEvents = localStorage.getItem('events')
  if (!storedEvents) return

  const events = JSON.parse(storedEvents)
  const activeBarangays = new Set()

  Object.values(events).forEach((dayEvents) => {
    dayEvents.forEach((event) => {
      if (event.barangay) {
        activeBarangays.add(event.barangay.trim())
      }
    })
  })

  activeBarangays.forEach((barangay) => {
    const coords = barangayCoordinates[barangay]
    if (coords) {
      L.circleMarker(coords, {
        radius: 10,
        color: themeColor,
        fillColor: themeColor,
        fillOpacity: 0.7,
      })
        .addTo(map.value)
        .bindPopup(`<b>Barangay ${barangay}</b><br>Has event today or upcoming.`)
        .on('click', () => showEventDetails(barangay))
    }
  })
}

const showEventDetails = (barangay) => {
  const storedEvents = localStorage.getItem('events')
  if (!storedEvents) {
    alert('No events data found.')
    return
  }

  const events = JSON.parse(storedEvents)
  const todayEvents = events[selectedDate.value] || []
  const barangayEvents = todayEvents.filter((event) => event.barangay === barangay)

  if (barangayEvents.length > 0) {
    const eventDetails = barangayEvents
      .map(
        (event) =>
          `Event: ${event.title}
           Doctor: ${event.doctor}
           Start Time: ${event.startTime}
           End Time: ${event.endTime}
           Description: ${event.description}`,
      )
      .join('\n\n')

    alert(`Events in Barangay ${barangay}:\n\n${eventDetails}`)
  } else {
    alert(`No events today in Barangay ${barangay}.`)
  }
}

// Formatting helpers
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Initialize map and data
onMounted(async () => {
  // Load profile image from localStorage
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) {
    profileImage.value = storedImage
  }

  // Initialize map
  map.value = L.map('map').setView([8.9475, 125.5406], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map.value)

  // Add Butuan City marker
  L.marker([8.9475, 125.5406]).addTo(map.value).bindPopup('📍 Butuan City, Mindanao').openPopup()

  // Add barangay markers
  Object.entries(barangayCoordinates).forEach(([name, coords]) => {
    L.marker(coords).addTo(map.value).bindPopup(`📍 ${name}`)
  })

  // Fetch services and add markers
  await fetchServices()
  addServiceMarkers()

  // Add event markers
  addEventMarkers()
})
</script>

<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar app :style="{ backgroundColor: secondaryColor }" dark>
      <v-toolbar-title>Resident Map</v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- Services Button -->
      <v-btn icon @click="toggleAllServices">
        <v-icon>mdi-medical-bag</v-icon>
      </v-btn>

      <!-- Profile Menu -->
      <v-menu v-model="isProfileMenuOpen" location="bottom end" offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
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
            <v-list-item link @click="triggerFileInput">
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
      <v-container fluid class="pa-0 fill-height">
        <div id="map" class="map-container"></div>

        <!-- Zoom and Reset Controls -->
        <div class="custom-zoom-controls">
          <v-tooltip text="Zoom In" location="right">
            <template #activator="{ props }">
              <v-btn
                icon
                v-bind="props"
                :style="{ backgroundColor: secondaryColor, color: 'white' }"
                @click="zoomIn"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Zoom Out" location="right">
            <template #activator="{ props }">
              <v-btn
                icon
                v-bind="props"
                :style="{ backgroundColor: secondaryColor, color: 'white' }"
                @click="zoomOut"
              >
                <v-icon>mdi-minus</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Reset View" location="right">
            <template #activator="{ props }">
              <v-btn
                icon
                v-bind="props"
                :style="{ backgroundColor: secondaryColor, color: 'white' }"
                @click="resetMapView"
              >
                <v-icon>mdi-map-marker-radius</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>

        <!-- All Services Panel -->
        <v-navigation-drawer
          v-model="showAllServices"
          temporary
          right
          width="400"
          class="services-drawer"
        >
          <v-card flat class="h-full">
            <v-card-title
              class="d-flex justify-space-between align-center"
              :style="{ backgroundColor: '#e3f2fd' }"
            >
              <span>Health Services</span>
              <v-btn icon @click="toggleAllServices">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>

            <v-card-text class="pt-4">
              <!-- Filters -->
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="serviceFilter.barangay"
                    :items="uniqueBarangays"
                    label="Filter by Barangay"
                    clearable
                    variant="outlined"
                    density="compact"
                  ></v-select>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="serviceFilter.doctor"
                    label="Filter by Doctor"
                    clearable
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="serviceFilter.date"
                    label="Filter by Date"
                    type="date"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" class="d-flex justify-end">
                  <v-btn :color="themeColor" @click="resetFilters" size="small"
                    >Reset Filters</v-btn
                  >
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <!-- Services List -->
              <div v-if="loading" class="d-flex justify-center my-4">
                <v-progress-circular indeterminate :color="themeColor"></v-progress-circular>
              </div>

              <div v-else-if="filteredServices.length === 0" class="text-center py-4">
                <v-icon size="64" color="grey lighten-2">mdi-alert-circle-outline</v-icon>
                <p class="mt-2">No services available with current filters.</p>
              </div>

              <div v-else class="services-list">
                <v-card
                  v-for="service in filteredServices"
                  :key="service.id"
                  class="mb-4 service-card"
                  elevation="2"
                >
                  <v-card-title class="text-h6" :style="{ backgroundColor: '#e3f2fd' }">
                    {{ service.service_name }}
                  </v-card-title>

                  <v-card-text>
                    <p class="mb-2">
                      <v-icon size="small" :color="themeColor" class="me-2">mdi-map-marker</v-icon>
                      <strong>Barangay:</strong> {{ service.barangay }}
                    </p>

                    <p class="mb-2">
                      <v-icon size="small" :color="themeColor" class="me-2"
                        >mdi-account-outline</v-icon
                      >
                      <strong>Doctor:</strong> {{ service.provider_name || 'Not specified' }}
                    </p>

                    <p class="mb-2">
                      <v-icon size="small" :color="themeColor" class="me-2">mdi-calendar</v-icon>
                      <strong>Date:</strong> {{ formatDate(service.service_date) }}
                    </p>

                    <p class="mb-2">
                      <v-icon size="small" :color="themeColor" class="me-2"
                        >mdi-clock-outline</v-icon
                      >
                      <strong>Time:</strong> {{ service.start_time || '—' }} -
                      {{ service.end_time || '—' }}
                    </p>

                    <p v-if="service.description" class="mt-3">
                      <v-icon size="small" :color="themeColor" class="me-2"
                        >mdi-information-outline</v-icon
                      >
                      <strong>Description:</strong>
                    </p>
                    <p class="ps-8 mt-1">{{ service.description || 'No description available' }}</p>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn variant="text" :color="themeColor" size="small">
                      MORE INFORMATION
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </div>
            </v-card-text>
          </v-card>
        </v-navigation-drawer>

        <!-- Services Card -->
        <div class="service-dialog-overlay" v-if="showServiceCard" @click.self="closeServiceCard">
          <v-card class="service-dialog" max-width="400">
            <v-card-title
              class="d-flex justify-space-between align-center"
              :style="{ backgroundColor: '#e3f2fd' }"
            >
              <span>Services in {{ selectedBarangay }}</span>
              <v-btn icon @click="closeServiceCard">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>

            <v-card-text class="service-dialog-content">
              <v-progress-circular
                v-if="loading"
                indeterminate
                :color="themeColor"
                class="d-flex mx-auto my-4"
              ></v-progress-circular>

              <div v-else-if="selectedBarangayServices.length === 0" class="text-center py-4">
                <v-icon size="64" color="grey lighten-2">mdi-alert-circle-outline</v-icon>
                <p class="mt-2">No services available in this barangay.</p>
              </div>

              <div v-else>
                <v-card
                  v-for="(service, index) in selectedBarangayServices"
                  :key="index"
                  class="mb-4 service-card"
                  elevation="2"
                >
                  <v-card-title :style="{ backgroundColor: '#e3f2fd' }">
                    {{ service.service_name }}
                  </v-card-title>

                  <v-card-text>
                    <p class="mb-2">
                      <v-icon size="small" :color="themeColor" class="me-2">mdi-map-marker</v-icon>
                      <strong>Barangay:</strong> {{ service.barangay }}
                    </p>

                    <p class="mb-2">
                      <v-icon size="small" :color="themeColor" class="me-2"
                        >mdi-account-outline</v-icon
                      >
                      <strong>Doctor:</strong> {{ service.provider_name || 'Not specified' }}
                    </p>

                    <p class="mb-2">
                      <v-icon size="small" :color="themeColor" class="me-2">mdi-calendar</v-icon>
                      <strong>Date:</strong> {{ formatDate(service.service_date) }}
                    </p>

                    <p class="mb-2">
                      <v-icon size="small" :color="themeColor" class="me-2"
                        >mdi-clock-outline</v-icon
                      >
                      <strong>Time:</strong> {{ service.start_time || '—' }} -
                      {{ service.end_time || '—' }}
                    </p>

                    <p v-if="service.description" class="mt-3">
                      <v-icon size="small" :color="themeColor" class="me-2"
                        >mdi-information-outline</v-icon
                      >
                      <strong>Description:</strong>
                    </p>
                    <p class="ps-8 mt-1">{{ service.description || 'No description available' }}</p>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn variant="text" :color="themeColor" size="small">
                      MORE INFORMATION
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  z-index: 1;
}

.custom-zoom-controls {
  position: absolute;
  top: 80px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
}

.service-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.service-dialog {
  max-height: 80vh;
  width: 90%;
  max-width: 400px;
}

.service-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}

.service-card {
  transition: transform 0.2s;
}

.service-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.services-drawer {
  z-index: 1002;
}

.services-list {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}
</style>
