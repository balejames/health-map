<script setup>
import AlertNotification from '@/components/layout/AlertNotification.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
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
const canvasRef = ref(null)
const isLoading = ref(true) // Added for loading screen

// Animation function to be called on mount
onMounted(() => {
  // Show loading screen for 3 seconds
  setTimeout(() => {
    isLoading.value = false
    // Logo animation is now directly applied via class in template
    initParticlesAnimation()
  }, 3000)

  // Initialize loading screen particles
  initLoadingParticles()
})

onBeforeUnmount(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
  if (loadingAnimationFrameId.value) {
    cancelAnimationFrame(loadingAnimationFrameId.value)
  }
})

const startLogoAnimation = () => {
  if (logoRef.value) {
    // Add the floating animation class to the logo
    logoRef.value.classList.add('enhanced-floating-animation')
  }
}

const stopLogoAnimation = () => {
  if (isAnimating.value && logoRef.value) {
    logoRef.value.classList.remove('enhanced-floating-animation')
    isAnimating.value = false
  }
}

// Particles Animation Variables
const particles = ref([])
const animationFrameId = ref(null)
const loadingCanvasRef = ref(null)
const loadingParticles = ref([])
const loadingAnimationFrameId = ref(null)

// Cloud Particle class for loading screen
class CloudParticle {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height * 0.7
    this.size = Math.random() * 60 + 30
    this.speedX = Math.random() * 1 - 0.5
    this.color = 'rgba(255, 255, 255, ' + (Math.random() * 0.4 + 0.1) + ')'
    this.radiusX = this.size * 1.2
    this.radiusY = this.size * 0.6
  }

  update() {
    this.x += this.speedX

    // Wrap around the screen
    if (this.x < -this.size * 2) {
      this.x = this.canvas.width + this.size
    }
    if (this.x > this.canvas.width + this.size * 2) {
      this.x = -this.size
    }
  }

  draw() {
    this.ctx.fillStyle = this.color
    this.ctx.beginPath()

    // Draw cloud-like shape
    this.ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Add some bumps to make it look more like a cloud
    this.ctx.beginPath()
    this.ctx.arc(this.x - this.size/2, this.y - this.size/4, this.size/2, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.beginPath()
    this.ctx.arc(this.x + this.size/2, this.y - this.size/6, this.size/2.5, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y - this.size/3, this.size/3, 0, Math.PI * 2)
    this.ctx.fill()
  }
}

// Initialize loading screen particles
const initLoadingParticles = () => {
  if (!loadingCanvasRef.value) return

  const canvas = loadingCanvasRef.value
  const ctx = canvas.getContext('2d')

  // Set canvas to full window size
  const resizeCanvas = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // Create cloud particles
  loadingParticles.value = []
  const cloudCount = 15
  for (let i = 0; i < cloudCount; i++) {
    loadingParticles.value.push(new CloudParticle(canvas))
  }

  // Animation loop for loading screen
  const animateLoading = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    loadingParticles.value.forEach(particle => {
      particle.update()
      particle.draw()
    })

    loadingAnimationFrameId.value = requestAnimationFrame(animateLoading)
  }

  animateLoading()
}

// Enhanced Particle class for more attractive particles
class Particle {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.size = Math.random() * 5 + 2  // Slightly larger particles
    this.speedX = (Math.random() - 0.5) * 1.5  // Adjusted speed
    this.speedY = (Math.random() - 0.5) * 1.5  // Adjusted speed
    this.color = getRandomColor()
    this.pulseSpeed = 0.03 + Math.random() * 0.02
    this.pulseDirection = 1
    this.pulseAmount = 0
    this.originalSize = this.size
    this.opacity = Math.random() * 0.5 + 0.3  // Add opacity variation
  }

  update() {
    this.x += this.speedX
    this.y += this.speedY

    // Bounce off the edges
    if (this.x < 0 || this.x > this.canvas.width) {
      this.speedX = -this.speedX
    }
    if (this.y < 0 || this.y > this.canvas.height) {
      this.speedY = -this.speedY
    }

    // Add gentle pulsing effect
    this.pulseAmount += this.pulseSpeed * this.pulseDirection
    if (this.pulseAmount > 0.5 || this.pulseAmount < 0) {
      this.pulseDirection *= -1
    }
    this.size = this.originalSize * (1 + this.pulseAmount * 0.3)
  }

  draw() {
    // Create a glowing effect
    const gradient = this.ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 2
    )

    // Extract base color for glow
    const baseColor = this.color.substring(0, this.color.lastIndexOf(','))

    gradient.addColorStop(0, this.color)
    gradient.addColorStop(0.5, baseColor + ', ' + (this.opacity * 0.5) + ')')
    gradient.addColorStop(1, baseColor + ', 0)')

    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2)
    this.ctx.fill()

    // Core of the particle
    this.ctx.fillStyle = this.color
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    this.ctx.fill()
  }
}

// Get a random color based on theme
function getRandomColor() {
  // Main theme color: #0dceda (13, 206, 218)
  const colors = [
    'rgba(13, 206, 218, 0.9)',   // Main theme color - brighter
    'rgba(13, 206, 218, 0.7)',   // Main theme color
    'rgba(13, 206, 218, 0.5)',   // Lighter theme
    'rgba(11, 185, 196, 0.7)',   // Slightly darker theme
    'rgba(10, 164, 174, 0.6)',   // Darker theme
    'rgba(153, 236, 242, 0.6)',  // Light teal
    'rgba(202, 245, 248, 0.5)',  // Very light teal
    'rgba(235, 255, 250, 0.7)',  // Card background color
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

const initParticlesAnimation = () => {
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  // Set canvas to full window size
  const resizeCanvas = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // Create particles
  particles.value = []
  const particleCount = Math.min(Math.floor(window.innerWidth / 8), 150) // Increased count
  for (let i = 0; i < particleCount; i++) {
    particles.value.push(new Particle(canvas))
  }

  // Animation loop
  const animate = () => {
    // Use a semi-transparent clear to create trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    particles.value.forEach(particle => {
      particle.update()
      particle.draw()
    })

    // Connect nearby particles with lines
    connectParticles(ctx)

    animationFrameId.value = requestAnimationFrame(animate)
  }

  animate()
}

// Function to connect particles with lines if they are close enough
const connectParticles = (ctx) => {
  for (let a = 0; a < particles.value.length; a++) {
    for (let b = a; b < particles.value.length; b++) {
      const dx = particles.value[a].x - particles.value[b].x
      const dy = particles.value[a].y - particles.value[b].y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Increased connection distance
      const maxDistance = 120

      if (distance < maxDistance) {
        const opacity = 1 - distance / maxDistance
        ctx.strokeStyle = `rgba(13, 206, 218, ${opacity * 0.5})`
        ctx.lineWidth = 1.5 * opacity // Make lines thicker but fade out with distance
        ctx.beginPath()
        ctx.moveTo(particles.value[a].x, particles.value[a].y)
        ctx.lineTo(particles.value[b].x, particles.value[b].y)
        ctx.stroke()
      }
    }
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
  <!-- Loading Screen -->
  <div v-if="isLoading" class="loading-screen">
    <canvas ref="loadingCanvasRef" class="loading-canvas"></canvas>
    <div class="loading-content">
      <div class="loading-text">Loading...</div>
      <div class="loading-spinner"></div>
    </div>
  </div>

  <!-- Login Page -->
  <div v-else class="login-wrapper">
    <!-- Canvas for particles animation -->
    <canvas ref="canvasRef" class="particles-canvas"></canvas>

    <v-container fluid>
      <v-row class="fill-height pa-4" align="center" justify="center" style="gap: 2rem">
        <v-col cols="12" class="d-md-none text-center mb-4">
          <img src="/images/LoginIcon.png" class="mobile-logo enhanced-floating-animation" alt="Health Map Logo" />
        </v-col>

        <!--Logo-->
        <v-col cols="12" md="6" class="text-section d-none d-md-flex align-center justify-center">
          <img
            ref="logoRef"
            src="/images/LoginIcon.png"
            class="animated-logo enhanced-floating-animation"
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

.custom-login {
  height: 50px;
  width: 150px;
  font-size: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.custom-login:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 14px rgba(13, 206, 218, 0.3);
}

.custom-login:active {
  transform: translateY(1px);
}

.v-card {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background-color: #ebfffa;
  position: relative;
  z-index: 10;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.v-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(13, 206, 218, 0.15);
}

.login-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url(/images/LOG-IN_BACKGROUND.png);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  background-attachment: fixed;
  position: relative;
  overflow: hidden; /* Ensure particles stay contained */
}

.particles-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none; /* This allows clicks to pass through the canvas */
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
  position: relative;
  z-index: 5;
  transform-origin: center center;
  margin-left: -250px;
  transition: transform 0.2s ease-in-out;
}

@keyframes enhancedFloating {
  0% {
    transform: translateY(-15px) translateX(5px) rotate(0.5deg);
  }
  25% {
    transform: translateY(0px) translateX(8px) rotate(0.2deg);
  }
  50% {
    transform: translateY(15px) translateX(3px) rotate(-0.3deg);
  }
  75% {
    transform: translateY(5px) translateX(-5px) rotate(-0.7deg);
  }
  100% {
    transform: translateY(-15px) translateX(5px) rotate(0.5deg);
  }
}

.animated-logo.enhanced-floating-animation {
  animation: enhancedFloating 8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

.animated-logo:hover {
  animation-play-state: paused;
  transform: scale(1.05);
}

.mobile-logo {
  width: 160px;
  height: auto;
  transition: transform 0.3s ease-in-out;
  position: relative;
  z-index: 5;
}

@keyframes enhancedMobileFloating {
  0% {
    transform: translateY(-8px) rotate(0.5deg);
  }
  33% {
    transform: translateY(5px) rotate(-0.3deg);
  }
  66% {
    transform: translateY(0px) rotate(0.2deg);
  }
  100% {
    transform: translateY(-8px) rotate(0.5deg);
  }
}

.mobile-logo.enhanced-floating-animation {
  animation: enhancedMobileFloating 6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

.mobile-logo:hover {
  transform: scale(1.05);
  animation-play-state: paused;
}

.logo-bounce {
  animation: bounce 0.6s ease;
}

@keyframes floatingLogo {
  0% {
    transform: translateY(0px);
  }
  25% {
    transform: translateY(-15px);
  }
  50% {
    transform: translateY(0px);
  }
  75% {
    transform: translateY(15px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes floatingMobile {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
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
