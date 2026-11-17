<script setup lang="ts">
// A page of the playground, from a docs page.
//   <Live page="house" />                                  a button that opens it live, and its source
//   <Live page="house" poster="/shots/house-sunset.webp" /> the picture; a click runs the app over the page
//   <Live page="house" link />                             just a link, for a table
//   <Live />                                               the whole playground
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useData, withBase } from "vitepress";

const props = defineProps<{ page?: string; label?: string; poster?: string; alt?: string; link?: boolean }>();
const { theme } = useData();

const base = computed(() => {
  const p: string = theme.value.playground;
  return p.startsWith("http") ? p : withBase(p);
});
const href = computed(() => props.page ? `${base.value}?page=${props.page}` : base.value);
const source = computed(() => `${theme.value.repo}/blob/main/playground/${props.page ? `pages/${props.page}.ts` : "pages"}`);
const text = computed(() => props.page ? `Open live${props.label ? `: ${props.label}` : ""}` : "Open the playground");

const running = ref(false);
const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") running.value = false; };
watch(running, (on) => {
  document.documentElement.style.overflow = on ? "hidden" : "";
  if (on) window.addEventListener("keydown", onKey);
  else window.removeEventListener("keydown", onKey);
});
onBeforeUnmount(() => { running.value = false; });
</script>

<template>
  <figure v-if="poster" class="live-view">
    <button class="live-start" type="button" @click="running = true">
      <img :src="withBase(poster)" :alt="alt ?? ''" />
      <span class="live-play">▶ Run it here</span>
    </button>
    <figcaption class="live-links">
      <a :href="href" target="_blank" rel="noopener">{{ text }} ↗</a>
      <a :href="source" target="_blank" rel="noopener">Source</a>
    </figcaption>
    <Teleport to="body">
      <div v-if="running" class="live-overlay" @click.self="running = false">
        <div class="live-window" role="dialog" :aria-label="label ?? page">
          <div class="live-head">
            <span class="live-title">{{ label ?? page }}</span>
            <a :href="href" target="_blank" rel="noopener">Open in a new tab ↗</a>
            <a :href="source" target="_blank" rel="noopener">Source</a>
            <button type="button" class="live-close" title="Close (Esc)" @click="running = false">×</button>
          </div>
          <iframe :src="`${href}&embed`" :title="label ?? page" allow="fullscreen" />
        </div>
      </div>
    </Teleport>
  </figure>
  <a v-else-if="link" class="live-link" :href="href" target="_blank" rel="noopener">{{ label ?? page }} ↗</a>
  <span v-else class="live-bar">
    <a class="live-open" :href="href" target="_blank" rel="noopener">▶ {{ text }}</a>
    <a class="live-source" :href="source" target="_blank" rel="noopener">source</a>
  </span>
</template>
