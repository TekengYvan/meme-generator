import './style.css'

// State
let currentImage = null;
let topText = '';
let bottomText = '';
const SAVED_MEMES_KEY = 'memegen-pro-gallery';

// DOM Elements
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const topTextInput = document.getElementById('topText');
const bottomTextInput = document.getElementById('bottomText');
const downloadBtn = document.getElementById('downloadBtn');
const saveGalleryBtn = document.getElementById('saveGalleryBtn');
const viewGalleryBtn = document.getElementById('viewGalleryBtn');
const closeGalleryBtn = document.getElementById('closeGalleryBtn');
const resetBtn = document.getElementById('resetBtn');
const gallerySection = document.getElementById('gallerySection');
const galleryGrid = document.getElementById('galleryGrid');

// --- Initialization ---
init();

function init() {
  setupEventListeners();
  loadGallery();
}

function setupEventListeners() {
  // Upload Logic
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));
  dropZone.addEventListener('drop', handleDrop);
  fileInput.addEventListener('change', handleFileSelect);

  // Text Inputs
  topTextInput.addEventListener('input', (e) => {
    topText = e.target.value.toUpperCase();
    drawMeme();
  });
  bottomTextInput.addEventListener('input', (e) => {
    bottomText = e.target.value.toUpperCase();
    drawMeme();
  });

  // Action Buttons
  downloadBtn.addEventListener('click', downloadMeme);
  saveGalleryBtn.addEventListener('click', saveToGallery);
  viewGalleryBtn.addEventListener('click', () => {
    gallerySection.classList.remove('hidden');
    loadGallery();
  });
  closeGalleryBtn.addEventListener('click', () => gallerySection.classList.add('hidden'));
  resetBtn.addEventListener('click', resetApp);
}

// --- Image Handling ---
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) loadImage(file);
}

function handleDrop(e) {
  e.preventDefault();
  dropZone.classList.remove('active');
  const file = e.dataTransfer.files[0];
  if (file) loadImage(file);
}

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      uploadPlaceholder.classList.add('hidden');
      canvas.classList.remove('hidden');
      drawMeme();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// --- Canvas Drawing ---
function drawMeme() {
  if (!currentImage) return;

  // Set canvas size to match image aspect ratio but keep reasonable dimensions
  const maxWidth = 800;
  const ratio = currentImage.height / currentImage.width;
  canvas.width = maxWidth;
  canvas.height = maxWidth * ratio;

  // Draw background image
  ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

  // Meme text style
  const fontSize = Math.floor(canvas.width / 10);
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = Math.floor(fontSize / 8);
  ctx.textAlign = 'center';
  ctx.font = `bold ${fontSize}px Impact, Archivo Black, "Arial Black", sans-serif`;

  // Draw Top Text
  if (topText) {
    ctx.textBaseline = 'top';
    ctx.fillText(topText, canvas.width / 2, 20);
    ctx.strokeText(topText, canvas.width / 2, 20);
  }

  // Draw Bottom Text
  if (bottomText) {
    ctx.textBaseline = 'bottom';
    ctx.fillText(bottomText, canvas.width / 2, canvas.height - 20);
    ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 20);
  }
}

// --- Actions ---
function downloadMeme() {
  if (!currentImage) return;
  const link = document.createElement('a');
  link.download = `meme-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function saveToGallery() {
  if (!currentImage) return;
  const dataURL = canvas.toDataURL('image/png');
  const savedMemes = JSON.parse(localStorage.getItem(SAVED_MEMES_KEY) || '[]');
  
  savedMemes.unshift({
    id: Date.now(),
    data: dataURL,
    date: new Date().toLocaleDateString()
  });

  localStorage.setItem(SAVED_MEMES_KEY, JSON.stringify(savedMemes));
  alert('Mèmè enregistré dans la galerie !');
}

function loadGallery() {
  const savedMemes = JSON.parse(localStorage.getItem(SAVED_MEMES_KEY) || '[]');
  galleryGrid.innerHTML = '';

  if (savedMemes.length === 0) {
    galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">Aucun mème enregistré pour le moment.</p>';
    return;
  }

  savedMemes.forEach(meme => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img src="${meme.data}" alt="Meme">
      <div class="overlay" style="flex-direction: column; gap: 0.5rem; justify-content: center; align-items: center; background: rgba(0,0,0,0.6);">
        <button class="btn btn-secondary" style="width: 80%" onclick="window.downloadFromLink('${meme.data}')">Télécharger</button>
        <button class="btn" style="width: 80%; background: var(--accent)" onclick="window.shareMeme('${meme.data}')">Partager</button>
      </div>
    `;
    galleryGrid.appendChild(item);
  });
}

// Global helper for sharing
window.shareMeme = async (dataUrl) => {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'meme.png', { type: 'image/png' });

    if (navigator.share) {
      await navigator.share({
        files: [file],
        title: 'Mon Mème',
        text: 'Regarde le mème que j\'ai créé avec MemeGen Pro !',
      });
    } else {
      alert('Le partage n\'est pas supporté sur ce navigateur. Téléchargez l\'image pour la partager.');
    }
  } catch (err) {
    console.error('Share failed:', err);
  }
};

// Global helper for gallery items
window.downloadFromLink = (data) => {
  const link = document.createElement('a');
  link.download = `meme-saved-${Date.now()}.png`;
  link.href = data;
  link.click();
};

function resetApp() {
  currentImage = null;
  topText = '';
  bottomText = '';
  topTextInput.value = '';
  bottomTextInput.value = '';
  uploadPlaceholder.classList.remove('hidden');
  canvas.classList.add('hidden');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
