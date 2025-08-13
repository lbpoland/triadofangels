#!/usr/bin/env node
/**
 * Triad of Angels | ToA Studios — Catalog Migrator
 * Purpose:
 *  - Scan repo folders and generate /js/data/catalog.js as the single source of truth.
 *  - Picks up album covers from /assets/covers, lyrics from /lyrics, and (optionally)
 *    legacy JSON/JS data if found (tries js/data.js, js/track.js, data.js in root or /js).
 *
 * What it does:
 *  1) Loads optional legacy JSON/JS (best-effort parse).
 *  2) Scans /assets/covers for album cover filenames.
 *  3) Scans /lyrics for *.txt, assigns to tracks by naming convention.
 *  4) Writes a fully-formed /js/data/catalog.js with artists, albums, tracks, links.
 *
 * Assumptions (customize in CONFIG below if needed):
 *  - Album folder/IDs are kebab-case; cover filenames roughly match album id.
 *  - Track lyric filenames are "<albumId>__<trackId>.txt" or "<trackId>.txt" (best-effort).
 *  - If we can’t infer year/genre/links, we keep fields empty. You can fill later.
 *
 * Safe to re-run. It overwrites /js/data/catalog.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUTFILE = path.join(ROOT, 'js', 'data', 'catalog.js');

const CONFIG = {
  coversDir: path.join(ROOT, 'assets', 'covers'),
  lyricsDir: path.join(ROOT, 'lyrics'),
  // Legacy data candidates (first existing wins)
  legacyCandidates: [
    path.join(ROOT, 'js', 'data.js'),
    path.join(ROOT, 'js', 'track.js'),
    path.join(ROOT, 'data.js'),
    path.join(ROOT, 'track.js')
  ],
  defaultArtists: {
    triadOfAngels: {
      name: "Triad of Angels",
      youtube: "https://www.youtube.com/%40triadofangels",
      spotify: "https://open.spotify.com/artist/57KgHoxG7paxKh3Q4pLXvP",
      apple:   "https://music.apple.com/us/artist/triad-of-angels/1811109753"
    },
    toaStudios: {
      name: "ToA Studios",
      youtube: "https://www.youtube.com/%40triadofangels",
      spotify: "https://open.spotify.com/artist/40BdnWGmvTVO60uEp1MLrA",
      apple:   ""
    }
  }
};

function fileExists(p){ try{ fs.accessSync(p); return true; }catch{ return false; } }

function readText(p){ return fs.readFileSync(p,'utf8'); }

function safeJSON(s){
  try{ return JSON.parse(s); }catch{ return null; }
}

// crude JS object extractor for files that say "window.DATA = {...}" etc
function extractJSObject(js){
  // Try to find the first { ... } big object
  const start = js.indexOf('{');
  const end   = js.lastIndexOf('}');
  if(start>=0 && end>start){
    const body = js.slice(start, end+1);
    // Try strict JSON first
    const j = safeJSON(body.replace(/(\w+):/g, '"$1":')); // naive key quoting
    if(j) return j;
    // Fallback: eval in a sandbox-ish Function (repo trusted locally)
    try{
      /* eslint no-new-func: 0 */
      return Function(`"use strict"; return (${body});`)();
    }catch(e){ return null; }
  }
  return null;
}

function scanDir(dir, pred){
  const out=[];
  if(!fileExists(dir)) return out;
  for(const f of fs.readdirSync(dir)){
    const full = path.join(dir,f);
    const stat = fs.statSync(full);
    if(stat.isFile() && pred(f)) out.push({name:f, full});
  }
  return out;
}

function kebabId(s){
  return String(s||'').trim().toLowerCase()
    .replace(/['’]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}

function inferAlbumFromCover(filename){
  const base = filename.replace(/\.(png|jpe?g|webp|gif|svg)$/i,'');
  return kebabId(base);
}

function loadLegacy(){
  for(const cand of CONFIG.legacyCandidates){
    if(fileExists(cand)){
      const txt = readText(cand);
      const asJSON = safeJSON(txt);
      if(asJSON) return asJSON;
      const obj = extractJSObject(txt);
      if(obj) return obj;
    }
  }
  return null;
}

function build(){
  const legacy = loadLegacy();

  const artists = { ...(CONFIG.defaultArtists) };

  // Albums map by id
  const albums = {};

  // Cover scan
  const covers = scanDir(CONFIG.coversDir, f=>/\.(png|jpe?g|webp|gif|svg)$/i.test(f));
  covers.forEach(({name})=>{
    const id = inferAlbumFromCover(name);
    if(!albums[id]) albums[id] = { id, artist:'triadOfAngels', title:id.replace(/-/g,' '), year:'', genre:[], cover:`/assets/covers/${name}`, spotify:'', apple:'', youtubeMusic:'', tracks:[] };
    else albums[id].cover = `/assets/covers/${name}`;
  });

  // Lyrics scan
  const lyricFiles = scanDir(CONFIG.lyricsDir, f=>/\.txt$/i.test(f));
  lyricFiles.forEach(({name})=>{
    // Patterns supported: "<albumId>__<trackId>.txt" OR "<trackId>.txt"
    const base = name.replace(/\.txt$/i,'');
    let albumId='', trackId='';
    const m = base.match(/^(.+?)__([^_].+)$/); // album__track
    if(m){ albumId = kebabId(m[1]); trackId = kebabId(m[2]); }
    else { trackId = kebabId(base); }

    // attach to album if known else to a generic album bucket
    const targetAlbumId = albumId && albums[albumId] ? albumId : albumId || Object.keys(albums)[0] || 'unassigned';
    if(!albums[targetAlbumId]){
      albums[targetAlbumId] = { id:targetAlbumId, artist:'triadOfAngels', title:targetAlbumId.replace(/-/g,' '), year:'', genre:[], cover:'', spotify:'', apple:'', youtubeMusic:'', tracks:[] };
    }
    const a = albums[targetAlbumId];
    if(!a.tracks.find(t=>t.id===trackId)){
      a.tracks.push({ id: trackId, title: trackId.replace(/-/g,' '), duration:'', feat:'', lyrics: `/lyrics/${name}`, spotify:'', apple:'', youtubeMusic:'' });
    }
  });

  // Merge legacy hints if found
  if(legacy){
    // Try common shapes: {albums:[...]} or direct array; allow artist names, years, links, genres, tracks
    const legacyAlbums = legacy.albums || legacy.Albums || legacy.ALBUMS || Array.isArray(legacy) ? legacy : [];
    (legacyAlbums||[]).forEach(la=>{
      const id = kebabId(la.id || la.title || la.name);
      if(!id) return;
      if(!albums[id]){
        albums[id] = { id, artist:'triadOfAngels', title: la.title || la.name || id, year: la.year||'', genre: la.genre||[], cover: la.cover||'', spotify: la.spotify||'', apple: la.apple||'', youtubeMusic: la.youtubeMusic||'', tracks:[] };
      } else {
        const a = albums[id];
        a.title = la.title || la.name || a.title;
        a.artist = la.artistKey || a.artist;
        a.year = la.year || a.year;
        a.genre = la.genre || a.genre;
        a.cover = la.cover || a.cover;
        a.spotify = la.spotify || a.spotify;
        a.apple = la.apple || a.apple;
        a.youtubeMusic = la.youtubeMusic || a.youtubeMusic;
      }
      const trackList = la.tracks || la.Tracks || [];
      trackList.forEach(t=>{
        const tid = kebabId(t.id || t.title);
        if(!tid) return;
        const existing = albums[id].tracks.find(x=>x.id===tid);
        const item = { id: tid, title: t.title || t.name || tid, duration: t.duration||'', feat: t.feat||'', lyrics: t.lyrics||'', spotify:t.spotify||'', apple:t.apple||'', youtubeMusic:t.youtubeMusic||'' };
        if(existing){ Object.assign(existing, item); } else { albums[id].tracks.push(item); }
      });
    });

    // Legacy artists if present
    const legacyArtists = legacy.artists || legacy.Artists;
    if(legacyArtists && typeof legacyArtists==='object'){
      for(const [k,v] of Object.entries(legacyArtists)){
        artists[k] = v;
      }
    }
  }

  // Construct final catalog object
  const catalog = {
    artists,
    albums: Object.values(albums).sort((a,b)=>(String(a.title)).localeCompare(String(b.title))),
    videos: [] // optional; fill later or auto from legacy if present
  };

  // Write /js/data/catalog.js
  const header = `/* AUTO-GENERATED by tools/migrate-to-catalog.js — DO NOT EDIT BY HAND */\n`;
  const body = `window.TOA_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
  fs.mkdirSync(path.dirname(OUTFILE), { recursive: true });
  fs.writeFileSync(OUTFILE, header + body, 'utf8');

  console.log(`✔ Wrote ${OUTFILE}`);
  console.log(`Albums found: ${catalog.albums.length}`);
  const trackCount = catalog.albums.reduce((n,a)=>n+(a.tracks?a.tracks.length:0),0);
  console.log(`Tracks found: ${trackCount}`);
}

build();
