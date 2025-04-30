<script setup>
import { onMounted, nextTick, ref } from 'vue'
import { isAuthenticated, supabase } from '@/utils/supabase.js'
import L from 'leaflet'
import { useRouter } from 'vue-router'

const router = useRouter()
const logout = async () => {
  await supabase.auth.signOut()

  router.push({ name: 'login' })
}
// Sidebar Drawer toggle
const drawer = ref(true)
const isMapFullScreen = ref(false)

const toggleDrawer = () => {
  drawer.value = !drawer.value
  isMapFullScreen.value = !drawer.value
}

// Profile Picture Logic
const profileImage = ref('https://via.placeholder.com/200')
const profileFile = ref(null)
const showChangePicture = ref(false)

const toggleChangePicture = () => {
  showChangePicture.value = !showChangePicture.value
}

const onFileSelected = (e) => {
  const file = e.target.files ? e.target.files[0] : profileFile.value
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      profileImage.value = e.target.result
      localStorage.setItem('profileImage', profileImage.value)
    }
    reader.readAsDataURL(file)
  }
}

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

onMounted(() => {
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) {
    profileImage.value = storedImage
  }

  // Initialize map centered at Butuan City
  const map = L.map('map').setView([8.9475, 125.5406], 13)
  mapRef.value = map

  // Load OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  // Add default marker at Butuan City center
  L.marker([8.9475, 125.5406]).addTo(map).bindPopup('📍 Butuan City, Mindanao').openPopup()

  // Handle click events on the map
  map.on('click', function (e) {
    const { lat, lng } = e.latlng

    // Add a marker at the clicked location
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(
        `📍 You clicked here:<br><strong>Lat:</strong> ${lat.toFixed(
          5,
        )}<br><strong>Lng:</strong> ${lng.toFixed(5)}`,
      )
      .openPopup()
  })

  const storedServices = localStorage.getItem('services')
  const today = selectedDate.value

  if (storedServices) {
    const services = JSON.parse(storedServices)
    todaysServices.value = services[today] || []
    expandedServices.value = todaysServices.value.map(() => false)
  }

  for (const [name, coords] of Object.entries(barangayCoordinates)) {
    L.marker(coords).addTo(mapRef.value).bindPopup(`📍 ${name}`)
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
          .addTo(mapRef.value)
          .bindPopup(`<b>Barangay ${name}</b><br>Has service today or upcoming.`)
          .on('click', () => showServiceDetails(name))
      }
    })
  }
})
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
        <v-btn
          block
          class="mt-9 mb-3"
          color="white"
          variant="text"
          @click="router.push('/dashboard')"
        >
          <v-icon left>mdi-view-dashboard</v-icon> Dashboard
        </v-btn>
        <v-btn block class="mb-3" style="background-color: #bddde4" variant="elevated">
          <v-icon left>mdi-map</v-icon> <b>Map View</b>
        </v-btn>
        <br /><br /><br /><br /><br />
        <br /><br /><br /><br /><br />
        <v-btn block class="mt-9" color="white" variant="text" @click="logout">
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
