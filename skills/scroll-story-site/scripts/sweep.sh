#!/usr/bin/env bash
# Screenshot every chapter of a scroll-story page at four viewports, so cut-off copy, overlaps and a missed
# landing show up before a human has to scroll for them.
# Usage: sweep.sh <url> <out_dir>      (out_dir must be absolute: agent-browser saves relative to its own cwd)
# Needs agent-browser. Uses its own session so it never touches a browser the user has open.
set -euo pipefail
url=${1:?url}; out=${2:?out_dir}
mkdir -p "$out"
S() { agent-browser --session sweep "$@"; }

for vp in 1440x900 1180x800 1024x768 390x844; do
  w=${vp%x*}; h=${vp#*x}
  S set viewport "$w" "$h" >/dev/null
  S open "$url$([[ $url == *\?* ]] && echo '&' || echo '?')v=$RANDOM" >/dev/null
  S wait 2500 >/dev/null
  n=$(S eval 'document.querySelectorAll("[data-ch]").length')
  n=${n//\"/}
  for ((c = 0; c < n; c++)); do
    # scroll to 15% into the chapter: inside the hold, where the pose is exact and the copy fully on
    S eval "(() => { const s = document.querySelector('[data-ch=\"$c\"]'); scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * 0.15); return 1; })()" >/dev/null
    S wait 900 >/dev/null
    S screenshot "$out/${vp}-ch$c.png" >/dev/null
  done
  S eval 'scrollTo(0, document.body.scrollHeight); 1' >/dev/null
  S wait 600 >/dev/null
  S screenshot "$out/${vp}-after.png" >/dev/null
  echo "$vp: $n chapters"
done
S errors || true
S close >/dev/null
echo "screenshots in $out"
