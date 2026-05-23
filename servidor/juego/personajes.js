// ============================================================
// PERSONAJES — Feed The Kraken
// 22 personajes con habilidades como placeholder
// Para activar una habilidad: implementar la función activar()
// ============================================================

const PERSONAJES = [
  {
    id: 'mentor',
    nombre: 'Mentor',
    habilidad: 'Elige un jugador. Voltea su carta boca abajo. Su habilidad puede activarse una segunda vez.',
    trigger: 'manual',
    activo: false,
    activar: (estado, jugadorId, objetivo) => { /* TODO */ },
  },
  {
    id: 'agitador',
    nombre: 'Agitador',
    habilidad: 'Tras elegir equipo: elige 2 jugadores. Deben revelar al menos 1 pistola en el motín.',
    trigger: 'tras_elegir_equipo',
    activo: false,
    activar: (estado, jugadorId, objetivos) => { /* TODO */ },
  },
  {
    id: 'lookout',
    nombre: 'Vigía',
    habilidad: 'Mira la carta superior del mazo. Puedes descartarla boca abajo o dejarla.',
    trigger: 'manual',
    activo: false,
    activar: (estado, jugadorId) => { /* TODO */ },
  },
  {
    id: 'cobrador',
    nombre: 'Cobrador de Deudas',
    habilidad: 'Tras elegir equipo: el jugador elegido debe dar 1 pistola a cada miembro del equipo.',
    trigger: 'tras_elegir_equipo',
    activo: false,
    activar: (estado, jugadorId, objetivo) => { /* TODO */ },
  },
  {
    id: 'pistolero',
    nombre: 'Pistolero',
    habilidad: 'Añade 2 pistolas a tu reserva personal.',
    trigger: 'inicio',
    activo: false,
    activar: (estado, jugadorId) => { /* TODO */ },
  },
  {
    id: 'igualador',
    nombre: 'Igualador',
    habilidad: 'El siguiente motín solo requiere 1 pistola para tener éxito. Cada jugador solo puede revelar hasta 1.',
    trigger: 'antes_motin',
    activo: false,
    activar: (estado, jugadorId) => { /* TODO */ },
  },
  {
    id: 'alborotador',
    nombre: 'Alborotador',
    habilidad: 'Tras revelar pistolas: el motín actual requiere la mitad de pistolas (redondeado arriba).',
    trigger: 'tras_revelar_pistolas',
    activo: false,
    activar: (estado, jugadorId) => { /* TODO */ },
  },
  {
    id: 'archivista',
    nombre: 'Archivista',
    habilidad: 'Antes de robar cartas: elige un jugador del equipo; puede descartar sus cartas y robar 2 nuevas.',
    trigger: 'antes_robar_cartas',
    activo: false,
    activar: (estado, jugadorId, objetivo) => { /* TODO */ },
  },
  {
    id: 'armero',
    nombre: 'Armero',
    habilidad: 'Descarta 1 pistola para revelar esta carta. Mientras esté revelada, siempre recuperas 1 pistola usada.',
    trigger: 'manual',
    activo: false,
    activar: (estado, jugadorId) => { /* TODO */ },
  },
  {
    id: 'herbolario',
    nombre: 'Herbolario',
    habilidad: 'Antes de elegir equipo: mueve el estado de fuera-de-servicio de un jugador a otro.',
    trigger: 'antes_elegir_equipo',
    activo: false,
    activar: (estado, jugadorId, origen, destino) => { /* TODO */ },
  },
  {
    id: 'contrabandista',
    nombre: 'Contrabandista',
    habilidad: 'Antes de robar cartas: el Capitán o Teniente elegido roba 3 cartas en vez de 2.',
    trigger: 'antes_robar_cartas',
    activo: false,
    activar: (estado, jugadorId, objetivo) => { /* TODO */ },
  },
  {
    id: 'contramaestre',
    nombre: 'Contramaestre',
    habilidad: 'Antes de robar cartas: intercambia el rol de Capitán o Teniente en el equipo actual.',
    trigger: 'antes_robar_cartas',
    activo: false,
    activar: (estado, jugadorId) => { /* TODO */ },
  },
  {
    id: 'pacificador',
    nombre: 'Pacificador',
    habilidad: 'Tras revelar pistolas: elige un jugador; sus pistolas no cuentan para el motín.',
    trigger: 'tras_revelar_pistolas',
    activo: false,
    activar: (estado, jugadorId, objetivo) => { /* TODO */ },
  },
  {
    id: 'cocinero',
    nombre: 'Cocinero Jefe',
    habilidad: 'Tras elegir equipo: el rol de Capitán pasa al jugador con menos currículums (en sentido horario).',
    trigger: 'tras_elegir_equipo',
    activo: false,
    activar: (estado, jugadorId) => { /* TODO */ },
  },
  {
    id: 'instigador',
    nombre: 'Instigador',
    habilidad: 'Tras revelar pistolas: elige un jugador; debe añadir todas sus pistolas al motín o voltear su carta.',
    trigger: 'tras_revelar_pistolas',
    activo: false,
    activar: (estado, jugadorId, objetivo) => { /* TODO */ },
  },
  {
    id: 'capitan',
    nombre: 'Capitán',
    habilidad: 'Se revela al inicio: eres el primer capitán. Roba una carta de personaje adicional.',
    trigger: 'inicio_partida',
    activo: true, // Esta sí se puede auto-aplicar (primer capitán)
    activar: (estado, jugadorId) => {
      estado.capitan = jugadorId;
    },
  },
  {
    id: 'juglar',
    nombre: 'Juglar',
    habilidad: 'Tras elegir equipo: 2 jugadores elegidos no participan en el motín.',
    trigger: 'tras_elegir_equipo',
    activo: false,
    activar: (estado, jugadorId, objetivos) => { /* TODO */ },
  },
  {
    id: 'espiritista',
    nombre: 'Espiritista',
    habilidad: 'En un turno con carta amarilla jugada: elige 2 jugadores; ambos dan 1 pistola a alguien.',
    trigger: 'carta_amarilla_jugada',
    activo: false,
    activar: (estado, jugadorId, objetivos) => { /* TODO */ },
  },
  {
    id: 'estratega',
    nombre: 'Gran Estratega',
    habilidad: 'Tras revelar pistolas: si no te conviertes en el nuevo capitán, recuperas tus pistolas reveladas.',
    trigger: 'tras_revelar_pistolas',
    activo: false,
    activar: (estado, jugadorId) => { /* TODO */ },
  },
  {
    id: 'alborotador2',
    nombre: 'Agitador',
    habilidad: 'Tras revelar pistolas: elige un jugador; sus pistolas cuentan como 2 en este motín.',
    trigger: 'tras_revelar_pistolas',
    activo: false,
    activar: (estado, jugadorId, objetivo) => { /* TODO */ },
  },
  {
    id: 'cleptomano',
    nombre: 'Cleptómano',
    habilidad: 'Elige un jugador: roba 1 pistola de su reserva y añádela a la tuya.',
    trigger: 'manual',
    activo: false,
    activar: (estado, jugadorId, objetivo) => { /* TODO */ },
  },
  {
    id: 'consultor',
    nombre: 'Consultor',
    habilidad: 'Antes de elegir equipo: tú nombras al siguiente Teniente; luego el Capitán elige al Navegante.',
    trigger: 'antes_elegir_equipo',
    activo: false,
    activar: (estado, jugadorId, tenienteId) => { /* TODO */ },
  },
];

const obtenerPersonajePorId = (id) => PERSONAJES.find(p => p.id === id) || null;
const obtenerPersonajesAleatorios = (cantidad) => {
  const copia = [...PERSONAJES];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, cantidad);
};

module.exports = { PERSONAJES, obtenerPersonajePorId, obtenerPersonajesAleatorios };
