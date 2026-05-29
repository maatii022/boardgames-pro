# /tablero/cartas-nav/

Assets PNG de las cartas de navegación.

## Anversos (por color y tipo)

| Archivo                    | Color   | Tipo de carta          |
|----------------------------|---------|------------------------|
| `carta-amarilla.png`       | Amarillo| Todas las amarillas    |
| `carta-azul-borracho.png`  | Azul    | Borracho               |
| `carta-azul-desarmado.png` | Azul    | Desarmado              |
| `carta-roja-borracho.png`  | Rojo    | Borracho               |
| `carta-roja-sirena.png`    | Rojo    | Sirena                 |
| `carta-roja-telescopio.png`| Rojo    | Telescopio             |

## Reverso

| Archivo            | Descripción          |
|--------------------|----------------------|
| `carta-reverso.png`| Reverso genérico (mazo y fallback) |

## Selección automática
La función `getCartaNavSrc(color, nombre)` en `Tablero.jsx`
elige el asset correcto a partir del color y el nombre de la carta.
