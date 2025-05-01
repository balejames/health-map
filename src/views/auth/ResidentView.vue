<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'

const isProfileMenuOpen = ref(false)
const profileImage = ref('https://via.placeholder.com/200')
const profileFile = ref(null)
const fileInput = ref(null)

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

const logout = () => {
  console.log('Logout clicked')
}

const map = ref(null)

onMounted(() => {
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) {
    profileImage.value = storedImage
  }

  map.value = L.map('map').setView([8.9475, 125.5406], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map.value)

  L.marker([8.9475, 125.5406])
    .addTo(map.value)
    .bindPopup('📍 Butuan City, Mindanao')
    .openPopup()

  for (const [name, coords] of Object.entries(barangayCoordinates)) {
    L.marker(coords).addTo(map.value).bindPopup(`📍 ${name}`)
  }

  const storedEvents = localStorage.getItem('events')
  if (storedEvents) {
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
          color: '#f44336',
          fillColor: '#f44336',
          fillOpacity: 0.7,
        })
          .addTo(map.value)
          .bindPopup(`<b>Barangay ${barangay}</b><br>Has event today or upcoming.`)
          .on('click', () => showEventDetails(barangay))
      }
    })
  }
})

const barangayCoordinates = {
  Ambago: [8.9706, 125.5334],
  Ampayon: [8.9801, 125.553],
  Libertad: [8.9489, 125.5372],
  BaanRiverside: [8.9567, 125.5521],
}

const selectedDate = ref(new Date().toISOString().split('T')[0])

const showEventDetails = (barangay) => {
  const storedEvents = localStorage.getItem('events')
  if (storedEvents) {
    const events = JSON.parse(storedEvents)
    const todayEvents = events[selectedDate.value] || []
    const barangayEvents = todayEvents.filter((event) => event.barangay === barangay)

    if (barangayEvents.length > 0) {
      const eventDetails = barangayEvents
        .map(
          (event) => `Event: ${event.title}
Doctor: ${event.doctor}
Start Time: ${event.startTime}
End Time: ${event.endTime}
Description: ${event.description}`
        )
        .join('\n\n')

      alert(`Events in Barangay ${barangay}:\n\n${eventDetails}`)
    } else {
      alert(`No events today in Barangay ${barangay}.`)
    }
  } else {
    alert('No events data found.')
  }
}

const zoomIn = () => {
  map.value?.zoomIn()
}

const zoomOut = () => {
  map.value?.zoomOut()
}

const resetMapView = () => {
  map.value?.setView([8.9475, 125.5406], 13)
}
</script>

<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>Resident Map</v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- Profile Menu -->
      <v-menu v-model="isProfileMenuOpen" location="bottom end" offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
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

    <!-- Map -->
    <v-main>
      <v-container fluid class="pa-0 fill-height">
        <div id="map" class="map-container"></div>

        <!-- Zoom and Reset Controls -->
        <div class="custom-zoom-controls">
          <v-tooltip text="Zoom In" location="right">
            <template #activator="{ props }">
              <v-btn icon v-bind="props" color="primary" @click="zoomIn">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Zoom Out" location="right">
            <template #activator="{ props }">
              <v-btn icon v-bind="props" color="primary" @click="zoomOut">
                <v-icon>mdi-minus</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Reset View" location="right">
            <template #activator="{ props }">
              <v-btn icon v-bind="props" color="primary" @click="resetMapView">
                <v-icon>mdi-map-marker-radius</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
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

.text-red {
  color: #e53935;
}
</style>
