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
