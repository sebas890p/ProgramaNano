# Agente Nano · Programa interactivo

Programa web para explorar en 3D el artefacto de Nano (vista general, transparencia, acercamiento, corte y despiece) y consultar los gráficos y mapas del caso.

## Archivos

```
index.html               Programa (todas las pantallas)
manual.html              Manual de usuario y lenguaje gráfico
css/estilo.css           Estilo final con el lenguaje gráfico
js/app.js                Navegación y pantallas
js/rueda.js              Rueda 3D con Three.js
js/juego.js              Minijuego Recarga cósmica (canvas)
graficos-mapas/index.html  Copia de AgenteNanoMapas con un parche para abrir cada vista por URL
```

## Publicar en GitHub Pages

1. Crea un repositorio nuevo (por ejemplo `AgenteNanoPrograma`) y sube todos los archivos tal cual, respetando las carpetas.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. Espera uno o dos minutos y abre `https://<tu-usuario>.github.io/AgenteNanoPrograma/`.

No necesita instalar nada: Three.js, Leaflet y las fuentes (Bangers, Baloo 2 y Patrick Hand) se cargan desde internet.

## Probarlo en tu computador

Los módulos de JavaScript no funcionan abriendo el archivo con doble clic. Usa un servidor local, por ejemplo en VS Code con la extensión **Live Server**, o en una terminal dentro de la carpeta:

```
python -m http.server 8000
```

y abre `http://localhost:8000`.

## Rutas

Cada pantalla tiene su dirección, útil para enlazar directo:

- `#/inicio`, `#/elegir`, `#/datos`, `#/juego`
- `#/artefacto/general`, `#/artefacto/transparencia`, `#/artefacto/acercamiento`, `#/artefacto/corte`, `#/artefacto/despiece`
- `#/ver/bars`, `#/ver/pie`, `#/ver/line`, `#/ver/radar`, `#/ver/donut`, `#/ver/cmp`, `#/ver/mapaolores`, `#/ver/mapaenemigos`

## Historia escondida

En la vista general hay cinco personajes alrededor de la rueda. Al pasar el cursor muestran una pregunta y al tocarlos se despliega su gráfico o mapa en una ventana, sin salir del artefacto:

| Personaje | Abre |
|---|---|
| Enemigo (ratón) | Mapa de enemigos por zona |
| Nano | Poderes, nivel de cada poder, antes y después |
| Tomates | Aromas que percibe, mapa de olores |
| Esfera de luz | Evolución de la historia |
| Barrio (árbol) | Elementos del entorno de Nano |

Los textos y qué gráfico abre cada personaje están en `HISTORIA`, al comienzo de `js/app.js`. El menú de Gráficos y mapas sigue igual.

## Minijuego Recarga cósmica

Nano corre en su rueda: la energía solo sube en la zona de carga (velocidad alta) y a toda velocidad aparecen tornillos que hay que saltar. PC: ← → o A D para correr, Espacio/↑/W para saltar. Celular: botones Correr y ¡Saltar!. La dificultad se ajusta con las constantes al comienzo de `js/juego.js` (`DURACION`, `IMPULSO`, `FRENADO`, `ZONA_CARGA`, `CARGA_MAX`...). El récord se guarda solo en el navegador de cada persona.

## Gráficos y mapas

`graficos-mapas/index.html` es tu página AgenteNanoMapas con dos cambios al final del archivo: abre la vista que viene en la URL (`index.html#pie`) y oculta "← Volver al menú" cuando está dentro del programa. Si actualizas tu página original, copia de nuevo el archivo y vuelve a pegar ese bloque marcado con `Parche para el programa Agente Nano`.
