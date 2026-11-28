<template>
  <article class="rounded-xl bg-cyan-50 p-5">
    <p class="text-sm">{{ article.categorie }} · {{ statusLabel }} · {{ knowledgeAudienceLabel(article.audience) }}</p>
    <h3 class="my-4 text-xl font-bold">{{ article.titre }}</h3>
    <p class="whitespace-pre-wrap break-words">{{ article.contenu }}</p>
  </article>
</template>
<script setup>
import { knowledgeAudienceLabel } from '../ui.js'
// Le texte est rendu sans HTML pour conserver la séparation entre contenu et code.
defineProps({ article: { type: Object, required: true }, statusLabel: { type: String, default: '' } })
</script>
