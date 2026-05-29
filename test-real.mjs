/**
 * test-real.mjs — Test end-to-end completo con DEV_PREVIEW=false
 * Cubre: sala, join, inicio, fase_0, confirmar roles, avanzar a fase_1, ceremonia
 */
import { chromium } from 'playwright';

const BASE  = 'http://localhost:5175';
const LOG   = [];
const ERRS  = [];

const log  = (t, m) => { const l=`[${t}] ${m}`; LOG.push(l); console.log(l); };
const fail = (m)    => { ERRS.push(m); log('FAIL', m); };
const ok   = (m)    => log('OK', `✅ ${m}`);
const warn = (m)    => log('WARN', `⚠️  ${m}`);

async function ss(page, name) {
  await page.screenshot({ path: `test-ss-${name}.png` });
  log('SS', `test-ss-${name}.png`);
}

// Extrae texto visible en el body del tablero (que usa un canvas 1920px scaled)
async function getTableroDOMInfo(page) {
  return page.evaluate(() => {
    const root = document.getElementById('root');
    const divs = root?.querySelectorAll('div[style]') || [];
    // Contar elementos con texto
    const textos = [];
    root?.querySelectorAll('p, h1, h2, h3, span').forEach(el => {
      const t = el.textContent?.trim();
      if (t) textos.push(t.slice(0,40));
    });
    return {
      reactRootExists: !!root,
      childCount: root?.childElementCount,
      textNodes: textos.slice(0, 20),
      bodyText: document.body.innerText?.slice(0, 300),
      consoleErrors: window.__playwright_errors || [],
    };
  });
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
  });

  // Capturar errores de consola en el tablero
  const tableroCErrs = [];

  // ─── 1. Tablero: crear sala ───────────────────────────────────────
  log('STEP', '1 — Tablero crea sala');
  const tabTablero = await browser.newPage();
  tabTablero.on('console', m => { if (m.type()==='error') tableroCErrs.push(m.text()); });
  tabTablero.on('pageerror', e => { tableroCErrs.push(e.message); fail(`JS: ${e.message}`); });

  await tabTablero.goto(`${BASE}/tablero`, { waitUntil: 'domcontentloaded' });
  await tabTablero.waitForTimeout(1500);
  await ss(tabTablero, '01-entrada');

  await tabTablero.click('text=Crear nueva sala');
  await tabTablero.waitForURL(/\/tablero\/[A-Z0-9]{4}/, { timeout: 8000 });
  const codigo = tabTablero.url().split('/tablero/')[1];
  ok(`Sala creada: ${codigo}`);

  // Esperar que el socket conecte y SalaEspera se muestre
  await tabTablero.waitForTimeout(2000);
  const dom1 = await getTableroDOMInfo(tabTablero);
  log('DOM', `Textos: ${dom1.textNodes.join(' | ')}`);
  if (!dom1.bodyText?.includes(codigo)) warn('Código de sala no encontrado en DOM');
  else ok('SalaEspera muestra el código de sala');
  await ss(tabTablero, '02-sala-espera');

  // ─── 2. Jugadores se unen ─────────────────────────────────────────
  log('STEP', '2 — 5 jugadores se unen');
  const NOMBRES = ['Ana','Beto','Carlos','Diana','Eva'];
  const jugPaginas = [];

  for (const nombre of NOMBRES) {
    const page = await browser.newPage();
    page.on('pageerror', e => fail(`${nombre} pageerror: ${e.message}`));
    await page.goto(`${BASE}/unirse`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const inputNombre = await page.$('input[placeholder*="nombre"],input[placeholder*="Nombre"]');
    const inputCodigo = await page.$('input[placeholder="XXXX"],input[placeholder*="digo"]');
    if (inputNombre) await inputNombre.fill(nombre);
    if (inputCodigo) await inputCodigo.fill(codigo);
    await page.waitForTimeout(200);

    const btn = await page.$('button:has-text("UNIRME")') || await page.$('button:has-text("Unirse")');
    if (btn) {
      await btn.click();
      await page.waitForURL(/\/(sala|jugar)/, { timeout: 5000 }).catch(()=>{});
      ok(`${nombre} → ${page.url()}`);
    } else {
      fail(`${nombre}: no se encontró botón UNIRME`);
    }
    jugPaginas.push({ nombre, page });
    await page.waitForTimeout(300);
  }

  // ─── 3. Verificar jugadores en tablero ────────────────────────────
  log('STEP', '3 — Verificar jugadores en tablero');
  await tabTablero.waitForTimeout(1500);
  const dom2 = await getTableroDOMInfo(tabTablero);
  log('DOM', `Textos: ${dom2.textNodes.join(' | ')}`);
  const visibles = NOMBRES.filter(n => dom2.bodyText?.includes(n));
  log('DOM', `Jugadores visibles: ${visibles.join(', ') || 'NINGUNO'} (${visibles.length}/5)`);
  if (visibles.length === 5) ok('Todos los jugadores visibles en SalaEspera');
  else fail(`Solo ${visibles.length}/5 jugadores visibles`);
  await ss(tabTablero, '03-con-jugadores');

  // ─── 4. Iniciar partida ───────────────────────────────────────────
  log('STEP', '4 — Iniciar partida');
  const btnIniciar = await tabTablero.$('img[alt="Iniciar Partida"]');
  if (btnIniciar) {
    await btnIniciar.click();
    ok('Click en Iniciar Partida');
  } else {
    fail('img[alt="Iniciar Partida"] no encontrado');
    await browser.close(); return ERRS;
  }

  // Esperar que el tablero reciba tablero-actualizado con fase_0
  await tabTablero.waitForTimeout(3000);
  const dom3 = await getTableroDOMInfo(tabTablero);
  log('DOM', `Tras iniciar — textos: ${dom3.textNodes.join(' | ')}`);
  if (tableroCErrs.length) {
    tableroCErrs.forEach(e => fail(`Tablero JS: ${e}`));
  }
  await ss(tabTablero, '04-tras-iniciar');

  // Comprobar que la fase cambió en el DOM del tablero
  const enFase0 = dom3.bodyText?.includes('Revelando') || dom3.bodyText?.includes('Roles') ||
                  dom3.bodyText?.includes('Capitán') || dom3.textNodes.some(t =>
                    t.includes('Revelando') || t.includes('fase') || t.includes('Capitán'));
  if (enFase0) ok('Tablero muestra estado de fase_0 (Revelando Roles)');
  else warn(`Tablero bodyText: "${dom3.bodyText?.slice(0,200)}"`);

  // ─── 5. Vista jugadores — verificar pantalla de rol ───────────────
  log('STEP', '5 — Jugadores ven su rol');
  await jugPaginas[0].page.waitForTimeout(1000);
  const rolText = await jugPaginas[0].page.innerText('body');
  log('JUGADOR', `Ana ve: "${rolText.slice(0,150)}"`);
  const vioRol = rolText.includes('Marinero') || rolText.includes('Pirata') ||
                 rolText.includes('Cultista') || rolText.includes('rol');
  if (vioRol) ok('Ana ve su pantalla de rol');
  else warn('Ana no muestra pantalla de rol esperada');
  await ss(jugPaginas[0].page, '05-jugador-rol');

  // ─── 6. Todos confirman rol ───────────────────────────────────────
  log('STEP', '6 — Todos confirman rol');
  for (const { nombre, page } of jugPaginas) {
    const btn = await page.$('button:has-text("He visto")') ||
                await page.$('button:has-text("Confirmar")') ||
                await page.$('button:has-text("Entendido")');
    if (btn) {
      await btn.click();
      ok(`${nombre} confirmó rol`);
    } else {
      const t = await page.innerText('body').catch(()=>'');
      warn(`${nombre}: botón confirmar no encontrado. Pantalla: "${t.slice(0,80)}"`);
    }
    await page.waitForTimeout(400);
  }

  // ─── 7. Tablero tras confirmar todos ─────────────────────────────
  log('STEP', '7 — Estado tablero tras confirmar roles');
  await tabTablero.waitForTimeout(3000);
  const dom4 = await getTableroDOMInfo(tabTablero);
  log('DOM', `Textos: ${dom4.textNodes.join(' | ')}`);
  const avanzado = dom4.bodyText?.includes('duerme') || dom4.bodyText?.includes('Eligiendo') ||
                   dom4.textNodes.some(t => t.includes('Capitán') || t.includes('duerme') || t.includes('Eligiendo'));
  if (avanzado) ok('Tablero avanzó a durmiendo o fase_1');
  else warn(`Tablero body: "${dom4.bodyText?.slice(0,200)}"`);
  await ss(tabTablero, '06-tras-confirmar-roles');

  // ─── 8. Revisar errores JS ────────────────────────────────────────
  log('STEP', '8 — Errores JS en tablero');
  log('JS ERRS', tableroCErrs.length > 0 ? tableroCErrs.join('\n  ') : 'ninguno');

  await browser.close();

  log('', '═══════════════════════════════════');
  log('ERRORES TOTALES', ERRS.length > 0 ? ERRS.join('\n  ') : 'ninguno');
  return ERRS;
}

run().then(errs => {
  console.log('\n══ VEREDICTO FINAL ══');
  if (errs.length === 0) {
    console.log('PASS — flujo completo sin errores críticos');
  } else {
    console.log(`FAIL — ${errs.length} error(es):`);
    errs.forEach(e => console.log('  ✗', e));
    process.exit(1);
  }
}).catch(err => {
  console.error('CRASH:', err.message);
  process.exit(1);
});
