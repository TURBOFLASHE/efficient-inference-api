// ==================== CONFIGURATION ====================
const API_URL = 'http://127.0.0.1:8000';

// ==================== CANVAS SETUP ====================
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasOverlay = document.getElementById('canvas-overlay');

let drawing = false;
let brushSize = 10;

// Initialiser fond blanc
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// ==================== CANVAS EVENTS ====================
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseleave', stopDrawing);

// Touch events pour mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
});

function startDrawing() {
    drawing = true;
    canvasOverlay.classList.add('hidden');
}

function stopDrawing() {
    drawing = false;
}

function draw(e) {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvasOverlay.classList.remove('hidden');
    hideResults();
}

// ==================== BRUSH SIZE ====================
const brushSizeInput = document.getElementById('brush-size');
const brushSizeValue = document.getElementById('brush-size-value');

brushSizeInput.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    brushSizeValue.textContent = brushSize;
});

// ==================== TAB SWITCHING ====================
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Remove active class
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class
        button.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        hideResults();
    });
});

// ==================== FILE UPLOAD ====================
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const previewContainer = document.getElementById('preview-container');
const previewImage = document.getElementById('preview-image');

let uploadedFile = null;

fileInput.addEventListener('change', handleFileSelect);

// Drag & Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Veuillez sélectionner une image valide');
        return;
    }

    uploadedFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadArea.style.display = 'none';
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
    
    hideResults();
}

function removeImage() {
    uploadedFile = null;
    fileInput.value = '';
    uploadArea.style.display = 'block';
    previewContainer.style.display = 'none';
    hideResults();
}

// ==================== PREDICTION ====================
async function predict() {
    const activeTab = document.querySelector('.tab-content.active').id;
    
    showLoading();
    hideError();
    
    try {
        let response;
        
        if (activeTab === 'draw-tab') {
            // Prédire depuis canvas
            const dataURL = canvas.toDataURL();
            
            response = await fetch(`${API_URL}/predict_canvas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataURL)
            });
        } else {
            // Prédire depuis image uploadée
            if (!uploadedFile) {
                showError('Veuillez d\'abord uploader une image');
                hideLoading();
                return;
            }
            
            const formData = new FormData();
            formData.append('file', uploadedFile);
            
            response = await fetch(`${API_URL}/predict_image`, {
                method: 'POST',
                body: formData
            });
        }
        
        if (!response.ok) {
            throw new Error('Erreur lors de la prédiction');
        }
        
        const data = await response.json();
        displayResult(data.prediction, data.confidence);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Erreur de connexion au serveur. Vérifiez que le backend est lancé.');
    } finally {
        hideLoading();
    }
}

// ==================== UI UPDATES ====================
function displayResult(prediction, confidence) {
    const resultCard = document.getElementById('result-card');
    const predictedNumber = document.getElementById('predicted-number');
    const confidenceValue = document.getElementById('confidence-value');
    const confidenceFill = document.getElementById('confidence-fill');
    const predictionContainer = document.getElementById('prediction-container');
    
    predictionContainer.style.display = 'none';
    resultCard.style.display = 'block';
    
    predictedNumber.textContent = prediction;
    confidenceValue.textContent = `${(confidence * 100).toFixed(1)}%`;
    confidenceFill.style.width = `${confidence * 100}%`;
    
    // Changer couleur selon confiance
    if (confidence > 0.9) {
        confidenceFill.style.background = 'linear-gradient(90deg, #43e97b, #38f9d7)';
    } else if (confidence > 0.7) {
        confidenceFill.style.background = 'linear-gradient(90deg, #fee140, #fa709a)';
    } else {
        confidenceFill.style.background = 'linear-gradient(90deg, #fa709a, #f093fb)';
    }
}

function showLoading() {
    document.getElementById('prediction-container').style.display = 'none';
    document.getElementById('result-card').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('prediction-container').style.display = 'block';
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    errorElement.style.display = 'block';
    
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function hideError() {
    document.getElementById('error-message').style.display = 'none';
}

function hideResults() {
    document.getElementById('result-card').style.display = 'none';
    document.getElementById('prediction-container').style.display = 'block';
}

// ==================== INITIAL STATE ====================
hideResults();