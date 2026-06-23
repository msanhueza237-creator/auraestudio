# Prompt para Google Antigravity: construir App Aura Estudio

Actúa como un ingeniero full-stack senior especializado en **Next.js App Router**, **Tailwind CSS**, **Supabase Postgres**, **Supabase Auth**, **TypeScript**, **Docker** y despliegues en **VPS con Dokploy**.

Debes construir una aplicación completa llamada **Aura Estudio**, basada en el archivo de especificación técnica:

```text
plan-maestro-app-aura-estudio.md
```

Ese archivo es la fuente principal de verdad para arquitectura, base de datos, rutas, módulos, seguridad, despliegue y criterios de aceptación.

## Contexto del producto

Aura Estudio es una app web para gestionar una peluquería o estudio de belleza. Debe permitir a cada usuario registrado gestionar:

- Agenda de citas.
- Clientes.
- Servicios prestados.
- Catálogo de servicios.
- Stock de productos.
- Productos utilizados en cada servicio.
- Tiempo empleado.
- Costes de servicios prestados.
- Dashboard con métricas, gráficas y filtros.

Cada usuario debe ver únicamente sus propios registros.

## Diseño visual

Voy a entregarte una **captura de pantalla como referencia de diseño**.

Debes analizar esa captura y usarla como guía visual para:

- Paleta de colores.
- Jerarquía visual.
- Espaciados.
- Bordes.
- Botones.
- Cards.
- Tablas.
- Formularios.
- Sidebar.
- Topbar.
- Estilo general de dashboard.

No copies texto irrelevante de la captura si no corresponde al producto. Usa la captura como referencia estética y de layout, pero adapta todo al dominio de Aura Estudio.

Si la captura contradice alguna parte funcional del plan maestro, prioriza la funcionalidad del plan maestro y conserva la inspiración visual de la captura.

## Objetivo de ejecución

Debes crear el sistema completo, no solo un prototipo visual.

Implementa:

1. Proyecto Next.js con TypeScript, App Router y Tailwind CSS.
2. Autenticación con Supabase Auth.
3. Base de datos Supabase con SQL completo.
4. RLS para aislamiento por usuario.
5. CRUD completo de clientes, productos, servicios y citas.
6. Registro de servicios prestados.
7. Registro de productos usados y descuento de stock.
8. Cálculo de coste, ingreso y margen.
9. Dashboard con métricas, filtros y gráficas.
10. Preparación para despliegue en Dokploy.
11. Documentación de instalación y despliegue.

## Reglas técnicas obligatorias

- Usa **Next.js App Router**.
- Usa **TypeScript** en todo el proyecto.
- Usa **Tailwind CSS** para estilos.
- Usa **Supabase** para autenticación y base de datos.
- Usa `@supabase/ssr` para compatibilidad con SSR y cookies.
- Usa **Server Actions** para operaciones de escritura cuando sea razonable.
- Usa **Zod** para validaciones.
- Usa **React Hook Form** para formularios.
- Usa **Recharts** para gráficas.
- Usa **lucide-react** para iconos.
- No uses datos mock como solución final.
- No mezcles datos entre usuarios.
- No expongas `SUPABASE_SERVICE_ROLE_KEY` en cliente.
- No guardes archivos `.env` reales en Git.

## Variables de entorno

Crea `.env.example` con:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Usa:

- `NEXT_PUBLIC_SUPABASE_URL` en cliente y servidor.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` en cliente y servidor.
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor si fuese estrictamente necesario.

## Flujo de trabajo requerido

Ejecuta el proyecto en este orden:

### 1. Leer especificación

Lee completamente `plan-maestro-app-aura-estudio.md`.

Extrae de ahí:

- Estructura de carpetas.
- Rutas públicas y privadas.
- Modelo de datos.
- SQL.
- Server Actions.
- Módulos funcionales.
- Requisitos de seguridad.
- Despliegue en Dokploy.

### 2. Analizar captura de diseño

Cuando reciba la captura de pantalla:

- Identifica estilo visual.
- Define tokens visuales en Tailwind.
- Ajusta componentes principales al diseño.
- Crea un layout coherente para Aura Estudio.

Mantén la app usable y profesional.

### 3. Crear proyecto base

Si el proyecto no existe, créalo con:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app
```

Instala:

```bash
npm install @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers recharts lucide-react
```

Si decides usar shadcn/ui, instálalo y úsalo de forma consistente.

### 4. Crear estructura del proyecto

Respeta esta organización:

```text
app/
  (auth)/
  app/
  api/
components/
lib/
actions/
types/
supabase/
public/
```

Las rutas privadas deben vivir bajo:

```text
/app/dashboard
/app/agenda
/app/clientes
/app/productos
/app/servicios
/app/servicios-prestados
/app/ajustes
```

### 5. Crear base de datos

Crea:

```text
supabase/migrations/0001_initial_schema.sql
```

Incluye el SQL completo definido en el plan maestro:

- `profiles`
- `clients`
- `services`
- `products`
- `appointments`
- `appointment_services`
- `service_product_usage`
- `stock_movements`
- `time_entries`
- Vista de dashboard
- Triggers
- Funciones
- Índices
- Políticas RLS

No omitas las políticas RLS.

### 6. Implementar autenticación

Crea:

- Login.
- Registro.
- Logout.
- Recuperación de contraseña.
- Actualización de contraseña.
- Middleware de protección.
- Cliente Supabase de navegador.
- Cliente Supabase de servidor.

Comportamiento esperado:

- Usuario no autenticado en `/app/*` debe ir a `/login`.
- Usuario autenticado en `/login` o `/registro` debe ir a `/app/dashboard`.
- Tras registro exitoso, crear o garantizar perfil en `profiles`.

### 7. Implementar layout privado

El layout privado debe incluir:

- Sidebar con navegación.
- Topbar.
- Nombre del usuario o negocio.
- Logout.
- Contenedor responsive.

Usa la captura de diseño como referencia visual.

### 8. Implementar CRUDs

Implementa CRUD completo para:

- Clientes.
- Servicios.
- Productos.
- Citas.

Cada CRUD debe tener:

- Tabla.
- Buscador.
- Filtros básicos.
- Crear.
- Editar.
- Eliminar.
- Confirmación antes de eliminar.
- Validación Zod.
- Estados de carga.
- Estado vacío.
- Mensajes de error.

### 9. Implementar servicios prestados

Permite:

- Asociar servicios a una cita.
- Registrar minutos reales.
- Registrar precio cobrado.
- Registrar productos usados.
- Calcular coste de productos.
- Calcular coste de mano de obra.
- Calcular coste total.
- Calcular margen.
- Descontar stock al completar o confirmar consumo.

Fórmulas:

```text
coste_mano_obra = minutos_empleados / 60 * coste_hora_usuario
coste_total = coste_productos_consumidos + coste_mano_obra
margen = precio_cobrado - coste_total
```

### 10. Implementar dashboard

El dashboard debe mostrar:

- Coste total.
- Ingresos.
- Margen.
- Citas del periodo.
- Horas trabajadas.
- Servicios más frecuentes.
- Productos más consumidos.
- Stock bajo.
- Próximas citas.

Incluye filtros:

- Rango de fechas.
- Cliente.
- Servicio.
- Estado.
- Producto.

Incluye gráficas con Recharts:

- Coste por mes.
- Ingresos por mes.
- Margen por mes.
- Consumo de productos.
- Servicios por categoría.

### 11. Preparar despliegue en Dokploy

Crea:

- `Dockerfile`.
- `next.config.ts` con `output: "standalone"`.
- `.dockerignore`.
- Endpoint `/api/health`.
- README con instrucciones de despliegue.

El README debe explicar:

- Instalación local.
- Variables de entorno.
- Ejecución del SQL en Supabase.
- Desarrollo local.
- Build.
- Despliegue en Dokploy.

### 12. Verificar

Antes de finalizar:

- Ejecuta `npm run lint`.
- Ejecuta `npm run build`.
- Corrige errores.
- Verifica rutas principales.
- Verifica que el dashboard renderiza.
- Verifica que las operaciones usan el usuario autenticado.
- Verifica que no hay claves privadas en cliente.

## Criterios de aceptación

El trabajo estará completo solo si:

- La app compila correctamente.
- El login y registro funcionan.
- Las rutas privadas están protegidas.
- Cada usuario ve solo sus datos.
- Los CRUDs principales funcionan.
- El stock se descuenta cuando se registran productos usados.
- Los costes y márgenes se calculan correctamente.
- El dashboard muestra métricas reales.
- La UI respeta la captura de diseño entregada.
- El proyecto queda preparado para Dokploy.
- Existe documentación clara en README.

## Resultado esperado

Entrega un proyecto funcional y organizado.

No entregues únicamente explicación. Implementa los archivos necesarios.

Si encuentras ambigüedades, toma decisiones razonables basadas en el plan maestro y documenta esas decisiones en el README.
