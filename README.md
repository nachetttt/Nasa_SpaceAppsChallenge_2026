# Misión Zafiro (Angular, versión para niños)

Juego educativo, creativo y visual en **Angular** (standalone), basado en el documento `nasa.pdf`. Está adaptado **para niños**: lenguaje sencillo, historia divertida y **minijuegos interactivos**.

## Historia
Eres un astronauta en una misión secreta. Unos ladrones espaciales van al planeta **HAT-P-7b** (en la constelación del Cisne), famoso porque sus nubes pueden tener **corindón** (el mineral de los zafiros y rubíes). Tienes **7 días** para evitar que se lleven las gemas haciendo que la nave baje sus recursos por debajo del **25%**.

## Cómo se juega
- **Objetivo:** dejar los 3 recursos en menos de **25%** al terminar el día 7.
- **Recursos:**
  - ⚡ **Energía** (electricidad de la nave)
  - 🫁 **Soporte vital** (aire, agua y plantitas), inspirado en el sistema **ECLSS** de la NASA
  - 🛡️ **Escudo** (protección contra rayos/radiación espacial)
- **Días 1, 3, 5, 7:** 3 decisiones con consecuencias y aprendizajes.
- **Días 2, 4, 6:** minijuegos interactivos.
- **Cada día:** informe de NOVA (robot amiga) y una carta a la NASA con lo aprendido.

## Minijuegos interactivos
- **Día 2 – Cables Brillantes:** memoriza y repite la secuencia de colores.
- **Día 4 – Atrapa los Rayos:** haz clic en rayos espaciales que aparecen y desaparecen (tiempo limitado).
- **Día 6 – Misión Sigilosa:** mueve al astronauta en una cuadrícula con botones hasta la computadora del ECLSS evitando robots guardianes.

## Ciencia y datos de NASA (base educativa)
El juego se inspira en recursos y conjuntos de datos reales de la NASA (sin inventar cifras técnicas):
- **NASA APIs:** https://api.nasa.gov/
- **Clima espacial / radiación (DONKI, CCMC):** https://ccmc.gsfc.nasa.gov/tools/DONKI/
- **Radiación y salud en misiones (OSDR):** https://osdr.nasa.gov/bio/repo/
- **RadLab Data API:** https://visualization.osdr.nasa.gov/radlab/gui/data-api/
- **Mars Trek (referencia de exploración):** https://trek.nasa.gov/mars/

Conceptos incluidos: ECLSS (reciclaje de aire/agua y soporte vital), importancia del escudo ante la radiación, relación energía↔luz↔crecimiento de plantas, y HAT-P-7b como exoplaneta extremo con indicios de nubes de corindón (Al₂O₃).

## Requisitos y ejecución
Requiere Node.js y npm.

```bash
npm install
npm start
# o: npx ng serve
```
Abrir `http://localhost:4200/`.

## Estructura
- `src/app/app.component.ts`: lógica del juego y minijuegos interactivos.
- `src/app/app.component.html`: interfaz y pantallas.
- `src/app/app.component.css`: estilos visuales/animaciones.
- `src/styles.css`: tema espacial global.
- Proyecto Angular standalone (sin NgModules).
