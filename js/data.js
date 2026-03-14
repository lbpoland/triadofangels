// js/data.js
// This file contains the albums data used by both album.html and track.html
// Edit: Add or update album and track data here. For each track, include lyrics, duration, story, video, behindTheScenes, and links as needed.

import { sanitizeTrackId } from './utils.js';
export const albums = [
// Triad of Angels Albums
  {
    id: "wings-of-fire",
    title: "Wings of Fire",
    artist: "Triad of Angels",
    genre: "Female Group, Cinematic Pop, Orchestral, Ballad",
    year: "May, 2025",
    cover: "assets/images/albums/wingsoffire-album.webp",
  tracks: [
    "Awakening the Triad",
    "Wings of Fire",
    "We are the Triad",
    "Starlight Wounds",
    "Ascension Hearts",
    "Halo in the Storm"
  ],
    links: {
      spotify: "https://open.spotify.com/album/4K83YJEeETmcybKtQ1LP5l?si=fOFELopLS9W3eLOSR8x5tA",
      appleMusic: "https://music.apple.com/us/album/wings-of-fire-ep/1812163266",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_kpbLV2nL-Ryt_nKkJ8CFfll701Zrw9N6k&si=c0d1GLRChrOKtkbK",
    },
    artistInfo: "A clear entry point into Triad of Angels: cinematic pop, strong melodies, and the first shape of the trio’s emotional world.",	
  lyrics: {
    "awakening-the-triad": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "wings-of-fire": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "we-are-the-triad": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "starlight-wounds": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "ascension-hearts": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "halo-in-the-storm": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "ascend",
    title: "Ascend",
    artist: "Triad of Angels",
    genre: "Female Group, Cinematic Pop, Orchestral, Alternative, Soundtrack",
    year: "May, 2025",
    cover: "assets/images/albums/ascend-album.webp",
  tracks: [
    "Ascend",
    "Fireproof",
    "We Are Light",
    "Echoes of Hope",
    "Rising Tide",
    "Hold the Sky",
    "Home to My Heart",
    "Unseen Wings",
    "Breathe",
    "Into the Light"
  ],
    links: {
      spotify: "https://open.spotify.com/album/5EetoHOZzPFoLGfM7XzTim?si=cWzTT5jKQ5KI-KkQYubADQ",
      appleMusic: "https://music.apple.com/us/album/ascend/1812603057",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_n6axY2s6JOnfyXOqSsWQ9o1Rmz05azC4w&si=5HJAAMnu0iXVlpNb",
    },
    artistInfo: "Ascend leans further into lift, motion, and atmosphere, carrying Triad of Angels through a more expansive cinematic-pop frame.",	
  lyrics: {
    "ascend": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "fireproof": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "we-are-light": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "echoes-of-hope": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "rising-tide": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "hold-the-sky": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "home-to-my-heart": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "unseen-wings": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "breathe": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "into-the-light": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "celestia-the-light-within",
    title: "Celestia: The Light Within",
    artist: "Triad of Angels",
    genre: "Cinematic, Pop, Ballads, Dance, Alternative",
    year: "28th of May, 2025",
    cover: "assets/images/albums/celestia-the-light-within-album.webp",
  tracks: [
    "Aurora Rising",
    "Wings of Grace",
    "Echoes of Eternity",
    "Elysian Groove",
    "Sacred Ground",
    "Soulkeeper",
    "Cosmic Boots",
    "Celestial Dance",
    "Harmony’s Call",
    "Mirror of the Soul",
    "Hearts Made of Fire",
    "Halo Burn",
    "Through the Flame I Am",
    "Celestia The Light Within"
  ],
    links: {
      spotify: "https://open.spotify.com/album/567eYko6C0VuGXKq4myvIC?si=pvGKdX-UQAa9q-XOwvpqkQ",
      appleMusic: "https://music.apple.com/us/artist/triad-of-angels/1811109753",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_kj2xaQyIOlhLxcXxpBy4nzhUXhrWaUlic&si=UGXcIqtMu7Xwypm0",
    },
    artistInfo: "Celestia: The Light Within keeps the trio in a brighter, more reflective lane, balancing lift, devotion, and melodic drama.",
  lyrics: {
    "aurora-rising": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "wings-of-grace": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "echoes-of-eternity": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "elysian-groove": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "sacred-ground": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "soulkeeper": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "cosmic-boots": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "celestial-dance": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "harmony’s-call": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "mirror-of-the-soul": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "hearts-made-of-fire": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "halo-burn": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "through-the-flame-i-am": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "celestia-the-light-within": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "divine-echoes",
    title: "Divine Echoes",
    artist: "Triad of Angels",
    genre: "A Cinematic Soundtrack Concept Art Piece",
    year: "June, 2025",
    cover: "assets/images/albums/divine-echoes-album.webp",
    tracks: [
      "Genesis of Light",
      "Name Above Fire",
      "The Wilderness Speaks",
      "Cry of the Watchmen",
      "Messiah",
      "Every Grave Shall Open",
      "Tongues of Fire",
      "We Do Not Bow",
      "Veil Torn",
      "Altars in the Ashes",
      "Healed in the Flames",
      "Crowned with Light",
      "The Table is Set",
      "Thrones Will Fall",
      "Let the Earth Respond",
      "The City Descends",
      "Amen The Sound That Never Ends"
    ],
    links: {
      spotify: "https://open.spotify.com/album/6upK6sWZbjr02iv4HO57cq?si=6V_hUAHZQ3u4QRbeN6t7rg",
      appleMusic: "https://music.apple.com/us/album/divine-echoes/1818755354",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_muGp8ipEDgk9ycyY2rSW7KNJC78gvuKFI&si=66B5FYd97JSVNd77",
    },
    artistInfo: "Divine Echoes widens the spiritual and cinematic side of Triad of Angels, treating the release as both music and a larger visual-concept world.",	
  lyrics: {
    "genesis-of-light": {
      file: "/lyrics/divine-echoes/genesis-of-light.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "name-above-fire": {
      file: "/lyrics/divine-echoes/name-above-fire.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "the-wilderness-speaks": {
      file: "/lyrics/divine-echoes/the-wilderness-speaks.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "cry-of-the-watchmen": {
      file: "/lyrics/divine-echoes/cry-of-the-watchmen.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "messiah": {
      file: "/lyrics/divine-echoes/messiah.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "every-grave-shall-open": {
      file: "/lyrics/divine-echoes/every-grave-shall-open.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "tongues-of-fire": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "the-bride-watches": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "we-do-not-bow": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "veil-torn": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "altars-in-the-ashes": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "healed-in-the-flames": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "crowned-with-light": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "the-table-is-set": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "thrones-will-fall": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "let-the-earth-respond": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "the-city-descends": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "amen-the-sound-that-never-ends": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
// ToA Studios Albums   
  {
    id: "probed-and-confused",
    title: "Probed & Confused",
    artist: "ToA Studios",
    genre: "Hip-Hop, Rap, Satirical, Parody, Electronic",
    year: "May, 2025",
    cover: "assets/images/albums/probedandconfused-album.webp",
  tracks: [
    "Probed & Confused",
    "Strings Attached",
    "Vatican Vaults",
    "Digital Gulag",
    "Lizard Congress",
    "Project Blue Beam",
    "Saturns Frequency Cage",
    "Hidden Cities Underground",
    "Bloodline Rituals",
    "The Great Goodbye"
  ],
    links: {
      spotify: "https://open.spotify.com/album/5pdZRwo8VXH3sxTZzqsUjN?si=nDt0mqEjQ82k-TaymTQYZQ",
      appleMusic: "https://music.apple.com/us/album/probed-confused/1812599708",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_nZawrRr1jGQNAw3nz0P2B-OoqMKmEn1Tg&si=v-I7avviDAjL1VW0",
    },
    artistInfo: "Probed & Confused lets ToA Studios take a looser, stranger, more satirical lane without losing its sense of craft.",	
  lyrics: {
    "probed-and-confused": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "strings-attached": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "vatican-vaults": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "digital-gulag": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "lizard-congress": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "project-blue-beam": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "saturns-frequency-cage": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "hidden-cities-underground": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "bloodline-rituals": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "the-great-goodbye": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
{
  id: "echoes-on-the-dirt-road",
  title: "Echoes on the Dirt Road",
  artist: "ToA Studios",
  genre: "Country, Ballad, Boot Scootin', Alternative",
  year: "May, 2025",
  cover: "assets/images/albums/echoesonthedirtroad-album.webp",
  tracks: [
    "Start Somewhere",
    "Mud on My Boots, Stars in My Eyes",
    "Rust & Roses",
    "Friday Nights & Broken Lights",
    "Boot, Scoot & Spin",
    "Gasoline Dreams",
    "Anchor and Flame",
    "The Last Call I Never Made",
    "Whiskey Moon",
    "Letters to the Wind",
    "Dust and Daisies",
    "Echoes on the Dirt Road"
  ],
  links: {
    spotify: "https://open.spotify.com/album/0y1rCdAJggJMoFvX1FFKDe?si=Vo8Gj9uXSku2-6WzY6HgQg",
    appleMusic: "https://music.apple.com/us/album/echoes-on-the-dirt-road/1812611626",
    youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_mL9FznTyx_-6nKq_rm767o73cjLlUCl_g&si=oprCNIO-vF3nwcuH",
  },
  artistInfo: "Echoes on the Dirt Road turns toward country textures, memory, and open-road feeling without over-polishing the heart out of it.",
  lyrics: {
    "start-somewhere": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "mud-on-my-boots-stars-in-my-eyes": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "rust-and-roses": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "friday-nights-and-broken-lights": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "boot-scoot-and-spin": { // Corrected key
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "gasoline-dreams": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "anchor-and-flame": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "the-last-call-i-never-made": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "whiskey-moon": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "letters-to-the-wind": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "dust-and-daisies": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "echoes-on-the-dirt-road": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    }
  }
},
  {
    id: "phoenix-rising",
    title: "Phoenix Rising",
    artist: "ToA Studios",
    genre: "Rock, Metal, Alternative, Orchestral",
    year: "May, 2025",
    cover: "assets/images/albums/phoenixrising-album.webp",
  tracks: [
    "Ashes and Alibis",
    "Snakebite Heart",
    "Bulletproof Veins",
    "Jungle of Mirrors",
    "Neon Rain",
    "Wolfskin",
    "Heaven’s Burning",
    "Venom & Velvet",
    "Phoenix Rising",
    "Final Breath"
  ],
    links: {
      spotify: "https://open.spotify.com/album/5xqK1MMJrhPOcPM58zjlvE?si=mn6Yx15fQkGzTLKPOPNE7Q",
      appleMusic: "https://music.apple.com/us/album/phoenix-rising/1812648146",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_mcj1x0UNnDOgYxEpw_3dsQWykLrAOPXj4&si=lzimoRyOpANWfQAb",
    },
    artistInfo: "Phoenix Rising pushes ToA Studios into heavier ground, combining rock, metal, and orchestral lift around resilience and return.",	
  lyrics: {
    "ashes-and-alibis": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "snakebite-heart": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "bulletproof-veins": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "jungle-of-mirrors": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "neon-rain": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "wolfskin": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "heaven’s-burning": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "venom-and-velvet": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "phoenix-rising": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "final-breath": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "the-quiet-war",
    title: "The Quiet War",
    artist: "ToA Studios",
    genre: "Concept Soundtrack, Hip-Hop, Rap",
    year: "May, 2025",
    cover: "assets/images/albums/thequietwar-album.webp",
  tracks: [
    "Houseguest",
    "Basement Tape",
    "Cracking",
    "Check Engine",
    "The Mirror",
    "Call to God",
    "Burnt Wires",
    "Nothing Fancy",
    "Speed Dial",
    "Shatterproof",
    "The Quiet War"
  ],
    links: {
      spotify: "https://open.spotify.com/album/5grqzzq1V4Gaw3jqDjoQbV?si=7YUpINOaRmaKSuYdtlVzvQ",
      appleMusic: "https://music.apple.com/us/album/the-quiet-war/1812870604",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_mnAyAE1pxoey93kvk6KxqaY8n3CDJtD-0&si=RdO6K4pEyqJVxWQ-",
    },
    artistInfo: "The Quiet War leans into internal conflict, pressure, and cinematic tension, working like a soundtrack to a struggle that does not stay quiet for long.",
  lyrics: {
    "houseguest": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "basement-tape": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "cracking": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "check-engine": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "the-mirror": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "call-to-god": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "burnt-wires": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "nothing-fancy": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "speed-dial": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "shatterproof": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "the-quiet-war": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "reality-exe",
    title: "Reality.exe",
    artist: "ToA Studios",
    genre: "Hip-Hop, Rap, Satirical, Parody, Electronic",
    year: "May, 2025",
    cover: "assets/images/albums/reality-exe-album.webp",
  tracks: [
    "Oops... I Thinked Again",
    "Screenagers",
    "Ghost Code",
    "CLoWnFiLe.exe",
    "I Miss Reality",
    "Vortex",
    "Monarch",
    "Puppet Show",
    "System Message_001001",
    "Who Voted for This?!",
    "President Roast Session",
    "Float Tank Freakout",
    "Just Roast It",
    "Bar Fight Champion",
    "Beast Mode Offline",
    "Offline Mode"
  ],
    links: {
      spotify: "https://open.spotify.com/album/6SzYfretgTzLUITlIP6AMy?si=f2cObGo4STKF-YQusk5YGg",
      appleMusic: "https://music.apple.com/us/album/reality-exe/1812900765",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_mEUI3xipOKn-zGt9dOHJbIuk6e1J7gHLQ&si=UuVUiJ6uhXTmNmR_",
    },
    artistInfo: "Reality.exe uses satire, rhythm, and bite to take aim at a world that already feels half broken and half absurd.",
  lyrics: {
    "oops-i-thinked-again": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "screenagers": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "ghost-code": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "clownfile-exe": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "i-miss-reality": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "vortex": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "monarch": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "puppet-show": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "system-message-001001": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "who-voted-for-this": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "president-roast-session": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "float-tank-freakout": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "just-roast-it": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "bar-fight-champion": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "beast-mode-offline": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "offline-mode": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "serpents-veil",
    title: "Serpent's Veil",
    artist: "ToA Studios",
    genre: "Rock, Metal, Heavy, Alternative",
    year: "19th of May, 2025",
    cover: "assets/images/albums/serpentsveil-album.webp",
  tracks: [
    "Ascend the Abyss",
    "Refraction",
    "Shapeshifter",
    "Ethereal Machines",
    "Mirrors & Dust",
    "Vortex",
    "Serpent’s Veil",
    "Silent Collapse",
    "Chaos Code",
    "Veins of Fire",
    "Phoenix Circuit"
  ],
    links: {
      spotify: "https://open.spotify.com/album/7nAY1Kggu7JKGEuhUpDvE6?si=URisRlIBQDeXDXlcjPEIHA",
      appleMusic: "https://music.apple.com/us/album/serpents-veil/1813142997",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_nCLvHBjqXqReqWVx1rMQTrwCUYc2u-pj0&si=0C-fKBT3XUcnwYEY",
    },
    artistInfo: "Serpent’s Veil moves deeper into darker metal textures and atmosphere, holding weight without losing shape.",
  lyrics: {
    "ascend-the-abyss": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "refraction": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "shapeshifter": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "ethereal-machines": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "mirrors-and-dust": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "vortex": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "serpent’s-veil": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "silent-collapse": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "chaos-code": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "veins-of-fire": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "phoenix-circuit": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "constellation-frequency",
    title: "Constellation Frequency: Volume 1",
    artist: "ToA Studios",
    genre: "Trance, Dance, Acid Trance, Pystrance, EDM",
    year: "1st of June, 2025",
    cover: "assets/images/albums/constellation-frequency-album.webp",
    tracks: [
      "Ascend Through Light",
      "Epoch of Frequency",
      "Hearts Under Gravity",
      "Cosmic Drift",
      "Pulse of the Skyline",
      "Velvet Voltage",
      "Mirage Engine",
      "Cosmic Tranquility",
      "Neural Ascension",
      "Into the Spiral Light",
      "Transcendence Drive",
      "Celestian Override",
      "Ascension Spiral",
      "Goddess in the Grid",
      "Astral Vanguard",
      "Wings of Resonance",
      "Journey's End"
    ],
    links: {
      spotify: "https://open.spotify.com/album/5YNBjbnvSaKQgNlxJKaoUK?si=V2Uw4y_SSF-f2vU3xltvcA",
      appleMusic: "https://music.apple.com/us/artist/triad-of-angels/1811109753",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_kj2xaQyIOlhLxcXxpBy4nzhUXhrWaUlic&si=UGXcIqtMu7Xwypm0",
    },
    artistInfo: "Constellation Frequency: Volume 1 opens the DJ Jessica lane with trance energy, momentum, and a stronger club-minded pulse.",	
  lyrics: {
    "ascend-through-light": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "epoch-of-frequency": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "hearts-under-gravity": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "cosmic-drift": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "pulse-of-the-skyline": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "velvet-voltage": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "mirage-engine": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "cosmic-tranquility": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "neural-ascension": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "into-the-spiral-light": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "transcendence-drive": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "celestian-override": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "ascension-spiral": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "goddess-in-the-grid": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "astral-vanguard": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "wings-of-resonance": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "journey’s-end": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "constellation-frequency2",
    title: "Constellation Frequency: Volume 2",
    artist: "ToA Studios",
    genre: "Trance, Dance, Acid Trance, Pystrance, EDM",
    year: "9th of June, 2025",
    cover: "assets/images/albums/constellation-frequency2-album.webp",
    tracks: [
      "Ignition Sequence DJ Jessica Uplink (Intro)",
      "Celestial Spine Recalibration",
      "Time Distortion",
      "Sonic Bloom: Shakuhachi Ascension",
      "Glass Lions in the Fog",
      "Rain Signal Through Neon Ruins",
      "Dust and Code: Temple of Algorithms",
      "Bass Communion London of the Light",
      "Enchanted Forest",
      "Oasis Frequency: Path of the Oud",
      "Sands of Aether",
      "Valhallan Circuit Surge",
      "Journey Back",
      "Starlight Memory: The Final Descent"
    ],
    links: {
      spotify: "https://open.spotify.com/album/0yPnjbEZALYK34p2LaJ7rz3?si=QtSs1FEMTrynOTpCaD5oBw",
      appleMusic: "https://music.apple.com/us/album/constellation-frequency-volume-2/1818483578",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_mwvoKhCKS8rLx9x3hF7vW3nPt27mcY_OJE&si=CuCAecGme5b_bizQ",
    },
    artistInfo: "Constellation Frequency: Volume 2 keeps the trance lane moving, pushing harder into motion, build, and late-night lift.",
  lyrics: {
    "ignition-sequence-dj-jessica-uplink-intro": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "celestial-spine-recalibration": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "time-distortion": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "sonic-bloom-shakuhachi-ascension": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "glass-lions-in-the-fog": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "rain-signal-through-neon-ruins": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "dust-and-code-temple-of-algorithms": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "bass-communion-london-of-the-light": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "enchanted-forest": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "oasis-frequency-path-of-the-oud": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "sands-of-aether": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "valhallan-circuit-surge": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "journey-back": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "starlight-memory-the-final-descent": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "enchantra",
    title: "Enchantra",
    artist: "ToA Studios",
    genre: "Trance, Dance, Acid Trance, Pystrance, EDM",
    year: "June, 2025",
    cover: "assets/images/albums/enchantra-album.webp",
    tracks: [
      "Dawn Signal (Intro)",
      "Crystalline Descent",
      "Rise of the Obsidian Pulse",
      "Temple of Pulsefire",
      "Ash and Embers",
      "Citadel",
      "Neon Glyph Surge",
      "Aurora Drift",
      "Core Implosion Protocol",
      "Streamlight Override",
      "Turbo Transmission",
      "Neon Relic",
      "Sunspike Horizon",
      "Speedlight Rituals",
      "Final Pulse of the Dawnbreaker"
    ],
    links: {
      spotify: "https://open.spotify.com/album/1HSO7heOxXFkgACt4RHHfh?si=7R0XwiP0STqY5cWwmqx74Q",
      appleMusic: "https://music.apple.com/us/album/enchantra/1819973546",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_neLPAVxfVTwJWm4gMAyEWLxDdLmDq_Zjo&si=AxV8ZQq55t7MMQ9E",
    },
    artistInfo: "Enchantra opens a more mythic rave-space for ToA Studios and DJ Jessica — rhythmic, immersive, and deliberately heightened.",
  lyrics: {
    "dawn-signal-intro": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "crystalline-descent": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "rise-of-the-obsidian-pulse": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "temple-of-pulsefire": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "ash-and-embers": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "citadel": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "neon-glyph-surge": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "aurora-drift": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "core-implosion-protocol": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "streamlight-override": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "turbo-transmission": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "neon-relic": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "sunspike-horizon": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "speedlight-rituals": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "final-pulse-of-the-dawnbreaker": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "enchantra2",
    title: "Enchantra Volume 2",
    artist: "ToA Studios",
    genre: "Trance, Dance, Acid Trance, Pystrance, EDM",
    year: "June, 2025",
    cover: "assets/images/albums/enchantra2-album.webp",
    tracks: [
      "The Celestial Vein Awakens (Intro)",
      "Solar Gate Invocation",
      "Celestial Gateway",
      "Temple of Auroras",
      "Seraphim Circuit Eclipse",
      "Starglyph Transmission",
      "The Frequency Oracle",
      "Godspeakers of the Void",
      "Sirens of Harmonic Collapse",
      "Pulse of the infinite Shore",
      "Echoes of the Aetherwind",
      "Beneath the Stardust Horizon"
    ],
    links: {
      spotify: "https://open.spotify.com/album/5QJ6YkZ3XvW8N7T2P4R5Lm?si=Z1X2Y3W4T7u8N9P0Q1R2Sg",
      appleMusic: "https://music.apple.com/us/album/enchantra-volume-2/1820145789",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_nfLPAVxfVTwJWm4gMAyEWLxDdLmDq_Zjo&si=AxV9ZQq55t7MMQ9E",
    },
    artistInfo: "Enchantra Volume 2 continues that lane with deeper atmosphere, bigger rise, and more pressure in the mix.",
  lyrics: {
    "the-celestial-vein-awakens-intro": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "solar-gate-invocation": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "celestial-gateway": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "temple-of-auroras": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "seraphim-circuit-eclipse": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "starglyph-transmission": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "the-frequency-oracle": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "godspeakers-of-the-void": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "sirens-of-harmonic-collapse": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "pulse-of-the-infinite-shore": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "echoes-of-the-aetherwind": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "beneath-the-stardust-horizon": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
  {
    id: "angelicresonance",
    title: "Angelic Resonance",
    artist: "Triad of Angels",
    genre: "Cinematic, Pop, Ballads, Dance, Alternative",
    year: "June, 2025",
    cover: "assets/images/albums/angelicresonance-album.webp",
    tracks: [
      "Angelic Entrance (Intro)",
      "Gates of the Eternal Sky",
      "Radiant Throne",
      "Angel Frequency",
      "Sky Cathedral",
      "Trinitas",
      "Aether Wings",
      "Empyrean Signal",
      "Skyveil",
      "Mirrors of Light",
      "Wingspan",
      "Heavens Eternal",
      "Thronefire",
      "Breath of the Spirit",
      "Covenant Aurora"
    ],
    links: {
      spotify: "https://open.spotify.com/album/3K7N8P2Q4R5T6Y9W1X2V3Z?si=Y4Z5X6W7T8u9P1Q2R3S4Tg",
      appleMusic: "https://music.apple.com/us/album/angelic-resonance/1820346790",
      youTubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_ngLPAVxfVTwJWm4gMAyEWLxDdLmDq_Zjo&si=AxV0ZQq55t7MMQ9E",
    },
    artistInfo: "Angelic Resonance stays close to the spiritual and melodic heart of Triad of Angels, letting the trio sound luminous without flattening the emotion.",
  lyrics: {
    "angelic-entrance-intro": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "gates-of-the-eternal-sky": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "radiant-throne": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "angel-frequency": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "sky-cathedral": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "trinitas": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "aether-wings": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "empyrean-signal": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "skyveil": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "mirrors-of-light": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "wingspan": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "heavens-eternal": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "thronefire": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "breath-of-the-spirit": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "covenant-aurora": {
      file: "", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
      }
    }
  },
{
  id: "the-quiet-war-2",
  title: "The Quiet War II: Faultline Testament",
  artist: "ToA Studios",
  genre: "Cinematic, Alternative, Orchestral, Soundtrack",
  year: "July, 2025",
  cover: "assets/images/albums/the-quiet-war-2-album.webp",
  tracks: [
    "Quiet War Overture",
    "Firewall Baptism",
    "Shadow Syntax",
    "Panic Translation",
    "Scrambled Saints",
    "Faultline Language",
    "Memoir in Static",
    "Ashes & Blueprints",
    "Blue Collar Prophecy",
    "Never Done",
    "Glass House (The Mirror II)",
    "Answered / Unanswered (Call to God II)",
    "Ghost Notes",
    "Redemption",
    "End of Transmission"
  ],
  links: {
    spotify: "https://open.spotify.com/album/1tovOjbZuTZFytW11vky8U?si=FOAH9DTLSmGnbjuJG4qEnA",
    appleMusic: "https://music.apple.com/us/album/american-firestorm-songs-of-freedom/1813521823", // Update if you get the direct Apple link
    youTubeMusic: "https://youtube.com/playlist?list=OLAK5uy_klrZ8eIXbfGwfwewgal9CiQHVNquj0aTA&si=EfzCx9-wDsMOerlk",
    // Add other platform links if needed
  },
  artistInfo: "The Quiet War II: Faultline Testament expands the tension of the first release into a larger, more fractured cinematic frame.",
  lyrics: {
    "quiet-war-overture": {
      file: "", // Add lyrics file path if available
      duration: "", // Add track duration
      story: "", // Add background story
      video: null,
      behindTheScenes: "", // Add behind-the-scenes details
      links: {}, // Add links if any (lyric videos, etc.)
      musicPlayerId: null
    },
    "firewall-baptism": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "shadow-syntax": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "panic-translation": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "scrambled-saints": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "faultline-language": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "memoir-in-static": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "ashes-blueprints": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "blue-collar-prophecy": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "never-done": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "glass-house-the-mirror-ii": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "answered-unanswered-call-to-god-ii": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "ghost-notes": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "redemption": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "end-of-transmission": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    }
  }
},
{
  id: "neon-ascension",
  title: "Neon Ascension: A Trance Odyssey",
  artist: "ToA Studios",
  genre: "Trance, EDM, Dance, Electronic",
  year: "July, 2025",
  cover: "assets/images/albums/neon-ascension-album.webp",
  tracks: [
    "Portal Sequence (Intro)",
    "Sonic Pilgrimage",
    "Starlit Velocity",
    "Crystal Synthesis",
    "Luminous Equinox",
    "Halcyon Surge",
    "Echoes of Time",
    "Distorted Travels",
    "Temporal Drift",
    "Mirage in Motion",
    "Twisted Realm",
    "Prism Resonance",
    "Aurora in Retrograde",
    "Terminal Arrival"
  ],
  links: {
    spotify: "https://open.spotify.com/album/3iTOqNNIBE0bosXZybWIML?si=ZTA-E2QQS-W8jSe9ES-PSQ",
    appleMusic: "https://music.apple.com/us/album/neon-ascension-a-trance-odyssey/1825533565",
    youTubeMusic: "https://youtube.com/playlist?list=OLAK5uy_lsVAGKpQa52rUwiKpH_eB9hvLqFAJf1vQ&si=3SuOUQK8rTGcrPUb"
    // Add other platform links if available
  },
  artistInfo: "Neon Ascension: A Trance Odyssey keeps the electronic side of ToA Studios moving upward — bright, rhythmic, and built for momentum.",
  lyrics: {
    "portal-sequence-intro": {
      file: "", // Add lyrics file path if available
      duration: "", // Add track duration
      story: "", // Add track background or story
      video: null,
      behindTheScenes: "", // Add behind-the-scenes info if any
      links: {}, // Add external links (lyric videos, etc.)
      musicPlayerId: null
    },
    "sonic-pilgrimage": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "starlit-velocity": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "crystal-synthesis": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "luminous-equinox": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "halcyon-surge": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "echoes-of-time": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "distorted-travels": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "temporal-drift": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "mirage-in-motion": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "twisted-realm": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "prism-resonance": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "aurora-in-retrograde": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    },
    "terminal-arrival": {
      file: "",
      duration: "",
      story: "",
      video: null,
      behindTheScenes: "",
      links: {},
      musicPlayerId: null
    }
  }
},
    
{
  id: "american-firestorm-songs-of-freedom",
  title: "American Firestorm: Songs of Freedom",
  artist: "ToA Studios",
  year: "June 20, 2025",
  cover: "assets/images/albums/songsoffreedom-album.webp",
  tracks: [
    "Light Up the Weekend",
    "Red, White and Country Strong",
    "Born to Ride Free",
    "Stars Across the Water",
    "Where the Brave Still Stand",
    "Where We Belong Tonight",
    "Fireworks and Freedom",
    "Born for the Red, White, and Blue",
    "Raise That Flag",
    "Living Free in America",
    "Home Beneath the Stars",
    "American Firelight",
    "Run the Red, White, and Blue",
    "Land That I Love"
  ],
    links: {
      spotify: "https://open.spotify.com/album/7FyaJxkI1n7XEtIwZ1qbUM?si=VRS1vaxfSL2g2BMjdSP82g",
      appleMusic: "https://music.apple.com/us/album/american-firestorm-songs-of-freedom/1813521823",
      youTubeMusic: "https://youtu.be/Tm-GC35AWD8?si=eLHg867DG7SatC_m",
    },
  artistInfo: "American Firestorm: Songs of Freedom turns toward conviction, pressure, and national heat, carried through a more direct songwriting frame.", // Add artist info later
  lyrics: {
    "light-up-the-weekend": {
      file: "/lyrics/american-firestorm-songs-of-freedom/light-up-the-weekend.txt",
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "red-white-and-country-strong": {
      file: "/lyrics/american-firestorm-songs-of-freedom/red-white-and-country-strong.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "born-to-ride-free": {
      file: "/lyrics/american-firestorm-songs-of-freedom/born-to-ride-free.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "stars-across-the-water": {
      file: "/lyrics/american-firestorm-songs-of-freedom/stars-across-the-water.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "where-the-brave-still-stand": {
      file: "/lyrics/american-firestorm-songs-of-freedom/where-the-brave-still-stand.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "where-we-belong-tonight": {
      file: "/lyrics/american-firestorm-songs-of-freedom/where-we-belong-tonight.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "fireworks-and-freedom": {
      file: "/lyrics/american-firestorm-songs-of-freedom/fireworks-and-freedom.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "born-for-the-red-white-and-blue": {
      file: "/lyrics/american-firestorm-songs-of-freedom/born-for-the-red-white-and-blue.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "raise-that-flag": {
      file: "/lyrics/american-firestorm-songs-of-freedom/raise-that-flag.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "living-free-in-america": {
      file: "/lyrics/american-firestorm-songs-of-freedom/living-free-in-america.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "home-beneath-the-stars": {
      file: "/lyrics/american-firestorm-songs-of-freedom/home-beneath-the-stars.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "american-firelight": {
      file: "/lyrics/american-firestorm-songs-of-freedom/american-firelight.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "run-the-red-white-and-blue": {
      file: "/lyrics/american-firestorm-songs-of-freedom/run-the-red-white-and-blue.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    },
    "land-that-i-love": {
      file: "/lyrics/american-firestorm-songs-of-freedom/land-that-i-love.txt", // Add lyrics later
      duration: "", // Add duration later
      story: "", // Add story later
      video: null,
      behindTheScenes: "", // Add behind-the-scenes later
      links: {}, // Add links later
      musicPlayerId: null
    }	  
  }
}  
];

/* =======================================================================
   DATA NORMALIZATION + HELPERS (P1 stability + single-source-of-truth)

   RULES:
   - Do NOT remove or rewrite existing album content.
   - Only normalize missing fields safely.
   - All rendering code should use helpers below to avoid defensive branching.
======================================================================= */

const SITE_ORIGIN = 'https://www.triadofangels.com';

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

const ensureObject = (v) => (isPlainObject(v) ? v : {});

const ensureString = (v) => (typeof v === 'string' ? v : '');

const normalizeAlbum = (album) => {
  if (!isPlainObject(album)) return;

  album.id = ensureString(album.id);
  album.title = ensureString(album.title);
  album.artist = ensureString(album.artist);
  album.genre = ensureString(album.genre);
  album.year = ensureString(album.year);
  album.releaseDate = ensureString(album.releaseDate);
  album.cover = ensureString(album.cover);

  // Optional descriptive fields (safe fallbacks for rendering/UI)
  album.description = ensureString(album.description) || ensureString(album.artistInfo) || ensureString(album.artistDescription);
  album.artistInfo = ensureString(album.artistInfo);
  album.artistDescription = ensureString(album.artistDescription);
  // Optional tags
  album.tags = Array.isArray(album.tags) ? album.tags : [];

  album.links = ensureObject(album.links);
  album.tracks = Array.isArray(album.tracks) ? album.tracks : [];

  // Track meta map is stored under album.lyrics (legacy name kept for compatibility).
  album.lyrics = ensureObject(album.lyrics);

  Object.keys(album.lyrics).forEach((trackId) => {
    const t = ensureObject(album.lyrics[trackId]);
    t.file = ensureString(t.file);
    t.text = ensureString(t.text);
    t.duration = ensureString(t.duration);
    t.description = ensureString(t.description);
    t.story = ensureString(t.story);
    t.behindTheScenes = ensureString(t.behindTheScenes);
    t.musicPlayerId = ensureString(t.musicPlayerId);
    t.video = t.video || null;
    t.links = ensureObject(t.links);
    album.lyrics[trackId] = t;
  });
};

albums.forEach(normalizeAlbum);

/** Convert a site-relative path ("/assets/...") into an absolute URL. */
export const toAbsoluteSiteUrl = (urlOrPath) => {
  const s = ensureString(urlOrPath).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${SITE_ORIGIN}${s}`;
  return `${SITE_ORIGIN}/${s}`;
};

/**
 * Parse an album's most reliable date into a numeric timestamp for sorting.
 * Order preference:
 *  1) album.releaseDate (ISO-like)
 *  2) year extracted from album.year
 * Fallback is 0.
 */
export const parseApproxDate = (album) => {
  const rd = ensureString(album?.releaseDate).trim();
  if (rd) {
    const t = Date.parse(rd);
    if (!Number.isNaN(t)) return t;
  }

  const yText = ensureString(album?.year);
  const m = yText.match(/(19|20)\d{2}/);
  if (m) {
    const y = Number(m[0]);
    const t = Date.parse(`${y}-01-01`);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
};

const titleFromId = (id) => {
  const s = ensureString(id).replace(/-/g, ' ').trim();
  if (!s) return '';
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Build a normalized track list for an album.
 * - Title order is derived from album.tracks (legacy array of strings) when present.
 * - Any extra entries in album.lyrics not represented in album.tracks are appended.
 */
const hasMeaningfulTrackMeta = (meta) => {
  const m = ensureObject(meta);
  if (!m || !Object.keys(m).length) return false;
  if (ensureString(m.title) || ensureString(m.file) || ensureString(m.text) || ensureString(m.duration) || ensureString(m.story) || ensureString(m.behindTheScenes) || ensureString(m.video)) return true;
  if (m.musicPlayerId !== null && m.musicPlayerId !== undefined && ensureString(m.musicPlayerId)) return true;
  const links = ensureObject(m.links);
  return Object.values(links).some((v) => ensureString(v));
};

export const buildAlbumTrackList = (album) => {
  const a = isPlainObject(album) ? album : {};
  const titles = Array.isArray(a.tracks) ? a.tracks : [];
  const lyricsMap = ensureObject(a.lyrics);

  const normalizedLyrics = new Map();
  Object.keys(lyricsMap).forEach((rawId) => {
    const id = sanitizeTrackId(rawId);
    if (!id) return;
    const meta = ensureObject(lyricsMap[rawId]);
    const prev = normalizedLyrics.get(id) || {};
    normalizedLyrics.set(id, { ...prev, ...meta, links: ensureObject(meta.links || prev.links) });
  });

  const map = new Map();

  titles.forEach((rawTitle, idx) => {
    const title = ensureString(rawTitle).trim();
    const id = sanitizeTrackId(title || `track-${idx + 1}`);
    const meta = ensureObject(normalizedLyrics.get(id));

    map.set(id, {
      id,
      title: title || ensureString(meta.title) || titleFromId(id) || id,
      index: idx,
      ...meta,
      links: ensureObject(meta.links)
    });
  });

  normalizedLyrics.forEach((meta, id) => {
    if (map.has(id)) return;
    if (!hasMeaningfulTrackMeta(meta)) return;
    map.set(id, {
      id,
      title: ensureString(meta.title) || titleFromId(id) || id,
      index: null,
      ...meta,
      links: ensureObject(meta.links)
    });
  });

  const list = [...map.values()];
  list.sort((a, b) => {
    const ai = a.index === null ? 9999 : a.index;
    const bi = b.index === null ? 9999 : b.index;
    if (ai !== bi) return ai - bi;
    return ensureString(a.title).localeCompare(ensureString(b.title), undefined, { sensitivity: 'base' });
  });

  return list;
};

export const getAlbumById = (albumId) => {
  const id = ensureString(albumId);
  return albums.find((a) => a.id === id) || null;
};

export const getTrackById = (albumId, trackId) => {
  const album = getAlbumById(albumId);
  if (!album) return null;
  const id = sanitizeTrackId(ensureString(trackId));
  const list = buildAlbumTrackList(album);
  return list.find((t) => t.id === id) || null;
};

/**
 * Infer bucket tags for UI filtering without mutating source data.
 * Returned values are stable slugs like: "worship", "metal", "country", "edm", "cinematic-pop".
 */
export const inferAlbumBuckets = (album) => {
  const g = ensureString(album?.genre).toLowerCase();
  const out = new Set();

  if (g.includes('worship') || g.includes('gospel') || g.includes('christian')) out.add('worship');
  if (g.includes('metal') || g.includes('hardcore')) out.add('metal');
  if (g.includes('country')) out.add('country');
  if (g.includes('trance') || g.includes('edm') || g.includes('dance') || g.includes('electronic') || g.includes('dnb') || g.includes('drum')) out.add('edm');
  if (g.includes('rap') || g.includes('hip hop') || g.includes('hip-hop')) out.add('hip-hop');
  if (g.includes('cinematic')) out.add('cinematic');
  if (g.includes('pop')) out.add('pop');
  if (g.includes('rock')) out.add('rock');

  // Always return at least one stable value for UI
  return out.size ? [...out] : ['other'];
};