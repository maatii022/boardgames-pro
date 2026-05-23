const ROLES = {
  MARINERO: 'marinero',
  PIRATA: 'pirata',
  CULTISTA: 'cultista',
  ADEPTO: 'adepto',
};

const FASES = {
  LOBBY: 'lobby',
  FASE_0: 'fase_0',
  DURMIENDO: 'durmiendo',
  FASE_1: 'fase_1',
  FASE_2: 'fase_2',
  FASE_3: 'fase_3',
  FASE_4: 'fase_4',
  FASE_5: 'fase_5',
  VICTORIA: 'victoria',
};

const EVENTOS = {
  UNIRSE_SALA: 'unirse-sala',
  CREAR_SALA: 'crear-sala',
  CONFIRMAR_ROL: 'confirmar-rol',
  ELEGIR_EQUIPO: 'elegir-equipo',
  VOTAR_MOTIN: 'votar-motin',
  ELEGIR_CARTA_COFRE: 'elegir-carta-cofre',
  ABRIR_COFRE: 'abrir-cofre',
  ACCION_RITUAL: 'accion-ritual',
  HOST_AVANZAR_FASE: 'host-avanzar-fase',
  HOST_RETROCEDER_FASE: 'host-retroceder-fase',
  HOST_REINICIAR: 'host-reiniciar',
  HOST_INICIAR_PARTIDA: 'host-iniciar-partida',
  SELECCIONAR_HOST: 'seleccionar-host',
  ACCION_LUPA: 'accion-lupa',
  ACCION_SIRENA: 'accion-sirena',
  ACCION_TELESCOPIO: 'accion-telescopio',
  SALA_ACTUALIZADA: 'sala-actualizada',
  FASE_CAMBIADA: 'fase-cambiada',
  ERROR: 'error',
  MOTIN_RESULTADO: 'motin-resultado',
  BARCO_MOVIDO: 'barco-movido',
  VICTORIA_DECLARADA: 'victoria-declarada',
  CARTA_COFRE: 'carta-cofre',
  RITUAL_REVELADO: 'ritual-revelado',
  ACCION_ESPECIAL: 'accion-especial',
};

const TIPOS_CARTA_NAVEGACION = {
  BORRACHO_AZUL: 'borracho_azul',
  DESARMADO_AZUL: 'desarmado_azul',
  LEVANTAMIENTO_CULTO: 'levantamiento_culto',
  BORRACHO_ROJO: 'borracho_rojo',
  SIRENA: 'sirena',
  TELESCOPIO: 'telescopio',
  ARMADO: 'armado',
};

const TIPOS_CARTA_RITUAL = {
  ALIJO_ARMAS: 'alijo_armas',
  REGISTRO_CAMAROTE: 'registro_camarote',
  CONVERSION_CULTO: 'conversion_culto',
};

const CONFIG_JUGADORES = {
  5:  { piratas: 2, cultistas: 1, marineros: 2, umbralMotin: 4 },
  6:  { piratas: 2, cultistas: 1, marineros: 3, umbralMotin: 5 },
  7:  { piratas: 2, cultistas: 1, marineros: 4, umbralMotin: 6 },
  8:  { piratas: 3, cultistas: 1, marineros: 4, umbralMotin: 7 },
  9:  { piratas: 3, cultistas: 1, marineros: 5, umbralMotin: 7 },
  10: { piratas: 3, cultistas: 1, marineros: 6, umbralMotin: 8 },
  11: { piratas: 4, cultistas: 1, marineros: 6, umbralMotin: 8 },
};

const TABLEROS = {
  PRINCIPAL: 'principal',
  LONG_JOURNEY: 'long_journey',
};

module.exports = { ROLES, FASES, EVENTOS, TIPOS_CARTA_NAVEGACION, TIPOS_CARTA_RITUAL, CONFIG_JUGADORES, TABLEROS };
