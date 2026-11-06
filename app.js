/**
 * Craft Lab Zuzo — Controlador de Interfaz y Análisis Local (Sin Persistencia)
 * ----------------------------------------------------------------------------
 * - Procesa imágenes localmente en memoria mediante FileReader y Canvas 2D.
 * - Conecta las preferencias y texto con CraftLabGenerator (100% determinístico NO IA).
 * - Actualiza el iframe con sandbox="allow-scripts" mediante srcdoc.
 * - Permite descargar el archivo .html autónomo y reiniciar el estado completo.
 */

(function () {
  'use strict';

  const Generator =
    typeof window !== 'undefined' && window.CraftLabGenerator
      ? window.CraftLabGenerator
      : null;

  if (!Generator) {
    return;
  }

  // Estado exclusivamente en memoria volátil (0% persistencia)
  const state = {
    currentImageMeta: null,
    lastResult: null
  };

  // Referencias del DOM
  const els = {
    form: document.getElementById('craft-form'),
    statusBanner: document.getElementById('status-banner'),
    liveSeedBadge: document.getElementById('live-seed-badge'),
    imageInput: document.getElementById('image-input'),
    imageDropzone: document.getElementById('image-dropzone'),
    telemetryCard: document.getElementById('image-telemetry-card'),
    imageThumb: document.getElementById('image-thumb'),
    imageName: document.getElementById('image-name'),
    btnClearImage: document.getElementById('btn-clear-image'),
    chipDimensions: document.getElementById('chip-dimensions'),
    chipAspect: document.getElementById('chip-aspect'),
    chipLuminance: document.getElementById('chip-luminance'),
    swatchDom: document.getElementById('swatch-dom'),
    swatchSec: document.getElementById('swatch-sec'),
    swatchLabel: document.getElementById('swatch-label'),
    referenceText: document.getElementById('reference-text'),
    textCounter: document.getElementById('text-counter'),
    prefLayout: document.getElementById('pref-layout'),
    prefPalette: document.getElementById('pref-palette'),
    prefTypography: document.getElementById('pref-typography'),
    prefDensity: document.getElementById('pref-density'),
    prefInteractive: document.getElementById('pref-interactive'),
    prefVariant: document.getElementById('pref-variant'),
    btnNextVariant: document.getElementById('btn-next-variant'),
    btnLoadExample: document.getElementById('btn-load-example'),
    btnReset: document.getElementById('btn-reset'),
    btnCopyHtml: document.getElementById('btn-copy-html'),
    btnDownloadHtml: document.getElementById('btn-download-html'),
    iframeStage: document.getElementById('iframe-stage'),
    previewIframe: document.getElementById('prototype-preview'),
    previewDimensionsLabel: document.getElementById('preview-dimensions-label'),
    generatedHtmlCode: document.getElementById('generated-html-code'),
    codeByteSize: document.getElementById('code-byte-size'),
    auditFingerprint: document.getElementById('audit-fingerprint'),
    auditSeed: document.getElementById('audit-seed'),
    auditPalette: document.getElementById('audit-palette'),
    auditTypography: document.getElementById('audit-typography'),
    auditInteractive: document.getElementById('audit-interactive')
  };

  /**
   * Emite un mensaje accesible en la barra de estado (aria-live="polite").
   */
  function announceStatus(message) {
    if (els.statusBanner) {
      els.statusBanner.textContent = message;
    }
  }

  /**
   * Actualiza el contador de palabras y caracteres del texto de referencia.
   */
  function updateTextCounter() {
    if (!els.referenceText || !els.textCounter) return;
    const raw = els.referenceText.value.trim();
    const words = raw ? raw.split(/\s+/).filter(Boolean).length : 0;
    els.textCounter.textContent = `${words} palabras · ${raw.length} caracteres`;
  }

  /**
   * Muestra u oculta la tarjeta de telemetría de la imagen local.
   */
  function renderImageTelemetry(meta) {
    if (!els.telemetryCard) return;
    if (!meta) {
      els.telemetryCard.setAttribute('hidden', 'hidden');
      if (els.imageThumb) els.imageThumb.removeAttribute('src');
      return;
    }

    els.telemetryCard.removeAttribute('hidden');
    if (els.imageThumb && meta.dataUrl) {
      els.imageThumb.src = meta.dataUrl;
    }
    if (els.imageName) {
      els.imageName.textContent = meta.name || 'imagen-local';
    }
    if (els.chipDimensions) {
      els.chipDimensions.textContent = `${meta.width || 0}×${meta.height || 0} px`;
    }
    if (els.chipAspect) {
      els.chipAspect.textContent = `Prop: ${meta.aspectRatioLabel || 'estándar'}`;
    }
    if (els.chipLuminance) {
      const lumPct = Math.round((Number(meta.averageLuminance) || 0) * 100);
      els.chipLuminance.textContent = `Lum: ${lumPct}%`;
    }
    if (els.swatchDom && meta.dominantRgb) {
      const { r, g, b } = meta.dominantRgb;
      els.swatchDom.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
    if (els.swatchSec && meta.secondaryRgb) {
      const { r, g, b } = meta.secondaryRgb;
      els.swatchSec.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
    if (els.swatchLabel && meta.dominantRgb) {
      const { r, g, b } = meta.dominantRgb;
      els.swatchLabel.textContent = `RGB(${r},${g},${b})`;
    }
  }

  /**
   * Analiza una imagen cargada localmente usando un Canvas 2D en memoria para
   * extraer color dominante, secundario, luminancia media, proporción y firma.
   */
  function analyzeLocalImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        reject(new Error('El archivo seleccionado no es una imagen válida.'));
        return;
      }

      const reader = new FileReader();
      reader.onerror = function () {
        reject(new Error('No se pudo leer el archivo de imagen local.'));
      };
      reader.onload = function (ev) {
        const dataUrl = String(ev.target.result || '');
        const img = new Image();
        img.onerror = function () {
          reject(new Error('No se pudo decodificar la imagen seleccionada.'));
        };
        img.onload = function () {
          const width = img.naturalWidth || img.width || 320;
          const height = img.naturalHeight || img.height || 240;
          const ratio = width / Math.max(1, height);
          let aspectRatioLabel = 'cuadrada';
          if (ratio > 1.2) aspectRatioLabel = 'panoramica';
          else if (ratio < 0.85) aspectRatioLabel = 'vertical';

          const sampleSize = 24;
          const canvas = document.createElement('canvas');
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          const ctx = canvas.getContext('2d');

          let dominantRgb = { r: 36, g: 124, b: 116 };
          let secondaryRgb = { r: 218, g: 132, b: 52 };
          let averageLuminance = 0.42;
          let pixelSignature = '';

          if (ctx) {
            ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
            const pixels = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
            let rSum = 0;
            let gSum = 0;
            let bSum = 0;
            let rSecSum = 0;
            let gSecSum = 0;
            let bSecSum = 0;
            let count = 0;
            let secCount = 0;
            let lumSum = 0;
            const sigParts = [];

            for (let i = 0; i < pixels.length; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              const a = pixels[i + 3];
              if (a < 32) continue;

              const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
              lumSum += lum;
              count += 1;

              if ((count % 2) === 0) {
                rSum += r;
                gSum += g;
                bSum += b;
              } else {
                rSecSum += r;
                gSecSum += g;
                bSecSum += b;
                secCount += 1;
              }

              if ((i % 64) === 0) {
                sigParts.push(((r << 16) | (g << 8) | b).toString(16));
              }
            }

            if (count > 0) {
              const domDenom = Math.max(1, count - secCount);
              dominantRgb = {
                r: Math.round(rSum / domDenom),
                g: Math.round(gSum / domDenom),
                b: Math.round(bSum / domDenom)
              };
              secondaryRgb = {
                r: Math.round(rSecSum / Math.max(1, secCount)),
                g: Math.round(gSecSum / Math.max(1, secCount)),
                b: Math.round(bSecSum / Math.max(1, secCount))
              };
              averageLuminance = Number((lumSum / count).toFixed(3));
            }

            const sigHash = Generator.fnv1a32(sigParts.join('-')).toString(16).padStart(8, '0');
            pixelSignature = `px-${sigHash}`;
          }

          resolve({
            name: file.name,
            width,
            height,
            dominantRgb,
            secondaryRgb,
            averageLuminance,
            aspectRatioLabel,
            pixelSignature,
            dataUrl
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Lee las preferencias actuales del formulario.
   */
  function readFormPreferences() {
    return {
      layout: els.prefLayout ? els.prefLayout.value : 'product-launch',
      paletteMode: els.prefPalette ? els.prefPalette.value : 'auto-image',
      typography: els.prefTypography ? els.prefTypography.value : 'sans-geometric',
      density: els.prefDensity ? els.prefDensity.value : 'balanced',
      interactiveModule: els.prefInteractive ? els.prefInteractive.value : 'estimator',
      variantIndex: els.prefVariant ? Math.max(1, Math.min(8, Number(els.prefVariant.value) || 1)) : 1
    };
  }

  /**
   * Ejecuta la síntesis determinística y actualiza la vista previa en sandbox, el código y la auditoría.
   */
  function synthesizeAndRender(reasonMessage) {
    const referenceText = els.referenceText ? els.referenceText.value : '';
    const preferences = readFormPreferences();

    const result = Generator.generateVariant({
      referenceText,
      imageMeta: state.currentImageMeta,
      preferences
    });

    state.lastResult = result;

    // Actualizar insignia de semilla en vivo
    if (els.liveSeedBadge) {
      els.liveSeedBadge.textContent = result.fingerprint;
    }

    // Actualizar iframe sandbox con srcdoc
    if (els.previewIframe) {
      els.previewIframe.srcdoc = result.html;
    }

    // Actualizar inspector de código HTML
    if (els.generatedHtmlCode) {
      els.generatedHtmlCode.textContent = result.html;
    }
    if (els.codeByteSize) {
      const bytes = new Blob([result.html]).size;
      els.codeByteSize.textContent = `${bytes.toLocaleString('es-ES')} bytes`;
    }

    // Actualizar panel de auditoría determinística
    if (els.auditFingerprint) els.auditFingerprint.textContent = result.fingerprint;
    if (els.auditSeed) els.auditSeed.textContent = `0x${result.seedHex} (${result.seed})`;
    if (els.auditPalette) els.auditPalette.textContent = result.palette.name;
    if (els.auditTypography) els.auditTypography.textContent = result.typography.label;
    if (els.auditInteractive) els.auditInteractive.textContent = preferences.interactiveModule;

    updateTextCounter();

    if (reasonMessage) {
      announceStatus(`${reasonMessage} · Huella determinística: ${result.fingerprint}`);
    }
  }

  /**
   * Carga el ejemplo propio incorporado en el MVP.
   */
  function loadBuiltInExample() {
    const ex = Generator.BUILT_IN_EXAMPLE;
    state.currentImageMeta = Object.assign({}, ex.imageMeta);

    if (els.referenceText) els.referenceText.value = ex.referenceText;
    if (els.prefLayout) els.prefLayout.value = ex.preferences.layout;
    if (els.prefPalette) els.prefPalette.value = ex.preferences.paletteMode;
    if (els.prefTypography) els.prefTypography.value = ex.preferences.typography;
    if (els.prefDensity) els.prefDensity.value = ex.preferences.density;
    if (els.prefInteractive) els.prefInteractive.value = ex.preferences.interactiveModule;
    if (els.prefVariant) els.prefVariant.value = String(ex.preferences.variantIndex);
    if (els.imageInput) els.imageInput.value = '';

    renderImageTelemetry(state.currentImageMeta);
    synthesizeAndRender('Ejemplo propio incorporado cargado');
  }

  /**
   * Reinicia todos los controles, limpia la imagen en memoria y restablece valores base.
   */
  function resetAll() {
    state.currentImageMeta = null;
    if (els.imageInput) els.imageInput.value = '';
    if (els.referenceText) els.referenceText.value = '';
    if (els.prefLayout) els.prefLayout.value = 'product-launch';
    if (els.prefPalette) els.prefPalette.value = 'auto-image';
    if (els.prefTypography) els.prefTypography.value = 'sans-geometric';
    if (els.prefDensity) els.prefDensity.value = 'balanced';
    if (els.prefInteractive) els.prefInteractive.value = 'estimator';
    if (els.prefVariant) els.prefVariant.value = '1';

    renderImageTelemetry(null);
    synthesizeAndRender('Estado reiniciado: memoria efímera limpia (0% persistencia)');
  }

  /**
   * Descarga el prototipo HTML generado como archivo autónomo.
   */
  function downloadGeneratedHtml() {
    if (!state.lastResult || !state.lastResult.html) return;
    const filename = `prototipo-${state.lastResult.fingerprint.toLowerCase()}.html`;
    const blob = new Blob([state.lastResult.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 250);
    announceStatus(`Archivo ${filename} descargado localmente.`);
  }

  /**
   * Copia el código HTML generado al portapapeles.
   */
  function copyGeneratedHtml() {
    if (!state.lastResult || !state.lastResult.html) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(state.lastResult.html).then(
        () => announceStatus('Código HTML copiado al portapapeles.'),
        () => announceStatus('No se pudo acceder al portapapeles automáticamente; usa la pestaña Código HTML.')
      );
    } else {
      announceStatus('Usa la pestaña Código HTML para seleccionar y copiar el documento.');
    }
  }

  // Eventos de formulario y controles
  if (els.form) {
    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      synthesizeAndRender('Variante regenerada manualmente (NO IA)');
    });
  }

  [
    els.prefLayout,
    els.prefPalette,
    els.prefTypography,
    els.prefDensity,
    els.prefInteractive,
    els.prefVariant
  ].forEach(function (control) {
    if (control) {
      control.addEventListener('change', function () {
        synthesizeAndRender('Preferencia actualizada');
      });
    }
  });

  if (els.referenceText) {
    els.referenceText.addEventListener('input', function () {
      synthesizeAndRender('Texto de referencia actualizado');
    });
  }

  if (els.btnNextVariant && els.prefVariant) {
    els.btnNextVariant.addEventListener('click', function () {
      const current = Number(els.prefVariant.value) || 1;
      const next = (current % 8) + 1;
      els.prefVariant.value = String(next);
      synthesizeAndRender(`Variante determinística #${next} activada`);
    });
  }

  if (els.btnLoadExample) {
    els.btnLoadExample.addEventListener('click', loadBuiltInExample);
  }

  if (els.btnReset) {
    els.btnReset.addEventListener('click', resetAll);
  }

  if (els.btnClearImage) {
    els.btnClearImage.addEventListener('click', function () {
      state.currentImageMeta = null;
      if (els.imageInput) els.imageInput.value = '';
      renderImageTelemetry(null);
      synthesizeAndRender('Imagen local descartada de la memoria');
    });
  }

  if (els.imageInput) {
    els.imageInput.addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      analyzeLocalImageFile(file)
        .then(function (meta) {
          state.currentImageMeta = meta;
          renderImageTelemetry(meta);
          synthesizeAndRender(`Imagen local "${meta.name}" analizada en memoria`);
        })
        .catch(function (err) {
          announceStatus(err.message || 'Error al procesar la imagen local.');
        });
    });
  }

  if (els.imageDropzone) {
    ['dragenter', 'dragover'].forEach(function (evName) {
      els.imageDropzone.addEventListener(evName, function (e) {
        e.preventDefault();
        els.imageDropzone.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(function (evName) {
      els.imageDropzone.addEventListener(evName, function (e) {
        e.preventDefault();
        els.imageDropzone.classList.remove('drag-over');
      });
    });
    els.imageDropzone.addEventListener('drop', function (e) {
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      analyzeLocalImageFile(file)
        .then(function (meta) {
          state.currentImageMeta = meta;
          renderImageTelemetry(meta);
          synthesizeAndRender(`Imagen arrastrada "${meta.name}" analizada en memoria`);
        })
        .catch(function (err) {
          announceStatus(err.message || 'Error al analizar la imagen arrastrada.');
        });
    });
  }

  if (els.btnDownloadHtml) {
    els.btnDownloadHtml.addEventListener('click', downloadGeneratedHtml);
  }

  if (els.btnCopyHtml) {
    els.btnCopyHtml.addEventListener('click', copyGeneratedHtml);
  }

  // Pestañas de vista (Preview / Código / Auditoría)
  const tabButtons = document.querySelectorAll('.tab-pill[data-view]');
  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetView = btn.getAttribute('data-view');
      tabButtons.forEach(function (b) {
        const isCurrent = b === btn;
        b.classList.toggle('active', isCurrent);
        b.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });
      ['preview', 'code', 'audit'].forEach(function (viewId) {
        const container = document.getElementById('view-' + viewId);
        if (container) {
          if (viewId === targetView) {
            container.classList.add('active');
            container.removeAttribute('hidden');
          } else {
            container.classList.remove('active');
            container.setAttribute('hidden', 'hidden');
          }
        }
      });
    });
  });

  // Selector de tamaño de pantalla para la vista previa
  const vpButtons = document.querySelectorAll('.vp-btn[data-vp]');
  vpButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const vp = btn.getAttribute('data-vp') || 'desktop';
      vpButtons.forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      if (els.iframeStage) {
        els.iframeStage.setAttribute('data-viewport', vp);
      }
      if (els.previewDimensionsLabel) {
        const labels = {
          desktop: 'Ancho: 100% (Escritorio)',
          tablet: 'Ancho: 768px (Tablet)',
          mobile: 'Ancho: 375px (Móvil)'
        };
        els.previewDimensionsLabel.textContent = labels[vp] || 'Ancho: 100%';
      }
    });
  });

  // Inicializar con el ejemplo propio incorporado
  loadBuiltInExample();
})();
