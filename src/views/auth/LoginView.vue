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

const handleLogin = () => {
  if (!role.value) {
    alert('Please select a role.')
    return
  }

  // Optional: You could redirect to different dashboards per role
  if (role.value === 'Barangay') {
    router.push('/dashboard') // or maybe /barangay-dashboard
  } else if (role.value === 'Viewer') {
    router.push('/dashboard') // or maybe /viewer-dashboard
  } else {
    alert('Invalid role selected.')
  }
}

const isPasswordVisible = ref(false)

const barangay = ref('')
const role = ref('')

const roles = ref(['Viewer', 'Barangay'])
</script>

<template>
  <div class="login-wrapper">
    <v-container fluid>
      <v-row class="fill-height pa-4" align="center" justify="center" style="gap: 2rem">
        <v-col cols="12" md="6" class="text-section">
          <div class="align-center">
            <h1 class="header mb-0 text-start">Health Map</h1>
            <p>
              Health Map links residents with local health resources by helping barangay clinics
              share services and keep the community informed about medical schedules.
            </p>
          </div>
        </v-col>

        <v-col cols="12" sm="10" md="6" lg="4">
          <v-card class="mx-auto" elevation="24">
            <template v-slot:title>
              <h2 class="text-center">Log In</h2>
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

                <router-link to="/dashboard" style="text-decoration: none">
                  <v-btn
                    style="background-color: #0dceda; color: white"
                    class="custom-login my-2 mx-auto d-block"
                    @click="handleLogin"
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
