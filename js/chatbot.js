// js/chatbot.js
document.addEventListener('DOMContentLoaded', () => {
 console.log('chatbot.js: DOMContentLoaded fired, initializing chatbot.');

 // === UTILITY FUNCTIONS ===
 // Sanitize input to prevent XSS and other attacks
 const sanitizeInput = (text) => {
 const div = document.createElement('div');
 div.textContent = text;
 return div.innerHTML
 .replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;')
 .replace(/"/g, '&quot;')
 .replace(/'/g, '&#39;');
 };

 // Rate limiter to prevent spamming
 class RateLimiter {
 constructor(limit = 10, windowMs = 60000) { // 10 messages per minute
 this.limit = limit;
 this.windowMs = windowMs;
 this.requests = JSON.parse(sessionStorage.getItem('chatbotRateLimit')) || [];
 }

 canSend() {
 const now = Date.now();
 this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);
 if (this.requests.length >= this.limit) return false;
 this.requests.push(now);
 sessionStorage.setItem('chatbotRateLimit', JSON.stringify(this.requests));
 return true;
 }

 getRemainingTime() {
 const now = Date.now();
 const oldestRequest = this.requests[0] || now;
 return Math.max(0, this.windowMs - (now - oldestRequest));
 }
 }

 // === CHATBOT CORE ===
 class Chatbot {
 constructor() {
 // DOM Elements
 this.chatBody = document.getElementById('chatbot-body');
 this.userInput = document.getElementById('user-input');
 this.sendButton = document.getElementById('chatbot-send-button');
 this.resetButton = document.getElementById('chatbot-reset-button'); // Optional reset button

 // Initialize Modules
 this.rateLimiter = new RateLimiter();
 this.security = new SecurityModule();
 this.nlp = new NLPModule();
 this.conversation = new ConversationManager();
 this.knowledgeBase = new KnowledgeBase();
 this.responseEngine = new ResponseEngine();
 this.errorHandler = new ErrorHandler();

 // Initialize Chatbot
 this.restoreConversation();
 this.setupEventListeners();
 }

 setupEventListeners() {
 if (this.sendButton) {
 this.sendButton.addEventListener('click', () => {
 console.log('Send button clicked.');
 this.handleUserInput();
 });
 } else {
 console.warn('Chatbot send button not found. Ensure element with id="chatbot-send-button" exists.');
 }
 if (this.userInput) {
 this.userInput.addEventListener('keypress', (e) => {
 if (e.key === 'Enter') {
 console.log('Enter key pressed.');
 this.handleUserInput();
 }
 });
 } else {
 console.warn('Chatbot user input not found. Ensure element with id="user-input" exists.');
 }
 if (this.resetButton) {
 this.resetButton.addEventListener('click', () => {
 console.log('Reset button clicked.');
 this.resetConversation();
 });
 }
 }

 restoreConversation() {
 if (!this.chatBody) {
 console.warn('Chatbot body not found. Ensure element with id="chatbot-body" exists.');
 return;
 }
 const storedMessages = sessionStorage.getItem('chatbotMessages');
 if (storedMessages) {
 this.chatBody.innerHTML = storedMessages;
 this.chatBody.scrollTop = this.chatBody.scrollHeight;
 console.log('Restored conversation history.');
 } else {
 this.displayGreeting();
 }
 }

 displayGreeting() {
 if (!this.chatBody || this.chatBody.innerHTML.trim() !== '') return;
 const greeting = this.responseEngine.generateGreeting(this.conversation.getUserContext());
 this.addMessage(greeting, 'bot-message');
 }

 handleUserInput() {
 if (!this.userInput) {
 console.error('User input element missing in handleUserInput.');
 return;
 }
 const userText = this.userInput.value.trim();
 if (userText === '') {
 console.log('Empty input ignored.');
 return;
 }

 // Security Checks
 if (!this.security.validateInput(userText)) {
 this.addMessage("Sorry, your message contains unsafe content. Please try again.", 'bot-message');
 console.log('Input rejected due to security validation.');
 return;
 }

 if (!this.rateLimiter.canSend()) {
 const waitTime = Math.ceil(this.rateLimiter.getRemainingTime() / 1000);
 this.addMessage(`Please wait ${waitTime} seconds before sending another message.`, 'bot-message');
 console.log('Input rejected due to rate limiting.');
 return;
 }

 // Add user message
 this.addMessage(userText, 'user-message');
 this.userInput.value = '';

 // Process input
 setTimeout(() => {
 try {
 const response = this.processInput(userText);
 this.addMessage(response, 'bot-message');
 } catch (error) {
 console.error('Internal error in processInput:', error);
 const fallback = this.errorHandler.handleInternalError();
 this.addMessage(fallback, 'bot-message');
 }
 }, 500);
 }

 processInput(userText) {
 // Step 1: Analyze input with NLP
 const { intent, entities } = this.nlp.analyze(userText);

 // Step 2: Update conversation context
 this.conversation.updateContext(intent, entities, userText);

 // Step 3: Check for multi-stage flow
 const currentFlow = this.conversation.getCurrentFlow();
 if (currentFlow) {
 return currentFlow.handle(userText, this.conversation.getContext());
 }

 // Step 4: Generate response
 let response;
 if (intent) {
 response = this.knowledgeBase.getResponse(intent, entities, this.conversation.getContext());
 } else {
 response = this.errorHandler.handleUnknownInput(userText);
 }

 // Step 5: Enhance response
 return this.responseEngine.generateResponse(response, this.conversation.getContext());
 }

 addMessage(content, className) {
 if (!this.chatBody) {
 console.error('Chat body element missing in addMessage.');
 return;
 }
 const messageDiv = document.createElement('div');
 messageDiv.className = `message ${className}`;

 const message = document.createElement('p');
 message.innerHTML = content; // Already sanitized
 messageDiv.appendChild(message);

 this.chatBody.appendChild(messageDiv);
 this.chatBody.scrollTop = this.chatBody.scrollHeight;

 // Save conversation history
 sessionStorage.setItem('chatbotMessages', this.chatBody.innerHTML);
 }

 resetConversation() {
 if (this.chatBody) {
 this.chatBody.innerHTML = '';
 sessionStorage.removeItem('chatbotMessages');
 sessionStorage.removeItem('chatbotState');
 sessionStorage.removeItem('chatbotRateLimit');
 this.conversation = new ConversationManager(); // Reset state
 this.displayGreeting();
 console.log('Conversation reset.');
 }
 }
 }

 // === SECURITY MODULE ===
 class SecurityModule {
 constructor() {
 this.blockedPatterns = [
 /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
 /on\w+\s*=/gi,
 /javascript:/gi,
 /data:/gi,
 /select\s+.*\s+from/gi,
 /(fuck|shit|damn|bitch|asshole)/gi,
 ];
 this.maxMessageLength = 500;
 }

 validateInput(text) {
 if (text.length > this.maxMessageLength) return false;
 const sanitized = sanitizeInput(text);
 return !this.blockedPatterns.some(pattern => pattern.test(sanitized));
 }
 }

 // === NATURAL LANGUAGE PROCESSING MODULE ===
 class NLPModule {
 constructor() {
 this.intents = {
 greeting: {
 patterns: ['hello', 'hi', 'hey', 'greetings', 'welcome'],
 keywords: ['how are you', 'good morning', 'good afternoon'],
 },
 query_music: {
 patterns: ['music', 'songs', 'album', 'albums', 'track', 'tracks'],
 keywords: ['listen', 'play', 'stream', 'genre', 'new release'],
 },
 query_games: {
 patterns: ['game', 'games', 'gaming'],
 keywords: ['play', 'download', 'angel wars'],
 },
 query_merch: {
 patterns: ['merch', 'merchandise', 'shop', 'store', 'buy'],
 keywords: ['shirt', 'poster', 'hat', 'purchase'],
 },
 query_about: {
 patterns: ['about', 'who are you', 'what is this'],
 keywords: ['triad of angels', 'toa studios', 'story', 'mission'],
 },
 query_help: {
 patterns: ['help', 'support', 'assist', 'problem'],
 keywords: ['issue', 'trouble', 'how to', 'fix'],
 },
 query_navigation: {
 patterns: ['go to', 'navigate', 'where is', 'find'],
 keywords: ['music page', 'games page', 'merch page', 'about page'],
 },
 query_contact: {
 patterns: ['contact', 'reach out', 'support team'],
 keywords: ['email', 'phone', 'get in touch'],
 },
 query_social: {
 patterns: ['social media', 'follow', 'tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'x'],
 keywords: ['account', 'profile', 'page'],
 },
 };
 }

 analyze(text) {
 const lowerText = text.toLowerCase();
 let intent = null;
 const entities = {};

 for (const [intentName, data] of Object.entries(this.intents)) {
 const patternMatch = data.patterns.some(pattern => lowerText.includes(pattern));
 const keywordMatch = data.keywords.some(keyword => lowerText.includes(keyword));
 if (patternMatch || keywordMatch) {
 intent = intentName;
 break;
 }
 }

 if (intent === 'query_music') {
 const albumNames = this.getAlbumNames();
 const foundAlbum = albumNames.find(name => lowerText.includes(name.toLowerCase()));
 if (foundAlbum) entities.album = foundAlbum;
 const genres = ['cinematic pop', 'electronic', 'country', 'orchestral', 'soundtrack'];
 const foundGenre = genres.find(genre => lowerText.includes(genre));
 if (foundGenre) entities.genre = foundGenre;
 if (lowerText.includes('new') || lowerText.includes('latest')) entities.requestType = 'latest';
 }

 if (intent === 'query_navigation') {
 const pages = ['music', 'games', 'merch', 'about', 'visual', 'apps', 'publishing', 'digital store', 'contact'];
 const foundPage = pages.find(page => lowerText.includes(page));
 if (foundPage) entities.page = foundPage;
 }

 if (intent === 'query_social') {
 const platforms = ['tiktok', 'instagram', 'youtube', 'facebook', 'x', 'twitter'];
 const foundPlatform = platforms.find(platform => lowerText.includes(platform));
 if (foundPlatform) entities.platform = foundPlatform;
 }

 return { intent, entities };
 }

 getAlbumNames() {
 const knowledgeBase = new KnowledgeBase();
 return knowledgeBase.albums.map(album => album.title);
 }
 }

 // === CONVERSATION MANAGER ===
 class ConversationManager {
 constructor() {
 this.state = JSON.parse(sessionStorage.getItem('chatbotState')) || {
 history: [],
 context: {},
 preferences: {},
 currentFlow: null,
 };
 // Ensure preferences is initialized
 this.state.preferences = this.state.preferences || {};
 this.saveState();
 }

 updateContext(intent, entities, userText) {
 this.state.history.push({ userText, intent, entities, timestamp: Date.now() });
 if (this.state.history.length > 100) this.state.history.shift(); // Limit history
 this.state.context = { intent, entities, lastUserText: userText };

 if (entities.album) this.state.preferences.favoriteAlbum = entities.album;
 if (entities.genre) this.state.preferences.preferredGenre = entities.genre;
 if (entities.page) this.state.preferences.lastVisitedPage = entities.page;

 this.saveState();
 }

 getContext() {
 return this.state.context || {};
 }

 getUserContext() {
 return this.state.preferences || {};
 }

 getHistory() {
 return this.state.history || [];
 }

 getCurrentFlow() {
 if (this.state.currentFlow) {
 switch (this.state.currentFlow) {
 case 'music_exploration':
 return new MusicExplorationFlow();
 case 'navigation_guide':
 return new NavigationGuideFlow();
 default:
 return null;
 }
 }
 return null;
 }

 setCurrentFlow(flowName) {
 this.state.currentFlow = flowName;
 this.saveState();
 }

 clearCurrentFlow() {
 this.state.currentFlow = null;
 this.saveState();
 }

 saveState() {
 sessionStorage.setItem('chatbotState', JSON.stringify(this.state));
 }
 }

 // === KNOWLEDGE BASE ===
 class KnowledgeBase {
 constructor() {
 this.albums = [
 {
 id: "wings-of-fire",
 title: "Wings of Fire",
 artist: "Triad of Angels",
 genre: "Cinematic Pop",
 year: 2024,
 tracks: ["Ignite the Sky", "Eternal Flame", "Rise Above"],
 links: {
 spotify: "https://open.spotify.com/album/4K83YJEeETmcybKtQ1LP5l?si=fOFELopLS9W3eLOSR8x5tA",
 appleMusic: "https://music.apple.com/us/album/wings-of-fire-ep/1812163266",
 },
 description: "A cinematic pop masterpiece weaving themes of hope, strength, and fiery passion."
 },
 {
 id: "ascend",
 title: "Ascend",
 artist: "Triad of Angels",
 genre: "Cinematic Pop",
 year: 2025,
 tracks: ["Ascension", "Skyward Bound", "Celestial Rise"],
 links: {
 spotify: "https://open.spotify.com/album/5EetoHOZzPFoLGfM7XzTim?si=cWzTT5jKQ5KI-KkQYubADQ",
 appleMusic: "https://music.apple.com/us/album/ascend/1812603057",
 },
 description: "An uplifting journey of soaring melodies and emotions."
 },
 {
 id: "probed-and-confused",
 title: "Probed & Confused",
 artist: "ToA Studios",
 genre: "Electronic",
 year: 2025,
 tracks: ["First Contact", "Lost in the Void", "Abduction Anthem"],
 links: {
 spotify: "https://open.spotify.com/album/5pdZRwo8VXH3sxTZzqsUjN?si=nDt0mqEjQ82k-TaymTQYZQ",
 appleMusic: "https://music.apple.com/us/album/probed-confused/1812599708",
 },
 description: "An electronic journey through cosmic confusion and extraterrestrial vibes."
 },
 {
 id: "echoes-on-the-dirt-road",
 title: "Echoes on the Dirt Road",
 artist: "ToA Studios",
 genre: "Country",
 year: 2025,
 tracks: ["Dirt Road Echoes", "Whispers in the Wind", "Fading Footprints"],
 links: {
 spotify: "https://open.spotify.com/album/0y1rCdAJggJMoFvX1FFKDe?si=Vo8Gj9uXSku2-6WzY6HgQg",
 appleMusic: "https://music.apple.com/us/album/echoes-on-the-dirt-road/1812611626",
 },
 description: "A heartfelt country album capturing the soul of rural life with hauntingly beautiful melodies."
 },
 {
 id: "phoenix-rising",
 title: "Phoenix Rising",
 artist: "ToA Studios",
 genre: "Orchestral",
 year: 2025,
 tracks: ["Ashes to Flame", "Wings of Rebirth", "Eternal Ascent"],
 links: {
 spotify: "https://open.spotify.com/album/5xqK1MMJrhPOcPM58zjlvE?si=mn6Yx15fQkGzTLKPOPNE7Q",
 appleMusic: "https://music.apple.com/us/album/phoenix-rising/1812648146",
 },
 description: "An orchestral masterpiece symbolizing renewal and resilience through soaring compositions."
 },
 {
 id: "the-quiet-war",
 title: "The Quiet War",
 artist: "ToA Studios",
 genre: "Soundtrack",
 year: 2025,
 tracks: ["Silent Conflict", "Shadows of Valor", "Echoes of Peace"],
 links: {
 spotify: "https://open.spotify.com/album/5grqzzq1V4Gaw3jqDjoQbV?si=7YUpINOaRmaKSuYdtlVzvQ",
 appleMusic: "https://music.apple.com/us/album/the-quiet-war/1812870604",
 },
 description: "A gripping soundtrack for an untold story of inner battles and silent victories."
 },
 {
 id: "reality-exe",
 title: "Reality.exe",
 artist: "ToA Studios",
 genre: "Electronic",
 year: 2025,
 tracks: ["Code of Existence", "Digital Pulse", "System Reboot"],
 links: {
 spotify: "https://open.spotify.com/album/6SzYfretgTzLUITlIP6AMy?si=f2cObGo4STKF-YQusk5YGg",
 appleMusic: "https://music.apple.com/us/album/reality-exe/1812900765",
 },
 description: "An electronic album that glitches through the fabric of existence with pulsating beats."
 },
 ];

 this.pages = [
 { name: "Home", url: "index.html", description: "Discover the essence of Triad of Angels." },
 { name: "About", url: "about.html", description: "Learn about Triad of Angels and ToA Studios." },
 { name: "Music", url: "music.html", description: "Explore our albums and tracks." },
 { name: "Visual", url: "visual.html", description: "Experience our visual creations." },
 { name: "Games", url: "games.html", description: "Discover our interactive games." },
 { name: "Apps", url: "apps.html", description: "Check out our applications." },
 { name: "Merch", url: "merch.html", description: "Shop for Triad of Angels merchandise." },
 { name: "Publishing", url: "publishing.html", description: "Explore our publishing works." },
 { name: "Digital Store", url: "digital-store.html", description: "Visit our digital store." },
 { name: "Contact", url: "contact.html", description: "Get in touch with us." },
 ];

 this.socialMedia = [
 { platform: "TikTok", url: "https://www.tiktok.com/@triadofangels", username: "@triadofangels" },
 { platform: "Instagram", url: "https://www.instagram.com/triadofangels/", username: "@triadofangels" },
 { platform: "YouTube", url: "https://www.youtube.com/@triadofangels_new", username: "@triadofangels_new" },
 { platform: "Facebook", url: "https://www.facebook.com/triadofangels", username: "triadofangels" },
 { platform: "X", url: "https://x.com/triadofangels", username: "@triadofangels" },
 ];

 this.faqs = [
 { question: "What is Triad of Angels?", answer: "Triad of Angels is a creative project blending music, games, and stories, brought to life by ToA Studios, guided by the principles of Hope, Strength, Fire, and Innovation." },
 { question: "How can I listen to your music?", answer: "You can stream our albums on platforms like Spotify and Apple Music. Visit the Music page for links to all streaming platforms!" },
 { question: "Who are the angels?", answer: "The angels of Triad embody our core values. For example, Seraphina, the Angel of Hope, guides visitors with light and inspiration. Learn more on our About page!" },
 ];
 }

 getResponse(intent, entities, context) {
 switch (intent) {
 case 'greeting':
 return "Greetings, seeker of light! Welcome to the celestial realm of Triad of Angels. I’m here to guide you—would you like to explore our music, learn about our story, or perhaps visit another part of our site?";
 case 'query_music':
 if (entities.requestType === 'latest') {
 const latestAlbum = this.albums.reduce((latest, album) => 
 album.year > latest.year ? album : latest, this.albums[0]);
 return this.formatAlbumResponse(latestAlbum, "Here’s our latest album");
 }
 if (entities.album) {
 const album = this.albums.find(a => a.title.toLowerCase() === entities.album.toLowerCase());
 return this.formatAlbumResponse(album);
 }
 if (entities.genre) {
 const albums = this.albums.filter(a => a.genre.toLowerCase() === entities.genre.toLowerCase());
 const albumList = albums.map(a => `*${a.title}*`).join(', ');
 return `In the ${entities.genre} genre, we have: ${albumList}. Would you like to learn more about one of these albums?`;
 }
 return new MusicExplorationFlow().start();
 case 'query_games':
 return "Our Games section features immersive experiences like Angel Wars. You can explore them on the Games page: <a href='games.html'>Games</a>. Would you like to know more about a specific game?";
 case 'query_merch':
 return "We offer a range of merchandise, including shirts, posters, and hats, in our Merch section. Visit the store here: <a href='merch.html'>Merch</a>. Interested in a particular item?";
 case 'query_about':
 return "Triad of Angels is a cosmic journey of music, stories, and creations, brought to life by ToA Studios. We’re guided by the principles of Hope, Strength, Fire, and Innovation. Learn more about us and the angels who inspire us on the About page: <a href='about.html'>About</a>.";
 case 'query_help':
 return "I’m here to assist you on your celestial journey! Are you looking for information about our music, help with navigating the site, or something else?";
 case 'query_navigation':
 if (entities.page) {
 const page = this.pages.find(p => p.name.toLowerCase() === entities.page.toLowerCase());
 return `Let me guide you to the ${page.name} page! ${page.description} Visit it here: <a href='${page.url}'>${page.name}</a>.`;
 }
 return new NavigationGuideFlow().start();
 case 'query_contact':
 return "You can get in touch with us through the Contact page, where you’ll find our email and other contact details: <a href='contact.html'>Contact</a>. How can I assist you further?";
 case 'query_social':
 if (entities.platform) {
 const platform = this.socialMedia.find(p => p.platform.toLowerCase() === entities.platform.toLowerCase());
 return `You can follow us on ${platform.platform} at ${platform.username}: <a href='${platform.url}' target='_blank'>${platform.url}</a>. Would you like to check out another platform?`;
 }
 const platforms = this.socialMedia.map(p => `${p.platform} (${p.username})`).join(', ');
 return `We’re on several social media platforms: ${platforms}. Which one would you like to visit?`;
 default:
 return "I’m not sure how to assist with that. Perhaps you’d like to explore our music, learn about our story, or visit a specific page on our site?";
 }
 }

 formatAlbumResponse(album, intro = "Here’s what I know about") {
 return `${intro} <em>${album.title}</em> by ${album.artist}: a ${album.genre} album released in ${album.year}. It features tracks like ${album.tracks.join(', ')}. ${album.description} You can listen on <a href='${album.links.spotify}' target='_blank'>Spotify</a> or <a href='${album.links.appleMusic}' target='_blank'>Apple Music</a>. Would you like to explore another album?`;
 }
 }

 // === RESPONSE ENGINE ===
 class ResponseEngine {
 constructor() {
 this.greetingVariations = [
 "Greetings, seeker of light! Welcome to the celestial realm of Triad of Angels. I’m here to guide you—would you like to explore our music, learn about our story, or perhaps visit another part of our site?",
 "Hello, traveler of the cosmos! I’m delighted to welcome you to Triad of Angels, where hope and inspiration soar. What would you like to discover today?",
 "Welcome to Triad of Angels, where celestial dreams come to life! I’m here to assist you on this journey—what sparks your curiosity?",
 ];

 this.responseEnhancements = [
 (msg) => `${msg} Let me know how I can assist you further!`,
 (msg) => `${msg} I’m here to guide you on this celestial journey—what’s next?`,
 (msg) => `${msg} May your exploration be filled with light and inspiration!`,
 ];
 }

 generateGreeting(userContext) {
 let greeting = this.greetingVariations[Math.floor(Math.random() * this.greetingVariations.length)];

 userContext = userContext || {};
 if (userContext.favoriteAlbum) {
 greeting += ` I see you’ve shown interest in <em>${userContext.favoriteAlbum}</em> before—would you like to explore more music like that?`;
 } else if (userContext.lastVisitedPage) {
 greeting += ` You last explored our ${userContext.lastVisitedPage} page—would you like to continue there?`;
 }

 return greeting;
 }

 generateResponse(baseResponse, context) {
 const enhancement = this.responseEnhancements[Math.floor(Math.random() * this.responseEnhancements.length)];
 return enhancement(baseResponse);
 }
 }

 // === MULTI-STAGE CONVERSATION FLOWS ===
 class MusicExplorationFlow {
 start() {
 return "Let’s explore the celestial sounds of Triad of Angels! We have albums in genres like Cinematic Pop, Electronic, Country, and more. You can ask about a specific album, a genre, or I can suggest our latest release. What would you like to do?";
 }

 handle(userText, context) {
 const lowerText = userText.toLowerCase();
 const knowledgeBase = new KnowledgeBase();

 const albumNames = knowledgeBase.albums.map(a => a.title.toLowerCase());
 const foundAlbum = albumNames.find(name => lowerText.includes(name));
 if (foundAlbum) {
 const album = knowledgeBase.albums.find(a => a.title.toLowerCase() === foundAlbum);
 return knowledgeBase.formatAlbumResponse(album);
 }

 const genres = ['cinematic pop', 'electronic', 'country', 'orchestral', 'soundtrack'];
 const foundGenre = genres.find(genre => lowerText.includes(genre));
 if (foundGenre) {
 const albums = knowledgeBase.albums.filter(a => a.genre.toLowerCase() === foundGenre);
 const albumList = albums.map(a => `<em>${a.title}</em>`).join(', ');
 return `In the ${foundGenre} genre, we have: ${albumList}. Which album would you like to learn about?`;
 }

 if (lowerText.includes('latest') || lowerText.includes('new')) {
 const latestAlbum = knowledgeBase.albums.reduce((latest, album) => 
 album.year > latest.year ? album : latest, knowledgeBase.albums[0]);
 return knowledgeBase.formatAlbumResponse(latestAlbum, "Here’s our latest album");
 }

 return "I’m not sure what you’re looking for. You can ask about a specific album (like <em>Wings of Fire</em>), a genre (like Cinematic Pop), or I can share our latest release. What would you like to do?";
 }
 }

 class NavigationGuideFlow {
 start() {
 return "I can guide you through the celestial paths of our site! We have pages like Music, Games, Merch, About, and more. Which page would you like to visit?";
 }

 handle(userText, context) {
 const lowerText = userText.toLowerCase();
 const knowledgeBase = new KnowledgeBase();

 const pages = knowledgeBase.pages.map(p => ({ name: p.name.toLowerCase(), ...p }));
 const foundPage = pages.find(page => lowerText.includes(page.name));
 if (foundPage) {
 return `Let me guide you to the ${foundPage.name} page! ${foundPage.description} Visit it here: <a href='${foundPage.url}'>${foundPage.name}</a>.`;
 }

 return "I didn’t catch that. We have pages like Music, Games, Merch, and About. Which one would you like to visit?";
 }
 }

 // === ERROR HANDLER ===
 class ErrorHandler {
 handleUnknownInput(userText) {
 const suggestions = [
 "I’m not sure what you mean. Are you interested in our music, games, or perhaps our story on the About page?",
 "Hmm, I didn’t catch that. Can you tell me more, or would you like to explore our albums or site pages?",
 "I’m a bit lost, seeker of light! Could you try asking about our music, merchandise, or how to navigate the site?"
 ];
 return suggestions[Math.floor(Math.random() * suggestions.length)];
 }

 handleInternalError() {
 return "Something went wrong on my end, but I’m still here to help! Let’s try something else—perhaps you’d like to explore our music or learn about Triad of Angels?";
 }
 }

 // === INITIALIZE CHATBOT ===
 const chatbot = new Chatbot();
});