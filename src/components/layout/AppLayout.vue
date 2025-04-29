<script setup>
import { isAuthenticated } from '@/utils/supabase.js'
impor
import { onMounted, ref } from 'vue'
//import { useDisplay } from 'vuetify'

// load variables
const isLoggedIn = ref(false)

// get authentication status from supabase
const getLoggedStatus = async () => {
  isLoggedIn.value = await isAuthenticated()
}

// load fuctions during components rendering
onMounted(() => {
  getLoggedStatus()
})
</script>
<template>
  <ProfileHeader v-if="isLoggedIn"> </ProfileHeader>
</template>
