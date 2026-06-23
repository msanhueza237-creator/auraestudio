# Aura Estudio - Sistema de Gestión para Peluquerías y Estética

Aura Estudio es una aplicación web premium diseñada para gestionar peluquerías, salones de belleza y centros de estética. Permite administrar citas, fichas de clientes, catálogos de servicios, inventarios de stock con descuento automático por consumo y visualización de márgenes operativos a través de un panel de control con analíticas.

## Stack Tecnológico

*   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS (v4), Recharts para gráficas y Lucide React para iconos.
*   **Formularios y Validación**: React Hook Form y Zod.
*   **Backend & Base de datos**: Supabase (Postgres, Auth, Row Level Security).
*   **Despliegue**: Docker y VPS utilizando Dokploy.

---

## Estructura del Proyecto

```text
app/                 # Rutas de Next.js (App Router)
  (auth)/            # Vistas públicas de autenticación (login, registro, recuperación)
  app/               # Panel privado (dashboard, agenda, clientes, productos, servicios)
  api/health         # Endpoint de salud para Dokploy / VPS checking
components/          # Componentes compartidos de la interfaz
lib/
  supabase/          # Clientes y middleware de Supabase Auth SSR
  validations/       # Esquemas de validación con Zod
actions/             # Lógica de escritura y lectura mediante Server Actions
types/               # Tipos TypeScript de base de datos
supabase/
  migrations/        # Migraciones SQL de base de datos
Dockerfile           # Configuración de compilación para Dokploy
docker-compose.yml   # Orquestación de Docker local
.env.example         # Plantilla de variables de entorno
```

---

## 1. Configuración de Base de Datos en Supabase

Para inicializar la base de datos de Aura Estudio:

1.  Crea un nuevo proyecto en la plataforma de [Supabase](https://supabase.com/).
2.  Accede a la pestaña **SQL Editor** en el panel de tu proyecto.
3.  Copia el contenido del archivo de migración [`supabase/migrations/0001_initial_schema.sql`](file:///c:/Users/msanh/OneDrive/Escritorio/aura%20studio/APP%20aura%20estudio%20antigravity/supabase/migrations/0001_initial_schema.sql) y ejecútalo.
4.  Esto configurará automáticamente:
    *   Las tablas relacionales (`profiles`, `clients`, `services`, `products`, `appointments`, `appointment_services`, `service_product_usage`, `stock_movements`, `time_entries`).
    *   Triggers de marca de tiempo `updated_at`.
    *   El trigger que sincroniza nuevos registros de `auth.users` creando perfiles públicos en `profiles`.
    *   Vistas de base de datos para el dashboard.
    *   Funciones Postgres para el cálculo de costos y totales de facturación.
    *   Políticas RLS que aseguran aislamiento absoluto entre usuarios.

---

## 2. Instalación y Ejecución Local

### Requisitos Previos

*   Node.js 20 o superior instalado.
*   Una base de datos de Supabase configurada.

### Pasos

1.  Clona el repositorio en tu máquina local.
2.  Instala las dependencias necesarias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env` en el directorio raíz basándote en la plantilla `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  Configura las variables correspondientes a tu proyecto de Supabase en el archivo `.env`:
    *   `NEXT_PUBLIC_APP_URL`: Dirección de la app local (generalmente `http://localhost:3000`).
    *   `NEXT_PUBLIC_SUPABASE_URL`: La URL de tu proyecto de Supabase.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: La clave pública anon de tu proyecto.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Clave de rol de servicio (generalmente no requerida gracias a las políticas RLS directas).
5.  Inicia el servidor de desarrollo local:
    ```bash
    npm run dev
    ```
6.  Abre `http://localhost:3000` en tu navegador.

---

## 3. Lógica de Stock y Costos

*   **Descuento de Stock**: Cuando agregas un consumo de producto en la ficha del servicio prestado (`/app/servicios-prestados`), el stock actual del producto disminuye por la cantidad seleccionada. Si eliminas el consumo o el servicio, el stock se reintegra.
*   **Costo de Mano de Obra**: Se calcula multiplicando el tiempo empleado real (minutos) entre 60 por la tarifa por hora configurada en la sección de **Ajustes** (`/app/ajustes`):
    $$\text{costo\_mo} = \frac{\text{minutos}}{60} \times \text{tarifa\_hora}$$
*   **Costo Total del Servicio**: Suma del costo de los productos consumidos más el costo de mano de obra.
*   **Margen Comercial**: Se define como el ingreso del servicio cobrado menos el costo total operativo del mismo.

---

## 4. Despliegue en VPS con Dokploy

Aura Estudio se encuentra configurado para un despliegue de alto rendimiento mediante contenedores Docker.

### Variables de Entorno en Dokploy

En el panel de control de Dokploy, añade las siguientes variables de entorno para la aplicación:

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio-produccion.com
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica-anon-real
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role-real
```

### Proceso de Despliegue

1.  Conecta tu repositorio de GitHub a Dokploy.
2.  Crea una nueva **Aplicación** en Dokploy.
3.  Selecciona el método de compilación **Dockerfile**.
4.  Configura el puerto expuesto en `3000`.
5.  Configura las variables de entorno listadas arriba.
6.  Configura tu dominio y activa la opción de **Certificado SSL (HTTPS)**.
7.  Presiona **Deploy** (Desplegar).
8.  Verifica que el endpoint de salud `/api/health` responda correctamente en producción: `https://tu-dominio-produccion.com/api/health`.
