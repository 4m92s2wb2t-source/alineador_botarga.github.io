// ==========================================
// 0. CONSTANTE DE ORO Y ESTADO GLOBAL
// ==========================================
const CANVAS_SIZE = 2400; // El tamaño interno inamovible del lienzo
const MOVE_STEP = 3;     
const SCALE_STEP = 0.01; 
let fondoBaseGlobal = null;

const state = {
    Frontal: { img1: null, img2: null, s1: {x:0, y:0, sc:1, bw:0, bh:0}, s2: {x:0, y:0, sc:1, bw:0, bh:0}, activa: 1 },
    Lateral: { img1: null, img2: null, s1: {x:0, y:0, sc:1, bw:0, bh:0}, s2: {x:0, y:0, sc:1, bw:0, bh:0}, activa: 1 },
    Espalda: { img1: null, img2: null, s1: {x:0, y:0, sc:1, bw:0, bh:0}, s2: {x:0, y:0, sc:1, bw:0, bh:0}, activa: 1 }
};

const vistas = ['Frontal', 'Lateral', 'Espalda'];

// ==========================================
// 1. SISTEMA DE HISTORIAL (CTRL+Z / CTRL+Y)
// ==========================================
let undoStack = [];
let redoStack = [];

function saveToHistory() {
    const snapshot = {
        Frontal: { img1: state.Frontal.img1, img2: state.Frontal.img2, s1: {...state.Frontal.s1}, s2: {...state.Frontal.s2}, activa: state.Frontal.activa },
        Lateral: { img1: state.Lateral.img1, img2: state.Lateral.img2, s1: {...state.Lateral.s1}, s2: {...state.Lateral.s2}, activa: state.Lateral.activa },
        Espalda: { img1: state.Espalda.img1, img2: state.Espalda.img2, s1: {...state.Espalda.s1}, s2: {...state.Espalda.s2}, activa: state.Espalda.activa }
    };
    undoStack.push(snapshot);
    if (undoStack.length > 30) undoStack.shift(); 
    redoStack = []; 
}

function restoreSnapshot(snapshot) {
    vistas.forEach(view => {
        state[view].img1 = snapshot[view].img1;
        state[view].img2 = snapshot[view].img2;
        state[view].s1 = {...snapshot[view].s1};
        state[view].s2 = {...snapshot[view].s2};
        state[view].activa = snapshot[view].activa;
        
        document.getElementById(`row${view}1`).classList.remove('active');
        document.getElementById(`row${view}2`).classList.remove('active');
        document.getElementById(`row${view}${state[view].activa}`).classList.add('active');
        
        drawCanvas(view);
    });
}

function undo() {
    if (undoStack.length > 0) {
        const currentSnapshot = {
            Frontal: { img1: state.Frontal.img1, img2: state.Frontal.img2, s1: {...state.Frontal.s1}, s2: {...state.Frontal.s2}, activa: state.Frontal.activa },
            Lateral: { img1: state.Lateral.img1, img2: state.Lateral.img2, s1: {...state.Lateral.s1}, s2: {...state.Lateral.s2}, activa: state.Lateral.activa },
            Espalda: { img1: state.Espalda.img1, img2: state.Espalda.img2, s1: {...state.Espalda.s1}, s2: {...state.Espalda.s2}, activa: state.Espalda.activa }
        };
        redoStack.push(currentSnapshot);
        const previous = undoStack.pop();
        restoreSnapshot(previous);
    }
}

function redo() {
    if (redoStack.length > 0) {
        const currentSnapshot = {
            Frontal: { img1: state.Frontal.img1, img2: state.Frontal.img2, s1: {...state.Frontal.s1}, s2: {...state.Frontal.s2}, activa: state.Frontal.activa },
            Lateral: { img1: state.Lateral.img1, img2: state.Lateral.img2, s1: {...state.Lateral.s1}, s2: {...state.Lateral.s2}, activa: state.Lateral.activa },
            Espalda: { img1: state.Espalda.img1, img2: state.Espalda.img2, s1: {...state.Espalda.s1}, s2: {...state.Espalda.s2}, activa: state.Espalda.activa }
        };
        undoStack.push(currentSnapshot);
        const next = redoStack.pop();
        restoreSnapshot(next);
    }
}

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
            e.preventDefault();
            if (e.shiftKey) redo(); 
            else undo();            
        } else if (e.key === 'y' || e.key === 'Y') {
            e.preventDefault();
            redo();                 
        }
    }
});

// ==========================================
// 2. FUNCIÓN ANTI-DEFORMACIÓN PARA EL FONDO
// ==========================================
// Simula el "background-size: cover" para que la cuadrícula no se aplaste
function drawCoverImage(ctx, img, renderSize) {
    const imgRatio = img.width / img.height;
    const canvasRatio = 1; // Nuestro lienzo siempre es 1:1 cuadrado
    
    let drawW = renderSize;
    let drawH = renderSize;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
        // La imagen original es más ancha que alta (como tu lienzo3.jpg)
        drawW = renderSize * imgRatio;
        offsetX = (renderSize - drawW) / 2; // Centra y recorta los lados
    } else {
        // La imagen original es más alta que ancha
        drawH = renderSize / imgRatio;
        offsetY = (renderSize - drawH) / 2; // Centra y recorta arriba/abajo
    }
    
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
}

// ==========================================
// 3. CARGAR CUADRÍCULA GLOBAL
// ==========================================
document.getElementById('btnCargarFondo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            saveToHistory(); 
            fondoBaseGlobal = img;
            vistas.forEach(view => drawCanvas(view)); 
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// ==========================================
// 4. MOTOR DE DIBUJO E INTERFAZ
// ==========================================
function drawCanvas(view) {
    const canvas = document.getElementById(`canvas${view}`);
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // FONDO PERFECTAMENTE PROPORCIONADO
    ctx.globalCompositeOperation = 'source-over';
    if (fondoBaseGlobal) {
        drawCoverImage(ctx, fondoBaseGlobal, CANVAS_SIZE);
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    // BOCETOS CON EFECTO MULTIPLY
    ctx.globalCompositeOperation = 'multiply';
    [1, 2].forEach(num => {
        const img = state[view][`img${num}`];
        const s = state[view][`s${num}`];
        if (img) ctx.drawImage(img, s.x, s.y, s.bw * s.sc, s.bh * s.sc);
        updateStats(view, num);
    });
    
    ctx.globalCompositeOperation = 'source-over';

    const activeNum = state[view].activa;
    const activeImg = state[view][`img${activeNum}`];
    
    if (activeImg) {
        const s = state[view][`s${activeNum}`];
        const currentW = s.bw * s.sc;
        const currentH = s.bh * s.sc;

        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 4; 
        ctx.setLineDash([15, 15]);
        ctx.strokeRect(s.x, s.y, currentW, currentH);
        ctx.setLineDash([]); 
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(s.x - 15, s.y - 15, 30, 30); 
        ctx.fillRect(s.x + currentW - 15, s.y - 15, 30, 30); 
    }
}

function updateStats(view, num) {
    const s = state[view][`s${num}`];
    const text = document.getElementById(`stats${view}${num}`);
    if (state[view][`img${num}`]) {
        text.innerText = `X: ${Math.round(s.x)} | Y: ${Math.round(s.y)} | Esc: ${s.sc.toFixed(2)}`;
    } else {
        text.innerText = `Vacío`;
    }
}

function setActiveImage(view, num) {
    state[view].activa = num;
    document.getElementById(`row${view}1`).classList.remove('active');
    document.getElementById(`row${view}2`).classList.remove('active');
    document.getElementById(`row${view}${num}`).classList.add('active');
    drawCanvas(view); 
}

// ==========================================
// 5. INICIALIZAR CONTROLES Y EVENTOS DE RATÓN
// ==========================================
vistas.forEach(view => {
    const canvas = document.getElementById(`canvas${view}`);
    
    [1, 2].forEach(num => {
        document.getElementById(`img${view}${num}`).addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    saveToHistory(); 
                    state[view][`img${num}`] = img;
                    const s = state[view][`s${num}`];
                    s.bw = img.width; s.bh = img.height; s.sc = 1;
                    
                    s.x = (CANVAS_SIZE - s.bw) / 2; // Usa constante de oro
                    s.y = CANVAS_SIZE - s.bh; 
                    
                    setActiveImage(view, num);
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        });

        document.getElementById(`btnActivar${view}${num}`).addEventListener('click', () => setActiveImage(view, num));
        document.getElementById(`btnEliminar${view}${num}`).addEventListener('click', () => {
            saveToHistory(); 
            state[view][`img${num}`] = null;
            document.getElementById(`img${view}${num}`).value = ""; 
            drawCanvas(view);
        });
    });

    const getActive = () => state[view][`s${state[view].activa}`];
    const hasImg = () => state[view][`img${state[view].activa}`] !== null;

    // --- ARRASTRE Y ESCALA (CLICS Y MOVIMIENTO) ---
    let isDragging = false;
    let isResizing = false;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener('mousedown', (e) => {
        if (!hasImg()) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width; // Usa constante de oro
        const scaleY = CANVAS_SIZE / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        const s = getActive();
        const currentW = s.bw * s.sc;
        
        const hitTL = (mouseX >= s.x - 30 && mouseX <= s.x + 30) && (mouseY >= s.y - 30 && mouseY <= s.y + 30);
        const hitTR = (mouseX >= s.x + currentW - 30 && mouseX <= s.x + currentW + 30) && (mouseY >= s.y - 30 && mouseY <= s.y + 30);
        
        saveToHistory(); 

        if (hitTL || hitTR) {
            isResizing = true;
            canvas.style.cursor = 'ns-resize'; 
        } else {
            isDragging = true;
            canvas.style.cursor = 'grabbing';
        }

        startX = mouseX;
        startY = mouseY;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!hasImg()) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        const s = getActive();

        if (isResizing) {
            const baseY = s.y + (s.bh * s.sc); 
            const newHeight = Math.max(50, baseY - mouseY); 
            const oldScale = s.sc;
            const newScale = newHeight / s.bh;
            s.sc = newScale;
            s.y = baseY - (s.bh * s.sc); 
            s.x -= ((s.bw * newScale) - (s.bw * oldScale)) / 2; 
            drawCanvas(view);
            return;
        }

        if (isDragging) {
            s.x += (mouseX - startX);
            s.y += (mouseY - startY);
            startX = mouseX;
            startY = mouseY;
            drawCanvas(view);
        }
    });

    window.addEventListener('mouseup', () => { isDragging = false; isResizing = false; canvas.style.cursor = 'default'; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; isResizing = false; canvas.style.cursor = 'default'; });

    // --- ZOOM LUPA Y MOVIMIENTO LIBRE ---
    let lupaScale = 100; 
    let scrollTimeout;
    
    canvas.parentElement.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault(); 
            if (e.deltaY < 0) lupaScale += 10; 
            else lupaScale -= 10;              
            
            lupaScale = Math.max(100, Math.min(lupaScale, 600)); 
            canvas.style.width = `${lupaScale}%`;
            canvas.style.height = 'auto';
        } else {
            if (!scrollTimeout && hasImg()) saveToHistory();
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => { scrollTimeout = null; }, 500);
        }
    }, { passive: false });

    // --- CONTROLES DE BOTONES ---
    function applyZoom(delta) {
        if (!hasImg()) return;
        saveToHistory(); 
        const s = getActive();
        const oldScale = s.sc;
        const newScale = Math.max(0.01, oldScale + delta);
        s.y -= (s.bh * newScale) - (s.bh * oldScale); 
        s.x -= ((s.bw * newScale) - (s.bw * oldScale)) / 2; 
        s.sc = newScale;
        drawCanvas(view);
    }

    function moveAction(dx, dy) {
        if (!hasImg()) return;
        saveToHistory();
        const s = getActive();
        s.x += dx;
        s.y += dy;
        drawCanvas(view);
    }

    document.getElementById(`btnZoomIn${view}`).addEventListener('click', () => applyZoom(SCALE_STEP));
    document.getElementById(`btnZoomOut${view}`).addEventListener('click', () => applyZoom(-SCALE_STEP));
    document.getElementById(`btnUp${view}`).addEventListener('click', () => moveAction(0, -MOVE_STEP));
    document.getElementById(`btnDown${view}`).addEventListener('click', () => moveAction(0, MOVE_STEP));
    document.getElementById(`btnLeft${view}`).addEventListener('click', () => moveAction(-MOVE_STEP, 0));
    document.getElementById(`btnRight${view}`).addEventListener('click', () => moveAction(MOVE_STEP, 0));
});

// ==========================================
// 6. EXPORTACIÓN BLINDADA (SIN LEER HTML)
// ==========================================
function getResolucionMultiplicador() {
    const selector = document.getElementById('resolucionDpi').value;
    return selector === '300' ? 1 : (800 / CANVAS_SIZE); 
}

function renderExportCanvas(viewState, mult) {
    // Calculamos el tamaño final basado 100% en la constante matemática
    const exportSize = Math.round(CANVAS_SIZE * mult); 
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = exportSize; 
    tempCanvas.height = exportSize;
    const ctx = tempCanvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportSize, exportSize);
    
    if (fondoBaseGlobal) {
        // Usamos la nueva función anti-deformación para dibujar el fondo
        drawCoverImage(ctx, fondoBaseGlobal, exportSize);
    }

    ctx.globalCompositeOperation = 'multiply';
    [1, 2].forEach(num => {
        const img = viewState[`img${num}`];
        const s = viewState[`s${num}`];
        if (img) {
            const drawX = Math.round(s.x * mult);
            const drawY = Math.round(s.y * mult);
            const drawW = Math.round((s.bw * s.sc) * mult);
            const drawH = Math.round((s.bh * s.sc) * mult);
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
    });
    ctx.globalCompositeOperation = 'source-over';

    return tempCanvas;
}

function descargar(view) {
    const mult = getResolucionMultiplicador();
    // Le pasamos solo el estado matemático, ya no leemos la etiqueta <canvas>
    const exportCanvas = renderExportCanvas(state[view], mult);
    
    const enlace = document.createElement('a');
    enlace.download = `Botarga_Vista_${view}.jpg`;
    enlace.href = exportCanvas.toDataURL('image/jpeg', 1.0); 
    enlace.click();
}

document.getElementById('btnDescargarFrontal').addEventListener('click', () => descargar('Frontal'));
document.getElementById('btnDescargarLateral').addEventListener('click', () => descargar('Lateral'));
document.getElementById('btnDescargarEspalda').addEventListener('click', () => descargar('Espalda'));

document.getElementById('btnDescargarComposicion').addEventListener('click', () => {
    const mult = getResolucionMultiplicador();
    
    // Tamaños basados en constante
    const baseWidth = Math.round(CANVAS_SIZE * mult); 
    const baseHeight = Math.round(CANVAS_SIZE * mult); 

    const comp = document.createElement('canvas');
    comp.width = baseWidth * 3;
    comp.height = baseHeight;
    const ctx = comp.getContext('2d');

    const expF = renderExportCanvas(state['Frontal'], mult);
    const expL = renderExportCanvas(state['Lateral'], mult);
    const expE = renderExportCanvas(state['Espalda'], mult);

    ctx.drawImage(expF, 0, 0);
    ctx.drawImage(expL, baseWidth, 0);
    ctx.drawImage(expE, baseWidth * 2, 0);

    const enlace = document.createElement('a');
    enlace.download = 'Botarga_Composicion_Horizontal.jpg';
    enlace.href = comp.toDataURL('image/jpeg', 1.0);
    enlace.click();
});
