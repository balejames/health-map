<script setup>
import { formActionDefault, supabase } from '@/utils/supabase.js'
import { ref, computed, onMounted} from 'vue'
import { useRouter } from 'vue-router'
import { profileImage, updateProfileImage } from '@/utils/eventBus.js'

const router = useRouter()
const formAction = ref({ ...formActionDefault })

// Logout Logic
const logout = async () => {
  formAction.value = { ...formActionDefault }
  formAction.value.formProcess = true

  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error logging out:', error)
    return
  }
  formAction.value.formProcess = false
  router.replace('/')
}

// Check if there are services for a given date
const hasServices = (date) => {
  return services.value[date] && services.value[date].length > 0
}

// Reactive form for New Service
const selectedDate = ref('')
const newService = ref({
  title: '',
  description: '',
  barangay: '',
  doctor: '',
  startTime: '',
  endTime: '',
  date: '', // Add date field to the form
})
const services = ref({}) // Grouped services by date
const dailyServices = ref([]) // Services for the selected date
const dialog = ref(false)

// Barangay List (Dropdown)
const barangayList = [
  { name: 'Ampayon' },
  { name: 'Ambago' },
  { name: 'Antongalon' },
  { name: 'Baan Km. 3' },
  { name: 'Maon' },
  { name: 'Taligaman' },
]

const barangayOptions = computed(() => barangayList.map((b) => b.name))

// Date Management for Calendar
const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const monthYearLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }),
)

const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())

const blankDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  return Array.from({ length: firstDay }, (_, i) => i)
})

// FIXED: Updated getDate function to properly format date without timezone issues
const getDate = (day) => {
  // Create date object using local timezone
  const date = new Date(currentYear.value, currentMonth.value, day)

  // Format to YYYY-MM-DD ensuring we don't lose a day due to timezone conversion
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')

  // Return in YYYY-MM-DD format
  return `${year}-${month}-${dayStr}`
}

// FIXED: Updated isToday function to use the same date formatting approach
const isToday = (dateString) => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayFormatted = `${year}-${month}-${day}`

  return dateString === todayFormatted
}

const onDateClick = (date) => {
  selectedDate.value = date
  getServicesForDate()
}

const getServicesForDate = () => {
  dailyServices.value = services.value[selectedDate.value] || []
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

// Open Add Service Dialog
const openServiceDialog = () => {
  // Initialize form with selected date
  newService.value.date = selectedDate.value
  dialog.value = true
}

// Add Service to Supabase
const addService = async () => {
  try {
    // Use the form's date field instead of selectedDate
    const serviceDate = newService.value.date || selectedDate.value

    // Create ISO format timestamp strings that include timezone info
    const startDateTime = new Date(`${serviceDate}T${newService.value.startTime}:00`)
    const endDateTime = new Date(`${serviceDate}T${newService.value.endTime}:00`)

    // Format for timestamptz in Supabase
    const startTimestamptz = startDateTime.toISOString()
    const endTimestamptz = endDateTime.toISOString()

    // Form validation
    if (
      !newService.value.title ||
      !newService.value.barangay ||
      !serviceDate ||
      !newService.value.startTime ||
      !newService.value.endTime
    ) {
      alert('Please fill in all required fields (title, barangay, date, start and end time)')
      return
    }

    // Create new service object
    const newServiceData = {
      title: newService.value.title,
      description: newService.value.description,
      doctor: newService.value.doctor,
      barangay: newService.value.barangay,
      start_date_time: startTimestamptz,
      end_date_time: endTimestamptz,
      date: serviceDate,
    }

    // Insert to database
    const { data, error } = await supabase.from('services').insert([newServiceData])

    if (error) {
      console.error('Failed to add service:', error.message)
      alert('Failed to add service: ' + error.message)
      return
    }

    console.log('Service added successfully:', data)

    // Update the local services state to include the new service
    if (!services.value[serviceDate]) {
      services.value[serviceDate] = []
    }

    // For immediate UI update without waiting for database refresh
    services.value[serviceDate].push({
      ...newServiceData,
      id: data?.[0]?.id || Date.now(), // Use returned ID or fallback to timestamp
    })

    // If we're viewing the date that just had a service added, update daily services
    if (selectedDate.value === serviceDate) {
      getServicesForDate()
    }

    dialog.value = false
    await fetchServices() // Refresh all services
    resetServiceForm()
  } catch (e) {
    console.error('Unexpected error while adding service:', e)
    alert('Unexpected error while adding service')
  }
}

// Fetch Services from Supabase
const fetchServices = async () => {
  const { data, error } = await supabase.from('services').select('*')

  if (error) {
    console.error('Error fetching services:', error)
    return
  }

  const grouped = {}
  data.forEach((service) => {
    if (!grouped[service.date]) {
      grouped[service.date] = []
    }
    grouped[service.date].push(service)
  })

  services.value = grouped
  getServicesForDate() // Update daily services for the selected date
}

// Reset Service Form
const resetServiceForm = () => {
  newService.value.title = ''
  newService.value.description = ''
  newService.value.doctor = ''
  newService.value.barangay = ''
  newService.value.startTime = ''
  newService.value.endTime = ''
  newService.value.date = ''
}

const deleteDialog = ref(false)
const selectedServices = ref([])

const openDeleteServiceDialog = () => {
  selectedServices.value = []
  deleteDialog.value = true
}

const deleteSelectedServices = async () => {
  try {
    const servicesToDelete = selectedServices.value
      .map((i) => dailyServices.value[i]?.id)
      .filter(Boolean)

    if (!servicesToDelete.length) {
      console.log('No services selected for deletion')
      return
    }
    const { error } = await supabase.from('services').delete().in('id', servicesToDelete)

    if (error) {
      console.error('Error deleting services:', error)
      alert('Failed to delete services: ' + error.message)
      return
    }

    console.log(`${servicesToDelete.length} service(s) deleted successfully`)
    deleteDialog.value = false

    await fetchServices()
  } catch (e) {
    console.error('Unexpected error while deleting services:', e)
    alert('An unexpected error occurred while deleting services')
  }
}

// Profile image logic
const fileInput = ref(null)
const isProfileMenuOpen = ref(false)

const toggleChangePicture = () => {
  fileInput.value.click()
}

const onFileSelected = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      // Use the shared update function
      updateProfileImage(reader.result)
    }
    reader.readAsDataURL(file)
  }
}

// Calendar Navigation
const goToPrevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value -= 1
  } else {
    currentMonth.value -= 1
  }
}

const goToNextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value += 1
  } else {
    currentMonth.value += 1
  }
}

// Mobile detection
const isMobile = ref(false)

// Function to check screen size
const checkScreen = () => {
  isMobile.value = window.innerWidth < 768
}

// Set up Supabase subscription for real-time updates
const channelRef = ref(null)

const setupRealtimeSubscription = () => {
  channelRef.value = supabase
    .channel('services-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
      console.log('Realtime update received in Dashboard:', payload)
      fetchServices() // Refresh services when there's a change
    })
    .subscribe((status) => {
      console.log('Dashboard subscription status:', status)
    })
}

// On component mount - FIXED: Updated to use consistent date formatting
onMounted(() => {
  // Set default selected date to today using consistent date format
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  selectedDate.value = `${year}-${month}-${day}`

  // Check screen size initially
  checkScreen()

  // Add resize event listener
  window.addEventListener('resize', checkScreen)

  // Fetch services
  fetchServices()

  // Set up realtime updates
  setupRealtimeSubscription()
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
        class="ml-2 mr-2"
      ></v-img>

      <h2 class="white--text truncate-title" style="color: white; cursor: pointer">Health Map</h2>

      <!-- Navigation Buttons - Hide on mobile -->
      <div class="d-none d-sm-flex">
        <router-link to="/dashboard">
          <v-btn text style="color: white"> Dashboard </v-btn>
        </router-link>

        <router-link to="/map">
          <v-btn text style="color: white"> Map View </v-btn>
        </router-link>
      </div>

      <v-spacer></v-spacer>

      <!-- Mobile Navigation Menu -->
      <v-menu v-if="isMobile" location="bottom end" offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item to="/dashboard">
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item>
          <v-list-item to="/map">
            <v-list-item-title>Map View</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Profile Menu -->
      <v-menu v-model="isProfileMenuOpen" location="bottom end" offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <!-- Use the profile image here -->
            <v-avatar size="32">
              <v-img :src="profileImage" alt="Profile Picture" />
            </v-avatar>
          </v-btn>
        </template>

        <v-card class="pa-2" :width="isMobile ? '200px' : '256px'">
          <v-list>
            <!-- Profile Picture -->
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
      <v-container fluid class="px-2 px-sm-4">
        <!-- Carousel with responsive height -->
        <v-carousel :height="isMobile ? 200 : 300" hide-delimiter-background show-arrows="hover">
          <v-carousel-item src="/images/CAROUSEL1.png" cover></v-carousel-item>
          <v-carousel-item src="/images/CAROUSEL2.png" cover></v-carousel-item>
        </v-carousel>

        <v-row>
          <!-- Calendar Column - Shown first on mobile -->
          <v-col cols="12" md="6" :order="isMobile ? '1' : '2'" class="pt-3 pt-md-6">
            <div class="calendar-wrapper">
              <div class="calendar-header">
                <v-btn icon @click="goToPrevMonth"><v-icon>mdi-chevron-left</v-icon></v-btn>
                <span>{{ monthYearLabel }}</span>
                <v-btn icon @click="goToNextMonth"><v-icon>mdi-chevron-right</v-icon></v-btn>
              </div>

              <div class="calendar-weekdays">
                <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
              </div>

              <div class="calendar-days">
                <div
                  v-for="blank in blankDays"
                  :key="'b-' + blank"
                  class="calendar-day empty"
                ></div>

                <div
                  v-for="day in daysInMonth"
                  :key="day"
                  class="calendar-day"
                  @click="onDateClick(getDate(day))"
                  :class="{ selected: selectedDate === getDate(day), today: isToday(getDate(day)) }"
                >
                  <span>{{ day }}</span>
                  <span v-if="hasServices(getDate(day))" class="service-dot"></span>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Service Today Column -->
          <v-col cols="12" md="6" :order="isMobile ? '2' : '1'" class="pt-3 pt-md-6">
            <!-- Services Card -->
            <v-card class="mb-4">
              <v-card-title class="service-title">
                {{
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'Service Today'
                    : 'Services for ' + selectedDate
                }}
                <v-spacer />
              </v-card-title>

              <v-divider></v-divider>

              <v-card-text>
                <v-list v-if="dailyServices.length" dense>
                  <v-list-item v-for="(service, index) in dailyServices" :key="index">
                    <v-card class="pa-3 pa-md-4" color="#e6f2fc" flat rounded>
                      <div>
                        <div class="text-primary font-weight-bold text-body-1 text-md-h6">
                          {{ service.title }}
                        </div>
                        <div class="mb-2 text-caption text-md-body-2">
                          {{ service.description }}
                        </div>

                        <div class="d-flex align-center mb-1 text-caption text-md-body-2">
                          <v-icon size="small" class="mr-2">mdi-account</v-icon>
                          <span>{{ service.doctor }}</span>
                        </div>

                        <div class="d-flex align-center mb-1 text-caption text-md-body-2">
                          <v-icon size="small" class="mr-2">mdi-map-marker</v-icon>
                          <span>{{ service.barangay }}</span>
                        </div>

                        <div class="d-flex align-center text-caption text-md-body-2">
                          <v-icon size="small" class="mr-2">mdi-clock-time-four</v-icon>
                          <span>
                            {{ formatTime(service.start_date_time) }} -
                            {{ formatTime(service.end_date_time) }}
                          </span>
                        </div>
                      </div>
                    </v-card>
                  </v-list-item>
                </v-list>

                <div v-else class="text-center py-4">No service for this day.</div>

                <div class="d-flex justify-center mt-4" v-if="selectedDate">
                  <v-btn
                    color="#5da8ca"
                    :size="isMobile ? 'small' : 'default'"
                    class="mr-2"
                    @click="openServiceDialog"
                  >
                    Add
                  </v-btn>
                  <v-btn
                    color="error"
                    :size="isMobile ? 'small' : 'default'"
                    @click="openDeleteServiceDialog"
                    :disabled="!dailyServices.length"
                  >
                    Delete
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Delete Service Dialog -->
        <v-dialog v-model="deleteDialog" :max-width="isMobile ? '95%' : '500px'">
          <v-card>
            <v-card-title class="text-h6">Select Service(s) to Delete</v-card-title>
            <v-card-text>
              <v-list dense>
                <v-list-item
                  v-for="(service, index) in dailyServices"
                  :key="index"
                  class="hoverable"
                >
                  <v-list-item-action>
                    <v-checkbox
                      v-model="selectedServices"
                      :value="index"
                      color="error"
                      hide-details
                    ></v-checkbox>
                  </v-list-item-action>

                  <div>
                    <div class="text-subtitle-1 font-weight-medium">{{ service.title }}</div>
                    <div class="text-body-2">{{ service.description }}</div>
                  </div>
                </v-list-item>
              </v-list>
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn text @click="deleteDialog = false">Cancel</v-btn>
              <v-btn color="error" text @click="deleteSelectedServices">Delete</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Add Service Dialog -->
        <v-dialog v-model="dialog" :max-width="isMobile ? '95%' : '500px'">
          <v-card class="pa-3 pa-sm-6">
            <v-card-title class="service-title">
              Add Service
              <v-spacer />
            </v-card-title>

            <v-card-text class="pa-3 pa-md-4">
              <v-text-field v-model="newService.title" label="Service Title" required dense />
              <v-textarea v-model="newService.description" label="Description" rows="2" dense />
              <v-text-field v-model="newService.doctor" label="Doctor" dense />
              <v-select
                v-model="newService.barangay"
                :items="barangayOptions"
                label="Barangay"
                required
                dense
                :rules="[(v) => !!v || 'Barangay is required']"
              />

              <!-- Add date picker -->
              <v-text-field
                v-model="newService.date"
                label="Date"
                type="date"
                :min="new Date().toISOString().split('T')[0]"
                required
                dense
              />

              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newService.startTime"
                    label="Start Time"
                    type="time"
                    required
                    dense
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newService.endTime"
                    label="End Time"
                    type="time"
                    required
                    dense
                  />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions class="pa-3 pa-md-4">
              <v-spacer />
              <v-btn text @click="dialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="addService">Save Service</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.dashboard-bg {
  background-image: url('/images/DashboardBackground.png');
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
}

.calendar-wrapper {
  background-color: #e0fff4;
  border-radius: 12px;
  padding: 12px;
}

.calendar-header {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  color: white;
  background-color: #47b8c7;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-weekdays,
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  text-align: center;
}

.truncate-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

@media (max-width: 600px) {
  .calendar-day {
    padding: 5px;
    font-size: 12px;
  }

  .calendar-header span {
    font-size: 14px;
  }

  .calendar-weekdays,
  .calendar-days {
    gap: 4px;
  }

  .weekday {
    font-size: 12px;
  }

  .calendar-wrapper {
    padding: 8px;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .calendar-day {
    padding: 8px;
    font-size: 14px;
  }

  .calendar-header span {
    font-size: 16px;
  }
}

.toolbar-title {
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.calendar-day {
  background-color: white;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  position: relative;
}

.calendar-day.selected {
  background-color: #0288d1;
  color: white;
}

.calendar-day.today {
  background-color: #b3e5fc;
  color: #0277bd;
  font-weight: bold;
}

.service-dot {
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background-color: rgb(84, 101, 255);
  border-radius: 50%;
}

.empty {
  background-color: transparent;
}

.v-btn {
  margin-block: 8px;
}

.service-title {
  background-color: #9bd1f8;
  font-weight: bold;
  color: #ffffff;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 18px;
  padding: 12px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
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

.v-dialog .v-card {
  border-radius: 12px;
  background-color: #fff;
}

.v-card-title {
  font-weight: 600;
  font-size: 18px;
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
}

/* Adjust spacing for mobile */
@media (max-width: 600px) {
  .v-btn {
    margin-block: 4px;
  }

  .service-title {
    font-size: 16px;
    padding: 10px;
  }

  .v-card-title {
    font-size: 16px;
  }
}
</style>
