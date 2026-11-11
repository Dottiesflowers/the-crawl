#!/bin/bash
# Rebuild public/index.html from game-src/ (run before committing game changes).
set -e
cd "$(dirname "$0")/game-src"
cat v2_head.html v2_level.js v2_world.js v2_hero.js gltfloader.js skelutils.js v2_kit.js v2_props.js items.js v2_skills.js v2_combat.js v2_char.js v2_npc.js v2_ui.js v2_tap.js v2_tricks.js v2_life.js v2_itemfx.js v2_craft.js v2_theme.js v2_sheet.js v2_logic.js \
  | sed 's#https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js#three.min.js#' > ../public/index.html
echo "built public/index.html"
