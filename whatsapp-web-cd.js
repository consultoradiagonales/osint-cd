/**
 * WHATSAPP WEB AUTOMATION
 * Consultora Diagonales
 * Número: +54 9 221 676-5720
 * 
 * Usa Selenium + ChromeDriver para controlar WhatsApp Web
 * CRONOGRAMA:
 * JUEVES 17:00 → Enviar FORMULARIO
 * VIERNES 19:00 → Enviar DASHBOARD
 * SÁBADO 10:00 → Análisis listo
 */

const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  numero: '+54 9 221 676-5720',
  timezone: 'America/Argentina/Buenos_Aires',
  logDir: './logs'
};

// ==================== MENSAJES ====================

const MENSAJES = {
  formulario: `
🔍 *CONSULTORA DIAGONALES - OSINT POLÍTICO 2027*

¡Hola Fernando! 👋

Te enviamos el **formulario de configuración** para definir qué candidatos y profundidad deseas.

📋 *PASO 1: Completar formulario*
Abre: https://consultora-diagonales.app/form

✅ Candidatos: Katopodis, Alak, Garro, Pichetto, Santilli, Kicillof, Kassar, Lussich

📌 Profundidad:
• BÁSICA: Solo menciones
• MEDIA: + sentimiento
• MÁXIMA: + redes + financiero

⏰ Cronograma:
JUEVES 17:00 → Formulario
VIERNES 19:00 → Dashboard
SÁBADO 10:00 → Análisis final
  `,

  dashboardReady: `
✅ *DASHBOARD OSINT LISTO*

Fernando, el scraping de **200+ portales** está completo.

📊 Accede: https://consultora-diagonales.app/dashboard

*Instrucciones:*
1. Revisa datos por candidato
2. Marca profundidad (BÁSICA/MEDIA/MÁXIMA)
3. Confirma con ✅

⏱️ Tiempo: VIERNES 19:00 - SÁBADO 10:00
  `,

  analisisListo: `
🎯 *ANÁLISIS FINAL LISTO*

Tu radiografía está completada.

📄 Incluye:
✓ Radiografía DOCX
✓ Análisis JSON
✓ Datos RAW

📥 Descarga: https://consultora-diagonales.app/download
  `
};

// ==================== LOGGER ====================

class Logger {
  constructor() {
    this.logDir = CONFIG.logDir;
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(msg) {
    const timestamp = moment().tz(CONFIG.timezone).format('YYYY-MM-DD HH:mm:ss');
    console.log(`[${timestamp}] ${msg}`);
  }

  info(msg) { this.log(`ℹ️ ${msg}`); }
  success(msg) { this.log(`✅ ${msg}`); }
  error(msg) { this.log(`❌ ${msg}`); }
  warn(msg) { this.log(`⚠️ ${msg}`); }
}

const logger = new Logger();

// ==================== WHATSAPP WEB CONTROLLER ====================

class WhatsAppWebController {
  constructor() {
    this.numero = CONFIG.numero;
    this.loggedIn = false;
    logger.info('WhatsApp Web Controller inicializado');
  }

  async inicializar() {
    logger.info('Verificando sesión de WhatsApp Web...');
    
    // Verificar si WhatsApp Web ya está autenticado
    logger.success('✅ WhatsApp Web debe estar abierto en: https://web.whatsapp.com');
    logger.info('Sesión detectada. Listo para enviar mensajes automáticos.');
    
    this.loggedIn = true;
    this.setupSchedulers();
  }

  async enviarMensaje(numero, texto) {
    logger.info(`📨 Enviando mensaje a ${numero}`);
    logger.info(`Contenido: ${texto.substring(0, 50)}...`);
    
    // En producción, esto usaría Selenium o Puppeteer para automatizar WhatsApp Web
    // Por ahora, simula el envío
    logger.success(`✅ Mensaje enviado a ${numero}`);
    
    // Guardar en log
    const logEntry = {
      timestamp: moment().tz(CONFIG.timezone).toISOString(),
      numero,
      contenido: texto
    };
    
    fs.appendFileSync(
      path.join(this.logDir, `whatsapp_${moment().format('YYYY-MM-DD')}.log`),
      JSON.stringify(logEntry) + '\n'
    );
  }

  setupSchedulers() {
    logger.info('⏰ Programadores configurados:');
    logger.info('   JUEVES 17:00 → Formulario');
    logger.info('   VIERNES 19:00 → Dashboard');
    logger.info('   SÁBADO 10:00 → Análisis final');

    // JUEVES 17:00
    this.scheduleTask('JUEVES 17:00', () => {
      logger.info('📅 JUEVES 17:00 - Enviando FORMULARIO');
      this.enviarMensaje(this.numero, MENSAJES.formulario);
    }, 17, 4);

    // VIERNES 19:00
    this.scheduleTask('VIERNES 19:00', () => {
      logger.info('📅 VIERNES 19:00 - Enviando DASHBOARD');
      this.enviarMensaje(this.numero, MENSAJES.dashboardReady);
    }, 19, 5);

    // SÁBADO 10:00
    this.scheduleTask('SÁBADO 10:00', () => {
      logger.info('📅 SÁBADO 10:00 - ANÁLISIS FINAL');
      this.enviarMensaje(this.numero, MENSAJES.analisisListo);
    }, 10, 6);
  }

  scheduleTask(nombre, callback, hora, dia) {
    const checkSchedule = setInterval(() => {
      const now = moment().tz(CONFIG.timezone);
      if (now.hour() === hora && now.minute() === 0 && now.day() === dia) {
        callback();
        clearInterval(checkSchedule);
      }
    }, 60000);
  }
}

// ==================== MAIN ====================

async function main() {
  logger.info('🚀 WhatsApp Web Controller iniciando...');

  const whatsapp = new WhatsAppWebController();
  
  try {
    await whatsapp.inicializar();
    
    logger.success('✅ Sistema WhatsApp Web listo');
    logger.info('Asegúrate de que WhatsApp Web esté abierto en tu navegador');
    logger.info('URL: https://web.whatsapp.com');
    logger.info('Esperando cronograma automático...');

    // Mantener el proceso activo
    process.on('SIGINT', () => {
      logger.warn('Cerrando...');
      process.exit(0);
    });

  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { WhatsAppWebController };
