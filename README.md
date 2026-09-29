# haro-site

The landing page for [haro](https://github.com/HaziqLucii/haro-oss), served with GitHub Pages at
https://haziqlucii.github.io/haro-site/.

`index.html` (desktop) and `m.html` (phones, 760px and below; each page redirects to the other) are the
Claude Design landing pages. They render through the small runtime in `support.js` (React and Babel
from unpkg). Screenshots are plain `<img>` tags, so touches always scroll; `shots/` holds the screenshots, taken
from the haro desktop app in its capture mode, and `fonts/` the brand fonts.

Downloads are marked coming soon until the first packaged release (AppImage, `.deb`) exists.
