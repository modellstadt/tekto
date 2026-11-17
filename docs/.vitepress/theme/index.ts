// The default VitePress theme with tekto's colours (greyscale, one muted slate-blue accent),
// and a clip of the model in the home page's hero instead of a picture.
import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import HeroClip from "./HeroClip.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { "home-hero-image": () => h(HeroClip) }),
};
