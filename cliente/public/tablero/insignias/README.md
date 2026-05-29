# /tablero/insignias/

Assets para la ceremonia de equipo y las insignias del panel de jugadores.

## Carteles de ceremonia (overlay grande)
Aparecen en pantalla completa cuando se asigna capitán y su equipo.
Recomendado: PNG con fondo transparente, relación ~2:3 (ancho:alto).

| Archivo               | Descripción                              | Ancho usado |
|-----------------------|------------------------------------------|-------------|
| `cartel-capitan.png`  | Cartel/banner grande "Capitán"           | 250 px      |
| `cartel-teniente.png` | Cartel/banner "Teniente"                 | 190 px      |
| `cartel-navegante.png`| Cartel/banner "Navegante"                | 190 px      |

> Si el archivo no existe, el código lo ignora (`onError → display:none`)
> y solo se muestra el nombre del jugador.

## Insignias de panel (pequeñas, lista de jugadores)
Actualmente referenciadas desde `/tablero/ui/` — si se mueven aquí
actualizar las rutas en `Tablero.jsx` (búsqueda: `/tablero/ui/insignia-`).

| Archivo                 | Descripción          | Tamaño usado |
|-------------------------|----------------------|--------------|
| `insignia-capitan.png`  | Icono pequeño capitán | 22 × 22 px   |
| `insignia-teniente.png` | Icono pequeño teniente| 22 × 22 px   |
| `insignia-navegante.png`| Icono pequeño navegante| 22 × 22 px  |
