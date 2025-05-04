<script setup>
import { ref, onMounted } from 'vue'
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
const isLoading = ref(true) // Add state to control loading screen visibility
const loadingCanvasRef = ref(null) // Add ref for the canvas element

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

// Loading animation function
const setupLoadingAnimation = () => {
  const canvas = loadingCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // Particles array for animation
  const particles = []
  const particleCount = 50

  // Create particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 4 + 2,
      color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`,
      speedX: Math.random() * 2 - 1,
      speedY: Math.random() * 2 - 1
    })
  }

  // Animation function
  const animate = () => {
    if (!isLoading.value) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw and update particles
    particles.forEach(particle => {
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fillStyle = particle.color
      ctx.fill()

      // Update position
      particle.x += particle.speedX
      particle.y += particle.speedY

      // Wrap around canvas
      if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
      if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1
    })

    requestAnimationFrame(animate)
  }

  animate()
}

// Handle window resize for canvas
const handleResize = () => {
  if (loadingCanvasRef.value) {
    loadingCanvasRef.value.width = window.innerWidth
    loadingCanvasRef.value.height = window.innerHeight
  }
}

onMounted(() => {
  // Set up loading animation
  setupLoadingAnimation()
  window.addEventListener('resize', handleResize)

  // Simulate loading completion after 2 seconds
  setTimeout(() => {
    isLoading.value = false
  }, 2000)

  return () => {
    window.removeEventListener('resize', handleResize)
  }
})

const onSubmit = async () => {
  formAction.value = { ...formActionDefault }
  formAction.value.formProcess = true

  try {
    const { data, error } = await supabase.auth.signUp({
      email: formData.value.email,
      password: formData.value.password,
      options: {
        data: {
          firstName: formData.value.firstName,
          lastName: formData.value.lastName,
          barangay: formData.value.barangay,
          role: formData.value.role,
          is_admin: false,
        },
      },
    })

    if (error) {
      formAction.value.formErrorMessage = error.message
      formAction.value.formStatus = error.status
      return
    }

    if (!data.user) {
      formAction.value.formErrorMessage = 'User registration failed'
      return
    }
    const numericId = Date.now()
    const { error: insertError } = await supabase.from('profiles').insert({
      id: numericId,
      email: data.user.email,
      first_name: formData.value.firstName,
      last_name: formData.value.lastName,
      barangay: formData.value.barangay,
      role: formData.value.role,
      is_admin: false,
    })

    if (insertError) {
      console.error('Profile insertion error:', insertError)
      formAction.value.formErrorMessage = `Profile creation failed: ${insertError.message}`
    } else {
      formAction.value.formSuccessMessage = 'Account created successfully!'
      router.replace('/dashboard')
    }
  } catch (err) {
    console.error('Registration error:', err)
    formAction.value.formErrorMessage = `An unexpected error occurred: ${err.message}`
  } finally {
    formAction.value.formProcess = false
  }
}

const onFormSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
}
</script>
<template>
  <!-- Loading Screen -->
  <div v-if="isLoading" class="loading-screen">
    <canvas ref="loadingCanvasRef" class="loading-canvas"></canvas>
    <div class="loading-content">
      <div class="loading-text">Loading...</div>
      <div class="loading-spinner"></div>
    </div>
  </div>

  <div v-else class="create-account-wrapper">
    <!-- Cloud animation elements -->
    <div class="clouds-container">
      <!-- SVG Clouds - Left side (original) -->
      <svg class="cloud cloud-1" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M25,50 C25,30 45,30 45,30 L55,30 C55,30 75,25 75,45 C75,60 65,60 65,60 L35,60 C35,60 25,60 25,50 Z" fill="rgba(255, 255, 255, 0.7)"/>
      </svg>

      <svg class="cloud cloud-2" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M20,50 C20,35 35,35 40,35 L60,35 C70,35 80,30 80,50 C80,65 70,65 65,65 L35,65 C25,65 20,60 20,50 Z" fill="rgba(255, 255, 255, 0.8)"/>
      </svg>

      <svg class="cloud cloud-3" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M15,55 C15,40 30,40 40,40 L60,40 C75,40 85,35 85,50 C85,65 75,65 65,65 L30,65 C20,65 15,65 15,55 Z" fill="rgba(255, 255, 255, 0.6)"/>
      </svg>

      <!-- Additional left side clouds -->
      <svg class="cloud cloud-6" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M20,45 C20,30 35,30 45,30 L55,30 C65,30 80,30 80,45 C80,60 70,60 60,60 L40,60 C30,60 20,60 20,45 Z" fill="rgba(255, 255, 255, 0.55)"/>
      </svg>

      <svg class="cloud cloud-7" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M30,40 C30,25 40,25 50,25 L60,25 C70,25 75,30 75,40 C75,50 65,55 55,55 L45,55 C35,55 30,50 30,40 Z" fill="rgba(255, 255, 255, 0.65)"/>
      </svg>

      <!-- SVG Clouds - Right side (original) -->
      <svg class="cloud cloud-4" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M10,50 C10,30 30,30 40,30 L70,30 C80,30 90,35 90,50 C90,70 75,70 60,70 L30,70 C15,70 10,65 10,50 Z" fill="rgba(255, 255, 255, 0.75)"/>
      </svg>

      <svg class="cloud cloud-5" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M15,45 C15,30 30,30 40,30 L65,30 C75,30 85,35 85,50 C85,65 70,65 60,65 L30,65 C20,65 15,55 15,45 Z" fill="rgba(255, 255, 255, 0.65)"/>
      </svg>

      <!-- Additional right side clouds -->
      <svg class="cloud cloud-8" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M15,55 C15,40 25,35 40,35 L60,35 C75,35 85,40 85,55 C85,70 75,70 60,70 L35,70 C20,70 15,70 15,55 Z" fill="rgba(255, 255, 255, 0.7)"/>
      </svg>

      <svg class="cloud cloud-9" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M25,45 C25,30 35,30 45,30 L65,30 C75,30 80,35 80,45 C80,60 70,60 60,60 L35,60 C25,60 25,55 25,45 Z" fill="rgba(255, 255, 255, 0.6)"/>
      </svg>

      <svg class="cloud cloud-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M20,50 C20,35 30,35 40,35 L55,35 C65,35 75,40 75,50 C75,65 65,65 55,65 L30,65 C20,65 20,60 20,50 Z" fill="rgba(255, 255, 255, 0.5)"/>
      </svg>
    </div>

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
                  autocomplete="email"
                  :rules="[requiredValidator, emailValidator]"
                />
                <v-row dense>
                  <v-col cols="12" sm="6">
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
                  </v-col>
                  <v-col cols="12" sm="6"
                    ><v-select
                      v-model="formData.role"
                      :items="['Employee', 'Resident']"
                      label="Role"
                      prepend-inner-icon="mdi-account-group"
                      rounded
                      required
                      variant="outlined"
                      :rules="[requiredValidator]"
                  /></v-col>
                </v-row>

                <v-text-field
                  v-model="formData.password"
                  label="Password"
                  prepend-inner-icon="mdi-lock"
                  rounded
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  variant="outlined"
                  autocomplete="new-password"
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
                  autocomplete="new-password"
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

.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #0dceda;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.loading-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  color: white;
  font-size: 3rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.98);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}


.create-account-wrapper {
  min-height: 100vh;
  width: 100%;
  background-image: url(/images/SIGN-UP_BACKGROUND.png);
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
  position: relative;
}

/* Cloud container */
.clouds-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

/* Cloud elements - SVG clouds */
.cloud {
  position: absolute;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
}

/* Original left side clouds */
.cloud-1 {
  width: 180px;
  height: 100px;
  top: 10%;
  left: -180px;
  animation: cloud-move-left 80s linear infinite;
}

.cloud-2 {
  width: 250px;
  height: 140px;
  top: 30%;
  left: -250px;
  animation: cloud-move-left 60s linear infinite;
}

.cloud-3 {
  width: 150px;
  height: 80px;
  top: 50%;
  left: -150px;
  animation: cloud-move-left 70s linear infinite;
}

/* Original right side clouds */
.cloud-4 {
  width: 220px;
  height: 120px;
  top: 70%;
  right: -220px;
  animation: cloud-move-right 90s linear infinite;
}

.cloud-5 {
  width: 200px;
  height: 110px;
  top: 85%;
  right: -200px;
  animation: cloud-move-right 75s linear infinite;
}

/* New left side clouds */
.cloud-6 {
  width: 160px;
  height: 90px;
  top: 20%;
  left: -160px;
  animation: cloud-move-left 65s linear infinite 2s; /* Delay of 2s */
}

.cloud-7 {
  width: 180px;
  height: 100px;
  top: 65%;
  left: -180px;
  animation: cloud-move-left 75s linear infinite 5s; /* Delay of 5s */
}

/* New right side clouds */
.cloud-8 {
  width: 230px;
  height: 130px;
  top: 15%;
  right: -230px;
  animation: cloud-move-right 85s linear infinite 3s; /* Delay of 3s */
}

.cloud-9 {
  width: 190px;
  height: 110px;
  top: 40%;
  right: -190px;
  animation: cloud-move-right 70s linear infinite 8s; /* Delay of 8s */
}

.cloud-10 {
  width: 170px;
  height: 95px;
  top: 60%;
  right: -170px;
  animation: cloud-move-right 80s linear infinite 12s; /* Delay of 12s */
}

/* Cloud animations */
@keyframes cloud-move-left {
  0% { left: -180px; }
  50% { left: 50%; } /* Stop at the middle */
  100% { left: -180px; } /* Return to start for looping */
}

@keyframes cloud-move-right {
  0% { right: -220px; }
  50% { right: 50%; } /* Stop at the middle */
  100% { right: -220px; } /* Return to start for looping */
}

/* Card and form styling */
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
  position: relative;
  z-index: 2;
}
</style>
