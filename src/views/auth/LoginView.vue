<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const barangay = ref('')
const role = ref('')

const emailError = ref('')
const passwordError = ref('')
const barangayError = ref('')

const roles = ref(['Viewer', 'Barangay'])

const submit = () => {
  let valid = true

  // Email Validation
  if (!validateEmail(email.value)) {
    emailError.value = 'Please enter a valid email address.'
    valid = false
  } else {
    emailError.value = ''
  }

  // Password Validation
  if (!password.value) {
    passwordError.value = 'Password is required.'
    valid = false
  } else {
    passwordError.value = ''
  }

  // Barangay Validation
  if (!barangay.value) {
    barangayError.value = 'Barangay is required.'
    valid = false
  } else {
    barangayError.value = ''
  }

  // If all fields are valid
  if (valid) {
    alert(`Submitted: ${email.value}, Role: ${role.value}`)
  }
}

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
</script>

<template>
  <div class="login-wrapper">
    <v-container fluid>
      <v-row justify="center" align="center" class="fill-height">
        <v-col cols="12" md="6" class="text-section pt-1">
          <div class="align-center">
            <h1 class="header mb-0 text-start">Health Map</h1>
            <p>
              Health Map connects you with the health resources in your community, helping barangay
              clinics share their services with residents in the area while also keeping residents
              updated on medical schedules in their barangay, ensuring they don't miss any health
              assistance.
            </p>
          </div>
        </v-col>
        <v-col cols="1"></v-col>
        <v-col cols="12" sm="8" md="5" lg="4">
          <v-card class="mx-auto" elevation="24">
            <template v-slot:title>
              <h2 class="text-center">Log In</h2>
            </template>
            <v-card-text>
              <v-form @submit.prevent="submit">
                <v-text-field
                  v-model="email"
                  label="Email"
                  required
                  type="email"
                  :error-messages="emailError"
                  variant="outlined"
                ></v-text-field>
                <v-text-field
                  v-model="password"
                  label="Password"
                  required
                  type="password"
                  :error-messages="passwordError"
                  variant="outlined"
                ></v-text-field>
                <v-text-field
                  v-model="barangay"
                  label="Barangay"
                  required
                  type="text"
                  :error-messages="barangayError"
                  variant="outlined"
                ></v-text-field>
                <v-select
                  v-model="role"
                  :items="roles"
                  :rules="[(v) => !!v || 'Role is required']"
                  label="Role"
                  required
                  variant="outlined"
                ></v-select>
                <router-link to="/dashboard" style="text-decoration: none">
                  <v-btn
                    type="submit"
                    style="background-color: #0dceda; color: white"
                    class="custom-login my-2 mx-auto d-block"
                  >
                    Log In
                  </v-btn>
                </router-link>
                <v-divider class="my-5"></v-divider>
                <h4 class="text-center">
                  Don't have an account?
                  <router-link class="text-primary" to="/register" style="text-decoration: none">
                    Sign up!
                  </router-link>
                </h4>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style>
.custom-login {
  height: 50px;
  width: 150px;
  font-size: 16px;
  border-radius: 8px;
}

.v-card {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background-color: #ebfffa;
}

.login-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  background-image: url('/images/Background (3).png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: fixed;
}

.header {
  text-align: center;
  color: white;
  font-family: 'Merriweather', serif;
}

p {
  color: white;
  font-size: 125%;
  font-family: 'Times New Roman', Times, serif;
}
</style>
