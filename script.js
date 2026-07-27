/* ============================================
   Melody Music Player — Main Script
   ============================================ */

let currentSongIndex = 0;
let currentSong = new Audio();
let isShuffle = false;
let isLoop = false;
let playedIndices = [];
let isRepeat = false;
let Songs = [];
const seekbar = document.getElementById("seek-bar");
let currFolder = "";

const play = document.getElementById("play");
const previous = document.getElementById("previous");
const next = document.getElementById("next");

// ===== Utility: Format seconds to mm:ss =====
function convertSeconds(seconds) {
  if (isNaN(seconds)) return "0:00";
  let minutes = Math.floor(seconds / 60);
  let remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// ===== Update seekbar gradient fill =====
function updateSeekbarGradient(percentage) {
  if (seekbar) {
    seekbar.style.background = `linear-gradient(to right, var(--accent, #1db954) ${percentage}%, #4f4f4f ${percentage}%)`;
  }
}

// ===== Setup persistent audio event listeners (once) =====
function setupAudioListeners() {
  currentSong.addEventListener("loadedmetadata", () => {
    document.querySelector(".duration").innerHTML = convertSeconds(currentSong.duration);
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".current-duration").innerHTML = convertSeconds(currentSong.currentTime);
    const percentage = (currentSong.currentTime / currentSong.duration) * 100 || 0;
    seekbar.value = percentage;
    updateSeekbarGradient(percentage);
  });

  currentSong.addEventListener("ended", () => {
    if (isRepeat) {
      playMusic(Songs[currentSongIndex].replace(".mp3", ""));
    } else if (isShuffle) {
      if (!playedIndices.includes(currentSongIndex)) {
        playedIndices.push(currentSongIndex);
      }
      if (playedIndices.length === Songs.length) {
        playedIndices = [];
      }
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * Songs.length);
      } while (playedIndices.includes(nextIndex) && playedIndices.length < Songs.length);
      playedIndices.push(nextIndex);
      currentSongIndex = nextIndex;
      playMusic(Songs[currentSongIndex].replace(".mp3", ""));
    } else {
      playNextSong();
    }
  });
}

// ===== Fetch and display songs from a folder =====
async function getSongs(folder) {
  Songs = [];
  currFolder = folder;

  let a = await fetch(`${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let list = div.getElementsByTagName("a");

  // Load saved library once
  let savedLibrary = JSON.parse(localStorage.getItem("library")) || [];

  for (let i = 0; i < list.length; i++) {
    const element = list[i];
    if (element.href.endsWith(".mp3")) {
      Songs.push(decodeURIComponent(element.href.split(`${folder}/`)[1]));
    }
  }

  let SongDiv = document.querySelector(".lists ul");
  SongDiv.innerHTML = "";

  for (const song of Songs) {
    const songName = song.replace(".mp3", "");
    const isInLibrary = savedLibrary.includes(songName);
    const heartFill = isInLibrary ? "red" : "none";
    const disabledAttr = isInLibrary ? "disabled" : "";

    SongDiv.innerHTML += `
      <li>
        <div class="li-song" style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; cursor:pointer;">
            <img src="images/music.svg" alt="">
            <p style="margin-left:10px;">${songName}</p>
          </div>
          <button class="add-to-library" data-song="${songName}" aria-label="Add to Library" title="Add to Library" style="background:none; border:none; cursor:pointer;" ${disabledAttr}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="${heartFill}" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42
                4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5
                3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55
                11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </li>`;
  }

  // Attach event listeners for "Add to Library" buttons
  document.querySelectorAll(".add-to-library").forEach(button => {
    button.addEventListener("click", function (e) {
      e.stopPropagation(); // prevent li click event
      const songName = this.getAttribute("data-song");
      addToLibrary(songName, this);
    });
  });

  // Attach click listeners to song list items
  Array.from(SongDiv.querySelectorAll("li")).forEach((e, index) => {
    e.addEventListener("click", () => {
      currentSongIndex = index;
      playMusic(Songs[currentSongIndex].replace(".mp3", ""));
    });
  });

  // Reset player state — don't auto-play, just show "Select a song"
  currentSong.pause();
  currentSong.src = "";
  currentSongIndex = 0;
  play.src = "images/play.svg";
  document.querySelector(".current-song p").innerHTML = "Select a song";
  document.querySelector(".current-duration").innerHTML = "0:00";
  document.querySelector(".duration").innerHTML = "0:00";
  seekbar.value = 0;
  updateSeekbarGradient(0);
}

// ===== Play a track =====
const playMusic = (track) => {
  currentSong.pause();
  currentSong.src = `${currFolder}/${track}.mp3`;
  currentSong.play();
  play.src = "images/pause.svg";
  document.querySelector(".current-song p").innerHTML = track;

  // Highlight currently playing song in sidebar
  highlightCurrentSong();
};

// ===== Highlight the currently playing song in the sidebar list =====
function highlightCurrentSong() {
  const allSongs = document.querySelectorAll(".lists .li-song");
  allSongs.forEach((el, idx) => {
    if (idx === currentSongIndex) {
      el.classList.add("playing");
    } else {
      el.classList.remove("playing");
    }
  });
}

// ===== Next / Previous =====
const playNextSong = () => {
  if (Songs.length === 0) return;

  if (isShuffle) {
    if (playedIndices.length === Songs.length - 1) {
      playedIndices = [];
    }
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * Songs.length);
    } while (nextIndex === currentSongIndex || playedIndices.includes(nextIndex));
    playedIndices.push(nextIndex);
    currentSongIndex = nextIndex;
  } else {
    currentSongIndex++;
    if (currentSongIndex >= Songs.length) {
      if (isLoop) {
        currentSongIndex = 0;
      } else {
        currentSongIndex = Songs.length - 1;
        return;
      }
    }
  }
  playMusic(Songs[currentSongIndex].replace(".mp3", ""));
};

const playPreviousSong = () => {
  if (Songs.length === 0) return;
  currentSongIndex = (currentSongIndex - 1 + Songs.length) % Songs.length;
  playMusic(Songs[currentSongIndex].replace(".mp3", ""));
};

// ===== Toggle Play/Pause =====
const togglePlayPause = () => {
  if (!currentSong.src || currentSong.paused) {
    if (!currentSong.src && Songs.length > 0) {
      currentSongIndex = 0;
      playMusic(Songs[currentSongIndex].replace(".mp3", ""));
    } else {
      currentSong.play();
      play.src = "images/pause.svg";
    }
  } else {
    currentSong.pause();
    play.src = "images/play.svg";
  }
};

// ===== Keyboard Shortcuts =====
const initializeKeyboardShortcuts = () => {
  document.addEventListener("keydown", (e) => {
    // Don't trigger shortcuts when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.code) {
      case "Space":
        e.preventDefault();
        togglePlayPause();
        break;
      case "Enter":
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault();
          togglePlayPause();
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        playNextSong();
        break;
      case "ArrowLeft":
        e.preventDefault();
        playPreviousSong();
        break;
      case "ArrowUp":
        e.preventDefault();
        currentSong.volume = Math.min(currentSong.volume + 0.1, 1);
        document.querySelector("#volume").value = Math.round(currentSong.volume * 100);
        break;
      case "ArrowDown":
        e.preventDefault();
        currentSong.volume = Math.max(currentSong.volume - 0.1, 0);
        document.querySelector("#volume").value = Math.round(currentSong.volume * 100);
        break;
      case "KeyM":
        toggleMute();
        break;
      case "KeyS":
        isShuffle = !isShuffle;
        document.getElementById("shuffle").classList.toggle("active");
        playedIndices = [];
        break;
      case "KeyL":
        isRepeat = !isRepeat;
        document.getElementById("loop").classList.toggle("active");
        break;
    }
  });
};

// ===== Mute/Unmute =====
function toggleMute() {
  const volumeIcon = document.querySelector(".volume > img") || document.querySelector(".volume .tooltip-container img");
  const volumeSlider = document.querySelector("#volume");

  if (!volumeIcon || !volumeSlider) return;

  if (currentSong.volume > 0) {
    currentSong._savedVolume = currentSong.volume; // remember previous volume
    currentSong.volume = 0;
    volumeSlider.value = 0;
    if (volumeIcon.src) {
      volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
    }
  } else {
    const restored = currentSong._savedVolume || 0.5;
    currentSong.volume = restored;
    volumeSlider.value = Math.round(restored * 100);
    if (volumeIcon.src) {
      volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
    }
  }
}

// ===== Main initialization =====
async function main() {
  // Setup audio event listeners once
  setupAudioListeners();

  await getSongs("musics/PartySongs");

  play.addEventListener("click", () => togglePlayPause());
  previous.addEventListener("click", () => playPreviousSong());
  next.addEventListener("click", () => playNextSong());

  seekbar.addEventListener("input", () => {
    const seekTo = (seekbar.value / 100) * currentSong.duration;
    currentSong.currentTime = seekTo;
    updateSeekbarGradient(seekbar.value);
  });
}

// ===== Volume slider =====
document.querySelector("#volume").addEventListener("input", (e) => {
  const vol = parseInt(e.target.value) / 100;
  currentSong.volume = vol;

  const volumeIcon = document.querySelector(".volume > img") || document.querySelector(".volume .tooltip-container img");
  if (volumeIcon) {
    if (vol > 0 && volumeIcon.src.includes("mute.svg")) {
      volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
    } else if (vol === 0 && volumeIcon.src.includes("volume.svg")) {
      volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
    }
  }
});

// ===== Mute toggle by clicking volume icon =====
const volumeIconEl = document.querySelector(".volume > img") || document.querySelector(".volume .tooltip-container img");
if (volumeIconEl) {
  volumeIconEl.addEventListener("click", () => toggleMute());
}

// ===== Bind playlist card clicks =====
function bindPlaylistCards() {
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    // Remove old listeners by cloning
    e.replaceWith(e.cloneNode(true));
  });
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      await getSongs(`musics/${item.currentTarget.dataset.folder}`);
    });
  });
}

// ===== Filter songs in sidebar =====
function filterSongs(query) {
  query = query.toLowerCase();
  let filtered = query === "" ? Songs : Songs.filter(song => song.toLowerCase().includes(query));
  let SongDiv = document.querySelector(".lists ul");
  if (!SongDiv) return;

  let savedLibrary = JSON.parse(localStorage.getItem("library")) || [];
  SongDiv.innerHTML = "";

  for (const song of filtered) {
    const songName = song.replace(".mp3", "");
    const isInLibrary = savedLibrary.includes(songName);
    const heartFill = isInLibrary ? "red" : "none";
    const disabledAttr = isInLibrary ? "disabled" : "";

    SongDiv.innerHTML += `
      <li>
        <div class="li-song" style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; cursor:pointer;">
            <img src="images/music.svg" alt="">
            <p style="margin-left:10px;">${songName}</p>
          </div>
          <button class="add-to-library" data-song="${songName}" aria-label="Add to Library" title="Add to Library" style="background:none; border:none; cursor:pointer;" ${disabledAttr}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="${heartFill}" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42
                4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5
                3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55
                11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </li>`;
  }

  // Reattach event listeners
  document.querySelectorAll(".add-to-library").forEach(button => {
    button.addEventListener("click", function (e) {
      e.stopPropagation();
      const songName = this.getAttribute("data-song");
      addToLibrary(songName, this);
    });
  });

  Array.from(document.querySelectorAll(".lists li")).forEach((e, index) => {
    e.addEventListener("click", () => {
      let realIndex = Songs.findIndex(s => s === filtered[index]);
      if (realIndex !== -1) {
        currentSongIndex = realIndex;
        playMusic(Songs[currentSongIndex].replace(".mp3", ""));
      }
    });
  });
}

// ===== Shuffle & Loop button clicks =====
document.getElementById("shuffle").addEventListener("click", () => {
  isShuffle = !isShuffle;
  document.getElementById("shuffle").classList.toggle("active");
  playedIndices = [];
});

document.getElementById("loop").addEventListener("click", () => {
  isLoop = !isLoop;
  document.getElementById("loop").classList.toggle("active");
});

// ===== Library Feature =====
function addToLibrary(songName, button) {
  let savedLibrary = JSON.parse(localStorage.getItem("library")) || [];

  if (!savedLibrary.includes(songName)) {
    savedLibrary.push(songName);
    localStorage.setItem("library", JSON.stringify(savedLibrary));
  }
  // Make heart red and disable button to prevent duplicate adding
  const svgPath = button.querySelector("svg path");
  if (svgPath) {
    svgPath.setAttribute("fill", "red");
  }
  button.disabled = true;
}

// ===== Boot =====
document.addEventListener("DOMContentLoaded", () => main());
initializeKeyboardShortcuts();
