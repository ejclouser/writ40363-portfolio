// ===================================
// ZED SONG CREATOR - APPLICATION
// ===================================

// Audio Context for Web Audio API
let audioContext;
let currentSong = [];
let isPlaying = false;

// Initialize audio context on first user interaction
document.addEventListener('click', function() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}, { once: true });

// Note frequencies (in Hz)
const noteFrequencies = {
    'C4': 261.63,
    'D4': 293.66,
    'E4': 329.63,
    'F4': 349.23,
    'G4': 392.00,
    'A4': 440.00,
    'B4': 493.88,
    'C5': 523.25
};

// ===================================
// SOUND GENERATION FUNCTION
// ===================================

function playSound(note) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const frequency = noteFrequencies[note];
    const now = audioContext.currentTime;
    const duration = 0.5;

    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Envelope: Attack-Decay-Sustain-Release
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);

    // Add note to current song
    currentSong.push({
        note: note,
        time: Date.now()
    });

    // Update timeline
    updateTimeline();

    // Visual feedback
    const padButton = document.querySelector(`[data-note="${note}"]`);
    if (padButton) {
        padButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            padButton.style.transform = 'scale(1)';
        }, 100);
    }
}

// ===================================
// SONG MANAGEMENT FUNCTIONS
// ===================================

function playSong() {
    if (currentSong.length === 0) {
        alert('No notes in your song yet!');
        return;
    }

    if (isPlaying) {
        return;
    }

    isPlaying = true;
    const tempo = parseInt(document.getElementById('tempo').value);
    const beatDuration = (60 / tempo) * 1000; // Convert BPM to milliseconds

    // Calculate relative times
    const startTime = currentSong[0].time;
    const relativeTimes = currentSong.map(note => ({
        note: note.note,
        relativeTime: note.time - startTime
    }));

    // Play song with tempo
    let playbackIndex = 0;
    const playNote = () => {
        if (playbackIndex >= relativeTimes.length || !isPlaying) {
            isPlaying = false;
            return;
        }

        const noteData = relativeTimes[playbackIndex];
        playSound(noteData.note);

        playbackIndex++;

        if (playbackIndex < relativeTimes.length) {
            const nextNoteTime = relativeTimes[playbackIndex].relativeTime - relativeTimes[playbackIndex - 1].relativeTime;
            setTimeout(playNote, Math.max(nextNoteTime, beatDuration * 0.5));
        } else {
            isPlaying = false;
        }
    };

    playNote();
}

function stopSong() {
    isPlaying = false;
}

function clearSong() {
    if (currentSong.length === 0) {
        alert('No song to clear!');
        return;
    }

    if (confirm('Are you sure you want to clear your song?')) {
        currentSong = [];
        updateTimeline();
        stopSong();
    }
}

function saveSong() {
    if (currentSong.length === 0) {
        alert('No notes in your song yet!');
        return;
    }

    const songName = document.getElementById('song-name').value || 'Untitled Song';
    const tempo = parseInt(document.getElementById('tempo').value);

    const song = {
        id: Date.now(),
        name: songName,
        notes: currentSong,
        tempo: tempo,
        dateCreated: new Date().toLocaleDateString()
    };

    // Get existing songs from localStorage
    let songs = JSON.parse(localStorage.getItem('zedSongs')) || [];

    // Add new song
    songs.push(song);

    // Save to localStorage
    localStorage.setItem('zedSongs', JSON.stringify(songs));

    // Reset form
    document.getElementById('song-name').value = '';
    currentSong = [];
    updateTimeline();

    alert(`"${song.name}" saved successfully!`);

    // Refresh library
    displayLibrary();
}

// ===================================
// TIMELINE UPDATE FUNCTION
// ===================================

function updateTimeline() {
    const timeline = document.getElementById('timeline');

    if (currentSong.length === 0) {
        timeline.innerHTML = '<p class="placeholder">Your song will appear here...</p>';
        return;
    }

    let timelineHTML = '<div class="timeline-notes">';
    currentSong.forEach((note, index) => {
        timelineHTML += `<span class="timeline-note" data-index="${index}">${note.note}</span>`;
    });
    timelineHTML += '</div>';

    timeline.innerHTML = timelineHTML;
}

// ===================================
// LIBRARY FUNCTIONS
// ===================================

function displayLibrary() {
    const library = document.getElementById('songs-library');
    const songs = JSON.parse(localStorage.getItem('zedSongs')) || [];

    if (songs.length === 0) {
        library.innerHTML = '<div class="empty-state"><p>No songs saved yet. Create one to get started!</p></div>';
        return;
    }

    let libraryHTML = '';
    songs.forEach(song => {
        libraryHTML += `
            <div class="song-card">
                <h4>${song.name}</h4>
                <p><strong>Tempo:</strong> ${song.tempo} BPM</p>
                <p><strong>Notes:</strong> ${song.notes.length}</p>
                <p><strong>Created:</strong> ${song.dateCreated}</p>
                <div class="song-card-buttons">
                    <button class="btn btn-small btn-primary" onclick="loadSong(${song.id})">Load</button>
                    <button class="btn btn-small btn-primary" onclick="playSavedSong(${song.id})">Play</button>
                    <button class="btn btn-small btn-secondary" onclick="deleteSong(${song.id})">Delete</button>
                </div>
            </div>
        `;
    });

    library.innerHTML = libraryHTML;
}

function loadSong(songId) {
    const songs = JSON.parse(localStorage.getItem('zedSongs')) || [];
    const song = songs.find(s => s.id === songId);

    if (song) {
        currentSong = song.notes;
        document.getElementById('song-name').value = song.name;
        document.getElementById('tempo').value = song.tempo;
        updateTimeline();
        showSection('create');
        alert(`"${song.name}" loaded! You can now edit and replay it.`);
    }
}

function playSavedSong(songId) {
    const songs = JSON.parse(localStorage.getItem('zedSongs')) || [];
    const song = songs.find(s => s.id === songId);

    if (song) {
        currentSong = song.notes;
        document.getElementById('tempo').value = song.tempo;
        playSong();
    }
}

function deleteSong(songId) {
    if (confirm('Are you sure you want to delete this song?')) {
        let songs = JSON.parse(localStorage.getItem('zedSongs')) || [];
        songs = songs.filter(s => s.id !== songId);
        localStorage.setItem('zedSongs', JSON.stringify(songs));
        displayLibrary();
        alert('Song deleted!');
    }
}

// ===================================
// NAVIGATION FUNCTIONS
// ===================================

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    // Update nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');

    // Load library when viewing library section
    if (sectionId === 'library') {
        displayLibrary();
    }
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize library display
    displayLibrary();

    // Keyboard support for notes
    document.addEventListener('keydown', function(event) {
        const keyMap = {
            'c': 'C4',
            'd': 'D4',
            'e': 'E4',
            'f': 'F4',
            'g': 'G4',
            'a': 'A4',
            'b': 'B4',
            ' ': 'C5'
        };

        const note = keyMap[event.key.toLowerCase()];
        if (note && event.target === document.body) {
            playSound(note);
            event.preventDefault();
        }
    });

    console.log('Zed Song Creator initialized!');
});
