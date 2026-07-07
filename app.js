// Configuration
const totalFrames = 231;
const images = [];
let loadedCount = 0;

// Animation State
let currentFrame = 0;
let targetFrame = 0;

// DOM Elements
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');
const heroSection = document.getElementById('hero-section');

// HUD indicators
const hudFrameNum = document.getElementById('hud-frame-num');
const hudProgressFill = document.getElementById('hud-progress-fill');
const hudPercent = document.getElementById('hud-percent');
const heroTextOverlay = document.getElementById('hero-text-overlay');

// Pad numbers with leading zeros (e.g., 5 -> "005")
function padZero(num, size = 3) {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

// Preload Images
function preloadImages() {
    for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        const frameNum = padZero(i);
        img.src = `./JPG/ezgif-frame-${frameNum}.jpg`;
        img.onload = () => {
            loadedCount++;
            const percent = Math.floor((loadedCount / totalFrames) * 100);
            loaderBar.style.width = `${percent}%`;
            loaderText.textContent = `Syncing sequence... ${percent}%`;

            if (loadedCount === totalFrames) {
                setTimeout(onPreloadComplete, 400); // Visual polish transition
            }
        };
        img.onerror = () => {
            console.error(`Failed to load frame: ${img.src}`);
            loadedCount++;
            if (loadedCount === totalFrames) {
                onPreloadComplete();
            }
        };
        images.push(img);
    }
}

// On Preload Complete
function onPreloadComplete() {
    loader.classList.add('loaded');
    resizeCanvas();
    updateFrame(0);
    // Start drawing loop for smooth scroll transition (lerping)
    requestAnimationFrame(renderLoop);
}

// Resize canvas to cover/fit container
function resizeCanvas() {
    const scale = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * scale;
    canvas.height = canvas.clientHeight * scale;
    ctx.scale(scale, scale);

    // Redraw current frame
    if (images[Math.round(currentFrame)]) {
        drawFrame(Math.round(currentFrame));
    }
}

// Helper to draw image aspect fit (contain) inside canvas
function drawFrame(index) {
    const img = images[index];
    if (!img) return;

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    if (!iw || !ih) return;

    // Aspect Contain
    const r = Math.min(w / iw, h / ih);
    const nw = iw * r;
    const nh = ih * r;

    // Center image
    const cx = (w - nw) / 2;
    const cy = (h - nh) / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, cx, cy, nw, nh);
}

// Map scroll position inside heroSection to frame index
function getScrollFrameIndex() {
    if (!heroSection) return 0;
    
    const rect = heroSection.getBoundingClientRect();
    const sectionHeight = rect.height;
    
    // Calculate how far the top of the section has scrolled above the viewport top
    const scrolled = -rect.top;
    const maxScroll = sectionHeight - window.innerHeight;
    
    if (maxScroll <= 0) return 0;
    
    const scrollFraction = Math.min(1, Math.max(0, scrolled / maxScroll));
    // Map fraction [0.0 - 1.0] to frame [0 - 230]
    return Math.min(totalFrames - 1, Math.max(0, Math.floor(scrollFraction * totalFrames)));
}

// Render Loop with smooth lerp
function renderLoop() {
    const target = getScrollFrameIndex();
    targetFrame = target;
    // Smoothly interpolate towards target frame
    currentFrame += (targetFrame - currentFrame) * 0.12;

    const frameIndex = Math.min(totalFrames - 1, Math.max(0, Math.round(currentFrame)));
    updateFrame(frameIndex);

    // Fade the text overlay based on scroll progress
    if (heroTextOverlay && heroSection) {
        const rect = heroSection.getBoundingClientRect();
        const scrolled = -rect.top;
        const maxScroll = rect.height - window.innerHeight;
        const fraction = maxScroll > 0 ? Math.min(1, Math.max(0, scrolled / maxScroll)) : 0;
        
        let opacity = 1;
        if (fraction >= 0.3) {
            opacity = 0;
        } else {
            opacity = 1 - (fraction / 0.3);
        }
        heroTextOverlay.style.opacity = opacity;
        if (opacity === 0) {
            heroTextOverlay.style.visibility = 'hidden';
        } else {
            heroTextOverlay.style.visibility = 'visible';
        }
    }

    requestAnimationFrame(renderLoop);
}

// Update UI metrics and render frame
function updateFrame(index) {
    drawFrame(index);

    // Update progress numbers
    const displayNum = padZero(index + 1);
    hudFrameNum.textContent = `${displayNum}/${padZero(totalFrames)}`;

    // Update progress percentages
    const progressPercent = (index / (totalFrames - 1)) * 100;
    if (hudPercent) {
        hudPercent.textContent = `${Math.round(progressPercent)}%`;
    }
    if (hudProgressFill) {
        hudProgressFill.style.width = `${progressPercent}%`;
    }
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);

// Initialize Preloading sequences
preloadImages();
