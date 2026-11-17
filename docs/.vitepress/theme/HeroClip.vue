<script setup lang="ts">
import { withBase } from "vitepress";
</script>

<!-- The home page's hero: the framed house as a line drawing, a cut travelling down to the plan and back. -->
<template>
  <video
    class="hero-clip"
    :src="withBase('/media/hero.mp4')"
    :poster="withBase('/media/hero-poster.jpg')"
    autoplay
    muted
    loop
    playsinline
    aria-label="A timber-framed house drawn in lines, cut from the roof down to its ground-floor plan"
  />
</template>
