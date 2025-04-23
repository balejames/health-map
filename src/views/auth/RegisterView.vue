<script setup>
import { ref } from 'vue'

import { requiredValidator, emailValidator, confirmedValidator } from '@/utils/validators.js'
import { supabase, formActionDefault } from '@/utils/supabase.js'

const isPasswordVisible = ref(false)
const isPasswordConfirmVisible = ref(false)
const refVForm = ref()

const formDataDefault = {
  firstName: '',
  lastName: '',
  email: '',
  barangay: '',
  password: '',
  password_confirmation: '',
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
</script>
<template>
  <v-alert
    v-if="formAction.formSuccessMessage"
    :text="formAction.formSuccessMessage"
    title="Success!"
    type="success"
    variant="tonal"
    density="compact"
    border="start"
    closable
  >
  </v-alert>
  <v-alert
    v-if="formAction.formErrorMessage"
    :text="formAction.formErrorMessage"
    title="Ooops!"
    type="error"
    variant="tonal"
    density="compact"
    border="start"
    closable
  >
  </v-alert>

  <div class="create-account-wrapper">
    <v-container fluid>
      <v-row justify="center" align="center" class="fill-height">
        <v-col cols="12" sm="4" md="5" lg="4" class="text-center mb-4">
          <v-card class="mx-auto" elevation="24">
            <template v-slot:title>
              <h2 class="text-center">Create account</h2>
            </template>
            <v-card-text>
              <v-form ref="refVForm" @submit.prevent="onFormSubmit">
                <v-text-field
                  v-model="formData.firstname"
                  label="First Name"
                  required
                  variant="outlined"
                  :rules="[requiredValidator]"
                >
                </v-text-field>
                <v-text-field
                  v-model="formData.lastname"
                  label="Last Name"
                  required
                  variant="outlined"
                  :rules="[requiredValidator]"
                >
                </v-text-field>
                <v-text-field
                  v-model="formData.email"
                  label="Email"
                  required
                  type="email"
                  variant="outlined"
                  :rules="[requiredValidator, emailValidator]"
                ></v-text-field>

                <v-text-field
                  v-model="formData.barangay"
                  label="Barangay"
                  required
                  type="text"
                  variant="outlined"
                  :rules="[requiredValidator]"
                ></v-text-field>

                <v-text-field
                  v-model="formData.password"
                  label="Password"
                  required
                  variant="outlined"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  :rules="[requiredValidator, passwordValidator]"
                ></v-text-field>

                <v-text-field
                  v-model="formData.password_confirmation"
                  label="Password Confirmation"
                  required
                  variant="outlined"
                  :type="isPasswordConfirmVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordConfirmVisible ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="isPasswordConfirmVisible = !isPasswordConfirmVisible"
                  :rules="[
                    requiredValidator,
                    confirmedValidator(formData.password_confirmation, formData.password),
                  ]"
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
                  <RouterLink class="text-primary" to="/" style="text-decoration: none"
                    >Sign in!</RouterLink
                  >
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

.create-account-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  background-image: url('/images/Background-Register.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: fixed;
}
</style>
