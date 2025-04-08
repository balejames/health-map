<template>
  <v-app>
    <!-- Sidebar -->
    <v-navigation-drawer permanent class="healthmap-sidebar" width="200">
      <div class="nav-icons">
        <v-btn
          icon
          variant="flat"
          class="nav-btn"
          :class="{ active: activeTab === 'home' }"
          @click="activeTab = 'home'"
        >
          <v-icon size="40">mdi-home</v-icon>
        </v-btn>

        <v-btn
          icon
          variant="flat"
          class="nav-btn"
          :class="{ active: activeTab === 'calendar' }"
          @click="activeTab = 'calendar'"
        >
          <v-icon size="40">mdi-calendar-month</v-icon>
        </v-btn>

        <v-btn
          icon
          variant="flat"
          class="nav-btn"
          :class="{ active: activeTab === 'map' }"
          @click="activeTab = 'map'"
        >
          <v-icon size="40">mdi-map-marker</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main class="main-content">
      <v-container fluid>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="10" md="8" lg="6" xl="5">
            <v-card class="schedule-card">
              <v-card-text>
                <h2>Schedule Today:</h2>
                <!-- You can add schedule content here -->
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('home')
</script>

<style scoped>
.healthmap-sidebar {
  background-color: #0cd3dc;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding-top: 50px;
}

.nav-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.nav-btn {
  background-color: transparent;
  color: white;
}

.nav-btn.active {
  background-color: white;
  color: #0cd3dc;
  border-radius: 12px;
}

.main-content {
  padding: 40px;
}

.schedule-card {
  background-color: #c6fce6;
  border-radius: 40px;
  padding: 40px;
  margin-top: 30px;
}
</style>
