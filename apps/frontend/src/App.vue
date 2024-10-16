<script setup lang="ts">
import { ref } from 'vue';

const response = ref<string | null>(null);

function startLinkedInAuthorization() {
  fetch('/api/login', {
    method: 'GET',
  })
    .then(response => response.json())
    .then(({ redirectUrl }) => {
      if (redirectUrl) {
        console.log('redirectUrl frontend', redirectUrl)
        // Redirect the user to the received URL
        location.href = redirectUrl;
      } else {
        console.error('Redirect URL missing from the response');
      }
    })
    .catch(error => {
      console.error('Failed to fetch authorization URL:', error);
    });
}
</script>

<template>
  <div>
    <button class="linkedin-btn" @click="startLinkedInAuthorization">
      Login with LinkedIn
    </button>
    <div v-if="response">{{ response }}</div>
  </div>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
}
</style>


<style scoped>
form {
  display: flex;
  flex-direction: column;
}
</style>

<style scoped>
form {
  display: flex;
  flex-direction: column;
}

button {
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
}

.linkedin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0077b5;
  color: white;
  font-weight: bold;
  font-size: 28px;

  padding: 15px 20px;
  ;
  margin-top: 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
}

.linkedin-icon {
  width: 28px;
  height: 28px;
  margin-right: 10px;
  fill: white;
}

.linkedin-btn:hover {
  background-color: #005582;
}
</style>
