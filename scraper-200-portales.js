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
  outputDir: process.env.OUTPUT_DIR || '/tmp/osint-data',
  logDir: process.env.LOG_DIR || '/tmp/osint-logs',
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

  sanitizeXML(xml) {
    // Solo remover caracteres de control inválidos
    // NO tocar tags ni estructura XML
    return xml
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Caracteres de control
      .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;');         // & no codificadas
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

      // Sanitizar XML antes de parsear
      const sanitizedXML = this.sanitizeXML(response.data);

      // Parsear XML sanitizado
      const feed = await parser.parseString(sanitizedXML);
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
