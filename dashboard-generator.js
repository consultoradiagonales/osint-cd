/**
 * DASHBOARD OSINT GENERADOR
 * Consultora Diagonales
 * 
 * Propósito: Mostrar TODO lo scrapeado con fuentes
 * Sin análisis, solo datos crudos para que Fernando revise/apruebe
 */

const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

class DashboardGenerator {
  constructor() {
    this.timezone = 'America/Argentina/Buenos_Aires';
    this.colorPaleta = {
      primary: '#4CAF50',
      dark: '#2E7D32',
      light: '#F5F5F5',
      gray: '#9E9E9E',
      text: '#212121',
      danger: '#C0392B',
      warning: '#FF9800'
    };
  }

  generar(datosRaw, candidatos) {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard OSINT - Consultora Diagonales</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, ${this.colorPaleta.light} 0%, #E8F5E9 100%);
      color: ${this.colorPaleta.text};
      padding: 20px;
    }

    .header {
      background: ${this.colorPaleta.primary};
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 1.1em;
      opacity: 0.95;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 5px solid ${this.colorPaleta.primary};
      transition: transform 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .stat-number {
      font-size: 2em;
      font-weight: bold;
      color: ${this.colorPaleta.dark};
      margin-bottom: 5px;
    }

    .stat-label {
      color: ${this.colorPaleta.gray};
      font-size: 0.95em;
    }

    .candidatos-nav {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .btn-candidato {
      padding: 12px 20px;
      background: white;
      border: 2px solid ${this.colorPaleta.primary};
      color: ${this.colorPaleta.primary};
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
    }

    .btn-candidato.active,
    .btn-candidato:hover {
      background: ${this.colorPaleta.primary};
      color: white;
    }

    .candidato-section {
      display: none;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .candidato-section.active {
      display: block;
    }

    .candidato-titulo {
      font-size: 2em;
      color: ${this.colorPaleta.dark};
      margin-bottom: 20px;
      border-bottom: 3px solid ${this.colorPaleta.primary};
      padding-bottom: 15px;
    }

    .portales-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .portal-card {
      background: ${this.colorPaleta.light};
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid ${this.colorPaleta.primary};
      transition: all 0.3s ease;
    }

    .portal-card:hover {
      background: #EEEEEE;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }

    .portal-nombre {
      font-weight: bold;
      font-size: 1.1em;
      color: ${this.colorPaleta.dark};
      margin-bottom: 10px;
    }

    .portal-url {
      font-size: 0.85em;
      color: ${this.colorPaleta.gray};
      margin-bottom: 12px;
      word-break: break-all;
    }

    .portal-items {
      font-size: 0.95em;
      color: ${this.colorPaleta.text};
      line-height: 1.6;
      max-height: 200px;
      overflow-y: auto;
    }

    .item {
      padding: 8px 0;
      border-bottom: 1px solid #E0E0E0;
      margin-bottom: 8px;
    }

    .item-titulo {
      font-weight: 500;
      color: ${this.colorPaleta.dark};
      margin-bottom: 4px;
    }

    .item-date {
      font-size: 0.85em;
      color: ${this.colorPaleta.gray};
    }

    .item-content {
      font-size: 0.85em;
      color: ${this.colorPaleta.text};
      margin-top: 4px;
      padding: 4px 0;
    }

    .status-success {
      color: #4CAF50;
      font-weight: bold;
    }

    .status-failed {
      color: ${this.colorPaleta.danger};
      font-weight: bold;
    }

    .stats-portal {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
      font-size: 0.85em;
    }

    .stats-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .checkbox-group {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #E0E0E0;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      cursor: pointer;
    }

    .checkbox-item input {
      cursor: pointer;
      width: 18px;
      height: 18px;
    }

    .checkbox-item label {
      cursor: pointer;
      flex: 1;
    }

    .footer {
      background: ${this.colorPaleta.dark};
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px;
      margin-top: 40px;
    }

    .footer p {
      margin-bottom: 10px;
    }

    .btn-action {
      background: ${this.colorPaleta.primary};
      color: white;
      padding: 15px 40px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      margin: 10px;
      transition: all 0.3s ease;
    }

    .btn-action:hover {
      background: ${this.colorPaleta.dark};
      transform: scale(1.05);
    }

    .success-count {
      color: ${this.colorPaleta.primary};
      font-weight: bold;
    }

    .error-count {
      color: ${this.colorPaleta.danger};
      font-weight: bold;
    }

    .timestamp {
      color: ${this.colorPaleta.gray};
      font-size: 0.9em;
      margin-top: 10px;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.8em;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .portales-grid {
        grid-template-columns: 1fr;
      }

      .candidatos-nav {
        flex-direction: column;
      }

      .btn-candidato {
        width: 100%;
      }
    }

    .info-box {
      background: #E3F2FD;
      border-left: 4px solid #2196F3;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 DASHBOARD OSINT</h1>
    <p>Consultora Diagonales - Scraping de 200+ Portales</p>
  </div>

  <div class="container">
    <!-- ESTADÍSTICAS GENERALES -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${candidatos.length}</div>
        <div class="stat-label">Candidatos Analizados</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${Object.keys(PORTALES_TODOS).length}</div>
        <div class="stat-label">Portales Scrapeados</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${moment().tz(this.timezone).format('HH:mm')}</div>
        <div class="stat-label">Última actualización</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">✅</div>
        <div class="stat-label">Estado: Completado</div>
      </div>
    </div>

    <!-- INFO BOX -->
    <div class="info-box">
      📋 <strong>Instrucciones:</strong> Revisa los datos recolectados. Selecciona qué fuentes incluir/excluir. 
      Marca si necesitas profundizar en algo. Cuando esté listo, haz clic en "Aprobar y Continuar".
    </div>

    <!-- NAVEGACIÓN CANDIDATOS -->
    <div class="candidatos-nav">
      ${candidatos.map((c, i) => `
        <button class="btn-candidato ${i === 0 ? 'active' : ''}" 
                onclick="mostrarCandidato('${c}')">
          ${c.charAt(0).toUpperCase() + c.slice(1)}
        </button>
      `).join('')}
    </div>

    <!-- SECCIONES POR CANDIDATO -->
    ${candidatos.map((candidato) => `
      <div id="section-${candidato}" class="candidato-section ${candidatos[0] === candidato ? 'active' : ''}">
        <div class="candidato-titulo">📊 ${candidato.toUpperCase()}</div>

        <div class="portales-grid">
          ${this.generarTarjetasPortales(datosRaw[candidato] || {}, candidato)}
        </div>

        <div class="checkbox-group">
          <h3>Opciones de profundidad:</h3>
          <div class="checkbox-item">
            <input type="radio" name="profundidad-${candidato}" value="basica" id="prof-${candidato}-basica" checked>
            <label for="prof-${candidato}-basica">BÁSICA: Solo menciones en medios</label>
          </div>
          <div class="checkbox-item">
            <input type="radio" name="profundidad-${candidato}" value="media" id="prof-${candidato}-media">
            <label for="prof-${candidato}-media">MEDIA: + análisis de sentimiento</label>
          </div>
          <div class="checkbox-item">
            <input type="radio" name="profundidad-${candidato}" value="maxima" id="prof-${candidato}-maxima">
            <label for="prof-${candidato}-maxima">MÁXIMA: + redes sociales + financiero</label>
          </div>
        </div>
      </div>
    `).join('')}

    <!-- FOOTER -->
    <div class="footer">
      <h2>¿Listo para analizar?</h2>
      <p>Revisa los datos, selecciona profundidad y aprueba para continuar</p>
      <button class="btn-action" onclick="aprobarDatos()">✅ Aprobar y Continuar</button>
      <button class="btn-action" onclick="rechazarYEditar()">❌ Editar Selección</button>
      <div class="timestamp">
        Generado: ${moment().tz(this.timezone).format('YYYY-MM-DD HH:mm:ss')} (ARG)
      </div>
    </div>
  </div>

  <script>
    const PORTALES_TODOS = ${JSON.stringify(Object.keys(datosRaw).length)};

    function mostrarCandidato(candidato) {
      // Ocultar todos
      document.querySelectorAll('.candidato-section').forEach(el => {
        el.classList.remove('active');
      });
      document.querySelectorAll('.btn-candidato').forEach(el => {
        el.classList.remove('active');
      });

      // Mostrar seleccionado
      document.getElementById('section-' + candidato).classList.add('active');
      event.target.classList.add('active');
    }

    function aprobarDatos() {
      const selecciones = {};
      document.querySelectorAll('[name^="profundidad-"]').forEach(el => {
        if (el.checked) {
          const candidato = el.name.replace('profundidad-', '');
          selecciones[candidato] = el.value;
        }
      });

      console.log('Aprobado:', selecciones);
      alert('✅ Datos aprobados. Iniciando análisis...\\n\\nRecibirás notificación vía WhatsApp cuando esté listo.');
      
      // Enviar a servidor
      fetch('/api/approve-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selecciones)
      }).then(r => r.json()).then(d => console.log('Respuesta:', d));
    }

    function rechazarYEditar() {
      alert('Puedes editar la selección de fuentes. Marca qué incluir/excluir.');
    }
  </script>
</body>
</html>
    `;

    return html;
  }

  generarTarjetasPortales(datosRaw, candidato) {
    let html = '';
    
    for (const [portalNombre, datosPortal] of Object.entries(datosRaw.portales || {})) {
      const items = datosPortal.items || [];
      const estado = datosPortal.status === 'success' ? 'success' : 'failed';

      html += `
        <div class="portal-card">
          <div class="portal-nombre">
            ${estado === 'success' ? '✅' : '❌'} ${portalNombre}
          </div>
          <div class="portal-url">${datosPortal.url}</div>
          <div class="portal-items">
            ${items.length > 0 ? items.map(item => `
              <div class="item">
                <div class="item-titulo">${item.title || 'Sin título'}</div>
                ${item.pubDate ? `<div class="item-date">${item.pubDate}</div>` : ''}
                ${item.content ? `<div class="item-content">${item.content.substring(0, 100)}...</div>` : ''}
              </div>
            `).join('') : '<p style="color: #9E9E9E;">Sin resultados</p>'}
          </div>
          <div class="stats-portal">
            <div class="stats-item">
              📊 ${items.length} items
            </div>
            <div class="stats-item">
              <span class="status-${estado}">${estado}</span>
            </div>
          </div>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" checked> Incluir en análisis
            </label>
          </div>
        </div>
      `;
    }

    return html || '<p>Sin datos</p>';
  }

  guardar(html, ruta) {
    fs.writeFileSync(ruta, html, 'utf-8');
    console.log(`✅ Dashboard guardado: ${ruta}`);
  }
}

module.exports = { DashboardGenerator };
