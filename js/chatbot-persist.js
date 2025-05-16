// js/chatbot-persist.js
document.addEventListener('DOMContentLoaded', () => {
 console.log('chatbot-persist.js: DOMContentLoaded fired, initializing persistence.');

 const chatWindow = document.getElementById('chatbot-window');
 const chatIcon = document.getElementById('chatbot-icon');
 const chatBody = document.getElementById('chatbot-body');
 const userInput = document.getElementById('user-input');
 const sendButton = document.getElementById('chatbot-send-button');
 const closeButton = document.getElementById('chatbot-close-button');
 const resetButton = document.getElementById('chatbot-reset-button');

 // Log missing elements for debugging
 if (!chatWindow) console.warn('Chatbot window not found. Ensure element with id="chatbot-window" exists.');
 if (!chatIcon) console.warn('Chatbot icon not found. Ensure element with id="chatbot-icon" exists.');
 if (!chatBody) console.warn('Chatbot body not found. Ensure element with id="chatbot-body" exists.');
 if (!userInput) console.warn('Chatbot user input not found. Ensure element with id="user-input" exists.');
 if (!sendButton) console.warn('Chatbot send button not found. Ensure element with id="chatbot-send-button" exists.');
 if (!closeButton) console.warn('Chatbot close button not found. Ensure element with id="chatbot-close-button" exists.');
 if (!resetButton) console.warn('Chatbot reset button not found. Ensure element with id="chatbot-reset-button" exists or remove reset functionality.');

 // Load persisted state
 const isChatOpen = sessionStorage.getItem('chatbotOpen') === 'true';
 const storedMessages = sessionStorage.getItem('chatbotMessages');

 // Restore open/closed state
 if (isChatOpen && chatWindow) {
 chatWindow.classList.remove('hidden');
 chatWindow.setAttribute('aria-hidden', 'false');
 if (userInput) userInput.focus();
 console.log('Chatbot restored to open state on page load.');
 } else if (chatWindow) {
 chatWindow.classList.add('hidden');
 chatWindow.setAttribute('aria-hidden', 'true');
 console.log('Chatbot restored to closed state on page load.');
 }

 // Restore conversation history
 if (storedMessages && chatBody) {
 chatBody.innerHTML = storedMessages;
 chatBody.scrollTop = chatBody.scrollHeight;
 console.log('Restored conversation history.');
 }

 // Function to toggle the chatbot
 function toggleChatbot() {
 if (!chatWindow) return;
 const isHidden = chatWindow.classList.contains('hidden');
 if (isHidden) {
 chatWindow.classList.remove('hidden');
 chatWindow.setAttribute('aria-hidden', 'false');
 if (userInput) userInput.focus();
 sessionStorage.setItem('chatbotOpen', 'true');
 console.log('Chatbot opened.');
 } else {
 chatWindow.classList.add('hidden');
 chatWindow.setAttribute('aria-hidden', 'true');
 sessionStorage.setItem('chatbotOpen', 'false');
 console.log('Chatbot closed.');
 }
 }

 // Save open/closed state when toggling the chatbot
 if (chatIcon) {
 chatIcon.addEventListener('click', () => {
 console.log('Chat icon clicked.');
 toggleChatbot();
 });
 chatIcon.addEventListener('keypress', (e) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 console.log('Chat icon keypress:', e.key);
 toggleChatbot();
 }
 });
 }

 // Handle close button
 if (closeButton) {
 closeButton.addEventListener('click', () => {
 if (!chatWindow) return;
 chatWindow.classList.add('hidden');
 chatWindow.setAttribute('aria-hidden', 'true');
 sessionStorage.setItem('chatbotOpen', 'false');
 console.log('Close button clicked, chatbot hidden.');
 });
 }

 // Handle reset button
 if (resetButton) {
 resetButton.addEventListener('click', () => {
 if (chatBody) {
 chatBody.innerHTML = '';
 sessionStorage.removeItem('chatbotMessages');
 sessionStorage.removeItem('chatbotState');
 sessionStorage.removeItem('chatbotRateLimit');
 sessionStorage.setItem('chatbotOpen', 'true'); // Keep chat open after reset
 console.log('Conversation reset via button.');
 }
 });
 }

 // Save conversation history
 function saveMessages() {
 if (chatBody) {
 sessionStorage.setItem('chatbotMessages', chatBody.innerHTML);
 chatBody.scrollTop = chatBody.scrollHeight;
 console.log('Saved conversation history.');
 }
 }

 // Save messages on send
 if (sendButton) {
 sendButton.addEventListener('click', () => {
 console.log('Send button clicked, saving messages.');
 saveMessages();
 });
 }

 if (userInput) {
 userInput.addEventListener('keypress', (e) => {
 if (e.key === 'Enter') {
 console.log('Enter key pressed, saving messages.');
 setTimeout(saveMessages, 0); 
 }
 });
 }
});