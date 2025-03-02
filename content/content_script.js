// Inject notes and buttons into PR list and PR pages
function injectPRNotes() {
    const prElements = document.querySelectorAll("div.js-issue-row");

    prElements.forEach(pr => {
        const prLink = pr.querySelector("a.Link--primary");
        if (!prLink) return;

        const prUrl = prLink.href;
        const match = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
        if (!match) return;

        const prId = `${match[1]}/${match[2]}/${match[3]}`;

        // Prevent duplicates
        if (pr.querySelector(".pr-note-container")) return;

        // Create UI elements
        const container = document.createElement("div");
        container.className = "pr-note-container";

        const noteDisplay = document.createElement("div");
        noteDisplay.className = "pr-note-display";

        const addNoteButton = document.createElement("button");
        addNoteButton.textContent = "Add Note";
        addNoteButton.className = "pr-note-button";

        // Load existing note
        chrome.storage.local.get(prId, (data) => {
            if (data[prId]) {
                noteDisplay.textContent = `📝 ${data[prId]}`;
            }
        });

        addNoteButton.addEventListener("click", () => {
            openNotePopup(prId, noteDisplay);
        });

        container.appendChild(noteDisplay);
        container.appendChild(addNoteButton);

        pr.querySelector("div.Box-row--drag-hide").appendChild(container);
    });
}

// Create a popup for editing notes
function openNotePopup(prId, noteDisplay) {
    const existingPopup = document.querySelector(".pr-note-popup");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.className = "pr-note-popup";

    const textarea = document.createElement("textarea");
    textarea.placeholder = "Enter your note...";
    textarea.maxLength = 1024;

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";

    // Load existing note
    chrome.storage.local.get(prId, (data) => {
        if (data[prId]) {
            textarea.value = data[prId];
        }
    });

    saveButton.addEventListener("click", () => {
        const noteText = textarea.value.trim();

        if (noteText === "") {
            chrome.storage.local.remove(prId);
            noteDisplay.textContent = "";
        } else {
            chrome.storage.local.set({ [prId]: noteText });
            noteDisplay.textContent = `📝 ${noteText}`;
        }

        popup.remove();
    });

    cancelButton.addEventListener("click", () => popup.remove());

    popup.appendChild(textarea);
    popup.appendChild(saveButton);
    popup.appendChild(cancelButton);
    document.body.appendChild(popup);
}

// Check if we are on a PR list page
if (window.location.pathname.match(/^\/[^\/]+\/[^\/]+\/pulls$/)) {
    console.log("Injecting PR notes on PR list page");
    injectPRNotes();
}

// Observe changes and re-inject UI when needed
const observer = new MutationObserver(() => {
    injectPRNotes();
});
observer.observe(document.body, { childList: true, subtree: true });
