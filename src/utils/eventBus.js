import { ref } from 'vue'

// Create a reactive ref to store the profile image URL
const profileImage = ref('/images/default-avatar.png')

// Function to update the profile image
const updateProfileImage = (newImageUrl) => {
  profileImage.value = newImageUrl

  // Save to localStorage for persistence across page refreshes
  localStorage.setItem('profileImage', newImageUrl)
}

// Function to initialize the profile image from localStorage (if available)
const initProfileImage = () => {
  const savedImage = localStorage.getItem('profileImage')
  if (savedImage) {
    profileImage.value = savedImage
  }
}

// Initialize on load
initProfileImage()

export { profileImage, updateProfileImage }
