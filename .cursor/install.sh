#!/usr/bin/env bash
# Idempotent dependency bootstrap for the etsy-typography render workspace.
# Safe to run repeatedly: npm install, playwright, and pip are all convergent.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Node deps (Playwright is the only dependency; drives the HTML->PNG renderers).
npm install

# Headless Chromium + its system libraries for the Cocoa / line-art renderers.
npx playwright install --with-deps chromium

# Python libs for the Pocket / mockup / deliverable scripts (Pillow, numpy, OpenCV).
pip3 install --user Pillow numpy opencv-python-headless

echo "etsy-typography environment ready."
