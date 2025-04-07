<script setup></script>
<template>
  <div class="dashboard-wrapper">
    <v-container fluid>
      <v-container>
        <v-row justify="center" align="center">
          <v-col
            ><RouterLink to="/"><span>Logout</span></RouterLink></v-col
          >
        </v-row>
      </v-container>
    </v-container>
  </div>
</template>
<style>
.dashboard-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0dceda;
  /*background-image: url('/images/Background (3).png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: fixed;*/
}
</style>
