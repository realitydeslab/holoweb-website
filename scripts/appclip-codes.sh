#!/usr/bin/env bash
# Generates App Clip Codes for every short link in content/shortlinks.json into public/appclip/<code>.svg.
# Needs Apple's App Clip Code Generator (developer.apple.com/download/all, "App Clip Code Generator").
# Only generate codes after https://web.holokit.io/c/ is registered as an advanced App Clip experience
# in App Store Connect; until then the codes scan but do not open the App Clip.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v AppClipCodeGenerator >/dev/null || { echo "AppClipCodeGenerator not found" >&2; exit 1; }
mkdir -p public/appclip
for code in $(node -e 'console.log(Object.keys(require("./content/shortlinks.json")).join(" "))'); do
  out="public/appclip/$code.svg"
  [ -f "$out" ] && continue # codes are permanent; never regenerate over a printed one
  AppClipCodeGenerator generate --url "https://web.holokit.io/c/$code" \
    --foreground 000000 --background FFFFFF --output "$out"
  echo "wrote $out"
done
