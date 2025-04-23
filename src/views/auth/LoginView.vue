<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { requiredValidator, emailValidator } from '@/utils/validators.js'

const refVForm = ref()
const formDataDefault = {
  email: '',
  password: '',
  barangay: '',
  role: '',
}
const formData = ref({ ...formDataDefault })

const onSubmit = () => {
  alert(formData.value.email)
}

const onFormSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (Valid) onSubmit()
  })
}

const router = useRouter()

const isPasswordVisible = ref(false)

const barangay = ref('')
const role = ref('')

const roles = ref(['Viewer', 'Barangay'])
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
              <h2 class="text-center">James</h2>
            </template>
            <v-card-text>
              <v-form ref="refVForm" @submit.prevent="onFormSubmit">
                <v-text-field
                  v-model="formData.email"
                  label="Email"
                  required
                  type="email"
                  variant="outlined"
                  :rules="[requiredValidator, emailValidator]"
                ></v-text-field>
                <v-text-field
                  label="Password"
                  required
                  variant="outlined"
                  v-model="formData.password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  :rules="[requiredValidator]"
                ></v-text-field>
                <v-text-field
                  v-model="barangay"
                  label="Barangay"
                  required
                  type="text"
                  variant="outlined"
                  :rules="[requiredValidator]"
                ></v-text-field>
                <v-select
                  v-model="role"
                  :items="roles"
                  label="Role"
                  required
                  variant="outlined"
                  :rules="[requiredValidator]"
                ></v-select>
                <v-btn
                  type="submit"
                  style="background-color: #0dceda; color: white"
                  class="custom-login my-2 mx-auto d-block"
                >
                  Log In
                </v-btn>
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
