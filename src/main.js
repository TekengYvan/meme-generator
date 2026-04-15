import './style.css'

// --- State ---
let currentImage = null;
let topText = '';
let bottomText = '';
let fontScale = 0.5; // From 0.1 to 1.0 (slider 10 to 100)
let textColor = '#ffffff';
let fontFamily = 'Impact';

const SAVED_MEMES_KEY = 'memegen-pro-gallery';

// --- DOM Elements ---
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');

// Inputs
const topTextInput = document.getElementById('topText');
const bottomTextInput = document.getElementById('bottomText');
const fontSizeInput = document.getElementById('fontSize');
const textColorInput = document.getElementById('textColor');
const fontFamilyInput = document.getElementById('fontFamily');

// Buttons
const downloadBtn = document.getElementById('downloadBtn');
const saveGalleryBtn = document.getElementById('saveGalleryBtn');
const mainShareBtn = document.getElementById('mainShareBtn');
const viewGalleryBtn = document.getElementById('viewGalleryBtn');
const closeGalleryBtn = document.getElementById('closeGalleryBtn');
const resetBtn = document.getElementById('resetBtn');

// Gallery
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

  // Text Logic
  topTextInput.addEventListener('input', (e) => {
    topText = e.target.value.toUpperCase();
    drawMeme();
  });
  bottomTextInput.addEventListener('input', (e) => {
    bottomText = e.target.value.toUpperCase();
    drawMeme();
  });

  // Styling Logic
  fontSizeInput.addEventListener('input', (e) => {
    fontScale = e.target.value / 100;
    drawMeme();
  });
  textColorInput.addEventListener('input', (e) => {
    textColor = e.target.value;
    drawMeme();
  });
  fontFamilyInput.addEventListener('change', (e) => {
    fontFamily = e.target.value;
    drawMeme();
  });

  // Action Buttons
  downloadBtn.addEventListener('click', downloadMeme);
  saveGalleryBtn.addEventListener('click', saveToGallery);
  mainShareBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png');
    shareMeme(dataURL);
  });

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

  // Set canvas size (Maintain aspect ratio, Max width 1200 for hi-res exports)
  const maxWidth = 1200;
  const ratio = currentImage.height / currentImage.width;
  canvas.width = maxWidth;
  canvas.height = maxWidth * ratio;

  // Draw background image
  ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

  // Dynamic Font Size calculation
  const baseSize = canvas.width / 10;
  const actualFontSize = baseSize * fontScale * 2; // Multiplier to allow big text

  // Text Styling
  ctx.fillStyle = textColor;
  ctx.strokeStyle = 'black';
  ctx.lineWidth = actualFontSize / 10;
  ctx.textAlign = 'center';
  ctx.font = `bold ${actualFontSize}px ${fontFamily}, Impact, sans-serif`;

  const margin = actualFontSize / 2 + 20;

  // Draw Top Text
  if (topText) {
    ctx.textBaseline = 'top';
    ctx.fillText(topText, canvas.width / 2, margin);
    ctx.strokeText(topText, canvas.width / 2, margin);
  }

  // Draw Bottom Text
  if (bottomText) {
    ctx.textBaseline = 'bottom';
    ctx.fillText(bottomText, canvas.width / 2, canvas.height - margin);
    ctx.strokeText(bottomText, canvas.width / 2, canvas.height - margin);
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
  showToast('Mème enregistré dans la galerie !');
}

function loadGallery() {
  const savedMemes = JSON.parse(localStorage.getItem(SAVED_MEMES_KEY) || '[]');
  galleryGrid.innerHTML = '';

  if (savedMemes.length === 0) {
    galleryGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-dim);">Votre galerie est vide.</p>';
    return;
  }

  savedMemes.forEach(meme => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img src="${meme.data}" alt="Meme">
      <div class="overlay">
        <button class="btn btn-secondary" style="width: 90%" onclick="window.downloadFromLink('${meme.data}')">Télécharger</button>
        <button class="btn btn-share" style="width: 90%" onclick="window.shareMeme('${meme.data}')">Partager</button>
        <button class="btn btn-danger" style="width: 90%" onclick="window.deleteMeme(${meme.id})">Supprimer</button>
      </div>
    `;
    galleryGrid.appendChild(item);
  });
}

// --- Global Helpers ---
window.shareMeme = async (dataUrl) => {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'meme.png', { type: 'image/png' });

    if (navigator.share) {
      await navigator.share({
        files: [file],
        title: 'MemeGen Pro',
        text: 'Regardez ce mème que je viens de créer !',
      });
    } else {
      // Fallback social links (Twitter/Twitter) - Note: Direct image sharing via URL fallback is limited for base64
      alert('Le partage direct n\'est pas supporté sur ce navigateur. Veuillez télécharger l\'image.');
    }
  } catch (err) {
    console.error('Share failed:', err);
  }
};

window.downloadFromLink = (data) => {
  const link = document.createElement('a');
  link.download = `meme-saved-${Date.now()}.png`;
  link.href = data;
  link.click();
};

window.deleteMeme = (id) => {
  if (!confirm('Voulez-vous vraiment supprimer ce mème ?')) return;
  let savedMemes = JSON.parse(localStorage.getItem(SAVED_MEMES_KEY) || '[]');
  savedMemes = savedMemes.filter(m => m.id !== id);
  localStorage.setItem(SAVED_MEMES_KEY, JSON.stringify(savedMemes));
  loadGallery();
};

function resetApp() {
  currentImage = null;
  topText = '';
  bottomText = '';
  topTextInput.value = '';
  bottomTextInput.value = '';
  fontSizeInput.value = 50;
  textColorInput.value = '#ffffff';
  fontFamilyInput.value = 'Impact';
  fontScale = 0.5;
  textColor = '#ffffff';
  fontFamily = 'Impact';
  
  uploadPlaceholder.classList.remove('hidden');
  canvas.classList.add('hidden');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function showToast(message) {
  // Simple alert upgrade
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
    background: var(--primary); color: white; padding: 1rem 2rem;
    border-radius: 99px; z-index: 10000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    animation: fadeIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
