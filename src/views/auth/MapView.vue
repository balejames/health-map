<script setup>
import { ref } from 'vue'
const drawer = ref(true)
</script>
<template>
  <v-layout>
    <v-navigation-drawer
      v-model="drawer"
      :permanent="$vuetify.display.mdAndUp"
      temporary
      app
      image="https://cdn.vuetifyjs.com/images/backgrounds/bg-2.jpg"
      theme="dark"
      class="pa-0"
    >
      <!-- Flex wrapper to center content vertically -->
      <div class="d-flex flex-column justify-center align-center" style="height: 100%">
        <v-list nav class="text-center w-100">
          <!-- Dashboard -->
          <RouterLink to="/dashboard" class="text-decoration-none">
            <v-list-item class="py-6" link>
              <v-list-item-content class="text-center">
                <v-icon
                  size="40"
                  class="mb-2 transition-fast-in-fast-out"
                  :color="$route.path === '/dashboard' ? '#0dceda' : 'white'"
                  :class="{ 'active-icon': $route.path === '/dashboard' }"
                  >mdi-view-dashboard</v-icon
                >
                <v-list-item-title
                  class="text-h6"
                  :style="{ color: $route.path === '/dashboard' ? '#0dceda' : 'white' }"
                  >Dashboard</v-list-item-title
                >
              </v-list-item-content>
            </v-list-item>
          </RouterLink>
          <!-- Map -->

          <div v-if="$route.path !== '/map'">
            <RouterLink to="/map" class="text-decoration-none">
              <v-list-item class="py-6" link>
                <v-list-item-content class="text-center">
                  <v-icon size="40" class="mb-2">mdi-google-maps</v-icon>
                  <v-list-item-title class="text-h6">Map</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </RouterLink>
          </div>
          <div v-else>
            <v-list-item class="py-6 active-tab">
              <v-list-item-content class="text-center">
                <v-icon size="40" class="mb-2">mdi-google-maps</v-icon>
                <v-list-item-title class="text-h6">Map</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </div>
        </v-list>
      </div>
    </v-navigation-drawer>
  </v-layout>
</template>
<style scoped>
.active-tab {
  background-color: rgba(13, 206, 218, 0.1); /* light teal background */
  border-left: 4px solid #0dceda;
  border-radius: 8px;
}

.active-icon {
  transform: scale(1.2);
  transition: transform 0.2s ease-in-out;
}
</style>
