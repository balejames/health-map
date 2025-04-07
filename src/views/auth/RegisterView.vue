<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const barangay = ref('')

const emailError = ref('')
const passwordError = ref('')
const barangayError = ref('')
const confirmPasswordError = ref('')

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

  // Confirm Password Validation
  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match.'
    valid = false
  } else {
    confirmPasswordError.value = ''
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
    alert(`Submitted: ${email.value}`)
  }
}

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
</script>
<template>
  <div class="create-account-wrapper">
    <v-container fluid>
      <v-row justify="center" align="center" class="fill-height">
        <v-col cols="12" sm="4" md="5" lg="4" class="text-center mb-4">
          <v-card class="mx-auto" elevation="24">
            <template v-slot:title>
              <h2 class="text-center">Create account</h2>
            </template>
            <v-card-text>
              <v-form fast-fail @submit.prevent="submit">
                <v-text-field
                  v-model="email"
                  label="Email"
                  required
                  type="email"
                  :error-messages="emailError"
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

                <v-text-field
                  v-model="password"
                  label="Password"
                  required
                  type="password"
                  :error-messages="passwordError"
                  variant="outlined"
                ></v-text-field>

                <v-text-field
                  v-model="confirmPassword"
                  label="Confirm Password"
                  required
                  type="password"
                  :error-messages="confirmPasswordError"
                  variant="outlined"
                ></v-text-field>

                <v-btn
                  type="submit"
                  style="background-color: #0dceda; color: white"
                  class="custom-create my-2 mx-auto d-block"
                >
                  Create Account
                </v-btn>
                <v-divider class="my-5"></v-divider>
                <h4 class="text-center">
                  Already have an account?
                  <RouterLink class="text-primary" to="/login">Sign in!</RouterLink>
                </h4>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="2"></v-col>
        <v-col cols="12" sm="4" md="5" lg="4" class="text-center mb-4"> </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style>
.create-account-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.custom-create {
  height: 50px;
  width: 200px;
  font-size: 16px;
  border-radius: 8px;
}
h2 {
  color: #6a777b;
  font-family: 'Times New Roman', Times, serif;
}
</style>
