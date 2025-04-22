<template>
  <v-app>
    <!-- Sidebar -->
    <v-navigation-drawer app permanent color="#03a9f4" dark>
      <v-container class="text-center py-5">
        <!-- Profile Picture as Clickable Circle -->
        <div style="position: relative; display: inline-block">
          <v-avatar size="80" class="mx-auto mb-4" @click="toggleChangePicture" style="cursor: pointer">
            <img :src="profileImage" alt="Profile" width="80" height="80" style="object-fit: cover" />
          </v-avatar>

          <!-- Hidden File Input for Changing Profile Picture -->
          <input v-if="showChangePicture" type="file" accept="image/*" @change="onFileSelected"
                 style="position: absolute; top: 0; left: 0; width: 80px; height: 80px; opacity: 0; cursor: pointer" />
        </div>

        <!-- Navigation Buttons -->
        <v-btn block class="mt-9 mb-3" color="white" variant="text" @click="$router.push('/dashboard')">
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
      </v-container>
    </v-main>

    <!-- Modal for Event Details -->
    <v-dialog v-model="eventDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Event Details</span>
        </v-card-title>
        <v-card-text>
          <div v-if="selectedEvent">
            <p><strong>Event Title:</strong> {{ selectedEvent.title }}</p>
            <p><strong>Doctor:</strong> {{ selectedEvent.doctor }}</p>
            <p><strong>Start Time:</strong> {{ selectedEvent.startTime }}</p>
            <p><strong>End Time:</strong> {{ selectedEvent.endTime }}</p>
            <p><strong>Description:</strong> {{ selectedEvent.description }}</p>
          </div>
          <div v-else>
            <p>No events found for this barangay today.</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="eventDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import L from 'leaflet'

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
const todaysEvents = ref([])
const expandedEvents = ref([])
const mapRef = ref(null)

onMounted(() => {
  const storedEvents = localStorage.getItem('events')
  const today = selectedDate.value

  if (storedEvents) {
    const events = JSON.parse(storedEvents)
    todaysEvents.value = events[today] || []
    expandedEvents.value = todaysEvents.value.map(() => false)
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

  if (storedEvents) {
    const events = JSON.parse(storedEvents)
    const activeBarangays = new Set()

    Object.values(events).forEach((dayEvents) => {
      dayEvents.forEach((event) => {
        if (event.barangay) {
          activeBarangays.add(normalize(event.barangay.trim()))
        }
      })
    })

    activeBarangays.forEach((barangayKey) => {
      const entry = Object.entries(barangayCoordinates).find(
        ([key]) => normalize(key) === barangayKey
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
          .bindPopup(`<b>Barangay ${name}</b><br>Has event today or upcoming.`)
          .on('click', () => showEventDetails(name))
      }
    })
  }
})

// Normalize string for matching
const normalize = (name) => name.toLowerCase().replace(/\s+/g, '')

// Show event details in modal
const eventDialog = ref(false)
const selectedEvent = ref(null)

const showEventDetails = (barangay) => {
  const storedEvents = localStorage.getItem('events')
  if (storedEvents) {
    const events = JSON.parse(storedEvents)
    const todayEvents = events[selectedDate.value] || []

    const normalizedBarangay = normalize(barangay)
    const barangayEvents = todayEvents.filter(
      (event) => normalize(event.barangay) === normalizedBarangay
    )

    if (barangayEvents.length > 0) {
      selectedEvent.value = barangayEvents[0]
    } else {
      selectedEvent.value = null
    }
  } else {
    selectedEvent.value = null
  }

  eventDialog.value = true

  nextTick(() => {
    setTimeout(() => {
      if (mapRef.value) {
        mapRef.value.invalidateSize()
      }
    }, 300)
  })
}
</script>


<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  z-index: 1;
}
</style>
