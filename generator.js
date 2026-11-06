/**
 * Craft Lab Zuzo — Motor de Síntesis Determinística (NO IA)
 * ---------------------------------------------------------
 * Sintetizador algorítmico puro basado en heurísticas geométricas,
 * extracción cromática/estructural y hash determinístico FNV-1a (32 bits).
 *
 * Garantías:
 * - 0% Inteligencia Artificial / LLMs / APIs externas.
 * - 100% Determinístico: la misma entrada produce exactamente el mismo HTML byte a byte.
 * - 0% Red / Terceros: el HTML generado es autónomo, sin CDNs, fuentes remotas ni trackers.
 * - 0% Persistencia: no utiliza localStorage, sessionStorage, IndexedDB ni cookies.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CraftLabGenerator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Hash determinístico FNV-1a de 32 bits.
   * @param {string} input
   * @returns {number} Entero sin signo de 32 bits
   */
  function fnv1a32(input) {
    const str = String(input || '');
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  /**
   * Generador pseudoaleatorio determinístico Mulberry32 acotado a una semilla de 32 bits.
   * @param {number} seed
   * @returns {() => number} Función que retorna flotante en [0, 1)
   */
  function createSeededRng(seed) {
    let state = (seed >>> 0) || 0x6d2b79f5;
    return function next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Escapa caracteres HTML especiales para prevenir inyección o rotura de marcado.
   * @param {string} raw
   * @returns {string}
   */
  function escapeHtml(raw) {
    return String(raw ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Convierte RGB [0-255] a HSL [0-360, 0-100, 0-100].
   */
  function rgbToHsl(r, g, b) {
    const rn = Math.max(0, Math.min(255, Number(r) || 0)) / 255;
    const gn = Math.max(0, Math.min(255, Number(g) || 0)) / 255;
    const bn = Math.max(0, Math.min(255, Number(b) || 0)) / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rn:
          h = (gn - bn) / d + (gn < bn ? 6 : 0);
          break;
        case gn:
          h = (bn - rn) / d + 2;
          break;
        default:
          h = (rn - gn) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Formatea HSL a cadena CSS.
   */
  function hslCss(h, s, l) {
    const hue = ((Math.round(h) % 360) + 360) % 360;
    const sat = Math.max(0, Math.min(100, Math.round(s)));
    const light = Math.max(0, Math.min(100, Math.round(l)));
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }

  /**
   * Ejemplo propio incorporado en el MVP (100% original, sin logos ni marcas de terceros).
   */
  const BUILT_IN_EXAMPLE = Object.freeze({
    id: 'atelier-zuzo-acustica-2026',
    label: 'Atelier Zuzo · Acústica Modular y Diseño Táctil',
    imageMeta: {
      name: 'panel-resonancia-zuzo.svg',
      width: 960,
      height: 600,
      dominantRgb: { r: 24, g: 118, b: 110 },
      secondaryRgb: { r: 217, g: 119, b: 54 },
      averageLuminance: 0.24,
      contrastScore: 0.78,
      aspectRatioLabel: 'panoramica',
      pixelSignature: 'zuzo-svg-7f4a2c91',
      dataUrl:
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 600" width="960" height="600">' +
            '<defs>' +
            '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#0d2329"/>' +
            '<stop offset="55%" stop-color="#18766e"/>' +
            '<stop offset="100%" stop-color="#102a32"/>' +
            '</linearGradient>' +
            '</defs>' +
            '<rect width="960" height="600" fill="url(#bg)"/>' +
            '<g stroke="#f3e8d8" stroke-opacity="0.18" stroke-width="2" fill="none">' +
            '<circle cx="480" cy="300" r="220"/>' +
            '<circle cx="480" cy="300" r="160"/>' +
            '<circle cx="480" cy="300" r="100"/>' +
            '<line x1="120" y1="300" x2="840" y2="300"/>' +
            '<line x1="480" y1="60" x2="480" y2="540"/>' +
            '</g>' +
            '<g fill="#d97736" fill-opacity="0.88">' +
            '<rect x="190" y="170" width="120" height="260" rx="14"/>' +
            '<rect x="340" y="130" width="120" height="340" rx="14" fill="#e9a952"/>' +
            '<rect x="490" y="190" width="120" height="220" rx="14" fill="#2cb1a1"/>' +
            '<rect x="640" y="150" width="120" height="300" rx="14" fill="#f4efe6"/>' +
            '</g>' +
            '<text x="72" y="542" fill="#f4efe6" font-family="monospace" font-size="20" letter-spacing="3">' +
            'ZUZO LAB // ESPECTRO DE ABSORCION DETERMINISTICO' +
            '</text>' +
            '</svg>'
        )
    },
    referenceText: [
      'Atelier Zuzo: Sistema de Paneles Acústicos de Geometría Celular',
      'Arquitectura fonoabsorbente modular fabricada en corcho prensado y madera técnica para estudios de grabación, salas de enfoque y laboratorios de hardware.',
      '- Reducción de reverberación de banda media con coeficiente NRC de 0.85 verificado en cámara.',
      '- Ensamblaje mecánico en seco mediante anclajes magnéticos sin adhesivos químicos ni residuos.',
      '- Geometría paramétrica calibrada por ranuras de Helmholtz para frecuencias entre 250 Hz y 3200 Hz.',
      '- Trazabilidad completa de materiales locales con 94% de fibra renovable y mantenimiento modular.',
      'Métrica: 0.85 NRC absorción acústica',
      'Métrica: 14 min montaje por módulo',
      'Métrica: 94% fibra natural prensada',
      'Métrica: 12 años garantía estructural',
      'CTA: Configurar matriz acústica'
    ].join('\n'),
    preferences: {
      layout: 'product-launch',
      paletteMode: 'auto-image',
      typography: 'sans-geometric',
      density: 'balanced',
      interactiveModule: 'estimator',
      variantIndex: 1
    }
  });

  /**
   * Analiza el texto de referencia de manera 100% determinística mediante reglas léxicas.
   * @param {string} rawText
   * @param {number} seed
   */
  function parseReferenceText(rawText, seed) {
    const clean = String(rawText || '').replace(/\r\n/g, '\n').trim();
    const lines = clean
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const rng = createSeededRng(seed);

    let title = 'Sistema Modular de Prototipado Determinístico';
    let subtitle =
      'Arquitectura funcional sintetizada localmente a partir de señales visuales, estructura textual y parámetros geométricos reproducibles.';
    const bullets = [];
    const metrics = [];
    let ctaText = 'Explorar especificación técnica';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/^(cta|acci[oó]n|bot[oó]n)\s*:/i.test(line)) {
        const val = line.replace(/^(cta|acci[oó]n|bot[oó]n)\s*:/i, '').trim();
        if (val) ctaText = val.slice(0, 64);
        continue;
      }

      if (/^(m[eé]trica|kpi|dato)\s*:/i.test(line)) {
        const rawMetric = line.replace(/^(m[eé]trica|kpi|dato)\s*:/i, '').trim();
        const match = rawMetric.match(/^([0-9.,+%a-zA-Z/-]+)\s+(.+)$/);
        if (match) {
          metrics.push({
            value: match[1].trim(),
            label: match[2].trim()
          });
        } else if (rawMetric) {
          metrics.push({
            value: `#${metrics.length + 1}`,
            label: rawMetric
          });
        }
        continue;
      }

      if (/^[-*•▸]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
        const item = line.replace(/^([-*•▸]|\d+[.)])\s+/, '').trim();
        if (item) bullets.push(item);
        continue;
      }

      if (i === 0) {
        title = line.replace(/^#+\s*/, '').slice(0, 96);
      } else if (subtitle === 'Arquitectura funcional sintetizada localmente a partir de señales visuales, estructura textual y parámetros geométricos reproducibles.' && line.length > 20) {
        subtitle = line.slice(0, 240);
      } else {
        bullets.push(line);
      }
    }

    // Si no se especificaron viñetas explícitas pero hay texto largo, segmentar por frases
    if (bullets.length === 0 && clean.length > 0) {
      const sentences = clean
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 12);
      for (let i = 1; i < Math.min(sentences.length, 5); i++) {
        bullets.push(sentences[i]);
      }
    }

    const fallbackBullets = [
      'Estructura modular generada por reglas determinísticas verificables sin modelos de IA.',
      'Diseño adaptable móvil y escritorio con retícula proporcional y tipografía de sistema.',
      'Componentes interactivos autónomos ejecutados en aislamiento estricto sin red externa.',
      'Trazabilidad completa mediante huella FNV-1a de 32 bits reproducible en cualquier sesión.'
    ];

    while (bullets.length < 4) {
      bullets.push(fallbackBullets[bullets.length % fallbackBullets.length]);
    }

    // Detectar cifras dentro de las viñetas si faltan métricas
    if (metrics.length < 4) {
      for (const b of bullets) {
        if (metrics.length >= 4) break;
        const numMatch = b.match(/(\d+(?:[.,]\d+)?\s*(?:%|ms|Hz|NRC|px|min|h|x|dB|años|m²)?)/i);
        if (numMatch) {
          const val = numMatch[1].trim();
          const label = b
            .replace(numMatch[0], '')
            .replace(/^[,.;:\s-]+/, '')
            .trim()
            .slice(0, 48);
          if (label.length > 4) {
            metrics.push({ value: val, label });
          }
        }
      }
    }

    const fallbackMetrics = [
      { value: `${Math.round(88 + rng() * 11)}%`, label: 'Eficiencia estructural medida' },
      { value: `${Math.round(8 + rng() * 16)} ms`, label: 'Tiempo de respuesta determinístico' },
      { value: '0 KB', label: 'Dependencias externas de red' },
      { value: `v${1 + Math.floor(rng() * 4)}.${Math.floor(rng() * 9)}`, label: 'Revisión de esquema modular' }
    ];

    while (metrics.length < 4) {
      metrics.push(fallbackMetrics[metrics.length]);
    }

    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;

    return {
      title,
      subtitle,
      bullets: bullets.slice(0, 6),
      metrics: metrics.slice(0, 4),
      ctaText,
      wordCount: words,
      charCount: clean.length
    };
  }

  /**
   * Construye el sistema de color determinístico según modo de paleta, imagen y semilla.
   */
  function resolvePalette(paletteMode, imageMeta, seed) {
    const mode = paletteMode || 'auto-image';
    const rng = createSeededRng(seed);

    if (mode === 'obsidian-craft') {
      return {
        name: 'Obsidiana & Ámbar Técnico',
        isDark: true,
        bgPrimary: '#0c1015',
        bgSurface: '#151c24',
        bgElevated: '#1d2733',
        textPrimary: '#f3f5f8',
        textSecondary: '#a7b4c6',
        accentPrimary: '#f08c2b',
        accentSecondary: '#38bdf8',
        borderSubtle: 'rgba(243, 245, 248, 0.14)',
        badgeBg: 'rgba(240, 140, 43, 0.16)',
        badgeText: '#ffb366'
      };
    }

    if (mode === 'paper-blueprint') {
      return {
        name: 'Papel Algodón & Cobalto',
        isDark: false,
        bgPrimary: '#f6f3ec',
        bgSurface: '#ffffff',
        bgElevated: '#ebe5d8',
        textPrimary: '#141923',
        textSecondary: '#465266',
        accentPrimary: '#1d4ed8',
        accentSecondary: '#c2410c',
        borderSubtle: 'rgba(20, 25, 35, 0.14)',
        badgeBg: 'rgba(29, 78, 216, 0.11)',
        badgeText: '#1e40af'
      };
    }

    if (mode === 'mineral-sage') {
      return {
        name: 'Salvia Mineral & Terracota',
        isDark: false,
        bgPrimary: '#eef2ee',
        bgSurface: '#f9fbf9',
        bgElevated: '#dfe7df',
        textPrimary: '#16241d',
        textSecondary: '#43584d',
        accentPrimary: '#1f6f5c',
        accentSecondary: '#bf5af2',
        borderSubtle: 'rgba(22, 36, 29, 0.14)',
        badgeBg: 'rgba(31, 111, 92, 0.13)',
        badgeText: '#155243'
      };
    }

    if (mode === 'high-contrast') {
      return {
        name: 'Monocromo Accesible AAA',
        isDark: true,
        bgPrimary: '#050505',
        bgSurface: '#111111',
        bgElevated: '#1e1e1e',
        textPrimary: '#ffffff',
        textSecondary: '#dcdcdc',
        accentPrimary: '#ffdd00',
        accentSecondary: '#00e5ff',
        borderSubtle: 'rgba(255, 255, 255, 0.36)',
        badgeBg: 'rgba(255, 221, 0, 0.2)',
        badgeText: '#ffea55'
      };
    }

    // Modo 'auto-image': extrae de la imagen local si existe, o deriva de la semilla
    if (imageMeta && imageMeta.dominantRgb) {
      const dom = rgbToHsl(
        imageMeta.dominantRgb.r,
        imageMeta.dominantRgb.g,
        imageMeta.dominantRgb.b
      );
      const sec = imageMeta.secondaryRgb
        ? rgbToHsl(
            imageMeta.secondaryRgb.r,
            imageMeta.secondaryRgb.g,
            imageMeta.secondaryRgb.b
          )
        : { h: (dom.h + 145) % 360, s: Math.max(55, dom.s), l: 55 };

      const isDark =
        typeof imageMeta.averageLuminance === 'number'
          ? imageMeta.averageLuminance < 0.48
          : dom.l < 50;

      const accentS = Math.max(58, Math.min(88, dom.s));
      const accentL = isDark ? Math.max(54, Math.min(68, dom.l + 18)) : Math.max(30, Math.min(44, dom.l));
      const secS = Math.max(55, Math.min(85, sec.s));
      const secL = isDark ? 64 : 38;

      return {
        name: `Cromática Extraída (${imageMeta.name || 'Imagen Local'})`,
        isDark,
        bgPrimary: isDark ? hslCss(dom.h, 24, 9) : hslCss(dom.h, 22, 95),
        bgSurface: isDark ? hslCss(dom.h, 22, 14) : '#ffffff',
        bgElevated: isDark ? hslCss(dom.h, 20, 19) : hslCss(dom.h, 18, 89),
        textPrimary: isDark ? hslCss(dom.h, 15, 95) : hslCss(dom.h, 28, 12),
        textSecondary: isDark ? hslCss(dom.h, 12, 74) : hslCss(dom.h, 16, 34),
        accentPrimary: hslCss(dom.h, accentS, accentL),
        accentSecondary: hslCss(sec.h, secS, secL),
        borderSubtle: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.14)',
        badgeBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
        badgeText: hslCss(dom.h, accentS, isDark ? 72 : 28)
      };
    }

    // Derivación determinística por semilla cuando no hay imagen
    const baseHue = Math.floor(rng() * 360);
    const compHue = (baseHue + 150) % 360;
    const isDark = rng() > 0.45;

    return {
      name: `Síntesis Algorítmica #${baseHue}°`,
      isDark,
      bgPrimary: isDark ? hslCss(baseHue, 24, 9) : hslCss(baseHue, 20, 96),
      bgSurface: isDark ? hslCss(baseHue, 22, 14) : '#ffffff',
      bgElevated: isDark ? hslCss(baseHue, 20, 20) : hslCss(baseHue, 16, 90),
      textPrimary: isDark ? '#f4f6f9' : '#121824',
      textSecondary: isDark ? '#a6b3c4' : '#475569',
      accentPrimary: hslCss(baseHue, 74, isDark ? 58 : 38),
      accentSecondary: hslCss(compHue, 70, isDark ? 62 : 42),
      borderSubtle: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.14)',
      badgeBg: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(15, 23, 42, 0.07)',
      badgeText: hslCss(baseHue, 78, isDark ? 72 : 30)
    };
  }

  /**
   * Resuelve la pila tipográfica sin depender de fuentes externas en red.
   */
  function resolveTypography(typographyMode) {
    switch (typographyMode) {
      case 'serif-editorial':
        return {
          label: 'Editorial Serif de Sistema',
          fontHeading: "Georgia, 'Times New Roman', Times, serif",
          fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          fontMono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace"
        };
      case 'mono-technical':
        return {
          label: 'Monoespaciada de Ingeniería',
          fontHeading: "ui-monospace, 'Cascadia Code', 'Fira Mono', monospace",
          fontBody: "ui-monospace, 'Cascadia Code', 'Fira Mono', monospace",
          fontMono: "ui-monospace, 'Cascadia Code', 'Fira Mono', monospace"
        };
      default:
        return {
          label: 'Geométrica Neo-Grotesque Local',
          fontHeading: "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, sans-serif",
          fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, sans-serif",
          fontMono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace"
        };
    }
  }

  /**
   * Resuelve las escalas espaciales según la preferencia de densidad.
   */
  function resolveDensity(densityMode) {
    switch (densityMode) {
      case 'compact':
        return {
          label: 'Compacta (Alta Densidad)',
          sectionPad: '2.25rem 1.25rem',
          gridGap: '0.85rem',
          cardPad: '1.05rem',
          radius: '8px'
        };
      case 'spacious':
        return {
          label: 'Aireada (Modo Galería)',
          sectionPad: '4.5rem 2rem',
          gridGap: '1.75rem',
          cardPad: '1.85rem',
          radius: '16px'
        };
      default:
        return {
          label: 'Equilibrada (Estándar)',
          sectionPad: '3.25rem 1.5rem',
          gridGap: '1.25rem',
          cardPad: '1.4rem',
          radius: '12px'
        };
    }
  }

  /**
   * Genera un gráfico SVG geométrico determinístico original (sin logos copiados).
   */
  function buildProceduralSvgArtwork(seed, palette, imageMeta) {
    const rng = createSeededRng(seed ^ 0x9e3779b9);
    const bars = [];
    const barCount = 6;
    for (let i = 0; i < barCount; i++) {
      const h = Math.round(70 + rng() * 150);
      const y = 260 - h;
      const x = 60 + i * 62;
      const fill = i % 2 === 0 ? palette.accentPrimary : palette.accentSecondary;
      bars.push(
        `<rect x="${x}" y="${y}" width="42" height="${h}" rx="7" fill="${fill}" fill-opacity="${(0.65 + rng() * 0.3).toFixed(2)}" />`
      );
    }

    const cx = Math.round(180 + rng() * 120);
    const cy = Math.round(110 + rng() * 60);
    const r = Math.round(38 + rng() * 35);

    const aspectTag = imageMeta && imageMeta.aspectRatioLabel
      ? imageMeta.aspectRatioLabel.toUpperCase()
      : 'GEOMETRIA-PURA';

    return `
      <svg viewBox="0 0 480 300" width="100%" height="100%" role="img" aria-label="Diagrama algorítmico determinístico NO IA">
        <rect width="480" height="300" rx="12" fill="${palette.bgElevated}" />
        <g stroke="${palette.borderSubtle}" stroke-width="1">
          <line x1="0" y1="60" x2="480" y2="60" />
          <line x1="0" y1="120" x2="480" y2="120" />
          <line x1="0" y1="180" x2="480" y2="180" />
          <line x1="0" y1="240" x2="480" y2="240" />
          <line x1="120" y1="0" x2="120" y2="300" />
          <line x1="240" y1="0" x2="240" y2="300" />
          <line x1="360" y1="0" x2="360" y2="300" />
        </g>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.accentSecondary}" stroke-width="2.5" stroke-dasharray="6 4" />
        ${bars.join('\n        ')}
        <text x="24" y="34" fill="${palette.textSecondary}" font-family="monospace" font-size="11" letter-spacing="1.5">
          SEED // 0x${seed.toString(16).toUpperCase().padStart(8, '0')} · ${escapeHtml(aspectTag)}
        </text>
      </svg>
    `.trim();
  }

  /**
   * Construye el módulo interactivo funcional en HTML + JS vanilla para el prototipo.
   */
  function buildInteractiveSection(interactiveModule, parsedText, seed) {
    const rng = createSeededRng(seed ^ 0x517cc1b7);
    const baseFactor = Math.round(12 + rng() * 28);

    if (interactiveModule === 'tabs-matrix') {
      return `
      <section class="proto-interactive" aria-labelledby="interactive-heading">
        <div class="section-header">
          <span class="eyebrow">MÓDULO FUNCIONAL DETERMINÍSTICO · MATRIZ DE ESPECIFICACIONES</span>
          <h2 id="interactive-heading">Inspección Interactiva de Capas del Prototipo</h2>
        </div>
        <div class="tabs-bar" role="tablist" aria-label="Capas de especificación">
          <button type="button" class="tab-btn active" role="tab" aria-selected="true" data-tab="arq">1. Arquitectura</button>
          <button type="button" class="tab-btn" role="tab" aria-selected="false" data-tab="mat">2. Parámetros</button>
          <button type="button" class="tab-btn" role="tab" aria-selected="false" data-tab="ver">3. Verificación NO IA</button>
        </div>
        <div class="tab-panel active" id="panel-arq" role="tabpanel">
          <h3>Síntesis de Estructura Principal</h3>
          <p>${escapeHtml(parsedText.bullets[0])}</p>
          <p class="mono-note">Índice estructural derivado: #${(seed % 997) + 100} · Factor geométrico ${baseFactor}x</p>
        </div>
        <div class="tab-panel" id="panel-mat" role="tabpanel" hidden>
          <h3>Vector de Restricciones Técnicas</h3>
          <p>${escapeHtml(parsedText.bullets[1])}</p>
          <p class="mono-note">Tolerancia calculada: ±${(1.1 + rng() * 2.4).toFixed(2)}% bajo carga nominal</p>
        </div>
        <div class="tab-panel" id="panel-ver" role="tabpanel" hidden>
          <h3>Certificación de Ejecución Limpia</h3>
          <p>${escapeHtml(parsedText.bullets[2])}</p>
          <p class="mono-note">Estado: 100% Determinístico · Sin red externa · Sin persistencia</p>
        </div>
      </section>`;
    }

    if (interactiveModule === 'faq-checklist') {
      return `
      <section class="proto-interactive" aria-labelledby="interactive-heading">
        <div class="section-header">
          <span class="eyebrow">MÓDULO FUNCIONAL DETERMINÍSTICO · AUDITORÍA DE CRITERIOS</span>
          <h2 id="interactive-heading">Lista de Control y Validación Operativa</h2>
        </div>
        <div class="checklist-box">
          <p class="checklist-status" id="checklist-counter" aria-live="polite">Progreso de validación: 1 / 3 criterios verificados</p>
          <label class="check-item">
            <input type="checkbox" class="proto-check" checked />
            <span>${escapeHtml(parsedText.bullets[0])}</span>
          </label>
          <label class="check-item">
            <input type="checkbox" class="proto-check" />
            <span>${escapeHtml(parsedText.bullets[1])}</span>
          </label>
          <label class="check-item">
            <input type="checkbox" class="proto-check" />
            <span>${escapeHtml(parsedText.bullets[2])}</span>
          </label>
        </div>
      </section>`;
    }

    // Por defecto: 'estimator' (Simulador / Calculadora en vivo)
    return `
      <section class="proto-interactive" aria-labelledby="interactive-heading">
        <div class="section-header">
          <span class="eyebrow">MÓDULO FUNCIONAL DETERMINÍSTICO · SIMULADOR PARAMÉTRICO</span>
          <h2 id="interactive-heading">Calculadora de Escala y Rendimiento Operativo</h2>
        </div>
        <div class="estimator-grid">
          <div class="estimator-controls">
            <label for="proto-units">Unidades / Módulos activos: <strong id="proto-units-val">6</strong></label>
            <input type="range" id="proto-units" min="1" max="24" value="6" />
            <label for="proto-mode">Perfil de calibración:</label>
            <select id="proto-mode">
              <option value="1">Estándar (Factor 1.0x)</option>
              <option value="1.35">Alta Densidad (Factor 1.35x)</option>
              <option value="1.75">Grado Laboratorio (Factor 1.75x)</option>
            </select>
          </div>
          <div class="estimator-output" aria-live="polite">
            <div class="est-metric">
              <span class="est-label">Índice de Capacidad Estimada</span>
              <strong class="est-number" id="proto-score">${6 * baseFactor} pts</strong>
            </div>
            <div class="est-metric">
              <span class="est-label">Cobertura Modular</span>
              <strong class="est-number" id="proto-area">${(6 * 2.4).toFixed(1)} m²</strong>
            </div>
          </div>
        </div>
      </section>`;
  }

  /**
   * Genera la variante original completa (HTML autónomo + metadatos de auditoría).
   * @param {object} input
   * @returns {object} Resultado con `html`, `seed`, `seedHex`, `fingerprint`, `palette`, `parsedText`, `layout`, etc.
   */
  function generateVariant(input = {}) {
    const rawText = String(input.referenceText || '').trim();
    const imageMeta = input.imageMeta || null;
    const prefs = Object.assign(
      {
        layout: 'product-launch',
        paletteMode: 'auto-image',
        typography: 'sans-geometric',
        density: 'balanced',
        interactiveModule: 'estimator',
        variantIndex: 1
      },
      input.preferences || {}
    );

    const variantIndex = Math.max(1, Math.min(99, Number(prefs.variantIndex) || 1));

    // Construcción de la cadena canónica para el hash determinístico FNV-1a
    const canonicalSignature = JSON.stringify({
      text: rawText,
      image: imageMeta
        ? {
            name: imageMeta.name || '',
            w: imageMeta.width || 0,
            h: imageMeta.height || 0,
            dom: imageMeta.dominantRgb || null,
            sec: imageMeta.secondaryRgb || null,
            lum: typeof imageMeta.averageLuminance === 'number'
              ? Number(imageMeta.averageLuminance.toFixed(3))
              : null,
            sig: imageMeta.pixelSignature || ''
          }
        : null,
      prefs: {
        layout: prefs.layout,
        paletteMode: prefs.paletteMode,
        typography: prefs.typography,
        density: prefs.density,
        interactiveModule: prefs.interactiveModule,
        variantIndex
      }
    });

    const seed = fnv1a32(canonicalSignature);
    const seedHex = seed.toString(16).toUpperCase().padStart(8, '0');
    const fingerprint = `ZUZ-NOIA-${seedHex}-V${variantIndex}`;

    const parsedText = parseReferenceText(rawText, seed);
    const palette = resolvePalette(prefs.paletteMode, imageMeta, seed);
    const typography = resolveTypography(prefs.typography);
    const density = resolveDensity(prefs.density);

    const rng = createSeededRng(seed);
    const baseFactor = Math.round(12 + rng() * 28);

    // Determinar visual principal (imagen local cargada o arte SVG determinístico)
    let visualBlockHtml = '';
    if (imageMeta && imageMeta.dataUrl && /^data:image\//i.test(imageMeta.dataUrl)) {
      visualBlockHtml = `
        <figure class="visual-frame">
          <img src="${escapeHtml(imageMeta.dataUrl)}" alt="Referencia visual cargada localmente: ${escapeHtml(imageMeta.name || 'imagen')}" class="visual-img" />
          <figcaption class="visual-caption">
            <span>Fuente local: ${escapeHtml(imageMeta.name || 'imagen')} (${Number(imageMeta.width) || 0}×${Number(imageMeta.height) || 0}px)</span>
            <span>Huella: ${escapeHtml(imageMeta.pixelSignature || seedHex)}</span>
          </figcaption>
        </figure>`;
    } else {
      visualBlockHtml = `
        <div class="visual-frame">
          ${buildProceduralSvgArtwork(seed, palette, imageMeta)}
          <div class="visual-caption">
            <span>Geometría sintética local (Sin imagen adjunta)</span>
            <span>Semilla: 0x${seedHex}</span>
          </div>
        </div>`;
    }

    const interactiveHtml = buildInteractiveSection(
      prefs.interactiveModule,
      parsedText,
      seed
    );

    const layoutClass = `layout-${escapeHtml(prefs.layout)}`;

    const metricsCardsHtml = parsedText.metrics
      .map(
        (m, idx) => `
          <article class="metric-card" data-index="${idx + 1}">
            <span class="metric-value">${escapeHtml(m.value)}</span>
            <span class="metric-label">${escapeHtml(m.label)}</span>
          </article>`
      )
      .join('');

    const featuresCardsHtml = parsedText.bullets
      .map(
        (b, idx) => `
          <article class="feature-card">
            <div class="feature-index">0${idx + 1}</div>
            <p class="feature-text">${escapeHtml(b)}</p>
          </article>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="generator" content="Craft Lab Zuzo - Motor Determinístico NO IA (${fingerprint})" />
  <title>${escapeHtml(parsedText.title)} · Prototipo NO IA</title>
  <style>
    :root {
      --bg-primary: ${palette.bgPrimary};
      --bg-surface: ${palette.bgSurface};
      --bg-elevated: ${palette.bgElevated};
      --text-primary: ${palette.textPrimary};
      --text-secondary: ${palette.textSecondary};
      --accent-primary: ${palette.accentPrimary};
      --accent-secondary: ${palette.accentSecondary};
      --border-subtle: ${palette.borderSubtle};
      --badge-bg: ${palette.badgeBg};
      --badge-text: ${palette.badgeText};
      --font-heading: ${typography.fontHeading};
      --font-body: ${typography.fontBody};
      --font-mono: ${typography.fontMono};
      --section-pad: ${density.sectionPad};
      --grid-gap: ${density.gridGap};
      --card-pad: ${density.cardPad};
      --radius: ${density.radius};
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-body);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    body.alt-surface {
      --bg-primary: ${palette.bgSurface};
      --bg-surface: ${palette.bgElevated};
    }

    .proto-shell {
      max-width: 1120px;
      margin: 0 auto;
      padding: var(--section-pad);
    }

    .proto-topbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding-bottom: 1.25rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .proto-brand {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .proto-emblem {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      display: inline-block;
    }

    .proto-badges {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    .no-ia-pill {
      background: var(--badge-bg);
      color: var(--badge-text);
      border: 1px solid var(--border-subtle);
      padding: 0.28rem 0.65rem;
      border-radius: 999px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
    }

    .surface-toggle {
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      padding: 0.32rem 0.75rem;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      cursor: pointer;
    }

    .surface-toggle:hover {
      border-color: var(--accent-primary);
    }

    .hero-section {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: calc(var(--grid-gap) * 1.5);
      align-items: center;
      margin-bottom: 2.5rem;
    }

    .layout-editorial-studio .hero-section {
      grid-template-columns: 1fr;
    }

    .layout-technical-dashboard .hero-section {
      grid-template-columns: 0.9fr 1.1fr;
    }

    .layout-minimal-manifesto .hero-section {
      grid-template-columns: 1fr;
      text-align: left;
    }

    .eyebrow {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-primary);
      margin-bottom: 0.6rem;
      font-weight: 700;
    }

    .hero-title {
      font-family: var(--font-heading);
      font-size: clamp(1.75rem, 3.5vw, 2.75rem);
      line-height: 1.15;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
    }

    .hero-subtitle {
      color: var(--text-secondary);
      font-size: 1.05rem;
      margin-bottom: 1.5rem;
      max-width: 62ch;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.85rem;
    }

    .cta-primary {
      background: var(--accent-primary);
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.35rem;
      border-radius: var(--radius);
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }

    .cta-primary:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .cta-feedback {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--accent-secondary);
    }

    .visual-frame {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      padding: 0.75rem;
      overflow: hidden;
    }

    .visual-img {
      width: 100%;
      max-height: 320px;
      object-fit: cover;
      border-radius: calc(var(--radius) - 4px);
      display: block;
    }

    .visual-caption {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.6rem;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-secondary);
    }

    .metrics-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--grid-gap);
      margin-bottom: 2.5rem;
    }

    .metric-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-left: 4px solid var(--accent-primary);
      border-radius: var(--radius);
      padding: var(--card-pad);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .metric-value {
      font-family: var(--font-heading);
      font-size: 1.65rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .metric-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .features-section {
      margin-bottom: 2.5rem;
    }

    .section-header {
      margin-bottom: 1.25rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--grid-gap);
    }

    .feature-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      padding: var(--card-pad);
    }

    .feature-index {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--accent-secondary);
      margin-bottom: 0.45rem;
    }

    .proto-interactive {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      padding: calc(var(--card-pad) * 1.25);
      margin-bottom: 2.5rem;
    }

    .estimator-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: var(--grid-gap);
      align-items: center;
    }

    .estimator-controls {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .estimator-controls input[type="range"],
    .estimator-controls select {
      width: 100%;
      padding: 0.5rem;
      background: var(--bg-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
    }

    .estimator-output {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .est-metric {
      background: var(--bg-elevated);
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
    }

    .est-label {
      display: block;
      font-size: 0.78rem;
      color: var(--text-secondary);
      margin-bottom: 0.35rem;
    }

    .est-number {
      font-family: var(--font-mono);
      font-size: 1.35rem;
      color: var(--accent-primary);
    }

    .tabs-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .tab-btn {
      background: var(--bg-elevated);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      padding: 0.5rem 0.95rem;
      border-radius: 6px;
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 0.82rem;
    }

    .tab-btn.active {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }

    .tab-panel {
      background: var(--bg-elevated);
      padding: 1.15rem;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
    }

    .mono-note {
      margin-top: 0.65rem;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--accent-secondary);
    }

    .checklist-box {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .checklist-status {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: var(--accent-primary);
      margin-bottom: 0.35rem;
    }

    .check-item {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      background: var(--bg-elevated);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      cursor: pointer;
    }

    .proto-footer {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.25rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.75rem;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .hero-section,
      .estimator-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body class="${layoutClass}">
  <div class="proto-shell">
    <header class="proto-topbar">
      <div class="proto-brand">
        <span class="proto-emblem" aria-hidden="true"></span>
        <span>CRAFT LAB ZUZO // PROTOTIPO FUNCIONAL</span>
      </div>
      <div class="proto-badges">
        <span class="no-ia-pill">NO IA · DETERMINÍSTICO</span>
        <span class="no-ia-pill">${escapeHtml(fingerprint)}</span>
        <button type="button" class="surface-toggle" id="surface-toggle-btn">Alternar Contraste</button>
      </div>
    </header>

    <main>
      <section class="hero-section">
        <div class="hero-copy">
          <span class="eyebrow">ARQUETIPO: ${escapeHtml(prefs.layout.toUpperCase())} · VARIANTE #${variantIndex}</span>
          <h1 class="hero-title">${escapeHtml(parsedText.title)}</h1>
          <p class="hero-subtitle">${escapeHtml(parsedText.subtitle)}</p>
          <div class="hero-actions">
            <button type="button" class="cta-primary" id="proto-cta-btn">${escapeHtml(parsedText.ctaText)}</button>
            <span class="cta-feedback" id="proto-cta-feedback" aria-live="polite"></span>
          </div>
        </div>
        <div class="hero-visual">
          ${visualBlockHtml}
        </div>
      </section>

      <section class="metrics-strip" aria-label="Métricas determinísticas">
        ${metricsCardsHtml}
      </section>

      <section class="features-section" aria-labelledby="features-heading">
        <div class="section-header">
          <span class="eyebrow">ESTRUCTURA DE CONTENIDO EXTRAÍDA</span>
          <h2 id="features-heading">Componentes y Especificaciones Clave</h2>
        </div>
        <div class="features-grid">
          ${featuresCardsHtml}
        </div>
      </section>

      ${interactiveHtml}
    </main>

    <footer class="proto-footer">
      <span>Generado algorítmicamente (NO IA) · Sin red externa · Sin persistencia</span>
      <span>Paleta: ${escapeHtml(palette.name)} · Huella: ${escapeHtml(fingerprint)}</span>
    </footer>
  </div>

  <script>
    (function () {
      var surfaceBtn = document.getElementById('surface-toggle-btn');
      if (surfaceBtn) {
        surfaceBtn.addEventListener('click', function () {
          document.body.classList.toggle('alt-surface');
        });
      }

      var ctaBtn = document.getElementById('proto-cta-btn');
      var ctaFeedback = document.getElementById('proto-cta-feedback');
      var clicks = 0;
      if (ctaBtn && ctaFeedback) {
        ctaBtn.addEventListener('click', function () {
          clicks += 1;
          ctaFeedback.textContent = 'Acción verificada en sandbox (Pulso #' + clicks + ' · Semilla 0x${seedHex})';
        });
      }

      var unitsInput = document.getElementById('proto-units');
      var modeSelect = document.getElementById('proto-mode');
      var unitsVal = document.getElementById('proto-units-val');
      var scoreEl = document.getElementById('proto-score');
      var areaEl = document.getElementById('proto-area');
      if (unitsInput && modeSelect && unitsVal && scoreEl && areaEl) {
        var updateEstimator = function () {
          var u = Number(unitsInput.value) || 1;
          var m = Number(modeSelect.value) || 1;
          unitsVal.textContent = String(u);
          scoreEl.textContent = Math.round(u * ${baseFactor} * m) + ' pts';
          areaEl.textContent = (u * 2.4 * m).toFixed(1) + ' m²';
        };
        unitsInput.addEventListener('input', updateEstimator);
        modeSelect.addEventListener('change', updateEstimator);
      }

      var tabBtns = document.querySelectorAll('.tab-btn');
      if (tabBtns.length > 0) {
        tabBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var target = btn.getAttribute('data-tab');
            tabBtns.forEach(function (b) {
              var active = b === btn;
              b.classList.toggle('active', active);
              b.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            ['arq', 'mat', 'ver'].forEach(function (id) {
              var panel = document.getElementById('panel-' + id);
              if (panel) {
                if (id === target) {
                  panel.classList.add('active');
                  panel.removeAttribute('hidden');
                } else {
                  panel.classList.remove('active');
                  panel.setAttribute('hidden', 'hidden');
                }
              }
            });
          });
        });
      }

      var checks = document.querySelectorAll('.proto-check');
      var counter = document.getElementById('checklist-counter');
      if (checks.length > 0 && counter) {
        var updateChecks = function () {
          var done = 0;
          checks.forEach(function (c) {
            if (c.checked) done += 1;
          });
          counter.textContent = 'Progreso de validación: ' + done + ' / ' + checks.length + ' criterios verificados';
        };
        checks.forEach(function (c) {
          c.addEventListener('change', updateChecks);
        });
      }
    })();
  </script>
</body>
</html>`;

    return {
      html,
      seed,
      seedHex,
      fingerprint,
      variantIndex,
      palette,
      typography,
      density,
      parsedText,
      preferences: prefs
    };
  }

  return {
    fnv1a32,
    createSeededRng,
    escapeHtml,
    rgbToHsl,
    parseReferenceText,
    resolvePalette,
    resolveTypography,
    resolveDensity,
    generateVariant,
    BUILT_IN_EXAMPLE
  };
});
