# Fotografiando Arjona

Galería fotográfica de Arjona, Jaén, realizada por Juan Martínez Gómez.

## Ejecutar en local

Requiere Node.js 20 o posterior. Desde esta carpeta:

```powershell
npm start
```

Abre `http://localhost:4173/`.

## Publicación

El repositorio publica automáticamente la web en GitHub Pages cada vez que se actualiza la rama `main`. La dirección pública es:

https://pitercillo091.github.io/fotografiando-arjona/

El flujo de GitHub Actions prepara una copia estática en `_site`; las fotos originales guardadas en `GALERIA DE FOTOS`, el archivo de respaldo y los materiales de trabajo no forman parte de la web publicada.

## Añadir fotografías

1. Copia las versiones que quieras mostrar a `public/images` sin borrar ni modificar los originales.
2. Añade cada archivo al catálogo `data/photos.js`, indicando su nombre, dimensiones y descripción alternativa. Si tiene versión AVIF, conserva también su JPG de reserva y las variantes de `public/images/optimized` que ya utilice el catálogo.
3. Comprueba las rutas y ejecuta `npm run check`.
4. Haz commit y push a `main`; GitHub Pages volverá a publicar la web.

Las imágenes deben tener un texto alternativo objetivo. No asignes años ni lugares concretos si no están confirmados. La portada se define en `enhancements.css` y en los metadatos de `index.html`.

## Juego de observación

Las preguntas están en `data/quiz.js`. Cada entrada necesita:

- `image`: nombre exacto de un archivo que ya exista en `public/images` y proceda de `GALERIA DE FOTOS`.
- `alt`: descripción objetiva de la imagen.
- `question`, `options` y `correctAnswer`: tres opciones y el índice de una única respuesta válida.
- `explanation`: explicación breve después de responder.
- `source` y `sourceLabel` cuando la respuesta use información histórica, cultural o turística.
- `category`: `fiestas`, `observacion`, `luz` o `contexto`.

Para añadir una pregunta, copia una entrada de `data/quiz.js`, cambia el `id`, selecciona una fotografía revisada y comprueba que la respuesta pueda defenderse con la imagen o con la fuente enlazada. El sistema mezcla las opciones de forma determinista, muestra una pregunta cada vez y precarga solo la imagen que corresponde al estado actual.

Después de editar, ejecuta `npm run check` y abre `http://localhost:4173/`. La sección aparece en `#juego` y también está enlazada desde la navegación superior.

## Agenda

Los eventos están centralizados en `data/agenda.js`. Cada entrada incluye título, fechas, hora cuando se conoce, lugar, categoría, estado, descripción, fotografía opcional y fuente. Los estados disponibles son `confirmado`, `recurrente`, `fecha-tradicional`, `pendiente-confirmar` y `cancelado`.

Para actualizar la agenda, modifica únicamente ese archivo y conserva las fechas en formato `AAAA-MM-DD`. Usa `dateLabel` cuando la fuente solo publique un mes o un periodo aproximado. No marques como `confirmado` un evento cuya fecha exacta todavía no esté publicada. La sección agrupa automáticamente los eventos por mes, ordena las fechas y genera los filtros según las categorías disponibles.

Fiestasantos 2027 está guardada como `fecha-tradicional` porque la fuente consultada documenta el periodo anual y el día principal tradicional, pero el programa específico de 2027 aún no está publicado. Cuando aparezca, sustituye sus fechas, descripción y fuente en `data/agenda.js` y cambia el estado a `confirmado` únicamente si existe una publicación oficial.

## Historias y buscador

Los recorridos fotográficos están centralizados en `data/stories.js`. Cada historia contiene un título, una introducción, una categoría y una lista de identificadores existentes en `data/photos.js`. Para crear otra, añade una entrada con fotografías revisadas y comprueba sus identificadores antes de publicar.

El buscador de la galería trabaja en el navegador sobre los datos ya disponibles. Busca en el identificador, nombre de archivo, título, descripción, texto alternativo y categoría. No envía consultas ni fotografías a servicios externos.

El archivo de agenda se prepara en `agendaArchive` dentro de `data/agenda.js`. Cada cierre mensual puede añadir allí los eventos celebrados con `archiveMonth`, manteniendo separada la agenda futura. La interfaz mostrará automáticamente los meses archivados cuando exista contenido.
