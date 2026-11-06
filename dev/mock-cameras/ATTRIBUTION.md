# Mock footage attribution

Footage: Multiview Extended Video with Activities (MEVA), by Kitware Inc. and
the Intelligence Advanced Research Projects Activity (IARPA).

Dataset: https://mevadata.org/

Publisher's license: https://mevadata.org/resources/MEVA-data-license.txt

License: Creative Commons Attribution 4.0 International (CC BY 4.0):
https://creativecommons.org/licenses/by/4.0/

The selected source files are identified by exact download URLs, SHA-256 hashes,
and excerpt boundaries in `sources.json` alongside this document in the repository.
They are from the `drops-123-r13` release, not the separate HADCV22 challenge set.

- Main Entrance: `2018-03-07.16-50-06.16-55-06.school.G300.r13.avi`, seconds 0-90.
- Corridor: `2018-03-07.16-50-01.16-55-01.school.G423.r13.avi`, seconds 100-190.
- Car Park: `2018-03-07.16-50-06.16-55-06.school.G336.r13.avi`, seconds 75-165.

Changes made for local simulation: trimmed excerpts, omitted audio, normalized
frame rate to 15 fps, encoded H.264/yuv420p with a two-second GOP, and fitted into
a 1920 x 1080 frame with padding where needed. Playback repeats continuously.
No actors, movements, or detection events have been synthesized.

Retain creator attribution, source/license links, supplied notices, and this
description of changes if sharing footage or derived recordings. The footage
is not relicensed under the application's MIT license. Do not imply endorsement
by the creators. CC BY 4.0 does not grant trademark or personality rights and
includes no warranties. See the linked license for the full terms.

Publication reference: Kellie Corona, Katie Osterdahl, Roderic Collins, and
Anthony Hoogs, "MEVA: A Large-Scale Multiview, Multimodal Video Dataset for
Activity Detection," WACV 2021.
