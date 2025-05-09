// ===========================================
// mud-client.js (Full Advanced File with Enhancements)
// ===========================================

// Global variables
let mudOutput = document.getElementById('mudOutput');
let mudCommand = document.getElementById('mudCommand');
let colorEnabled = false;
let soundEnabled = false;
let loggingEnabled = false;
let logData = '';
let aliasMap = {}; // NEW: Command aliases

// Connect to server (mocked)
function connectToServer(host, port) {
    appendOutput(`Connecting to ${host}:${port}...`);
    setTimeout(() => {
        appendOutput(`Connected to ${host}:${port}. Ready for commands.`);
    }, 1000);
}

// Send command (mocked)
function sendCommand() {
    let command = mudCommand.value.trim();
    if (command === '') return;

    // Check for alias
    if (aliasMap[command]) {
        command = aliasMap[command];
        appendOutput(`(Alias) Running: ${command}`);
    }

    appendOutput(`> ${command}`);
    processMockResponse(command);

    if (loggingEnabled) {
        logData += `> ${command}\n`;
    }

    mudCommand.value = '';
}

// Mock response processor
function processMockResponse(command) {
    let response = `You entered: ${command}`;
    if (colorEnabled) {
        response = `<span style='color: lime;'>${response}</span>`;
    }
    appendOutput(response);

    if (soundEnabled) {
        playBeep();
    }
}

// Append output to screen
function appendOutput(message) {
    mudOutput.innerHTML += `<div>${message}</div>`;
    mudOutput.scrollTop = mudOutput.scrollHeight;
}

// Play beep sound
function playBeep() {
    const beep = new Audio('assets/sounds/beep.mp3');
    beep.play();
}

// Option toggles
document.getElementById('colorToggle').addEventListener('change', e => {
    colorEnabled = e.target.checked;
});

document.getElementById('soundToggle').addEventListener('change', e => {
    soundEnabled = e.target.checked;
});

document.getElementById('logToggle').addEventListener('change', e => {
    loggingEnabled = e.target.checked;
    if (loggingEnabled) {
        logData = '';
    } else if (logData) {
        downloadLog();
    }
});

// Download log file
function downloadLog() {
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mud-session-log.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Add alias
function addAlias(alias, command) {
    aliasMap[alias] = command;
    appendOutput(`Alias added: ${alias} → ${command}`);
}

// Remove alias
function removeAlias(alias) {
    if (aliasMap[alias]) {
        delete aliasMap[alias];
        appendOutput(`Alias removed: ${alias}`);
    } else {
        appendOutput(`Alias not found: ${alias}`);
    }
}

// Enter key shortcut
mudCommand.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendCommand();
    }
});
