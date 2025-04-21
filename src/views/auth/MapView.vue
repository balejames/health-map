<template>
  <v-app>
    <!-- Sidebar -->
    <v-navigation-drawer app permanent color="#03a9f4" dark>
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
          @click="$router.push('/dashboard')"
        >
          <v-icon left>mdi-view-dashboard</v-icon> Dashboard
        </v-btn>
        <v-btn block class="mb-3" style="background-color: #0288d1" variant="elevated">
          <v-icon left>mdi-map</v-icon> Map View
        </v-btn>
        <v-btn block class="mt-9" color="white" variant="text" @click="$router.push('/login')">
          <v-icon left>mdi-logout</v-icon> Log out
        </v-btn>
      </v-container>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-0 fill-height">
        <!-- Map Section -->
        <div id="map" class="map-container"></div>
        <!-- Placeholder for the map -->
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'

// Profile Picture Logic
const profileImage = ref('https://via.placeholder.com/200')
const profileFile = ref(null)
const showChangePicture = ref(false)

const toggleChangePicture = () => {
  showChangePicture.value = !showChangePicture.value
}

const onFileSelected = () => {
  if (profileFile.value) {
    const reader = new FileReader()
    reader.onload = (e) => {
      profileImage.value = e.target.result
      localStorage.setItem('profileImage', profileImage.value)
    }
    reader.readAsDataURL(profileFile.value)
  }
}

// Barangay Coordinates
const barangayCoordinates = {
  Ambago: [8.9706, 125.5334],
  Ampayon: [8.9801, 125.553],
  Libertad: [8.9489, 125.5372],
  BaanRiverside: [8.9567, 125.5521],
  // Add more barangays as needed
}

onMounted(() => {
  // Initialize map centered at Butuan City
  const map = L.map('map').setView([8.9475, 125.5406], 13)

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

  // Add markers for each barangay
  for (const [name, coords] of Object.entries(barangayCoordinates)) {
    L.marker(coords).addTo(map).bindPopup(`📍 ${name}`)
  }

  // Your code for displaying event indicators
  const storedEvents = localStorage.getItem('events')
  if (storedEvents) {
    const events = JSON.parse(storedEvents)

    // Track which barangays have at least one event
    const activeBarangays = new Set()

    Object.values(events).forEach((dayEvents) => {
      dayEvents.forEach((event) => {
        if (event.barangay) {
          activeBarangays.add(event.barangay.trim())
        }
      })
    })

    // Show indicator for each barangay with event
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

// Function to display event details when a barangay is clicked
const selectedDate = ref(new Date().toISOString().split('T')[0]) // Initialize with today's date
const showEventDetails = (barangay) => {
  const storedEvents = localStorage.getItem('events')
  if (storedEvents) {
    const events = JSON.parse(storedEvents)
    const todayEvents = events[selectedDate.value] || []
    const barangayEvents = todayEvents.filter((event) => event.barangay === barangay)

    if (barangayEvents.length > 0) {
      const eventDetails = barangayEvents
        .map(
          (ev) => `
      Event: ${ev.title}
      Doctor: ${ev.doctor}
      Start Time: ${ev.startTime}
      End Time: ${ev.endTime}
      Description: ${ev.description}
      `,
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

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  z-index: 1;
}
</style>
