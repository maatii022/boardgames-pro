# Feed The Kraken — Web App

## Desarrollo local

```bash
# Terminal 1 — Servidor
cd servidor
npm install
npm run dev

# Terminal 2 — Cliente
cd cliente
npm install
npm run dev
```

Cliente en `http://localhost:5173` · Servidor en `http://localhost:3001`

---

## Despliegue en Render (paso a paso)

### 1. Sube el proyecto a GitHub
- Crea un repo en github.com (puede ser privado)
- Sube la carpeta `feed-the-kraken/` completa

### 2. Crea el servicio en Render
- Ve a https://render.com y crea cuenta gratuita
- New → Web Service
- Conecta tu repo de GitHub
- Configura:
  - **Name:** feed-the-kraken
  - **Root Directory:** servidor
  - **Runtime:** Node
  - **Build Command:** `npm install && npm run build`
  - **Start Command:** `npm start`
  - **Plan:** Free

### 3. Actualiza la URL del cliente
- Una vez desplegado, Render te dará una URL tipo:
  `https://feed-the-kraken-xxxx.onrender.com`
- Edita `cliente/.env.production` y pon esa URL
- Haz commit y push — Render redesplegará automáticamente

### 4. ¡Listo!
- Pantalla grande: `https://feed-the-kraken-xxxx.onrender.com/tablero`
- Móvil jugador: `https://feed-the-kraken-xxxx.onrender.com/unirse`
- Host: `https://feed-the-kraken-xxxx.onrender.com/crear`

### Nota sobre cold starts
El plan gratuito de Render "duerme" el servidor tras 15 min de inactividad.
La primera petición puede tardar ~30 segundos en despertar.
Para pruebas internas es perfectamente funcional.
