<template><p v-if="messages?.length" class="mt-1 text-xs font-medium text-red-700" role="status">{{ Array.isArray(messages) ? messages[0] : messages }}</p></template>
<script setup>defineProps({ messages: { type: [Array, String], default: null } })</script>
