<script setup>
import { ref } from 'vue'
import AlertNotification from '@/components/layout/AlertNotification.vue'
import { supabase, formActionDefault } from '@/utils/supabase.js'
import {
  requiredValidator,
  emailValidator,
  passwordValidator,
  confirmedValidator,
} from '@/utils/validators.js'
import { useRouter } from 'vue-router'

const isPasswordVisible = ref(false)
const isPasswordConfirmVisible = ref(false)
const refVForm = ref()
const router = useRouter()

const formDataDefault = {
  firstName: '',
  lastName: '',
  email: '',
  barangay: '',
  password: '',
  password_confirmation: '',
}

const formData = ref({ ...formDataDefault })
const formAction = ref({ ...formActionDefault })

const onSubmit = async () => {
  formAction.value = { ...formActionDefault }
  formAction.value.formProcess = true

  const { data, error } = await supabase.auth.signUp({
    email: formData.value.email,
    password: formData.value.password,
    options: {
      data: {
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        barangay: formData.value.barangay,
        role: formData.value.role,
        is_admin: true,
      },
    },
  })

  if (error) {
    formAction.value.formErrorMessage = error.message
    formAction.value.formStatus = error.status
  } else if (data.user) {
    // 🟢 Insert into profiles table
    const { error: insertError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: data.user.email,
      first_name: formData.value.firstName,
      last_name: formData.value.lastName,
      barangay: formData.value.barangay,
      role: formData.value.role,
      is_admin: true,
    })

    if (insertError) {
      formAction.value.formErrorMessage = insertError.message
    } else {
      formAction.value.formSuccessMessage = 'Account created successfully!'
      router.replace('/dashboard')
    }
  }

  refVForm.value?.reset()
  formAction.value.formProcess = false
}

const onFormSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
}
</script>
<template>
  <div class="create-account-wrapper">
    <v-container class="fill-height" fluid>
      <v-row justify="center" align="center">
        <v-col cols="12" sm="10" md="8" lg="6" xl="4" class="d-flex justify-center">
          <v-card class="pa-4 w-100" elevation="12">
            <template v-slot:title>
              <div class="text-center">
                <h2 class="title" style="color: #0dceda">Create your account</h2>
              </div>
            </template>

            <AlertNotification
              :form-success-message="formAction.formSuccessMessage"
              :form-error-message="formAction.formErrorMessage"
            />

            <v-card-text>
              <v-form ref="refVForm" @submit.prevent="onFormSubmit">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="formData.firstName"
                      label="First Name"
                      prepend-inner-icon="mdi-account"
                      rounded
                      variant="outlined"
                      :rules="[requiredValidator]"
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="formData.lastName"
                      label="Last Name"
                      prepend-inner-icon="mdi-account"
                      rounded
                      variant="outlined"
                      :rules="[requiredValidator]"
                    />
                  </v-col>
                </v-row>

                <v-text-field
                  v-model="formData.email"
                  label="Email Address"
                  prepend-inner-icon="mdi-email"
                  rounded
                  type="email"
                  variant="outlined"
                  :rules="[requiredValidator, emailValidator]"
                />

                <v-select
                  v-model="formData.barangay"
                  :items="['Ampayon', 'Taligaman', 'Antongalon', 'Baan Km.3', 'Ambago']"
                  label="Barangay"
                  prepend-inner-icon="mdi-map-marker"
                  rounded
                  required
                  variant="outlined"
                  :rules="[requiredValidator]"
                />

                <v-select
                  v-model="formData.role"
                  :items="['Employee', 'Resident']"
                  label="Role"
                  prepend-inner-icon="mdi-account-group"
                  rounded
                  required
                  variant="outlined"
                  :rules="[requiredValidator]"
                />

                <v-text-field
                  v-model="formData.password"
                  label="Password"
                  prepend-inner-icon="mdi-lock"
                  rounded
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  variant="outlined"
                  :rules="[requiredValidator, passwordValidator]"
                />

                <v-text-field
                  v-model="formData.password_confirmation"
                  label="Confirm Password"
                  prepend-inner-icon="mdi-shield-lock"
                  rounded
                  :type="isPasswordConfirmVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordConfirmVisible ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="isPasswordConfirmVisible = !isPasswordConfirmVisible"
                  variant="outlined"
                  :rules="[
                    requiredValidator,
                    confirmedValidator(formData.password_confirmation, formData.password),
                  ]"
                />

                <v-btn
                  @click="onFormSubmit"
                  type="submit"
                  class="custom-create my-2 mx-auto d-block"
                  :disabled="formAction.formProcess"
                  :loading="formAction.formProcess"
                >
                  Sign Up
                </v-btn>

                <v-divider class="my-4" />

                <h4 class="text-center" style="color: #0dceda">
                  Already have an account?
                  <RouterLink class="text-primary" to="/login" style="text-decoration: none"
                    >Sign in!</RouterLink
                  >
                </h4>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<style scoped>
.create-account-wrapper {
  min-height: 100vh;
  width: 100%;
  background-image: url('/images/LogInBackground.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
}

.title {
  font-family: 'Times New Roman', Times, serif;
  font-size: 35px;
  margin-bottom: 4px;
  font-weight: 600;
  text-align: center;
  color: #0dceda;
}

.subtitle {
  color: #666;
  font-size: 16px;
  margin-bottom: 20px;
}

.custom-create {
  background-color: #0dceda;
  color: white;
  height: 50px;
  width: 150px;
  font-size: 16px;
  border-radius: 8px;
}

.v-card {
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px;
  background-color: #ffffff;
}
</style>
