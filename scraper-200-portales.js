/**
 * SCRAPER MASIVO OSINT - 200+ PORTALES
 * Consultora Diagonales
 * Cronograma: JUEVES 18:00 - VIERNES 19:00 (25 horas)
 * Concurrencia: 15 peticiones simultáneas
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const pLimit = require('p-limit').default;
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// ==================== CONFIGURACIÓN ====================

const CONFIG = {
  timezone: 'America/Argentina/Buenos_Aires',
  candidatos: process.env.CANDIDATOS?.split(',') || [
    'katopodis', 'jualak', 'jgarro', 'pichetto', 
    'santilli', 'kicillof', 'kassar', 'lussich'
  ],
  maxConcurrencia: 15,
  timeout: 8000,
  retryAttempts: 3,
  retryDelay: 2000,
  outputDir: './data/scraped',
  logDir: './data/logs',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// ==================== PORTALES OSINT ====================

const PORTALES = {
  // TIER 1: FUENTES OFICIALES (15)
  oficiales: [
    { nombre: 'Boletín Oficial', url: 'https://www.boletinoficial.gob.ar/', tipo: 'html' },
    { nombre: 'Datos JUS', url: 'https://datos.jus.gob.ar/datos-abiertos', tipo: 'html' },
    { nombre: 'HCDN', url: 'https://www.hcdn.gob.ar/', tipo: 'html' },
    { nombre: 'Senado', url: 'https://www.senado.gob.ar/', tipo: 'html' },
    { nombre: 'PJN', url: 'https://www.pjn.gov.ar/', tipo: 'html' },
    { nombre: 'AFIP', url: 'https://www.afip.gob.ar/', tipo: 'html' },
    { nombre: 'BCRA', url: 'https://www.bcra.gob.ar/', tipo: 'html' },
    { nombre: 'Transparencia', url: 'https://transparencia.gob.ar/', tipo: 'html' },
    { nombre: 'Argentina.gob', url: 'https://www.argentina.gob.ar/', tipo: 'html' },
    { nombre: 'Contratar.gob', url: 'https://contratar.gob.ar/', tipo: 'html' },
    { nombre: 'Resultados.gob', url: 'https://resultados.gob.ar/', tipo: 'html' },
    { nombre: 'Boletín PBA', url: 'https://boletinoficial.buenosaires.gob.ar/', tipo: 'html' },
    { nombre: 'GBA.gob', url: 'https://www.gba.gob.ar/', tipo: 'html' },
    { nombre: 'IGJ', url: 'https://www.igj.gob.ar/', tipo: 'html' },
    { nombre: 'Registro Automotor', url: 'https://www.dnrpa.gob.ar/', tipo: 'html' }
  ],

  // TIER 2: POLÍTICA ONLINE (4)
  politica: [
    { nombre: 'La Política Online', url: 'https://www.lapoliticaonline.com/', tipo: 'rss' },
    { nombre: 'Política Argentina', url: 'https://www.politicargentina.com/', tipo: 'html' },
    { nombre: 'Real Politik', url: 'https://realpolitik.com.ar/', tipo: 'html' },
    { nombre: 'La Rosca Digital', url: 'https://laroscadigital.com.ar/', tipo: 'html' }
  ],

  // TIER 3: GRANDES MEDIOS (12)
  grandesMedias: [
    { nombre: 'La Nación', url: 'https://www.lanacion.com.ar/', tipo: 'rss' },
    { nombre: 'Clarín', url: 'https://www.clarin.com/', tipo: 'rss' },
    { nombre: 'Infobae', url: 'https://www.infobae.com/', tipo: 'rss' },
    { nombre: 'Perfil', url: 'https://www.perfil.com/', tipo: 'rss' },
    { nombre: 'Página 12', url: 'https://www.pagina12.com.ar/', tipo: 'rss' },
    { nombre: 'Cronista', url: 'https://www.cronista.com/', tipo: 'rss' },
    { nombre: 'TN', url: 'https://tn.com.ar/', tipo: 'rss' },
    { nombre: 'Ámbito', url: 'https://www.ambito.com/', tipo: 'rss' },
    { nombre: 'CNN Español', url: 'https://cnnespanol.cnn.com/argentina', tipo: 'html' },
    { nombre: 'Diario Junio', url: 'https://diariojunio.com.ar/', tipo: 'rss' },
    { nombre: 'IP Noticias', url: 'https://www.ipnoticias.com/', tipo: 'rss' },
    { nombre: 'Letra P', url: 'https://www.letrap.com.ar/', tipo: 'rss' }
  ],

  // TIER 4: MEDIOS REGIONALES (18)
  regionalesBonaerenses: [
    { nombre: 'La Voz', url: 'https://www.lavoz.com.ar/', tipo: 'rss' },
    { nombre: 'Río Negro', url: 'https://www.rionegro.com.ar/', tipo: 'rss' },
    { nombre: 'Los Andes', url: 'https://www.losandes.com.ar/', tipo: 'rss' },
    { nombre: 'Diario de Cuyo', url: 'https://www.diariodecuyo.com.ar/', tipo: 'rss' },
    { nombre: 'El Territorio', url: 'https://www.elterritorio.com.ar/', tipo: 'rss' },
    { nombre: 'La Arena', url: 'https://www.laarena.com.ar/', tipo: 'rss' },
    { nombre: 'El Litoral', url: 'https://www.ellitoral.com.ar/', tipo: 'rss' },
    { nombre: 'La Opinión Austral', url: 'https://laopinionaustral.com.ar/', tipo: 'rss' },
    { nombre: 'La Capital', url: 'https://www.lacapital.com.ar/', tipo: 'rss' },
    { nombre: 'El Día', url: 'https://www.eldia.com/', tipo: 'rss' },
    { nombre: 'Grupo La Provincia', url: 'https://grupolaprovincia.com/', tipo: 'rss' },
    { nombre: 'MDZ Online', url: 'https://www.mdzol.com/', tipo: 'rss' },
    { nombre: 'Diario de Democracia', url: 'https://www.diariodemocracia.com/', tipo: 'rss' },
    { nombre: 'El Ciudadano Web', url: 'https://elciudadanoweb.com/', tipo: 'rss' },
    { nombre: 'Sitio Andino', url: 'https://www.sitioandino.com.ar/', tipo: 'rss' },
    { nombre: 'Infobae Menores', url: 'https://www.infobae.com/sociedad/', tipo: 'html' },
    { nombre: 'Info Platense', url: 'https://www.infoplatense.com.ar/', tipo: 'rss' },
    { nombre: 'En Línea Noticias', url: 'https://www.enlineanoticias.com.ar/', tipo: 'rss' }
  ],

  // TIER 5: MEDIOS IDEOLÓGICOS (5)
  ideologicos: [
    { nombre: 'La Prensa', url: 'https://www.laprensa.com.ar/', tipo: 'rss' },
    { nombre: 'Izquierda Web', url: 'https://izquierdaweb.com/', tipo: 'html' },
    { nombre: 'Derecha Diario', url: 'https://derechadiario.com.ar/', tipo: 'html' },
    { nombre: 'Urgente24', url: 'https://urgente24.com/', tipo: 'rss' },
    { nombre: 'El Destape', url: 'https://www.eldestapeweb.com/politica', tipo: 'rss' }
  ],

  // TIER 6: ESPECIALIZADOS (9)
  especializados: [
    { nombre: 'Tiempo', url: 'https://www.tiempoar.com.ar/', tipo: 'rss' },
    { nombre: 'El Economista', url: 'https://eleconomista.com.ar/', tipo: 'rss' },
    { nombre: 'iProfesional', url: 'https://www.iprofesional.com/', tipo: 'rss' },
    { nombre: 'BAE Negocios', url: 'https://www.baenegocios.com/', tipo: 'rss' },
    { nombre: 'Chequeado', url: 'https://chequeado.com/', tipo: 'rss' },
    { nombre: 'Filo News', url: 'https://www.filo.news/', tipo: 'rss' },
    { nombre: 'Revista Crisis', url: 'https://revistacrisis.com.ar/', tipo: 'html' },
    { nombre: 'Mondiplo', url: 'https://mondiplo.com/', tipo: 'rss' },
    { nombre: 'ACNUR', url: 'https://www.acnur.org/argentina', tipo: 'html' }
  ],

  // TIER 7: LOCALES 7ª SECCIÓN (12)
  locales7maSeccion: [
    { nombre: 'Azul Digital', url: 'https://www.azuldigital.gob.ar/', tipo: 'html' },
    { nombre: 'Olavarría', url: 'https://www.olavarria.gob.ar/', tipo: 'html' },
    { nombre: '25 de Mayo', url: 'https://www.25demayo.gob.ar/', tipo: 'html' },
    { nombre: 'Saladillo', url: 'https://www.saladillo.gob.ar/', tipo: 'html' },
    { nombre: 'Bolívar', url: 'https://www.bolivar.gob.ar/', tipo: 'html' },
    { nombre: 'Roque Pérez', url: 'https://www.roqueperez.gob.ar/', tipo: 'html' },
    { nombre: 'Tapalqué', url: 'https://www.tapalque.gob.ar/', tipo: 'html' },
    { nombre: 'General Álvear', url: 'https://www.generalálvear.gob.ar/', tipo: 'html' },
    { nombre: 'Séptima Sección', url: 'https://septimaseccion.com.ar/', tipo: 'rss' },
    { nombre: 'El Independiente de Azul', url: 'https://elindependientedelazul.com/', tipo: 'html' },
    { nombre: 'Noticias Azul', url: 'https://noticiasazul.com.ar/', tipo: 'rss' },
    { nombre: 'Zona Bonaerense', url: 'https://www.zonabonaerense.com/', tipo: 'html' }
  ],

  // TIER 8: REDES SOCIALES (2 - búsqueda de perfiles públicos)
  redesSociales: [
    { nombre: 'Twitter Search', url: 'https://twitter.com/search', tipo: 'api' },
    { nombre: 'YouTube Search', url: 'https://www.youtube.com/', tipo: 'api' }
  ],

  // TIER 9: ARCHIVOS Y BASES (5)
  archivos: [
    { nombre: 'Archive.org', url: 'https://archive.org/', tipo: 'html' },
    { nombre: 'Panama Papers', url: 'https://panamapapers.icij.org/', tipo: 'html' },
    { nombre: 'OpenCorporates', url: 'https://opencorporates.com/', tipo: 'html' },
    { nombre: 'OCCRP Aleph', url: 'https://aleph.occrp.org/', tipo: 'html' },
    { nombre: 'Opensecrets', url: 'https://www.opensecrets.org/', tipo: 'html' }
  ],

  // TIER 10: ENCUESTADORES (6)
  encuestadores: [
    { nombre: 'Zuban Córdoba', url: 'https://www.zuban.com.ar/', tipo: 'html' },
    { nombre: 'Trends', url: 'https://www.trendsar.com.ar/', tipo: 'html' },
    { nombre: 'QMonitor', url: 'https://www.qmonitor.com.ar/', tipo: 'html' },
    { nombre: 'AtlasIntel', url: 'https://www.atlasintel.org/', tipo: 'html' },
    { nombre: 'CB Global', url: 'https://cbglobaldata.com/', tipo: 'html' },
    { nombre: 'Alaska', url: 'https://alaska.com.ar/', tipo: 'html' }
  ]
};

// ==================== LOGGER ====================

class Logger {
  constructor() {
    this.logDir = CONFIG.logDir;
    this.ensureDir(this.logDir);
    this.sessionId = moment().tz(CONFIG.timezone).format('YYYY-MM-DD_HH-mm-ss');
    this.logFile = path.join(this.logDir, `scraping_${this.sessionId}.log`);
  }

  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(level, message, metadata = {}) {
    const timestamp = moment().tz(CONFIG.timezone).format('YYYY-MM-DD HH:mm:ss');
    const logEntry = {
      timestamp,
      level,
      message,
      ...metadata
    };
    
    console.log(`[${level}] ${timestamp} - ${message}`);
    if (Object.keys(metadata).length > 0) {
      console.log(metadata);
    }
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  }

  info(msg, meta) { this.log('INFO', msg, meta); }
  error(msg, meta) { this.log('ERROR', msg, meta); }
  warn(msg, meta) { this.log('WARN', msg, meta); }
  success(msg, meta) { this.log('SUCCESS', msg, meta); }
}

const logger = new Logger();

// ==================== SCRAPER ====================

class ScraperOSINT {
  constructor() {
    this.results = {};
    this.errors = [];
    this.stats = {
      totalPortales: 0,
      scraped: 0,
      failed: 0,
      startTime: moment().tz(CONFIG.timezone),
      endTime: null
    };
  }

  async scrapearTodo(candidatos) {
    logger.info('🚀 INICIANDO SCRAPING MASIVO', { 
      candidatos, 
      portales: Object.values(PORTALES).flat().length,
      concurrencia: CONFIG.maxConcurrencia
    });

    const limit = pLimit(CONFIG.maxConcurrencia);
    const allPortales = Object.values(PORTALES).flat();
    this.stats.totalPortales = allPortales.length;

    // Crear estructura de resultados
    candidatos.forEach(c => {
      this.results[c] = {
        candidato: c,
        scraped_at: moment().tz(CONFIG.timezone).toISOString(),
        portales: {}
      };
    });

    // Ejecutar scraping en paralelo
    const tasks = allPortales.map(portal => 
      limit(() => this.scrapearPortal(portal, candidatos))
    );

    await Promise.allSettled(tasks);

    this.stats.endTime = moment().tz(CONFIG.timezone);
    this.guardarResultados();
    this.reportarEstadísticas();
  }

  async scrapearPortal(portal, candidatos) {
    let attempt = 0;
    
    while (attempt < CONFIG.retryAttempts) {
      try {
        logger.info(`📡 Scrapeando: ${portal.nombre}`, { url: portal.url });

        let datos = {};

        if (portal.tipo === 'rss') {
          datos = await this.scrapearRSS(portal, candidatos);
        } else if (portal.tipo === 'html') {
          datos = await this.scrapearHTML(portal, candidatos);
        } else if (portal.tipo === 'api') {
          datos = await this.scrapearAPI(portal, candidatos);
        }

        // Guardar en resultados
        candidatos.forEach(c => {
          this.results[c].portales[portal.nombre] = {
            url: portal.url,
            tipo: portal.tipo,
            scraped_at: moment().tz(CONFIG.timezone).toISOString(),
            items: datos[c] || [],
            status: 'success'
          };
        });

        this.stats.scraped++;
        logger.success(`✅ ${portal.nombre}`, { items: Object.keys(datos).length });
        return;

      } catch (error) {
        attempt++;
        // Retry exponencial: 2s -> 4s -> 8s
        const exponentialDelay = CONFIG.retryDelay * Math.pow(2, attempt - 1);
        logger.warn(`⚠️ Intento ${attempt}/${CONFIG.retryAttempts}: ${portal.nombre}`, { 
          error: error.message,
          nextRetryIn: `${exponentialDelay}ms`
        });

        if (attempt < CONFIG.retryAttempts) {
          await new Promise(r => setTimeout(r, exponentialDelay));
        }
      }
    }

    this.stats.failed++;
    this.errors.push({ portal: portal.nombre, error: 'Max retries exceeded' });
    logger.error(`❌ FALLÓ: ${portal.nombre}`, { url: portal.url });

    candidatos.forEach(c => {
      this.results[c].portales[portal.nombre] = {
        url: portal.url,
        status: 'failed',
        error: 'Max retries exceeded'
      };
    });
  }

  // ==================== FUNCIONES AUXILIARES ====================

  /**
   * Reglas de sanitización específicas por portal.
   *
   * Grupo A — Line 60, Col 8 (Clarín, Infobae, Página 12):
   *   Feeds con tags sin cerrar o mal anidados en el bloque de cabecera del
   *   canal (~línea 60). Se detecta y cierra/elimina el tag problemático.
   *
   * Grupo B — Line 136, Col 117 (La Nación, Perfil, Cronista):
   *   Feeds con atributos de comillas sin escapar o referencias de entidad
   *   rotas dentro de elementos <item> (~línea 136). Se normalizan in-situ.
   */
  get PORTAL_SANITIZATION_RULES() {
    return {
      // ── Grupo A: unclosed/mismatched tags around line 60 ──────────────────

      'Clarín': (xml) => {
        // Cierra <image> sin cerrar que aparece en el bloque <channel>
        xml = xml.replace(
          /<image>(?![\s\S]*?<\/image>)([\s\S]*?)(<item[\s>])/,
          '<image>$1</image>$2'
        );
        // Elimina atributos xmlns duplicados que confunden al parser
        xml = xml.replace(
          /(<rss[^>]*)\s+xmlns:\w+="[^"]*"(\s+xmlns:\w+="[^"]*")+/,
          (match, base) => base
        );
        logger.info('🔧 Sanitización Clarín (Grupo A) aplicada');
        return xml;
      },

      'Infobae': (xml) => {
        // Infobae a veces emite <link> sin cerrar dentro de <channel>
        xml = xml.replace(
          /<link>([^<]*?)(?=<(?!\/link>))/g,
          '<link>$1</link>'
        );
        // Elimina processing instructions no estándar que rompen el parser
        xml = xml.replace(/<\?[^?]*\?>/g, (match) =>
          match.startsWith('<?xml') ? match : ''
        );
        logger.info('🔧 Sanitización Infobae (Grupo A) aplicada');
        return xml;
      },

      'Página 12': (xml) => {
        // Página 12 deja <description> sin cerrar en el bloque de canal
        xml = xml.replace(
          /<description>([\s\S]*?)(?=<(?!\/description>)\w)/g,
          (match, content) => `<description>${content}</description>`
        );
        // Elimina comentarios HTML mal formados (<!-- sin cierre -->)
        xml = xml.replace(/<!--(?![\s\S]*?-->)/g, '');
        logger.info('🔧 Sanitización Página 12 (Grupo A) aplicada');
        return xml;
      },

      // ── Grupo B: malformed attributes/entities around line 136 ───────────

      'La Nación': (xml) => {
        // Normaliza comillas tipográficas dentro de atributos XML
        xml = xml.replace(/="([^"]*)"/g, (match, val) =>
          `="${val.replace(/[\u201C\u201D\u201E\u201F]/g, '&quot;')}"`
        );
        // Escapa & residuales dentro de valores de atributos
        xml = xml.replace(/(\w+)="([^"]*)"/g, (match, attr, val) =>
          `${attr}="${val.replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')}"`
        );
        logger.info('🔧 Sanitización La Nación (Grupo B) aplicada');
        return xml;
      },

      'Perfil': (xml) => {
        // Perfil incluye HTML sin escapar dentro de <description> fuera de CDATA
        xml = xml.replace(
          /<description>(?!\s*<!\[CDATA\[)([\s\S]*?)<\/description>/g,
          (match, content) => `<description><![CDATA[${content}]]></description>`
        );
        // Repara referencias de entidad rotas (& seguido de espacio, ; o <)
        xml = xml.replace(/&(\s|;|<)/g, '&amp;$1');
        logger.info('🔧 Sanitización Perfil (Grupo B) aplicada');
        return xml;
      },

      'Cronista': (xml) => {
        // Cronista emite atributos con comillas simples mezcladas con dobles
        xml = xml.replace(/<([a-zA-Z][^\s>]*)(\s[^>]*)?>/g, (match, tag, attrs) => {
          if (!attrs) return match;
          // Normaliza atributos con comillas simples a dobles
          const fixedAttrs = attrs.replace(
            /(\w[\w:-]*)='([^']*)'/g,
            (m, name, val) => `${name}="${val.replace(/"/g, '&quot;')}"`
          );
          return `<${tag}${fixedAttrs}>`;
        });
        logger.info('🔧 Sanitización Cronista (Grupo B) aplicada');
        return xml;
      }
    };
  }

  /**
   * Sanitiza XML en dos pasadas:
   *   1. Reparaciones genéricas (caracteres de control, entidades, CDATA, etc.)
   *   2. Regla específica del portal (si existe en PORTAL_SANITIZATION_RULES)
   *
   * @param {string} xml       - XML crudo recibido del feed
   * @param {string} [portal]  - Nombre del portal para aplicar regla específica
   * @returns {{ xml: string, rulesApplied: string[] }}
   */
  sanitizeXML(xml, portal = null) {
    const rulesApplied = [];

    // ── Pasada 1: reparaciones genéricas ────────────────────────────────────

    // 1a. Caracteres de control inválidos en XML 1.0
    xml = xml.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    rulesApplied.push('strip-control-chars');

    // 1b. Caracteres Unicode no permitidos en XML (surrogates sueltos, BOM)
    xml = xml.replace(/[\uFFFE\uFFFF]/g, '');
    xml = xml.replace(/[\uD800-\uDFFF]/g, '');
    rulesApplied.push('strip-invalid-unicode');

    // 1c. & no codificadas fuera de CDATA y fuera de referencias de entidad
    //     Preserva secciones CDATA intactas y solo escapa & sueltas en el resto
    const cdataParts = xml.split(/(<!\[CDATA\[[\s\S]*?\]\]>)/);
    xml = cdataParts.map((part, i) => {
      // Los índices impares son secciones CDATA — no tocar
      if (i % 2 === 1) return part;
      return part.replace(/&(?!#?[a-zA-Z0-9]{1,20};)/g, '&amp;');
    }).join('');
    rulesApplied.push('escape-bare-ampersands');

    // 1d. Secciones CDATA mal cerradas (]]> faltante antes de </description>)
    xml = xml.replace(
      /<!\[CDATA\[([\s\S]*?)(?=<\/(?:description|title|content|summary)>)/g,
      (match, content) => {
        if (match.endsWith(']]>')) return match;
        return `<![CDATA[${content}]]>`;
      }
    );
    rulesApplied.push('fix-unclosed-cdata');

    // 1e. Referencias de entidad HTML comunes que XML no reconoce nativamente
    const HTML_ENTITIES = {
      '&nbsp;': '&#160;',   '&mdash;': '&#8212;', '&ndash;': '&#8211;',
      '&laquo;': '&#171;',  '&raquo;': '&#187;',  '&ldquo;': '&#8220;',
      '&rdquo;': '&#8221;', '&lsquo;': '&#8216;', '&rsquo;': '&#8217;',
      '&hellip;': '&#8230;','&copy;': '&#169;',   '&reg;': '&#174;',
      '&trade;': '&#8482;', '&euro;': '&#8364;',  '&pound;': '&#163;',
      '&yen;': '&#165;',    '&cent;': '&#162;',   '&deg;': '&#176;',
      '&agrave;': '&#224;', '&aacute;': '&#225;', '&eacute;': '&#233;',
      '&iacute;': '&#237;', '&oacute;': '&#243;', '&uacute;': '&#250;',
      '&ntilde;': '&#241;', '&Ntilde;': '&#209;', '&iexcl;': '&#161;',
      '&iquest;': '&#191;'
    };
    const entityPattern = Object.keys(HTML_ENTITIES)
      .map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    xml = xml.replace(new RegExp(entityPattern, 'g'), (match) =>
      HTML_ENTITIES[match] || match
    );
    rulesApplied.push('normalize-html-entities');

    // ── Pasada 2: regla específica del portal ────────────────────────────────
    if (portal && this.PORTAL_SANITIZATION_RULES[portal]) {
      xml = this.PORTAL_SANITIZATION_RULES[portal](xml);
      rulesApplied.push(`portal-rule:${portal}`);
    }

    return { xml, rulesApplied };
  }

  /**
   * Extrae un fragmento de contexto alrededor de la posición de error XML.
   * @param {string} xml
   * @param {number} line   - 1-based
   * @param {number} col    - 1-based
   * @param {number} radius - caracteres a cada lado del punto de error
   */
  _xmlErrorSnippet(xml, line, col, radius = 100) {
    const lines = xml.split('\n');
    if (line < 1 || line > lines.length) return xml.substring(0, 200);
    const targetLine = lines[line - 1] || '';
    const start = Math.max(0, col - 1 - radius);
    const end = Math.min(targetLine.length, col - 1 + radius);
    return targetLine.substring(start, end);
  }

  /**
   * Parsea el mensaje de error del parser XML para extraer línea y columna.
   * Soporta formatos: "Line X, Column Y" y "line X column Y".
   */
  _parseXMLErrorPosition(message) {
    const m = message.match(/[Ll]ine[:\s]+(\d+)[,\s]+[Cc]ol(?:umn)?[:\s]+(\d+)/);
    if (m) return { line: parseInt(m[1], 10), col: parseInt(m[2], 10) };
    return null;
  }

  async scrapearRSS(portal, candidatos) {
    const parser = new Parser({
      timeout: CONFIG.timeout,
      requestOptions: {
        rejectUnauthorized: false, // SSL bypass para certificados inválidos
        headers: { 'User-Agent': CONFIG.userAgent }
      }
    });

    try {
      // Obtener XML crudo
      const response = await axios.get(portal.url, {
        timeout: CONFIG.timeout,
        headers: { 'User-Agent': CONFIG.userAgent },
        maxRedirects: 5
      });

      // ── Sanitizar XML (genérico + regla específica del portal) ────────────
      const { xml: sanitizedXML, rulesApplied } = this.sanitizeXML(
        response.data,
        portal.nombre
      );

      logger.info(`🧹 XML sanitizado: ${portal.nombre}`, {
        rulesApplied,
        originalLength: response.data.length,
        sanitizedLength: sanitizedXML.length
      });

      // ── Parsear XML sanitizado ────────────────────────────────────────────
      let feed;
      try {
        feed = await parser.parseString(sanitizedXML);
      } catch (parseError) {
        // Enriquecer el error con posición exacta y fragmento del XML problemático
        const pos = this._parseXMLErrorPosition(parseError.message);
        const snippet = pos
          ? this._xmlErrorSnippet(sanitizedXML, pos.line, pos.col)
          : sanitizedXML.substring(0, 200);

        logger.error(`❌ XML parse error en ${portal.nombre}`, {
          error: parseError.message,
          line: pos ? pos.line : 'unknown',
          column: pos ? pos.col : 'unknown',
          snippet,
          rulesApplied
        });

        throw parseError;
      }

      const items = feed.items || [];
      const datos = {};

      candidatos.forEach(candidato => {
        datos[candidato] = items
          .filter(item => {
            const text = `${item.title || ''} ${item.content || ''} ${item.description || ''}`.toLowerCase();
            return text.includes(candidato.toLowerCase());
          })
          .slice(0, 10) // Limitar a 10 items por candidato
          .map(item => ({
            title: item.title || 'Sin título',
            link: item.link || '',
            pubDate: item.pubDate || '',
            content: (item.content || item.description || '').substring(0, 500),
            source: portal.nombre
          }));
      });

      return datos;
    } catch (error) {
      throw new Error(`RSS parsing failed: ${error.message}`);
    }
  }


  async scrapearHTML(portal, candidatos) {
    try {
      const response = await axios.get(portal.url, {
        timeout: CONFIG.timeout,
        headers: { 'User-Agent': CONFIG.userAgent },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      const datos = {};

      candidatos.forEach(candidato => {
        const articles = [];
        
        // Buscar en títulos y contenido
        $('h1, h2, h3, article, .article, [class*="post"]').each((i, el) => {
          const text = $(el).text().toLowerCase();
          if (text.includes(candidato.toLowerCase())) {
            articles.push({
              title: $(el).find('h1, h2, h3').text() || $(el).text().substring(0, 100),
              link: $(el).find('a').attr('href') || portal.url,
              date: moment().tz(CONFIG.timezone).format('YYYY-MM-DD'),
              source: portal.nombre
            });
          }
        });

        datos[candidato] = articles.slice(0, 10);
      });

      return datos;
    } catch (error) {
      throw new Error(`HTML scraping failed: ${error.message}`);
    }
  }

  async scrapearAPI(portal, candidatos) {
    // Placeholder para APIs especializadas (Twitter, YouTube, etc.)
    // Se requeriría autenticación específica
    logger.warn(`⏭️ API ${portal.nombre} requiere autenticación especial`);
    return {};
  }

  guardarResultados() {
    const outputDir = CONFIG.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = moment().tz(CONFIG.timezone).format('YYYY-MM-DD_HH-mm-ss');
    const outputFile = path.join(outputDir, `osint_raw_${timestamp}.json`);

    fs.writeFileSync(
      outputFile,
      JSON.stringify(this.results, null, 2),
      'utf-8'
    );

    logger.success('💾 Resultados guardados', { file: outputFile });
  }

  reportarEstadísticas() {
    const duracion = this.stats.endTime.diff(this.stats.startTime, 'minutes');
    
    logger.info('📊 ESTADÍSTICAS FINALES', {
      totalPortales: this.stats.totalPortales,
      scraped: this.stats.scraped,
      failed: this.stats.failed,
      successRate: `${((this.stats.scraped / this.stats.totalPortales) * 100).toFixed(2)}%`,
      duracion: `${duracion} minutos`,
      startTime: this.stats.startTime.format('YYYY-MM-DD HH:mm:ss'),
      endTime: this.stats.endTime.format('YYYY-MM-DD HH:mm:ss')
    });
  }
}

// ==================== EJECUCIÓN ====================

async function main() {
  try {
    const scraper = new ScraperOSINT();
    await scraper.scrapearTodo(CONFIG.candidatos);
    
    logger.success('🎉 SCRAPING COMPLETADO');
    process.exit(0);
  } catch (error) {
    logger.error('💥 ERROR FATAL', { error: error.message });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ScraperOSINT, Logger };
