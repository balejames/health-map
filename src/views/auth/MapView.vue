<script setup>
import { ref, onMounted, nextTick } from 'vue'
import L from 'leaflet'

// Sidebar Drawer toggle
const drawer = ref(true)
const isMapFullScreen = ref(false)  // Add this line

const toggleDrawer = () => {
  drawer.value = !drawer.value
  isMapFullScreen.value = !drawer.value  // Adjust the map full-screen mode based on drawer status
}

// Profile Picture Logic
const profileImage = ref('https://via.placeholder.com/200')
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
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) {
    profileImage.value = storedImage
  }
})

// Barangay Coordinates
const barangayCoordinates = {
  Ambago: [8.9724, 125.4946],
  Ampayon: [8.9592, 125.615],
  BaanKM3: [8.9491, 125.57809],
  Antongalon: [8.9493, 125.6209],
  Taligaman: [8.9409, 125.6289],
  Maon: [8.9316, 125.5447],
}

const selectedDate = ref(new Date().toISOString().split('T')[0])
const todaysServices = ref([])
const expandedServices = ref([])
const mapRef = ref(null)

onMounted(() => {
  const storedServices = localStorage.getItem('services')
  const today = selectedDate.value

  if (storedServices) {
    const services = JSON.parse(storedServices)
    todaysServices.value = services[today] || []
    expandedServices.value = todaysServices.value.map(() => false)
  }

  const map = L.map('map').setView([8.9475, 125.5406], 13)
  mapRef.value = map

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  for (const [name, coords] of Object.entries(barangayCoordinates)) {
    L.marker(coords).addTo(map).bindPopup(`📍 ${name}`)
  }

  if (storedServices) {
    const services = JSON.parse(storedServices)
    const activeBarangays = new Set()

    Object.values(services).forEach((dayServices) => {
      dayServices.forEach((service) => {
        if (service.barangay) {
          activeBarangays.add(normalize(service.barangay.trim()))
        }
      })
    })

    activeBarangays.forEach((barangayKey) => {
      const entry = Object.entries(barangayCoordinates).find(
        ([key]) => normalize(key) === barangayKey,
      )
      if (entry) {
        const [name, coords] = entry
        L.circleMarker(coords, {
          radius: 10,
          color: '#f44336',
          fillColor: '#f44336',
          fillOpacity: 0.7,
        })
          .addTo(map)
          .bindPopup(`<b>Barangay ${name}</b><br>Has service today or upcoming.`)
          .on('click', () => showServiceDetails(name))
      }
    })
  }
})

// Normalize string for matching
const normalize = (name) => name.toLowerCase().replace(/\s+/g, '')

// Show service details in modal
const serviceDialog = ref(false)
const selectedService = ref(null)

const showServiceDetails = (barangay) => {
  const storedServices = localStorage.getItem('services')
  if (storedServices) {
    const services = JSON.parse(storedServices)
    const todayServices = services[selectedDate.value] || []

    const normalizedBarangay = normalize(barangay)
    const barangayServices = todayServices.filter(
      (service) => normalize(service.barangay) === normalizedBarangay,
    )

    if (barangayServices.length > 0) {
      selectedService.value = barangayServices[0]
    } else {
      selectedService.value = null
    }
  } else {
    selectedService.value = null
  }

  serviceDialog.value = true

  nextTick(() => {
    setTimeout(() => {
      if (mapRef.value) {
        mapRef.value.invalidateSize()
      }
    }, 300)
  })
}
</script>

<template>
  <v-app>
    <!-- Sidebar -->
    <v-navigation-drawer v-model="drawer" app color="#9bd1f8" dark>
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
          <input
            v-if="showChangePicture"
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
            "
          />
        </div>

        <!-- Navigation Buttons -->
        <v-btn
          block
          class="mt-9 mb-3"
          color="white"
          variant="text"
          @click="$router.push('/dashboard')"
        >
          <v-icon left>mdi-view-dashboard</v-icon> <b>Dashboard</b>
        </v-btn>
        <v-btn block class="mb-3" style="background-color: #BDDDE4" variant="elevated">
          <v-icon left>mdi-map</v-icon> <b>Map View</b>
        </v-btn>
        <v-spacer></v-spacer>
        <br><br><br><br><br>
        <br><br><br><br><br>
        <v-btn block class="mt-9" color="white" variant="text" @click="$router.push('/login')">
          <v-icon left>mdi-logout</v-icon> <b>Log out</b>
        </v-btn>
      </v-container>
    </v-navigation-drawer>

    <!-- Top App Bar -->
    <v-app-bar app color="transparent" dark elevation="0">
      <v-app-bar-nav-icon @click="toggleDrawer">
        <v-icon>{{ drawer ? 'mdi-menu-open' : 'mdi-menu' }}</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>Dashboard</v-toolbar-title>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-0 fill-height">
        <!-- Map Section -->
        <div id="map" :class="['map-container', isMapFullScreen ? 'full-screen' : '']"></div>
      </v-container>
    </v-main>

    <!-- Modal for Service Details -->
    <v-dialog v-model="serviceDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Service Details</span>
        </v-card-title>
        <v-card-text>
          <div v-if="selectedService">
            <p><strong>Service Title:</strong> {{ selectedService.title }}</p>
            <p><strong>Doctor:</strong> {{ selectedService.doctor }}</p>
            <p><strong>Start Time:</strong> {{ selectedService.startTime }}</p>
            <p><strong>End Time:</strong> {{ selectedService.endTime }}</p>
            <p><strong>Description:</strong> {{ selectedService.description }}</p>
          </div>
          <div v-else>
            <p>No service found for this barangay today.</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="serviceDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  z-index: 1;
  transition: all 0.3s ease;
}

.full-screen {
  height: 100vh;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
