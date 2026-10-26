# Entre páginas — web de lectura

Una web estática en español para publicar una novela por capítulos. Diseñada con una estética editorial oscura, acentos suaves y paneles Liquid Glass discretos.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube `index.html`, `styles.css`, `app.js` y `chapters.js` a la raíz del repositorio.
3. Entra en **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**, elige `main` y la carpeta `/ (root)`.
5. Guarda y espera a que GitHub Pages publique el sitio.

No necesita servidor, instalación ni proceso de compilación. La tipografía externa utiliza Google Fonts; si no hay conexión, se aplicarán fuentes alternativas.

## Añadir capítulos

Edita `chapters.js`. La novela se guarda en `window.NOVEL_CHAPTERS`, una lista de objetos. Añade un objeto por capítulo siguiendo esta estructura:

```js
{
  id: 2,
  title: "Título del capítulo",
  paragraphs: [
    "Primer párrafo.",
    "—Diálogo del personaje.",
    "Siguiente párrafo."
  ]
}
```

Cada elemento de `paragraphs` se muestra como un párrafo separado. El texto del capítulo 1 incluido en el proyecto corresponde al contenido proporcionado por el autor. No se han inventado capítulos adicionales.

## Funciones incluidas

- Índice de capítulos en un panel lateral.
- Navegación entre capítulos y acceso a la página de inicio.
- Modo claro/oscuro con preferencia guardada.
- Ajuste del tamaño de fuente y del ancho de lectura.
- Barra de progreso de lectura y guardado de posición en `localStorage`.
- Diseño responsive, foco visible, navegación por teclado y respeto por `prefers-reduced-motion`.
- Sin registro, comentarios, valoraciones ni dependencias de JavaScript externas.

## Nota sobre el progreso

El progreso se guarda localmente en el navegador del dispositivo. No se sincroniza entre dispositivos ni navegadores. La barra representa el avance de desplazamiento dentro de la vista del capítulo.
