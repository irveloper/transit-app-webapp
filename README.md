# Public Transit App - Web App

Frontend de [Public Transit App](https://github.com/irveloper/transit-app-webapp), una aplicacion colaborativa de transporte publico para ciudades de LATAM donde Google Maps no tiene cobertura de transito.

> Es Waze, pero para el transporte publico de LATAM.

## Features

- **Mapa interactivo** — Visualizacion de paradas y rutas en tiempo real con Leaflet
- **Check-in en tiempo real** — Reporta tu estado: esperando en parada, arriba del autobus, condiciones del viaje
- **Explorador de rutas** — Busca que autobus tomar para ir del punto A al punto B
- **Prediccion inteligente** — Estimacion del mejor momento para salir a tu parada (powered by LLMs)
- **Admin panel** — Gestion de paradas y rutas en `/admin`
- **PWA ready** — Instalable como app nativa en dispositivos moviles

## Tech Stack

| Tecnologia | Uso |
|---|---|
| [Next.js](https://nextjs.org/) 16 | Framework React |
| [Tailwind CSS](https://tailwindcss.com/) 4 | Estilos |
| [Leaflet](https://leafletjs.com/) + React Leaflet | Mapas interactivos |
| [Sileo](https://www.npmjs.com/package/sileo) | State management |
| [Lucide](https://lucide.dev/) | Iconos |
| [Biome](https://biomejs.dev/) | Linter y formatter |

## Estructura del proyecto

```
src/
  app/                    # Pages (App Router)
    page.tsx              # Pagina principal con mapa
    admin/page.tsx        # Panel de administracion
  features/
    check-in/             # Check-in de usuarios en paradas
    intelligence/         # Prediccion de retrasos con IA
    journey-planner/      # Planificador de viajes A -> B
    route-explorer/       # Explorador de rutas disponibles
    stop-manager/         # CRUD de paradas (admin)
    transit-map/          # Mapa principal con Leaflet
  shared/
    api/                  # Cliente API
    ui/                   # Componentes compartidos (toasts)
```

## Requisitos

- Node.js >= 18
- pnpm

## Setup

```bash
# Instalar dependencias
pnpm install

# Variables de entorno
cp .env.example .env.local
# Configurar NEXT_PUBLIC_API_URL

# Iniciar en desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts

| Comando | Descripcion |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de produccion |
| `pnpm start` | Servidor de produccion |
| `pnpm lint` | Lint con Biome |
| `pnpm format` | Formatear codigo con Biome |

## Deploy

Desplegado en **CubePath** como contenedor independiente.

- **Demo**: [transitbackendapp-transitappwebapp-pusca-98e5c4-107-148-105-28.traefik.me](https://transitbackendapp-transitappwebapp-pusca-98e5c4-107-148-105-28.traefik.me/)

---

Hackathon CubePath x Midudev 2026
