<script setup lang="ts">
defineProps<{ title: string, type: string }>()
const model = defineModel<string>()
</script>

<template>
  <label>
    <span>{{ title }}</span>
    <input required v-model="model" :type="type"/>
  </label>
</template>

<style scoped>
label {
  display: flex;
  flex-direction: row;
  margin-bottom: 1rem;
  align-items: center;
}

span {
  width: 100px;
}

input {
  flex: 1;
  border-radius: 3px;
  padding: 10px;
  border: 0;
  box-shadow: none;
  outline: none;

}
</style>