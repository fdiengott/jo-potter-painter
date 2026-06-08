# Videos are referenced by external URL, never stored in-repo

Each Artwork may have an optional `video` field holding a YouTube URL. Video is embedded from YouTube at view time; no video file is ever committed to the repository.

Chosen over self-hosting (`.mp4` in `src/assets/`) because `astro:assets` does not optimise video, video binaries bloat the Git history, and — decisively — the deferred self-serve admin commits uploads to Git as Base64. A multi-megabyte video Base64'd into a commit is unworkable, whereas pasting a URL is trivial. YouTube was preferred over Vimeo for reach/SEO.

Note to self (I am the only future contributor): resist the urge to add video uploads to the admin flow — the whole media-by-reference model exists to keep the repo light and the commit-based admin viable. Images remain in-repo and optimised; video stays external.
