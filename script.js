// Get the canvas element and its 2D context
const canvas = document.getElementById('screensaver');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Array to store shapes
const shapes = [];

// Settings
let drawSpeed = 0.02;
let newShapeInterval = 0.02;
let fadeIntensity = 0.01;
let selectedColor = { r: 255, g: 255, b: 255 };
let maxShapes = 50;
let useSelectedColor = false;
let neonIntensity = 20;
let colors = ['#ff0000', '#8000ff', '#ff00ff', '#00ff80', '#f0ffff'];
let backgroundColor = '#000000';
let backgroundImage = null;
let backgroundImageData = null;
let backgroundBlur = 0;
let lineBlur = 0;
let backgroundImageUrl = '';
let lineWidth = 2;

// Add these new settings
let minPoints = 3;
let maxPoints = 7;

// Background source selection
const urlSourceBtn = document.getElementById('urlSourceBtn');
const localSourceBtn = document.getElementById('localSourceBtn');
const solidColorBtn = document.getElementById('solidColorBtn');
const urlSource = document.getElementById('urlSource');
const localSource = document.getElementById('localSource');
const solidColorSource = document.getElementById('solidColorSource');
const backgroundBlurSetting = document.getElementById('backgroundBlurSetting');

function setActiveBackgroundSource(activeBtn, activeSource) {
    [urlSourceBtn, localSourceBtn, solidColorBtn].forEach(btn => btn.classList.remove('active'));
    [urlSource, localSource, solidColorSource].forEach(source => source.classList.remove('active'));
    activeBtn.classList.add('active');
    activeSource.classList.add('active');
    backgroundBlurSetting.style.display = activeBtn === solidColorBtn ? 'none' : 'block';
}

urlSourceBtn.addEventListener('click', () => setActiveBackgroundSource(urlSourceBtn, urlSource));
localSourceBtn.addEventListener('click', () => setActiveBackgroundSource(localSourceBtn, localSource));
solidColorBtn.addEventListener('click', () => setActiveBackgroundSource(solidColorBtn, solidColorSource));

// Define defaultSettings at the top of the script
const defaultSettings = {
    line: {
        drawSpeed: 0.02,
        lineWidth: 2,
        lineBlur: 0,
        neonIntensity: 20
    },
    shape: {
        newShapeInterval: 0.02,
        fadeIntensity: 0.01,
        maxShapes: 50,
        minPoints: 3,
        maxPoints: 7
    },
    color: {
        colors: ['#ff0000', '#ffff00', '#ff00ff', '#00ffff', '#ffffff']
    },
    background: {
        backgroundColor: '#000000',
        backgroundBlur: 0
    },
    performance: {
        showFPS: false
    }
};

// Function to check if settings have been modified
function checkModifiedSettings(section) {
    const settings = defaultSettings[section];
    for (const [key, value] of Object.entries(settings)) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                if (element.checked !== value) return true;
            } else {
                if (parseFloat(element.value) !== value) return true;
            }
        }
    }
    if (section === 'color') {
        if (JSON.stringify(colors) !== JSON.stringify(settings.colors)) return true;
    }
    return false;
}

// Function to update reset button appearance
function updateResetButton(section) {
    const button = document.querySelector(`[data-reset="${section}"]`);
    if (checkModifiedSettings(section)) {
        button.classList.add('modified');
    } else {
        button.classList.remove('modified');
    }
}

// Update all reset buttons
function updateAllResetButtons() {
    Object.keys(defaultSettings).forEach(updateResetButton);
}

// Load settings from local storage
function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('screensaverSettings'));
    console.log('Loaded settings:', savedSettings);
    if (savedSettings) {
        drawSpeed = savedSettings.drawSpeed ?? drawSpeed;
        newShapeInterval = savedSettings.newShapeInterval ?? newShapeInterval;
        fadeIntensity = savedSettings.fadeIntensity ?? fadeIntensity;
        maxShapes = savedSettings.maxShapes ?? maxShapes;
        neonIntensity = savedSettings.neonIntensity ?? neonIntensity;
        colors = savedSettings.colors ?? colors;
        backgroundColor = savedSettings.backgroundColor ?? backgroundColor;
        backgroundImageData = savedSettings.backgroundImageData ?? null;
        backgroundBlur = savedSettings.backgroundBlur ?? backgroundBlur;
        lineBlur = savedSettings.lineBlur ?? lineBlur;
        backgroundImageUrl = savedSettings.backgroundImageUrl ?? backgroundImageUrl;
        showFPS = savedSettings.showFPS ?? showFPS;
        lineWidth = savedSettings.lineWidth ?? lineWidth;
        minPoints = savedSettings.minPoints ?? minPoints;
        maxPoints = savedSettings.maxPoints ?? maxPoints;
        
        // Update UI
        document.getElementById('drawSpeed').value = drawSpeed;
        document.getElementById('newShapeInterval').value = newShapeInterval;
        document.getElementById('fadeIntensity').value = fadeIntensity;
        document.getElementById('maxShapes').value = maxShapes;
        document.getElementById('neonIntensity').value = neonIntensity;
        document.getElementById('backgroundColor').value = backgroundColor;
        document.getElementById('backgroundBlur').value = backgroundBlur;
        document.getElementById('lineBlur').value = lineBlur;
        document.getElementById('backgroundImageUrl').value = backgroundImageUrl;
        document.getElementById('showFPS').checked = showFPS;
        document.getElementById('lineWidth').value = lineWidth;
        document.getElementById('minPoints').value = minPoints;
        document.getElementById('maxPoints').value = maxPoints;
        fpsCounter.style.display = showFPS ? 'block' : 'none';
        updateColorPicker();

        if (backgroundImageUrl) {
            urlSourceBtn.click();
            loadBackgroundImage(backgroundImageUrl);
        } else if (backgroundImageData) {
            localSourceBtn.click();
            loadBackgroundImage(backgroundImageData);
        } else {
            solidColorBtn.click();
        }
    }
    console.log('Applied settings:', {
        drawSpeed,
        newShapeInterval,
        fadeIntensity,
        maxShapes,
        neonIntensity,
        colors,
        backgroundColor,
        backgroundBlur,
        lineBlur,
        backgroundImageUrl,
        showFPS,
        lineWidth,
        minPoints,
        maxPoints
    });
    updateAllResetButtons();
}

// Save settings to local storage
function saveSettings() {
    const settings = {
        drawSpeed,
        newShapeInterval,
        fadeIntensity,
        maxShapes,
        neonIntensity,
        colors,
        backgroundColor,
        backgroundImageData,
        backgroundBlur,
        lineBlur,
        backgroundImageUrl,
        showFPS,
        lineWidth,
        minPoints,
        maxPoints
    };
    localStorage.setItem('screensaverSettings', JSON.stringify(settings));
}

// Function to draw a bendy line with a glowing effect
function drawBendyLine(shape, context) {
    const progress = Math.min(1, shape.progress);
    
    context.beginPath();
    context.moveTo(shape.points[0].x, shape.points[0].y);

    for (let i = 1; i < shape.points.length - 2; i++) {
        const xc = (shape.points[i].x + shape.points[i + 1].x) / 2;
        const yc = (shape.points[i].y + shape.points[i + 1].y) / 2;
        context.quadraticCurveTo(shape.points[i].x, shape.points[i].y, xc, yc);
    }

    context.quadraticCurveTo(
        shape.points[shape.points.length - 2].x,
        shape.points[shape.points.length - 2].y,
        shape.points[shape.points.length - 1].x,
        shape.points[shape.points.length - 1].y
    );

    context.strokeStyle = `rgba(${shape.color.r}, ${shape.color.g}, ${shape.color.b}, ${shape.alpha})`;
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.setLineDash([progress * shape.totalLength, shape.totalLength]);

    // Base glow
    context.shadowColor = `rgba(${shape.color.r}, ${shape.color.g}, ${shape.color.b}, ${shape.alpha})`;
    context.shadowBlur = neonIntensity * 0.5;
    context.stroke();

    // Intense center
    context.shadowBlur = 0;
    context.lineWidth = 1;
    context.strokeStyle = `rgba(${shape.color.r}, ${shape.color.g}, ${shape.color.b}, ${shape.alpha})`;
    context.stroke();

    // Outer glow layers
    const numLayers = 3;
    for (let i = 0; i < numLayers; i++) {
        context.lineWidth = lineWidth + i * 2;
        context.strokeStyle = `rgba(${shape.color.r}, ${shape.color.g}, ${shape.color.b}, ${shape.alpha * (1 - i / numLayers) * 0.1})`;
        context.stroke();
    }
}

function calculateTotalLength(points) {
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
        totalLength += distance(points[i - 1], points[i]);
    }
    return totalLength;
}

function distance(p1, p2) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

// FPS counter variables
let fps = 0;
let lastLoop = performance.now();
let showFPS = false;
const fpsCounter = document.getElementById('fpsCounter');

function animate() {
    // Calculate FPS
    const thisLoop = performance.now();
    fps = 1000 / (thisLoop - lastLoop);
    lastLoop = thisLoop;

    // Update FPS counter
    if (showFPS) {
        fpsCounter.textContent = `FPS: ${fps.toFixed(1)}`;
        updateFPSColor();
    }

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.globalCompositeOperation = 'source-over';
    if (backgroundImage) {
        ctx.filter = `blur(${backgroundBlur}px)`;
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
    } else {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Create a separate canvas for shapes
    const shapeCanvas = document.createElement('canvas');
    shapeCanvas.width = canvas.width;
    shapeCanvas.height = canvas.height;
    const shapeCtx = shapeCanvas.getContext('2d');

    // Draw shapes on the separate canvas
    shapeCtx.filter = `blur(${lineBlur}px)`;
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];

        if (shape.progress < 1) {
            shape.progress += drawSpeed;
        } else {
            shape.alpha -= fadeIntensity;
        }

        drawBendyLine(shape, shapeCtx);

        if (shape.alpha <= 0) {
            shapes.splice(i, 1);
            i--;
        }
    }
    shapeCtx.filter = 'none';

    // Composite the shapes onto the main canvas
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(shapeCanvas, 0, 0);

    if (Math.random() < newShapeInterval && shapes.length < maxShapes) {
        drawShape();
    }

    requestAnimationFrame(animate);
}

function drawShape() {
    const numPoints = Math.floor(Math.random() * (maxPoints - minPoints + 1)) + minPoints;
    const points = [];

    for (let i = 0; i < numPoints; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        points.push({ x, y });
    }

    const color = colors[Math.floor(Math.random() * colors.length)];
    const rgbColor = hexToRgb(color);

    const totalLength = calculateTotalLength(points);
    shapes.push({ points, color: rgbColor, alpha: 1.0, progress: 0.0, totalLength });
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function loadBackgroundImage(source) {
    const img = new Image();
    img.onload = () => {
        backgroundImage = img;
    };
    img.onerror = () => {
        console.error('Failed to load image:', source);
        backgroundImage = null;
    };
    img.src = source;
}

function updateFPSColor() {
    let color;
    if (fps >= 55) {
        color = 'lime';
    } else if (fps >= 45) {
        color = 'yellow';
    } else if (fps >= 30) {
        color = 'orange';
    } else {
        color = 'red';
    }
    fpsCounter.style.color = color;
}

// Load settings when the page loads
loadSettings();

// Start the animation
animate();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Settings panel functionality
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');

function toggleSettings() {
    settingsPanel.classList.toggle('open');
}

settingsButton.addEventListener('click', toggleSettings);

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        toggleSettings();
    }
});

document.getElementById('drawSpeed').addEventListener('input', (e) => {
    drawSpeed = parseFloat(e.target.value);
    updateRangeValue(e.target);
    saveSettings();
});

document.getElementById('newShapeInterval').addEventListener('input', (e) => {
    newShapeInterval = parseFloat(e.target.value);
    updateRangeValue(e.target);
    saveSettings();
});

document.getElementById('fadeIntensity').addEventListener('input', (e) => {
    fadeIntensity = parseFloat(e.target.value);
    updateRangeValue(e.target);
    saveSettings();
});

document.getElementById('neonIntensity').addEventListener('input', (e) => {
    neonIntensity = parseInt(e.target.value);
    updateRangeValue(e.target);
    updateNeonTitle();
    saveSettings();
});

function removeColor(index) {
    colors.splice(index, 1);
    updateColorPicker();
}

function editColor(index) {
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = colors[index];
    colorPicker.addEventListener('change', (e) => {
        colors[index] = e.target.value;
        updateColorPicker();
    });
    colorPicker.click();
}

function updateColorPicker() {
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.innerHTML = '';
    colors.forEach((color, index) => {
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        colorItem.style.backgroundColor = color;
        
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeColor(index);
        });
        colorItem.appendChild(deleteBtn);

        colorItem.addEventListener('click', (e) => {
            if (e.target !== deleteBtn) {
                editColor(index);
            }
        });
        colorPicker.appendChild(colorItem);
    });
    const addColorItem = document.createElement('div');
    addColorItem.className = 'color-item add';
    addColorItem.textContent = '+';
    addColorItem.addEventListener('click', addColor);
    colorPicker.appendChild(addColorItem);
    saveSettings();
    updateResetButton('color');
}

function addColor() {
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.addEventListener('change', (e) => {
        colors.push(e.target.value);
        updateColorPicker();
    });
    colorPicker.click();
}

updateColorPicker();

document.getElementById('backgroundColor').addEventListener('input', (e) => {
    backgroundColor = e.target.value;
    backgroundImage = null;
    backgroundImageData = null;
    backgroundImageUrl = '';
    document.getElementById('backgroundImageInput').value = '';
    document.getElementById('backgroundImageUrl').value = '';
    saveSettings();
});

document.getElementById('backgroundImageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            backgroundImageData = event.target.result;
            loadBackgroundImage(backgroundImageData);
            backgroundImageUrl = '';
            document.getElementById('backgroundImageUrl').value = '';
            saveSettings();
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('clearBackgroundImage').addEventListener('click', () => {
    backgroundImage = null;
    backgroundImageData = null;
    backgroundImageUrl = '';
    document.getElementById('backgroundImageInput').value = '';
    document.getElementById('backgroundImageUrl').value = '';
    solidColorBtn.click();
    saveSettings();
});

document.getElementById('loadBackgroundImageUrl').addEventListener('click', () => {
    const url = document.getElementById('backgroundImageUrl').value;
    if (url) {
        backgroundImageUrl = url;
        loadBackgroundImage(url);
        backgroundImageData = null;
        document.getElementById('backgroundImageInput').value = '';
        saveSettings();
    }
});

document.getElementById('backgroundBlur').addEventListener('input', (e) => {
    backgroundBlur = parseInt(e.target.value);
    updateRangeValue(e.target);
    saveSettings();
});

document.getElementById('lineBlur').addEventListener('input', (e) => {
    lineBlur = parseInt(e.target.value);
    updateRangeValue(e.target);
    saveSettings();
});

const closeButton = document.getElementById('closeButton');
closeButton.addEventListener('click', () => {
    settingsPanel.classList.remove('open');
});

const maxShapesInput = document.getElementById('maxShapes');
const decreaseButton = document.querySelector('.decrease');
const increaseButton = document.querySelector('.increase');

decreaseButton.addEventListener('click', () => {
    maxShapesInput.value = Math.max(1, parseInt(maxShapesInput.value) - 1);
    maxShapes = parseInt(maxShapesInput.value);
});

increaseButton.addEventListener('click', () => {
    maxShapesInput.value = Math.min(100, parseInt(maxShapesInput.value) + 1);
    maxShapes = parseInt(maxShapesInput.value);
});

maxShapesInput.addEventListener('input', (e) => {
    maxShapes = parseInt(e.target.value);
    saveSettings();
});

document.getElementById('showFPS').addEventListener('change', (e) => {
    showFPS = e.target.checked;
    fpsCounter.style.display = showFPS ? 'block' : 'none';
    saveSettings();
});

// Set initial active state
urlSourceBtn.click();

// Update the drawBendyLine function to accept a context parameter
function drawBendyLine(shape, context) {
    const progress = Math.min(1, shape.progress);
    
    context.beginPath();
    context.moveTo(shape.points[0].x, shape.points[0].y);

    for (let i = 1; i < shape.points.length - 2; i++) {
        const xc = (shape.points[i].x + shape.points[i + 1].x) / 2;
        const yc = (shape.points[i].y + shape.points[i + 1].y) / 2;
        context.quadraticCurveTo(shape.points[i].x, shape.points[i].y, xc, yc);
    }

    context.quadraticCurveTo(
        shape.points[shape.points.length - 2].x,
        shape.points[shape.points.length - 2].y,
        shape.points[shape.points.length - 1].x,
        shape.points[shape.points.length - 1].y
    );

    context.strokeStyle = `rgba(${shape.color.r}, ${shape.color.g}, ${shape.color.b}, ${shape.alpha})`;
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.setLineDash([progress * shape.totalLength, shape.totalLength]);

    // Base glow
    context.shadowColor = `rgba(${shape.color.r}, ${shape.color.g}, ${shape.color.b}, ${shape.alpha})`;
    context.shadowBlur = neonIntensity * 0.5;
    context.stroke();

    // Intense center
    context.shadowBlur = 0;
    context.lineWidth = 1;
    context.strokeStyle = `rgba(${shape.color.r}, ${shape.color.g}, ${shape.color.b}, ${shape.alpha})`;
    context.stroke();

    // Outer glow layers
    const numLayers = 3;
    for (let i = 0; i < numLayers; i++) {
        context.lineWidth = lineWidth + i * 2;
        context.strokeStyle = `rgba(${shape.color.r}, ${shape.color.g}, ${shape.color.b}, ${shape.alpha * (1 - i / numLayers) * 0.1})`;
        context.stroke();
    }
}

function updateNeonTitle() {
    const title = document.querySelector('.neon-title');
    const shadowIntensity = neonIntensity * 0.5;
    title.style.textShadow = `
        0 0 ${shadowIntensity * 0.1}px #fff,
        0 0 ${shadowIntensity * 0.2}px #fff,
        0 0 ${shadowIntensity * 0.3}px #fff,
        0 0 ${shadowIntensity * 0.4}px #ff00de,
        0 0 ${shadowIntensity * 0.7}px #ff00de,
        0 0 ${shadowIntensity * 0.8}px #ff00de,
        0 0 ${shadowIntensity}px #ff00de,
        0 0 ${shadowIntensity * 1.5}px #ff00de
    `;
}

// Update neon title on load
updateNeonTitle();

// Add event listeners for line width controls
const lineWidthInput = document.getElementById('lineWidth');
const decreaseLineWidthButton = document.querySelector('.decrease-line-width');
const increaseLineWidthButton = document.querySelector('.increase-line-width');

decreaseLineWidthButton.addEventListener('click', () => {
    lineWidthInput.value = Math.max(1, parseInt(lineWidthInput.value) - 1);
    lineWidth = parseInt(lineWidthInput.value);
    saveSettings();
});

increaseLineWidthButton.addEventListener('click', () => {
    lineWidthInput.value = Math.min(10, parseInt(lineWidthInput.value) + 1);
    lineWidth = parseInt(lineWidthInput.value);
    saveSettings();
});

lineWidthInput.addEventListener('input', (e) => {
    lineWidth = parseInt(e.target.value);
    saveSettings();
});

// Add event listeners for new settings
const minPointsInput = document.getElementById('minPoints');
const maxPointsInput = document.getElementById('maxPoints');
const decreaseMinPointsButton = document.querySelector('.decrease-min-points');
const increaseMinPointsButton = document.querySelector('.increase-min-points');
const decreaseMaxPointsButton = document.querySelector('.decrease-max-points');
const increaseMaxPointsButton = document.querySelector('.increase-max-points');

function updateMinMaxPoints() {
    minPoints = Math.min(minPoints, maxPoints);
    maxPoints = Math.max(minPoints, maxPoints);
    minPointsInput.value = minPoints;
    maxPointsInput.value = maxPoints;
    saveSettings();
}

decreaseMinPointsButton.addEventListener('click', () => {
    minPoints = Math.max(3, parseInt(minPointsInput.value) - 1);
    updateMinMaxPoints();
});

increaseMinPointsButton.addEventListener('click', () => {
    minPoints = Math.min(10, parseInt(minPointsInput.value) + 1);
    updateMinMaxPoints();
});

decreaseMaxPointsButton.addEventListener('click', () => {
    maxPoints = Math.max(3, parseInt(maxPointsInput.value) - 1);
    updateMinMaxPoints();
});

increaseMaxPointsButton.addEventListener('click', () => {
    maxPoints = Math.min(20, parseInt(maxPointsInput.value) + 1);
    updateMinMaxPoints();
});

minPointsInput.addEventListener('input', (e) => {
    minPoints = parseInt(e.target.value);
    updateMinMaxPoints();
});

maxPointsInput.addEventListener('input', (e) => {
    maxPoints = parseInt(e.target.value);
    updateMinMaxPoints();
});

// Add gesture support for number inputs
function addGestureSupport(input) {
    let startX, startValue;

    input.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startValue = parseInt(input.value);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        const diff = e.clientX - startX;
        const newValue = Math.max(input.min, Math.min(input.max, startValue + Math.round(diff / 5)));
        input.value = newValue;
        input.dispatchEvent(new Event('input'));
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

addGestureSupport(document.getElementById('lineWidth'));
addGestureSupport(document.getElementById('maxShapes'));
addGestureSupport(document.getElementById('minPoints'));
addGestureSupport(document.getElementById('maxPoints'));

// Make settings sections collapsible
document.querySelectorAll('.setting-group h4').forEach(header => {
    header.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            const group = header.parentElement;
            group.classList.toggle('collapsed');
        }
    });
});

// Reset buttons functionality
document.querySelectorAll('.reset-button').forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const section = button.dataset.reset;
        const settings = defaultSettings[section];

        for (const [key, value] of Object.entries(settings)) {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
                element.dispatchEvent(new Event('input'));
            }
        }

        if (section === 'color') {
            colors = [...settings.colors];
            updateColorPicker();
        }

        saveSettings();
        updateAllResetButtons();
    });
});

// Add event listeners to update reset buttons
document.querySelectorAll('.setting input, .setting select').forEach(element => {
    element.addEventListener('input', () => {
        const section = element.closest('.setting-group').querySelector('.reset-button').dataset.reset;
        updateResetButton(section);
    });
});

// Initial update of reset buttons
updateAllResetButtons();

// Function to update range input value attribute
function updateRangeValue(input) {
    input.setAttribute('value', input.value);
}

// Add event listeners for range inputs
document.querySelectorAll('input[type="range"]').forEach(input => {
    input.addEventListener('input', () => updateRangeValue(input));
    updateRangeValue(input); // Set initial value
});

// Update slider values
document.querySelectorAll('input[type="range"]').forEach(input => {
    input.addEventListener('input', updateSliderValue);
    updateSliderValue.call(input);
});

function updateSliderValue() {
    const min = parseFloat(this.min);
    const max = parseFloat(this.max);
    const val = parseFloat(this.value);
    const percentage = (val - min) * 100 / (max - min);
    
    this.style.setProperty('--thumb-position', `${percentage}%`);
    this.setAttribute('value', this.value);
}