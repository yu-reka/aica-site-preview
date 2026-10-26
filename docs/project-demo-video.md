# Project demo video: frontend preparation

A supplied video with a non-empty src (or source[src]) inside .pjd .pjhero is enhanced with a 16:9 stage. The video is the only visible hero medium while its address is present. Existing photo/gallery/thumbnail nodes are retained but hidden, so removing the video restores the original representative media. Entering the detail attempts muted inline playback; blocked autoplay exposes a start button and native controls. Leaving the detail or hiding the tab pauses playback.

Without a video address, existing photos, thumbnails, illustrations and their representative-image caption remain unchanged. A network-free preparation message is only created when there is no existing visual media. Removing a video address hides its empty stage when photos remain.

## Future integration

This PR does not define or change upload, database or public API fields. Once that contract is agreed, stories-render.js can output video[src] or video > source[src] using the existing shared URL validation. No current API-to-video mapping is added. Never put a video URL into an image field or bypass public-content validation. Source changes and newly generated detail nodes are observed.

Before connecting real media, verify seek, volume, fullscreen, captions and real iPhone/Galaxy playback. Temporary synthetic media and regression fixtures are kept outside the repository and actual DB/snapshots.
