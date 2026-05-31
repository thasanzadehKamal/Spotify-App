/*
  Spotify UI demo logic (no real audio)
*/

window.addEventListener("DOMContentLoaded", () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    currentIndex: 0,
    isPlaying: false,
    shuffle: false,
    repeat: "off", // off | one | all
    volume: 30,
    liked: new Set(), // row indices
    // fake progress (1..100 slider)
    progressValue: 30,
  };

  // table
  const table = $(".playlist-songs table");
  const allTr = table ? $$('tr', table) : [];
  const songRowEls = allTr.length ? allTr.slice(1) : []; // skip header row

  const readSongFromRow = (tr, index) => {
    const titleEl = $(".song-name", tr);
    const artistEl = $(".song-artist", tr);
    const albumEl = $(".song-album", tr);
    const coverEl = $(".song-image img", tr);
    const durationEl = $(".song-duration", tr);

    return {
      index,
      title: titleEl ? titleEl.textContent.trim() : `Song ${index + 1}`,
      artist: artistEl ? artistEl.textContent.trim() : "Unknown artist",
      album: albumEl ? albumEl.textContent.trim() : "Unknown album",
      coverSrc: coverEl ? coverEl.getAttribute("src") : "",
      durationText: durationEl ? durationEl.textContent.trim() : "3:26",
    };
  };

  const updatePlayStateUI = () => {
    const pauseSpan = $(".pause-button");
    if (!pauseSpan) return;

    const img = pauseSpan.querySelector("img");
    if (!img) return;

    img.src = state.isPlaying ? "assets/Pause.svg" : "assets/Pause.svg";
    // We don't have a real play icon set in markup; keep pause svg, just change styling.
    pauseSpan.classList.toggle("is-playing", state.isPlaying);
  };

  const updateFooterFromIndex = () => {
    const tr = songRowEls[state.currentIndex];
    if (!tr) return;

    const data = readSongFromRow(tr, state.currentIndex);

    const footerTitle = $(".footer-player-left-song-name");
    const footerArtist = $(".footer-player-left-song-artist");
    const currentCover = $(".current-song-cover img");

    if (footerTitle) footerTitle.textContent = data.title;
    if (footerArtist) footerArtist.textContent = data.artist;
    if (currentCover && data.coverSrc) currentCover.src = data.coverSrc;

    songRowEls.forEach((r) => r.classList.remove("is-active"));
    tr.classList.add("is-active");

    // like icon
    const likeIcon = $(".footer-player-left-like img");
    if (likeIcon) {
      const liked = state.liked.has(state.currentIndex);
      likeIcon.src = liked ? "assets/FiiledLike.svg" : "assets/FiiledLike.svg";
      likeIcon.classList.toggle("is-liked", liked);
    }
  };

  const toggleLike = () => {
    if (state.liked.has(state.currentIndex)) state.liked.delete(state.currentIndex);
    else state.liked.add(state.currentIndex);

    updateFooterFromIndex();
  };

  const getNextIndex = () => {
    const n = songRowEls.length;
    if (!n) return 0;

    if (state.shuffle) {
      if (n === 1) return 0;
      let next = state.currentIndex;
      while (next === state.currentIndex) next = Math.floor(Math.random() * n);
      return next;
    }

    if (state.currentIndex + 1 < n) return state.currentIndex + 1;

    if (state.repeat === "one") return state.currentIndex;
    return 0; // repeat all or off -> wrap to start
  };

  const getPrevIndex = () => {
    const n = songRowEls.length;
    if (!n) return 0;

    if (state.shuffle) {
      if (n === 1) return 0;
      let prev = state.currentIndex;
      while (prev === state.currentIndex) prev = Math.floor(Math.random() * n);
      return prev;
    }

    if (state.currentIndex - 1 >= 0) return state.currentIndex - 1;

    if (state.repeat === "one") return state.currentIndex;
    return n - 1;
  };

  const goToIndex = (i) => {
    if (!songRowEls.length) return;
    state.currentIndex = Math.max(0, Math.min(songRowEls.length - 1, i));
    updateFooterFromIndex();
  };

  // Repeat/shuffle UI toggles
  const setShuffleUI = () => {
    const shuffleBtn = $(".footer-player-middle-buttons img[src='assets/Shuffle.svg']");
    if (shuffleBtn) shuffleBtn.classList.toggle("is-active", state.shuffle);
  };

  const setRepeatUI = () => {
    const repeatBtn = $(".footer-player-middle-buttons img[src='assets/Repeat.svg']");
    if (!repeatBtn) return;
    repeatBtn.classList.toggle("is-active", state.repeat !== "off");
    // We can also change title via dataset
    repeatBtn.title = state.repeat === "off" ? "Repeat Off" : state.repeat === "one" ? "Repeat One" : "Repeat All";
  };

  const setProgressUIFromValue = (v) => {
    state.progressValue = v;
    const left = $(".footer-player-middle .player-time:first-of-type");
    const right = $(".footer-player-middle .player-time:last-of-type");
    if (!left || !right) return;

    const leftSeconds = Math.round((v / 100) * 4 * 60 + (v / 100) * 15); // fake
    const mm = Math.floor(leftSeconds / 60);
    const ss = leftSeconds % 60;
    left.textContent = `${mm}:${String(ss).padStart(2, "0")}`;

    // keep right as fake total
    right.textContent = "4:34";
  };

  // Events
  // song row click
  if (table) {
    table.addEventListener("click", (e) => {
      const tr = e.target.closest("tr");
      if (!tr || tr === table.querySelector("tr")) return; // header
      const idx = songRowEls.indexOf(tr);
      if (idx === -1) return;
      goToIndex(idx);
    });
  }

  // play/pause
  $(".pause-button")?.addEventListener("click", (e) => {
    e.stopPropagation();
    state.isPlaying = !state.isPlaying;
    updatePlayStateUI();
  });

  // next/prev
  $(".footer-player-middle-buttons img[src='assets/Next.svg']")?.addEventListener("click", (e) => {
    e.stopPropagation();
    goToIndex(getNextIndex());
  });
  $(".footer-player-middle-buttons img[src='assets/Previous.svg']")?.addEventListener("click", (e) => {
    e.stopPropagation();
    goToIndex(getPrevIndex());
  });

  // shuffle
  $(".footer-player-middle-buttons img[src='assets/Shuffle.svg']")?.addEventListener("click", (e) => {
    e.stopPropagation();
    state.shuffle = !state.shuffle;
    setShuffleUI();
  });

  // repeat
  $(".footer-player-middle-buttons img[src='assets/Repeat.svg']")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state.repeat === "off") state.repeat = "one";
    else if (state.repeat === "one") state.repeat = "all";
    else state.repeat = "off";
    setRepeatUI();
  });

  // like
  $(".footer-player-left-like")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleLike();
  });

  // volume
  $(".footer-player-right .player-slider input")?.addEventListener("input", (e) => {
    state.volume = Number(e.target.value);
  });

  // progress
  const progressInput = $(".footer-player-middle .player-slider input");
  progressInput?.addEventListener("input", (e) => {
    setProgressUIFromValue(Number(e.target.value));
  });

  // expand/collapse playlist (new feature)
  // We'll collapse the long playlist list into a smaller preview.
  const playlists = $$(".menu.playlists ul li", document);

  const playlistMenu = $(".menu.playlists");
  if (playlistMenu && playlists.length > 6) {
    const previewCount = 6;
    playlists.forEach((li, i) => {
      if (i >= previewCount) li.classList.add("is-collapsed");
    });

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Show more";
    btn.className = "playlist-toggle";

    playlistMenu.appendChild(btn);

    btn.addEventListener("click", () => {
      const isExpanded = btn.dataset.expanded === "true";
      if (isExpanded) {
        btn.textContent = "Show more";
        btn.dataset.expanded = "false";
        playlists.forEach((li, i) => {
          if (i >= previewCount) li.classList.add("is-collapsed");
        });
      } else {
        btn.textContent = "Show less";
        btn.dataset.expanded = "true";
        playlists.forEach((li, i) => {
          li.classList.remove("is-collapsed");
        });
      }
    });
  }

  // initial UI
  songRowEls.forEach((tr, i) => (tr.dataset.songIndex = String(i)));
  setShuffleUI();
  setRepeatUI();
  updateFooterFromIndex();
  setProgressUIFromValue(state.progressValue);
  updatePlayStateUI();
});

