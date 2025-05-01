<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'

// Profile Menu Logic
const isProfileMenuOpen = ref(false)
const showChangePicture = ref(false)
const profileImage = ref('https://via.placeholder.com/200') // Temporary profile picture
const profileFile = ref(null)

const toggleChangePicture = () => {
  showChangePicture.value = !showChangePicture.value
}

const onFileSelected = (event) => {
  profileFile.value = event.target.files[0]
  if (profileFile.value) {
    const reader = new FileReader()
    reader.onload = (e) => {
      profileImage.value = e.target.result
      localStorage.setItem('profileImage', profileImage.value)
      showChangePicture.value = false
    }
    reader.readAsDataURL(profileFile.value)
  }
}

const logout = () => console.log('Logout clicked')

// Load stored profile image on startup
onMounted(() => {
  const storedImage = localStorage.getItem('profileImage')
  if (storedImage) {
    profileImage.value = storedImage
  }

  const map = L.map('map').setView([8.9475, 125.5406], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  L.marker([8.9475, 125.5406]).addTo(map).bindPopup('📍 Butuan City, Mindanao').openPopup()

  for (const [name, coords] of Object.entries(barangayCoordinates)) {
    L.marker(coords).addTo(map).bindPopup(`📍 ${name}`)
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
          .addTo(map)
          .bindPopup(`<b>Barangay ${barangay}</b><br>Has event today or upcoming.`)
          .on('click', () => showEventDetails(barangay))
      }
    })
  }
})

// Barangay Coordinates
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
Description: ${event.description}`,
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
</script>

<template>
  <v-app>
    <!-- Top Bar -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>Resident Map</v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Profile Dropdown -->
      <v-menu v-model="isProfileMenuOpen" location="bottom end" offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>

        <v-card class="w-64 pa-2">
          <v-list>
            <!-- Profile Picture Preview -->
            <v-list-item>
              <v-avatar size="64" class="mx-auto mb-2">
                <v-img :src="profileImage" alt="Profile Picture" />
              </v-avatar>
            </v-list-item>

            <!-- Change Profile Picture Option -->
            <v-list-item link @click="toggleChangePicture">
              <v-icon start icon="mdi-camera"></v-icon>
              <v-list-item-title>Change Profile Picture</v-list-item-title>
            </v-list-item>

            <!-- File Input -->
            <v-list-item v-if="showChangePicture">
              <v-file-input
                label="Upload New Picture"
                accept="image/*"
                @change="onFileSelected"
                dense
                hide-details
                prepend-icon="mdi-upload"
              />
            </v-list-item>

            <v-divider></v-divider>

            <!-- Logout -->
            <v-list-item link @click="logout">
              <v-icon start color="red" icon="mdi-logout"></v-icon>
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

.text-red {
  color: #e53935;
}
</style>
