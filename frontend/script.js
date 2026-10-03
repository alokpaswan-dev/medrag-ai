const API_BASE = "http://127.0.0.1:8000";

let selectedReportFile = null;



const chatMessages = document.getElementById("chatMessages");
const welcomeScreen = document.getElementById("welcomeScreen");

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const newChatBtn = document.getElementById("newChatBtn");
const clearBtn = document.getElementById("clearBtn");
const backBtn = document.getElementById("backBtn");
const themeBtn = document.getElementById("themeBtn");
const exportBtn = document.getElementById("exportBtn");

const backendStatus = document.getElementById("backendStatus");
const backendDot = document.getElementById("backendDot");

const recentQuestions = document.getElementById("recentQuestions");

const questionFeature = document.getElementById("questionFeature");
const reportFeature = document.getElementById("reportFeature");
const sourceFeature = document.getElementById("sourceFeature");

const reportPanel = document.getElementById("reportPanel");
const reportInput = document.getElementById("reportInput");
const chooseFileBtn = document.getElementById("chooseFileBtn");
const selectedFile = document.getElementById("selectedFile");
const reportFileName = document.getElementById("reportFileName");
const reportFileSize = document.getElementById("reportFileSize");
const removeFileBtn = document.getElementById("removeFileBtn");

const previewContainer = document.getElementById("previewContainer");
const reportPreview = document.getElementById("reportPreview");

const analyzeReportBtn = document.getElementById("analyzeReportBtn");
const closeReportBtn = document.getElementById("closeReportBtn");
const dropArea = document.getElementById("dropArea");

const toast = document.getElementById("toast");


document.addEventListener("DOMContentLoaded", function () {

    loadTheme();
    loadRecentQuestions();

    checkBackend();

    setupEvents();

});


function setupEvents() {

    
    sendButton.addEventListener("click", sendQuestion);

    messageInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter" && !event.shiftKey) {

            event.preventDefault();

            sendQuestion();

        }

    });


    
    newChatBtn.addEventListener("click", function () {

        startNewChat();

    });


    
    clearBtn.addEventListener("click", function () {

        clearChat();

    });


    
    backBtn.addEventListener("click", function () {

        goBack();

    });


   
    themeBtn.addEventListener("click", function () {

        toggleTheme();

    });


   
    exportBtn.addEventListener("click", function () {

        exportChat();

    });


    
    const quickQuestions =
        document.querySelectorAll(".quick-question");

    quickQuestions.forEach(function (button) {

        button.addEventListener("click", function () {

            const question = button.textContent.trim();

            messageInput.value = question;

            messageInput.focus();

        });

    });


    
    questionFeature.addEventListener("click", function () {

        hideWelcome();

        messageInput.focus();

    });


    
    reportFeature.addEventListener("click", function () {

        openReportPanel();

    });



    sourceFeature.addEventListener("click", function () {

        showLastSources();

    });


    
    chooseFileBtn.addEventListener("click", function () {

        reportInput.click();

    });


    reportInput.addEventListener("change", function () {

        if (reportInput.files.length > 0) {

            handleReportFile(reportInput.files[0]);

        }

    });


    removeFileBtn.addEventListener("click", function () {

        removeReportFile();

    });


    closeReportBtn.addEventListener("click", function () {

        closeReportPanel();

    });


    analyzeReportBtn.addEventListener("click", function () {

        analyzeReport();

    });


    
    dropArea.addEventListener("dragover", function (event) {

        event.preventDefault();

        dropArea.classList.add("dragging");

    });


    dropArea.addEventListener("dragleave", function () {

        dropArea.classList.remove("dragging");

    });


    dropArea.addEventListener("drop", function (event) {

        event.preventDefault();

        dropArea.classList.remove("dragging");

        const files = event.dataTransfer.files;

        if (files.length > 0) {

            handleReportFile(files[0]);

        }

    });

}



async function checkBackend() {

    try {

        const response = await fetch(API_BASE + "/");

        if (!response.ok) {

            throw new Error("Backend is not responding");

        }

        backendStatus.textContent = "Backend online";
        backendDot.classList.add("online");
        backendDot.classList.remove("offline");

    }
    catch (error) {

        backendStatus.textContent = "Backend offline";

        backendDot.classList.add("offline");
        backendDot.classList.remove("online");

    }

}


async function sendQuestion() {

    const question = messageInput.value.trim();

    if (!question) {

        showToast("Please enter a question.");

        return;

    }


    hideWelcome();

    addUserMessage(question);

    messageInput.value = "";

    const loadingMessage = addLoadingMessage();


    try {

        const response = await fetch(API_BASE + "/ask", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                question: question
            })

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail || "Something went wrong."
            );

        }


        loadingMessage.remove();


        addAssistantMessage(
            data.answer,
            data.sources
        );


        saveRecentQuestion(question);

    }
    catch (error) {

        loadingMessage.remove();

        addAssistantMessage(
            "Sorry, I could not process your question. " +
            "Please check that the backend is running."
        );

        console.error("Question error:", error);

    }

}


function addUserMessage(text) {

    const message = document.createElement("div");

    message.className = "chat-message user-message";

    message.innerHTML = `
        <div class="user-bubble">
            ${escapeHTML(text)}
        </div>
    `;

    chatMessages.appendChild(message);

    scrollToBottom();

}


function addAssistantMessage(answer, sources = []) {

    const message = document.createElement("div");

    message.className = "chat-message assistant-message";

    const content = document.createElement("div");

    content.className = "assistant-content";

    content.innerHTML = formatText(answer);


    const icon = document.createElement("div");

    icon.className = "assistant-icon";

    icon.textContent = "+";


    const wrapper = document.createElement("div");

    wrapper.appendChild(icon);

    wrapper.appendChild(content);

    message.appendChild(wrapper);

    chatMessages.appendChild(message);


    if (sources && sources.length > 0) {

        showSources(message, sources);

    }


    scrollToBottom();

}


function addLoadingMessage() {

    const message = document.createElement("div");

    message.className = "chat-message assistant-message";

    message.innerHTML = `
        <div class="assistant-icon">+</div>

        <div class="assistant-content loading">
            Thinking...
        </div>
    `;

    chatMessages.appendChild(message);

    scrollToBottom();

    return message;

}


function formatText(text) {

    if (!text) {

        return "";

    }

    let safeText = escapeHTML(text);

    safeText = safeText.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    safeText = safeText.replace(
        /\n/g,
        "<br>"
    );

    return safeText;

}


let lastSources = [];


function showSources(message, sources) {

    lastSources = sources;

    const sourceBox = document.createElement("div");

    sourceBox.className = "sources";


    const title = document.createElement("div");

    title.className = "sources-title";

    title.textContent = "Sources";


    sourceBox.appendChild(title);


    sources.forEach(function (source) {

        const item = document.createElement("div");

        item.className = "source-item";

        let sourceText = "Medical knowledge base";

        if (source.source) {

            sourceText = source.source;

        }

        if (source.page !== undefined && source.page !== null) {

            sourceText += " — Page " + source.page;

        }

        item.textContent = sourceText;

        sourceBox.appendChild(item);

    });


    const content = message.querySelector(".assistant-content");

    if (content) {

        content.appendChild(sourceBox);

    }

}


function showLastSources() {

    if (!lastSources || lastSources.length === 0) {

        showToast("No sources available yet.");

        return;

    }


    let message = "Sources used for the latest answer:\n\n";

    lastSources.forEach(function (source, index) {

        message += (index + 1) + ". ";

        message += source.source || "Medical knowledge base";

        if (source.page !== undefined) {

            message += " - Page " + source.page;

        }

        message += "\n";

    });


    alert(message);

}

function hideWelcome() {

    if (welcomeScreen) {

        welcomeScreen.style.display = "none";

    }

}


function showWelcome() {

    if (welcomeScreen) {

        welcomeScreen.style.display = "block";

    }

}

function goBack() {

    closeReportPanel();

    clearChatMessages();

    showWelcome();

    messageInput.value = "";

    messageInput.focus();

    scrollToBottom();

}


function startNewChat() {

    closeReportPanel();

    clearChatMessages();

    showWelcome();

    messageInput.value = "";

    lastSources = [];

    messageInput.focus();

}

function clearChat() {

    const confirmed = confirm(
        "Clear the current conversation?"
    );

    if (!confirmed) {

        return;

    }

    clearChatMessages();

    showWelcome();

    messageInput.value = "";

    lastSources = [];

}

function clearChatMessages() {

    const messages =
        chatMessages.querySelectorAll(".chat-message");

    messages.forEach(function (message) {

        message.remove();

    });

}

function openReportPanel() {

    hideWelcome();

    reportPanel.classList.add("active");

    messageInput.blur();

}


function closeReportPanel() {

    reportPanel.classList.remove("active");

}

function handleReportFile(file) {

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg"
    ];


    if (!allowedTypes.includes(file.type)) {

        showToast("Please choose a JPG or PNG image.");

        return;

    }


    const maxSize = 10 * 1024 * 1024;


    if (file.size > maxSize) {

        showToast("Image must be smaller than 10 MB.");

        return;

    }


    selectedReportFile = file;


    reportFileName.textContent = file.name;

    reportFileSize.textContent =
        formatFileSize(file.size);


    selectedFile.classList.add("show");

    analyzeReportBtn.disabled = false;


    const reader = new FileReader();


    reader.onload = function (event) {

        reportPreview.src = event.target.result;

        previewContainer.classList.add("show");

    };


    reader.readAsDataURL(file);

}


function removeReportFile() {

    selectedReportFile = null;

    reportInput.value = "";

    selectedFile.classList.remove("show");

    previewContainer.classList.remove("show");

    reportPreview.src = "";

    analyzeReportBtn.disabled = true;

}

async function analyzeReport() {

    if (!selectedReportFile) {

        showToast("Please select a report first.");

        return;

    }


    analyzeReportBtn.disabled = true;

    analyzeReportBtn.textContent = "Analyzing...";


    const formData = new FormData();

    formData.append(
        "file",
        selectedReportFile
    );


    try {

        const response = await fetch(
            API_BASE + "/analyze-report",
            {
                method: "POST",
                body: formData
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail || "Report analysis failed."
            );

        }


        closeReportPanel();

        hideWelcome();


        if (data.analysis) {

            addReportResult(
                selectedReportFile.name,
                data.analysis
            );

        }
        else {

            addReportResult(
                selectedReportFile.name,
                data.message ||
                "The report was uploaded successfully, " +
                "but the backend did not return an analysis."
            );

        }


    }
    catch (error) {

        console.error("Report error:", error);

        showToast(
            error.message ||
            "Could not analyze the report."
        );

    }
    finally {

        analyzeReportBtn.disabled = false;

        analyzeReportBtn.textContent =
            "Analyze Report";

    }

}

function addReportResult(fileName, analysis) {

    const message = document.createElement("div");

    message.className = "chat-message assistant-message";


    const icon = document.createElement("div");

    icon.className = "assistant-icon";

    icon.textContent = "📄";


    const content = document.createElement("div");

    content.className = "assistant-content";


    content.innerHTML = `
        <strong>Medical Report Analysis</strong>
        <p style="margin-top: 10px;">
            Report: ${escapeHTML(fileName)}
        </p>

        <div style="margin-top: 12px;">
            ${formatText(analysis)}
        </div>
    `;


    message.appendChild(icon);

    message.appendChild(content);

    chatMessages.appendChild(message);

    scrollToBottom();

}


function saveRecentQuestion(question) {

    let questions =
        JSON.parse(
            localStorage.getItem("recentQuestions")
        ) || [];


    questions = questions.filter(function (item) {

        return item !== question;

    });


    questions.unshift(question);


    questions = questions.slice(0, 6);


    localStorage.setItem(
        "recentQuestions",
        JSON.stringify(questions)
    );


    loadRecentQuestions();

}


function loadRecentQuestions() {

    let questions =
        JSON.parse(
            localStorage.getItem("recentQuestions")
        ) || [];


    recentQuestions.innerHTML = "";


    if (questions.length === 0) {

        recentQuestions.innerHTML =
            '<p class="empty-text">No recent questions</p>';

        return;

    }


    questions.forEach(function (question) {

        const item = document.createElement("div");

        item.className = "recent-item";

        item.textContent = question;

        item.title = question;


        item.addEventListener("click", function () {

            messageInput.value = question;

            messageInput.focus();

        });


        recentQuestions.appendChild(item);

    });

}

function toggleTheme() {

    document.body.classList.toggle("dark-mode");


    const dark =
        document.body.classList.contains("dark-mode");


    localStorage.setItem(
        "darkMode",
        dark ? "true" : "false"
    );


    themeBtn.textContent =
        dark ? "☀" : "☾";

}


function loadTheme() {

    const dark =
        localStorage.getItem("darkMode");


    if (dark === "true") {

        document.body.classList.add("dark-mode");

        themeBtn.textContent = "☀";

    }
    else {

        themeBtn.textContent = "☾";

    }

}


function exportChat() {

    const messages =
        chatMessages.querySelectorAll(".chat-message");


    if (messages.length === 0) {

        showToast("There is no conversation to export.");

        return;

    }


    let text = "MedRAG AI - Conversation\n";

    text += "================================\n\n";


    messages.forEach(function (message) {

        if (message.classList.contains("user-message")) {

            text += "You:\n";

        }
        else {

            text += "MedRAG AI:\n";

        }


        text +=
            message.innerText.trim() +
            "\n\n";

    });


    const blob = new Blob(
        [text],
        {
            type: "text/plain"
        }
    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "medrag-conversation.txt";

    link.click();


    URL.revokeObjectURL(url);

}

function scrollToBottom() {

    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: "smooth"
    });

}


function formatFileSize(bytes) {

    if (bytes < 1024) {

        return bytes + " B";

    }


    if (bytes < 1024 * 1024) {

        return (
            (bytes / 1024).toFixed(1) +
            " KB"
        );

    }


    return (
        (bytes / (1024 * 1024)).toFixed(1) +
        " MB"
    );

}


function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");


    setTimeout(function () {

        toast.classList.remove("show");

    }, 3000);

}