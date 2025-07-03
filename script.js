class MoodGradePro {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.originalImage = null;
    this.originalImageData = null;
    this.currentImageData = null;
    this.workingImage = null;
    
    // App state
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.isViewingOriginal = false;
    
    // History management
    this.historyStack = [];
    this.redoStack = [];
    this.maxHistorySize = 20;
    
    // Image adjustments
    this.adjustments = {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      hue: 0,
      highlights: 0,
      shadows: 0,
      vibrance: 0,
      temperature: 0,
      tint: 0,
      gamma: 1,
      exposure: 0
    };
    
    // Current filter
    this.currentFilter = '';
    this.activeTab = 'filters';
    this.activeCategory = 'cinematic';
    
    // Text overlays
    this.textOverlays = [];
    this.selectedText = null;
    
    // Crop settings
    this.cropMode = false;
    this.cropRect = null;
    this.cropRatio = 'free';
    
    // Initialize the app
    this.init();
  }

  async init() {
    // Show splash screen
    this.showSplashScreen();
    
    // Initialize particles
    this.initParticles();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Hide splash and show app after loading
    setTimeout(() => {
      this.hideSplashScreen();
      this.initCanvas();
      this.loadFilters();
      this.loadAdjustmentControls();
      this.loadEffects();
      this.loadOverlays();
    }, 3000);
  }

  showSplashScreen() {
    const splash = document.getElementById('splash');
    splash.style.display = 'flex';
  }

  hideSplashScreen() {
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');
    
    splash.style.opacity = '0';
    splash.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      splash.style.display = 'none';
      app.classList.remove('hidden');
    }, 500);
  }

  initParticles() {
    const particleContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        this.createParticle(particleContainer);
      }, i * 200);
    }
    
    // Create new particles periodically
    setInterval(() => {
      if (Math.random() < 0.1) {
        this.createParticle(particleContainer);
      }
    }, 1000);
  }

  createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random starting position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = '100vh';
    
    // Random properties
    const size = Math.random() * 3 + 1;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    // Random color (cyan/magenta spectrum)
    const hue = Math.random() < 0.5 ? 180 : 300;
    particle.style.background = `hsl(${hue}, 100%, ${50 + Math.random() * 30}%)`;
    particle.style.boxShadow = `0 0 ${size * 2}px hsl(${hue}, 100%, 70%)`;
    
    // Random animation duration
    particle.style.animationDuration = (8 + Math.random() * 4) + 's';
    particle.style.animationDelay = Math.random() * 2 + 's';
    
    container.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 12000);
  }

  setupEventListeners() {
    // File upload
    const uploadInput = document.getElementById('uploadInput');
    const uploadArea = document.getElementById('uploadArea');
    const addNewBtn = document.getElementById('addNewBtn');
    
    uploadInput.addEventListener('change', (e) => this.handleFileSelect(e));
    addNewBtn.addEventListener('click', () => uploadInput.click());
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'rgba(0, 255, 255, 0.8)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.loadImage(files[0]);
      }
    });
    
    uploadArea.addEventListener('click', () => uploadInput.click());
    
    // Canvas interactions
    this.setupCanvasEvents();
    
    // Tool tabs
    document.querySelectorAll('.tool-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // Header buttons
    document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    document.getElementById('redoBtn').addEventListener('click', () => this.redo());
    document.getElementById('exportBtn').addEventListener('click', () => this.openExportModal());
    document.getElementById('beforeAfterBtn').addEventListener('click', () => this.toggleBeforeAfter());
    document.getElementById('zoomFitBtn').addEventListener('click', () => this.fitToScreen());
    document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
    document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
    
    // Export modal
    this.setupExportModal();
    
    // Quick actions
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleQuickAction(btn.dataset.action));
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Window resize
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  setupCanvasEvents() {
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    
    // Mouse events
    canvasWrapper.addEventListener('mousedown', (e) => this.startPan(e));
    canvasWrapper.addEventListener('mousemove', (e) => this.pan(e));
    canvasWrapper.addEventListener('mouseup', () => this.endPan());
    canvasWrapper.addEventListener('wheel', (e) => this.handleZoom(e));
    
    // Touch events
    canvasWrapper.addEventListener('touchstart', (e) => this.startPan(e.touches[0]));
    canvasWrapper.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.pan(e.touches[0]);
    });
    canvasWrapper.addEventListener('touchend', () => this.endPan());
  }

  setupExportModal() {
    const exportModal = document.getElementById('exportModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('closeExportModal');
    const cancelBtn = document.getElementById('cancelExport');
    const confirmBtn = document.getElementById('confirmExport');
    const qualityRange = document.getElementById('exportQuality');
    const qualityValue = document.getElementById('qualityValue');
    
    qualityRange.addEventListener('input', () => {
      qualityValue.textContent = qualityRange.value + '%';
    });
    
    closeBtn.addEventListener('click', () => this.closeExportModal());
    cancelBtn.addEventListener('click', () => this.closeExportModal());
    confirmBtn.addEventListener('click', () => this.exportImage());
    modalOverlay.addEventListener('click', () => this.closeExportModal());
  }

  initCanvas() {
    this.canvas = document.getElementById('editCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
  }

  resizeCanvas() {
    const container = document.getElementById('canvasContainer');
    const rect = container.getBoundingClientRect();
    
    this.canvas.width = rect.width - 32; // Account for padding
    this.canvas.height = rect.height - 32;
    
    if (this.workingImage) {
      this.redraw();
    }
  }

  handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
      this.loadImage(files[0]);
    }
  }

  async loadImage(file) {
    try {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.workingImage = img;
        this.resetAdjustments();
        this.resetTransform();
        this.saveToHistory();
        this.redraw();
        this.hideUploadArea();
        this.updateProjectName(file.name);
      };
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }

  hideUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.style.display = 'none';
  }

  showUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.style.display = 'block';
  }

  updateProjectName(filename) {
    const projectName = document.getElementById('projectName');
    projectName.textContent = filename.replace(/\.[^/.]+$/, '');
  }

  resetAdjustments() {
    this.adjustments = {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      hue: 0,
      highlights: 0,
      shadows: 0,
      vibrance: 0,
      temperature: 0,
      tint: 0,
      gamma: 1,
      exposure: 0
    };
    this.currentFilter = '';
  }

  resetTransform() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.updateZoomDisplay();
  }

  redraw() {
    if (!this.workingImage) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    
    // Apply zoom and pan
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.translate(this.panX, this.panY);
    
    // Calculate image dimensions
    const canvasAspect = this.canvas.width / this.canvas.height;
    const imageAspect = this.workingImage.width / this.workingImage.height;
    
    let drawWidth, drawHeight;
    if (imageAspect > canvasAspect) {
      drawWidth = this.canvas.width;
      drawHeight = this.canvas.width / imageAspect;
    } else {
      drawHeight = this.canvas.height;
      drawWidth = this.canvas.height * imageAspect;
    }
    
    // Apply filter if active
    if (this.currentFilter) {
      this.ctx.filter = this.currentFilter;
    }
    
    // Draw image
    this.ctx.drawImage(
      this.workingImage,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    
    // Reset filter
    this.ctx.filter = 'none';
    this.ctx.restore();
    
    // Draw text overlays
    this.drawTextOverlays();
  }

  // Filter definitions with categories
  getFilterDefinitions() {
    return {
      cinematic: {
        'Blade Runner 2049': 'contrast(1.3) saturate(1.4) hue-rotate(-10deg) brightness(1.1)',
        'Oppenheimer': 'contrast(1.5) saturate(0.6) sepia(0.1) brightness(0.95)',
        'Dune': 'brightness(1.1) contrast(1.2) saturate(0.8) sepia(0.05)',
        'The Batman': 'contrast(1.8) brightness(0.9) saturate(0.7)',
        'Tenet': 'contrast(1.4) brightness(1.05) saturate(0.9)',
        'Inception': 'contrast(1.3) brightness(0.95) hue-rotate(180deg)',
        'Interstellar': 'brightness(1.1) contrast(0.95) saturate(1.1)',
        'Mad Max: Fury Road': 'sepia(0.3) brightness(1.2) contrast(1.4)',
        'Moonlight': 'hue-rotate(240deg) contrast(1.3) saturate(1.2)',
        'Parasite': 'hue-rotate(100deg) brightness(0.95) contrast(1.1)'
      },
      vintage: {
        'Kodachrome': 'sepia(0.3) saturate(1.4) brightness(1.1) contrast(1.2)',
        'Polaroid': 'sepia(0.2) brightness(1.2) contrast(0.9) saturate(1.3)',
        '70s Film': 'hue-rotate(15deg) saturate(1.5) brightness(1.1) contrast(1.1)',
        'Faded Photo': 'brightness(1.3) contrast(0.8) saturate(0.7) sepia(0.1)',
        'Cross Process': 'contrast(1.4) saturate(1.6) hue-rotate(-10deg)',
        'Vintage Warm': 'sepia(0.4) brightness(1.15) contrast(1.1)',
        'Old Cinema': 'sepia(0.6) contrast(1.3) brightness(0.9)',
        'Retro Fade': 'brightness(1.2) contrast(0.85) saturate(0.8)'
      },
      modern: {
        'Clean Bright': 'brightness(1.2) contrast(1.1) saturate(1.1)',
        'High Contrast': 'contrast(1.5) brightness(1.05) saturate(1.2)',
        'Vibrant': 'saturate(1.6) brightness(1.1) contrast(1.2)',
        'Cool Blue': 'hue-rotate(200deg) saturate(1.3) brightness(1.05)',
        'Warm Orange': 'hue-rotate(20deg) saturate(1.4) brightness(1.1)',
        'Dramatic': 'contrast(1.6) brightness(0.95) saturate(1.3)',
        'Soft Light': 'brightness(1.15) contrast(0.9) saturate(1.05)',
        'Crisp': 'contrast(1.3) brightness(1.05) saturate(1.15)'
      },
      artistic: {
        'Oil Paint': 'contrast(1.4) saturate(1.5) brightness(1.1)',
        'Watercolor': 'brightness(1.2) contrast(0.8) saturate(1.3)',
        'Pop Art': 'contrast(1.6) saturate(2) brightness(1.1)',
        'Surreal': 'hue-rotate(90deg) saturate(1.8) contrast(1.3)',
        'Dreamy': 'brightness(1.3) contrast(0.7) saturate(1.4)',
        'Cyberpunk': 'hue-rotate(270deg) saturate(1.6) contrast(1.4)',
        'Neon': 'saturate(1.8) contrast(1.5) brightness(1.2)',
        'Psychedelic': 'hue-rotate(45deg) saturate(2) contrast(1.4)'
      },
      bw: {
        'Classic B&W': 'grayscale(1) contrast(1.2)',
        'High Contrast B&W': 'grayscale(1) contrast(1.6) brightness(1.1)',
        'Soft B&W': 'grayscale(1) contrast(0.9) brightness(1.15)',
        'Dramatic B&W': 'grayscale(1) contrast(1.8) brightness(0.95)',
        'Film Noir': 'grayscale(1) contrast(1.5) brightness(0.85)',
        'Infrared': 'grayscale(1) invert(0.1) contrast(1.3)',
        'Sepia Tone': 'sepia(1) brightness(1.1) contrast(1.1)',
        'Warm B&W': 'grayscale(1) sepia(0.3) brightness(1.05)'
      }
    };
  }

  loadFilters() {
    const filtersGrid = document.getElementById('filtersGrid');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const filters = this.getFilterDefinitions();
    
    // Category button events
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.dataset.category;
        this.renderFilters();
      });
    });
    
    this.renderFilters();
  }

  renderFilters() {
    const filtersGrid = document.getElementById('filtersGrid');
    const filters = this.getFilterDefinitions();
    const categoryFilters = filters[this.activeCategory] || {};
    
    filtersGrid.innerHTML = '';
    
    // Add "None" option
    const noneItem = document.createElement('div');
    noneItem.className = 'filter-item';
    noneItem.textContent = 'Original';
    noneItem.addEventListener('click', () => {
      this.applyFilter('');
      this.updateFilterSelection(noneItem);
    });
    filtersGrid.appendChild(noneItem);
    
    // Add category filters
    Object.entries(categoryFilters).forEach(([name, filter]) => {
      const filterItem = document.createElement('div');
      filterItem.className = 'filter-item';
      filterItem.textContent = name;
      filterItem.addEventListener('click', () => {
        this.applyFilter(filter);
        this.updateFilterSelection(filterItem);
      });
      filtersGrid.appendChild(filterItem);
    });
  }

  updateFilterSelection(selectedItem) {
    document.querySelectorAll('.filter-item').forEach(item => {
      item.classList.remove('active');
    });
    selectedItem.classList.add('active');
  }

  applyFilter(filter) {
    this.currentFilter = filter;
    this.saveToHistory();
    this.redraw();
  }

  loadAdjustmentControls() {
    const adjustContainer = document.querySelector('.adjustment-controls');
    const adjustments = [
      { name: 'brightness', label: 'Brightness', min: 0.5, max: 2, step: 0.01, default: 1 },
      { name: 'contrast', label: 'Contrast', min: 0.5, max: 2, step: 0.01, default: 1 },
      { name: 'saturation', label: 'Saturation', min: 0, max: 2, step: 0.01, default: 1 },
      { name: 'hue', label: 'Hue', min: -180, max: 180, step: 1, default: 0 },
      { name: 'exposure', label: 'Exposure', min: -2, max: 2, step: 0.1, default: 0 },
      { name: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1, default: 0 },
      { name: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1, default: 0 },
      { name: 'vibrance', label: 'Vibrance', min: -100, max: 100, step: 1, default: 0 },
      { name: 'temperature', label: 'Temperature', min: -100, max: 100, step: 1, default: 0 },
      { name: 'tint', label: 'Tint', min: -100, max: 100, step: 1, default: 0 }
    ];
    
    adjustments.forEach(adj => {
      const group = document.createElement('div');
      group.className = 'adjustment-group';
      
      const label = document.createElement('div');
      label.className = 'adjustment-label';
      label.innerHTML = `
        <span>${adj.label}</span>
        <span class="adjustment-value">${adj.default}</span>
      `;
      
      const range = document.createElement('input');
      range.type = 'range';
      range.className = 'range-input';
      range.min = adj.min;
      range.max = adj.max;
      range.step = adj.step;
      range.value = adj.default;
      
      range.addEventListener('input', () => {
        const value = parseFloat(range.value);
        this.adjustments[adj.name] = value;
        label.querySelector('.adjustment-value').textContent = 
          adj.name === 'hue' ? `${value}°` : value.toFixed(2);
        this.applyAdjustments();
      });
      
      group.appendChild(label);
      group.appendChild(range);
      adjustContainer.appendChild(group);
    });
  }

  applyAdjustments() {
    let filter = '';
    
    if (this.adjustments.brightness !== 1) {
      filter += `brightness(${this.adjustments.brightness}) `;
    }
    if (this.adjustments.contrast !== 1) {
      filter += `contrast(${this.adjustments.contrast}) `;
    }
    if (this.adjustments.saturation !== 1) {
      filter += `saturate(${this.adjustments.saturation}) `;
    }
    if (this.adjustments.hue !== 0) {
      filter += `hue-rotate(${this.adjustments.hue}deg) `;
    }
    
    this.currentFilter = filter.trim();
    this.redraw();
  }

  loadEffects() {
    const effectsGrid = document.querySelector('.effects-grid');
    const effects = [
      'Blur', 'Sharpen', 'Emboss', 'Edge Detect',
      'Noise', 'Vignette', 'Glow', 'Shadow'
    ];
    
    effects.forEach(effect => {
      const effectItem = document.createElement('div');
      effectItem.className = 'effect-item';
      effectItem.textContent = effect;
      effectItem.addEventListener('click', () => this.applyEffect(effect));
      effectsGrid.appendChild(effectItem);
    });
  }

  loadOverlays() {
    const overlaysGrid = document.querySelector('.overlays-grid');
    const overlays = [
      'Light Leak 1', 'Light Leak 2', 'Dust', 'Scratches',
      'Film Grain', 'Bokeh', 'Flare', 'Vignette'
    ];
    
    overlays.forEach(overlay => {
      const overlayItem = document.createElement('div');
      overlayItem.className = 'overlay-item';
      overlayItem.textContent = overlay;
      overlayItem.addEventListener('click', () => this.applyOverlay(overlay));
      overlaysGrid.appendChild(overlayItem);
    });
  }

  applyEffect(effect) {
    // Effect implementation would go here
    console.log('Applying effect:', effect);
  }

  applyOverlay(overlay) {
    // Overlay implementation would go here
    console.log('Applying overlay:', overlay);
  }

  // Tab switching
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tool-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update panels
    document.querySelectorAll('.tool-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`${tabName}Panel`).classList.add('active');
    
    this.activeTab = tabName;
  }

  // Canvas interactions
  startPan(event) {
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  pan(event) {
    if (!this.isDragging) return;
    
    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;
    
    this.panX += deltaX / this.zoom;
    this.panY += deltaY / this.zoom;
    
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    
    this.redraw();
  }

  endPan() {
    this.isDragging = false;
  }

  handleZoom(event) {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    this.zoom = Math.max(0.1, Math.min(5, this.zoom * delta));
    
    this.updateZoomDisplay();
    this.redraw();
  }

  zoomIn() {
    this.zoom = Math.min(5, this.zoom * 1.2);
    this.updateZoomDisplay();
    this.redraw();
  }

  zoomOut() {
    this.zoom = Math.max(0.1, this.zoom * 0.8);
    this.updateZoomDisplay();
    this.redraw();
  }

  fitToScreen() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.updateZoomDisplay();
    this.redraw();
  }

  updateZoomDisplay() {
    document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
  }

  toggleBeforeAfter() {
    if (!this.originalImage) return;
    
    this.isViewingOriginal = !this.isViewingOriginal;
    
    if (this.isViewingOriginal) {
      const tempFilter = this.currentFilter;
      this.currentFilter = '';
      this.redraw();
      this.currentFilter = tempFilter;
    } else {
      this.redraw();
    }
  }

  // Text overlay functionality
  drawTextOverlays() {
    this.textOverlays.forEach(textObj => {
      this.ctx.save();
      this.ctx.font = `${textObj.size}px ${textObj.font}`;
      this.ctx.fillStyle = textObj.color;
      this.ctx.textAlign = textObj.align;
      
      if (textObj.shadow) {
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
      }
      
      this.ctx.fillText(textObj.text, textObj.x, textObj.y);
      this.ctx.restore();
    });
  }

  addTextOverlay() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();
    
    if (!text) return;
    
    const textObj = {
      text: text,
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      font: document.getElementById('fontFamily').value,
      size: parseInt(document.getElementById('fontSize').value),
      color: document.getElementById('textColor').value,
      align: 'center',
      shadow: true
    };
    
    this.textOverlays.push(textObj);
    textInput.value = '';
    this.saveToHistory();
    this.redraw();
  }

  // History management
  saveToHistory() {
    const state = {
      filter: this.currentFilter,
      adjustments: { ...this.adjustments },
      textOverlays: [...this.textOverlays]
    };
    
    this.historyStack.push(state);
    this.redoStack = [];
    
    if (this.historyStack.length > this.maxHistorySize) {
      this.historyStack.shift();
    }
    
    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.historyStack.length <= 1) return;
    
    const currentState = this.historyStack.pop();
    this.redoStack.push(currentState);
    
    const previousState = this.historyStack[this.historyStack.length - 1];
    this.restoreState(previousState);
    this.updateUndoRedoButtons();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    
    const state = this.redoStack.pop();
    this.historyStack.push(state);
    this.restoreState(state);
    this.updateUndoRedoButtons();
  }

  restoreState(state) {
    this.currentFilter = state.filter;
    this.adjustments = { ...state.adjustments };
    this.textOverlays = [...state.textOverlays];
    this.redraw();
  }

  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    undoBtn.style.opacity = this.historyStack.length > 1 ? '1' : '0.5';
    redoBtn.style.opacity = this.redoStack.length > 0 ? '1' : '0.5';
  }

  // Quick actions
  handleQuickAction(action) {
    switch (action) {
      case 'auto-enhance':
        this.autoEnhance();
        break;
      case 'remove-bg':
        this.removeBackground();
        break;
      case 'ai-upscale':
        this.aiUpscale();
        break;
    }
  }

  autoEnhance() {
    // Auto enhance implementation
    this.adjustments.brightness = 1.1;
    this.adjustments.contrast = 1.2;
    this.adjustments.saturation = 1.15;
    this.applyAdjustments();
    this.saveToHistory();
  }

  removeBackground() {
    // Background removal would require AI service integration
    console.log('Remove background feature would integrate with AI service');
  }

  aiUpscale() {
    // AI upscaling would require AI service integration
    console.log('AI upscale feature would integrate with AI service');
  }

  // Export functionality
  openExportModal() {
    const modal = document.getElementById('exportModal');
    const overlay = document.getElementById('modalOverlay');
    
    modal.classList.add('active');
    overlay.classList.add('active');
  }

  closeExportModal() {
    const modal = document.getElementById('exportModal');
    const overlay = document.getElementById('modalOverlay');
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }

  exportImage() {
    const format = document.getElementById('exportFormat').value;
    const quality = document.getElementById('exportQuality').value / 100;
    const size = document.getElementById('exportSize').value;
    
    // Create export canvas
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // Set export dimensions
    if (size === 'original') {
      exportCanvas.width = this.originalImage.width;
      exportCanvas.height = this.originalImage.height;
    } else {
      const targetSize = parseInt(size);
      const aspect = this.originalImage.width / this.originalImage.height;
      
      if (aspect > 1) {
        exportCanvas.width = targetSize;
        exportCanvas.height = targetSize / aspect;
      } else {
        exportCanvas.height = targetSize;
        exportCanvas.width = targetSize * aspect;
      }
    }
    
    // Apply current filter
    if (this.currentFilter) {
      exportCtx.filter = this.currentFilter;
    }
    
    // Draw image
    exportCtx.drawImage(this.originalImage, 0, 0, exportCanvas.width, exportCanvas.height);
    
    // Draw text overlays
    const scaleX = exportCanvas.width / this.canvas.width;
    const scaleY = exportCanvas.height / this.canvas.height;
    
    this.textOverlays.forEach(textObj => {
      exportCtx.save();
      exportCtx.font = `${textObj.size * scaleX}px ${textObj.font}`;
      exportCtx.fillStyle = textObj.color;
      exportCtx.textAlign = textObj.align;
      exportCtx.fillText(textObj.text, textObj.x * scaleX, textObj.y * scaleY);
      exportCtx.restore();
    });
    
    // Export
    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    const dataURL = exportCanvas.toDataURL(mimeType, quality);
    
    const a = document.createElement('a');
    a.download = `moodgrade-export.${format}`;
    a.href = dataURL;
    a.click();
    
    this.closeExportModal();
  }

  // Keyboard shortcuts
  handleKeydown(event) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'z':
          event.preventDefault();
          if (event.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
          break;
        case 'e':
          event.preventDefault();
          this.openExportModal();
          break;
        case '=':
        case '+':
          event.preventDefault();
          this.zoomIn();
          break;
        case '-':
          event.preventDefault();
          this.zoomOut();
          break;
        case '0':
          event.preventDefault();
          this.fitToScreen();
          break;
      }
    }
    
    switch (event.key) {
      case 'Escape':
        this.closeExportModal();
        break;
      case ' ':
        event.preventDefault();
        this.toggleBeforeAfter();
        break;
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.moodGrade = new MoodGradePro();
});