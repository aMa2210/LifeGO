// Character art bundle — kept in its own module so pure-Node tests can import
// lib/character.ts without tripping on Metro-only require() of .mp4 / .png.

import type { CharacterVisual } from "./character";

export const CHARACTER_ASSETS: Record<
  CharacterVisual,
  { video: number | null; image: number | null }
> = {
  "stage-sprout": {
    video: require("../../assets/character/stage-sprout.mp4"),
    image: require("../../assets/character/stage-sprout.png"),
  },
  "stage-shape": {
    video: require("../../assets/character/stage-shape.mp4"),
    image: require("../../assets/character/stage-shape.png"),
  },
  "stage-awaken": {
    video: require("../../assets/character/stage-awaken.mp4"),
    image: require("../../assets/character/stage-awaken.png"),
  },
  "outfit-sport": {
    video: require("../../assets/character/outfit-sport.mp4"),
    image: require("../../assets/character/outfit-sport.png"),
  },
  "outfit-art": {
    video: require("../../assets/character/outfit-art.mp4"),
    image: require("../../assets/character/outfit-art.png"),
  },
  "outfit-social": {
    video: require("../../assets/character/outfit-social.mp4"),
    image: require("../../assets/character/outfit-social.png"),
  },
};

/**
 * The sprout → shape transition video for Profile's 人格年轮 card.
 * 16:9 horizontal. Renders with contain-fit + same-tone background so
 * the character isn't cropped or stretched.
 */
export const CHANGE_VIDEO_ASSET: number = require("../../assets/character/change.mp4");
