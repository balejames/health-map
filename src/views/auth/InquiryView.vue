<template>
  <v-app>
    <v-row no-gutters>
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
        <v-btn block class="mt-9 mb-3" color="white" variant="text" @click="$router.push('/dashboard')">
          <v-icon left>mdi-view-dashboard</v-icon> Dashboard
        </v-btn>
        <v-btn block class="mb-3" color="white" variant="text" @click="$router.push('/map')">
          <v-icon left>mdi-map</v-icon> Map View
        </v-btn>
        <v-btn block class="mb-3" style="background-color: #0288d1" variant="elevated">
          <v-icon left>mdi-comment-question</v-icon> Inquiry
        </v-btn>
        <v-btn block class="mt-9" color="white" variant="text" @click="$router.push('/login')">
          <v-icon left>mdi-logout</v-icon> Log out
        </v-btn>
      </v-container>
    </v-navigation-drawer>


      <!-- Main Chat Area -->
      <v-col cols="9" class="pa-6" style="background-color: #ccf5e7;">
        <div class="chat-bubble left">Hello, how can I help you?</div>
        <div class="chat-bubble right">I need assistance with the map.</div>
        <div class="chat-bubble right">Can you guide me?</div>

        <v-text-field
          class="mt-10"
          placeholder="What do you want to ask the team?"
          variant="outlined"
          hide-details
        />
      </v-col>
    </v-row>
  </v-app>
</template>

<script setup>
// No logic needed for static mockup
</script>

<style scoped>
.chat-bubble {
  max-width: 60%;
  padding: 12px 18px;
  margin: 10px 0;
  border-radius: 20px;
  display: inline-block;
}

.left {
  background-color: white;
  align-self: flex-start;
}

.right {
  background-color: #2196f3;
  color: white;
  align-self: flex-end;
  margin-left: auto;
}
</style>
