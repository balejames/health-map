<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '@/utils/supabase.js'
import L from 'leaflet'
import { useRouter } from 'vue-router'

const router = useRouter()
const logout = async () => {
  await supabase.auth.signOut()
  router.push({ name: 'login' })
}

const drawer = ref(true)
const isMapFullScreen = ref(false)
const toggleDrawer = () => {
  drawer.value = !drawer.value
  isMapFullScreen.value = !drawer.value
}

const profileImage = ref('/images/TemporaryProfile.jpg')
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

// Coordinates
const barangayCoordinates = {
  Ambago: [8.9724, 125.4946],
  Ampayon: [8.9592, 125.615],
  BaanKM3: [8.9491, 125.57809],
  Antongalon: [8.9493, 125.6209],
  Taligaman: [8.9409, 125.6289],
  Maon: [8.9316, 125.5447],
}

// Date & Service States
const selectedDate = ref(new Date().toISOString().split('T')[0])
const todaysServices = ref([])
const servicesFromDB = ref([])
const mapRef = ref(null)

const normalize = (name) => name.toLowerCase().replace(/\s+/g, '')

const serviceDialog = ref(false)
const selectedService = ref(null)

const showServiceDetails = (barangay) => {
  const normalizedBarangay = normalize(barangay)
  const today = selectedDate.value

  const filtered = servicesFromDB.value.filter(
    (s) => s.date === today && normalize(s.barangay) === normalizedBarangay,
  )

  if (filtered.length > 0) {
    selectedService.value = {
      barangay: filtered[0].barangay,
      service: filtered[0].title,
      details: filtered[0].description,
    }
  } else {
    selectedService.value = null
  }

  serviceDialog.value = true
}

const showBarangayMarkers = () => {
  const activeBarangays = new Set()

  servicesFromDB.value.forEach((service) => {
    if (service.barangay) {
      activeBarangays.add(normalize(service.barangay.trim()))
    }
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

const fetchServices = async () => {
  const { data, error } = await supabase.from('services').select('*')
  if (error) {
    console.error('Error fetching services:', error)
    return
  }

  servicesFromDB.value = data
  todaysServices.value = data.filter((svc) => svc.date === selectedDate.value)
  showBarangayMarkers()
}

onMounted(() => {
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) {
    profileImage.value = storedImage
  }

  const map = L.map('map').setView([8.9475, 125.5406], 13)
  mapRef.value = map

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)

  L.marker([8.9475, 125.5406]).addTo(map).bindPopup('📍 Butuan City, Mindanao').openPopup()

  for (const [name, coords] of Object.entries(barangayCoordinates)) {
    L.marker(coords).addTo(mapRef.value).bindPopup(`📍 ${name}`)
  }

  fetchServices()
})
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

      <v-toolbar-title class="white-text">Map View</v-toolbar-title>

      <!-- Navigation Buttons -->
      <v-btn text @click="router.push('/dashboard')">Dashboard</v-btn>
      <v-btn text @click="router.push('/map')">Map View</v-btn>
      <v-btn text @click="router.push('/residents')">Resident View</v-btn>

      <v-spacer></v-spacer>

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
            <v-list-item>
              <v-avatar size="64" class="mx-auto mb-2">
                <v-img :src="profileImage" alt="Profile Picture" />
              </v-avatar>
            </v-list-item>

            <v-list-item link @click="toggleChangePicture">
              <v-list-item-title>Change Profile Picture</v-list-item-title>
            </v-list-item>

            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="onFileSelected"
              style="display: none"
            />

            <v-divider></v-divider>

            <v-list-item link @click="logout">
              <v-list-item-title class="text-red">Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-0 fill-height">
        <div id="map" :class="['map-container', isMapFullScreen ? 'full-screen' : '']"></div>
      </v-container>
    </v-main>

    <v-dialog v-model="serviceDialog" max-width="600px">
      <v-card>
        <v-card-title class="headline">Service Details</v-card-title>
        <v-card-subtitle>{{ selectedService?.barangay }}</v-card-subtitle>
        <v-card-text>
          <p><strong>Service:</strong> {{ selectedService?.service }}</p>
          <p><strong>Details:</strong> {{ selectedService?.details }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn color="blue darken-1" text @click="() => (serviceDialog = false)">Close</v-btn>
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

#map {
  border: 1px solid #ddd;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
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
