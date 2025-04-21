<template>
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
          <img :src="profileImage" alt="Profile" width="80" height="80" style="object-fit: cover" />
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
      <v-btn block class="mt-9 mb-3" style="background-color: #0288d1" variant="elevated">
        <v-icon left>mdi-view-dashboard</v-icon> Dashboard
      </v-btn>
      <v-btn block class="mb-3" color="white" variant="text" @click="$router.push('/map')">
        <v-icon left>mdi-map</v-icon> Map View
      </v-btn>
      <v-btn block class="mb-3" color="white" variant="text" @click="$router.push('/inquiry')">
        <v-icon left>mdi-comment-question</v-icon> Inquiry
      </v-btn>
      <v-btn block class="mt-9" color="white" variant="text" @click="$router.push('/login')">
        <v-icon left>mdi-logout</v-icon> Log out
      </v-btn>
    </v-container>
  </v-navigation-drawer>
</template>
<script setup></script>
<style scoped></style>
