<script setup>
import AlertNotification from '@/components/layout/AlertNotification.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { requiredValidator, emailValidator } from '@/utils/validators.js'
import { formActionDefault, supabase } from '@/utils/supabase.js'

const router = useRouter()

const formDataDefault = {
  email: '',
  password: '',
  barangay: '',
  role: '',
}

const formData = ref({ ...formDataDefault })

const formAction = ref({ ...formActionDefault })

const isPasswordVisible = ref(false)
const refVForm = ref()
const logoRef = ref(null)
const isAnimating = ref(true)

// Animation function to be called on mount
onMounted(() => {
  startLogoAnimation()
})

const startLogoAnimation = () => {
  if (logoRef.value) {
    // Add the floating animation class to the logo
    logoRef.value.classList.add('floating-animation')
  }
}

const stopLogoAnimation = () => {
  if (isAnimating.value && logoRef.value) {
    logoRef.value.classList.remove('floating-animation')
    isAnimating.value = false
  }
}

const onSubmit = async () => {
  formAction.value = { ...formActionDefault }
  formAction.value.formProcess = true

  //Sign in with email + password only
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.value.email,
    password: formData.value.password,
  })

  if (error) {
    formAction.value.formErrorMessage = error.message
    formAction.value.formStatus = error.status
  } else if (data?.user) {
    const userMeta = data.user.user_metadata

    // Validate barangay and role
    if (userMeta.barangay !== formData.value.barangay || userMeta.role !== formData.value.role) {
      formAction.value.formErrorMessage =
        'Invalid credentials. Please check your barangay and role.'
      formAction.value.formStatus = 401
      //sign out the user immediately
      await supabase.auth.signOut()
    } else {
      formAction.value.formSuccessMessage = 'Account Logged in successfully!'
      router.replace('/dashboard')
    }
  }

  refVForm.value?.reset()
  formAction.value.formProcess = false
}

const onFormSubmit = () => {
  // Stop the animation when user clicks login
  stopLogoAnimation()

  refVForm.value?.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
}
</script>
<template>
  <div class="login-wrapper">
    <v-container fluid>
      <v-row class="fill-height pa-4" align="center" justify="center" style="gap: 2rem">
        <v-col cols="12" class="d-md-none text-center mb-4">
          <img src="/images/LoginIcon.png" class="mobile-logo" alt="Health Map Logo" />
        </v-col>

        <!--Logo-->
        <v-col cols="12" md="6" class="text-section d-none d-md-flex align-center justify-center">
          <img
            ref="logoRef"
            src="/images/LoginIcon.png"
            class="animated-logo"
            alt="Health Map Logo"
          />
        </v-col>

        <!-- Login Form -->
        <v-col cols="12" sm="10" md="6" lg="4">
          <v-card class="mx-auto" elevation="24">
            <template v-slot:title>
              <h2 class="text-center pt-4">Log In</h2>
            </template>

            <AlertNotification
              :form-success-message="formAction.formSuccessMessage"
              :form-error-message="formAction.formErrorMessage"
            ></AlertNotification>

            <v-card-text>
              <v-form class="mt-5" ref="refVForm" @submit.prevent="onFormSubmit">
                <v-text-field
                  v-model="formData.email"
                  label="Email"
                  prepend-inner-icon="mdi-email"
                  rounded
                  required
                  type="email"
                  variant="outlined"
                  :rules="[requiredValidator, emailValidator]"
                  autocomplete="email"
                ></v-text-field>

                <v-text-field
                  label="Password"
                  prepend-inner-icon="mdi-lock"
                  rounded
                  required
                  variant="outlined"
                  v-model="formData.password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  :rules="[requiredValidator]"
                  autocomplete="current-password"
                ></v-text-field>

                <v-row dense>
                  <v-col cols="6">
                    <v-select
                      v-model="formData.barangay"
                      :items="['Ampayon', 'Taligaman', 'Antongalon', 'Baan Km.3', 'Ambago']"
                      label="Barangay"
                      prepend-inner-icon="mdi-map-marker"
                      rounded
                      variant="outlined"
                      :rules="[requiredValidator]"
                      required
                      autocomplete="address-level2"
                    ></v-select>
                  </v-col>

                  <v-col cols="6">
                    <v-select
                      v-model="formData.role"
                      :items="['Employee', 'Resident']"
                      label="Role"
                      prepend-inner-icon="mdi-account"
                      rounded
                      required
                      variant="outlined"
                      :rules="[requiredValidator]"
                      autocomplete="organization-title"
                    ></v-select>
                  </v-col>
                </v-row>

                <v-btn
                  style="background-color: #0dceda; color: white"
                  class="custom-login my-2 mx-auto d-block"
                  :disabled="formAction.formProcess"
                  :loading="formAction.formProcess"
                  @click="onFormSubmit"
                  type="submit"
                >
                  Log In
                </v-btn>

                <v-divider class="my-5"></v-divider>

                <h4 class="text-center" style="color: #0dceda">
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

<style scoped>
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
  background: url('/images/LogInBackground.png');
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

h2 {
  color: #0dceda;
  font-family: 'Times New Roman', Times, serif;
}

p {
  color: white;
  font-size: 125%;
  font-family: 'Times New Roman', Times, serif;
}

.animated-logo {
  width: 500px;
  height: 500px;
  will-change: transform;
  margin-left: -200px;
}

.animated-logo.floating-animation {
  animation: floatingForm 3s ease-in-out infinite;
}

.animated-logo:hover {
  transform: scale(1.1);
}

.mobile-logo {
  width: 200px;
  height: auto;
  transition: transform 0.3s ease-in-out;
}

.mobile-logo:hover {
  transform: scale(1.05);
}

.logo-bounce {
  animation: bounce 0.6s ease;
}

.floating-animation {
  animation: floatingForm 3s ease-in-out infinite;
  position: relative;
}

@keyframes floatingForm {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(10px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
