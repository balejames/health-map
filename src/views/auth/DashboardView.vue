<template>
  <v-app>
    <!-- Sidebar -->
    <v-navigation-drawer permanent class="healthmap-sidebar" width="100">
      <div class="nav-icons">
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
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('home')
</script>

<style scoped>
.healthmap-sidebar {
  border-radius: 0 60px 60px 0;
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

.schedule-card {
  background-color: #c6fce6;
  border-radius: 40px;
  padding: 40px;
  margin-top: 30px;
}
</style>
