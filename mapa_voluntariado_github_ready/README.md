# Mapa de voluntariado — GitHub Pages + Supabase

Sitio web estático para visualizar puntos de voluntariado sobre un mapa, consultar sus campos, recibir comentarios y permitir que visitantes propongan nuevos puntos.

## Contenido del proyecto

- `index.html` — página pública.
- `admin.html` — panel de moderación.
- `app.js` — lógica del mapa, filtros, comentarios y formulario.
- `styles.css` — estilos.
- `seed-data.json` — datos iniciales extraídos de `Mapa voluntariado(1).xlsx` (25 registros).
- `supabase-schema.sql` — tablas, RLS, políticas y carga inicial para Supabase.
- `config.js` — configuración pública del proyecto Supabase; debes completar sus dos valores.
- `config.example.js` — ejemplo de configuración.
- `.nojekyll` — evita el procesamiento Jekyll de GitHub Pages.
- `.gitignore` — archivos locales que no deben subirse.

## 1. Crear el proyecto en Supabase

1. Entra a <https://supabase.com/> y crea un proyecto.
2. Abre **SQL Editor**.
3. Crea una consulta nueva.
4. Copia y ejecuta todo el contenido de `supabase-schema.sql`.
5. En **Authentication → Users**, crea el usuario que administrará el sitio.
6. Copia el UUID de ese usuario.
7. En **SQL Editor**, ejecuta:

```sql
insert into public.admins (user_id)
values ('UUID-DEL-USUARIO-ADMIN');
```

Reemplaza el UUID por el real.

## 2. Configurar la web

En Supabase entra a **Project Settings → API** y copia:

- **Project URL**
- **Publishable key** (o la clave pública/anon de tu proyecto, según la interfaz de Supabase)

Edita `config.js`:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "TU-CLAVE-PUBLICA"
};
```

### Importante

No coloques nunca una `service_role` key ni una clave secreta en `config.js`. Este archivo se entrega al navegador y quedará visible públicamente.

## 3. Probar localmente

No abras `index.html` con doble clic, porque el navegador puede bloquear la carga de `seed-data.json`. Usa un servidor local.

Con Python:

```bash
python -m http.server 8000
```

Luego abre <http://localhost:8000/>.

Para revisar el panel administrativo abre <http://localhost:8000/admin.html>.

## 4. Subir a GitHub

1. Crea un repositorio nuevo en GitHub, por ejemplo `mapa-voluntariado`.
2. Sube **el contenido de esta carpeta**, no la carpeta contenedora dentro de otra carpeta.
3. Verifica que `index.html` quede en la raíz del repositorio.
4. Haz commit de los archivos.

La estructura debe verse así:

```text
mapa-voluntariado/
├── .gitignore
├── .nojekyll
├── index.html
├── admin.html
├── app.js
├── styles.css
├── config.js
├── config.example.js
├── seed-data.json
├── supabase-schema.sql
└── README.md
```

## 5. Activar GitHub Pages

En el repositorio abre:

**Settings → Pages**

Selecciona:

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/ (root)`

Guarda los cambios.

GitHub generará una dirección similar a:

```text
https://TUUSUARIO.github.io/mapa-voluntariado/
```

## 6. Qué ocurre en producción

La arquitectura es:

```text
Visitante
   ↓
GitHub Pages
   ↓
Supabase
   ├── puntos aprobados
   ├── comentarios aprobados
   ├── propuestas de nuevos puntos
   └── moderación administrativa
```

Los visitantes pueden:

- consultar los puntos aprobados;
- buscar y filtrar;
- abrir la ficha de un punto;
- enviar comentarios;
- proponer nuevos puntos desde el formulario.

Los comentarios y puntos nuevos se guardan inicialmente como `pending`. El administrador debe aprobarlos desde `admin.html`.

## 7. Datos del Excel

El archivo `seed-data.json` contiene los **25 registros** del Excel nuevo.

Dos registros del Excel no tenían nombre. Para que puedan mostrarse y guardarse correctamente, se etiquetaron como `Punto por identificar (#20)` y `Punto por identificar (#23)` y se dejó una nota dentro de su descripción indicando que el nombre no estaba registrado.

El primer registro contiene en la columna de contacto el valor `30169834353022500000`, exactamente como fue interpretado por el archivo Excel. Conviene verificar ese dato antes de publicar definitivamente el mapa.

## 8. Actualizar los datos después

Si luego recibes otro Excel, reemplaza `seed-data.json` y actualiza la sección de datos iniciales de `supabase-schema.sql` antes de ejecutar una migración en Supabase.

No vuelvas a ejecutar un seed sobre una base de datos de producción sin revisar qué registros quieres actualizar.

## 9. Seguridad y moderación

La base de datos usa Row Level Security (RLS):

- visitantes: leen únicamente puntos y comentarios aprobados;
- visitantes: pueden insertar propuestas/comentarios que nacen como pendientes;
- administradores autenticados: pueden revisar, aprobar, rechazar y ocultar contenido.

Para un sitio totalmente abierto, considera además protección anti-spam (por ejemplo, CAPTCHA, rate limiting o una capa de Edge Function) antes de difundir la URL públicamente.

## Licencias de los mapas

El mapa utiliza Leaflet y los mosaicos de OpenStreetMap. Mantén la atribución visible que ya está incluida en la página.
