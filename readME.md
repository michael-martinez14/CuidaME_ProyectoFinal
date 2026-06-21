# CuidaME

Plataforma para que familias coordinen el cuidado de un ser querido: pacientes,
medicamentos, alertas, círculo familiar, chatbot y **gamificación** (puntos,
ranking, insignias y alarmas de tomas).

## Requisitos
- Node.js 18+
- npm
- MySQL 8+ (o MariaDB / XAMPP) corriendo localmente

## Variables de entorno

Los archivos `.env` no se versionan. En este repo ya se incluyen plantillas
`.env.example` y archivos `.env` listos para desarrollo local.

### Backend (`backend/.env`)
```
DATABASE_URL="mysql://USUARIO:CONTRASEÑA@localhost:3306/cuidame"
JWT_SECRET="cuidame-dev-secret-cambiar"
PORT=3001
```
Ajusta `DATABASE_URL` con tu usuario, contraseña, host y puerto de MySQL.

### Frontend (`fronted/.env.local`)
```
NEXT_PUBLIC_API_URL="http://localhost:3001"
```
Debe apuntar al host y `PORT` del backend.

## Instalación y ejecución

### Backend
```
cd backend
npm install
# Edita backend/.env con tus credenciales de MySQL
npx prisma migrate dev      # crea la BD "cuidame", aplica migraciones y genera el cliente Prisma
npm run dev                 # arranca en http://localhost:3001
```
> Si la base de datos ya está migrada, basta con `npx prisma generate` y `npm run dev`.

### Frontend
```
cd fronted
npm install
npm run dev                 # arranca en http://localhost:3000
```

## Probar la gamificación
1. Regístrate en `/registro` e inicia sesión.
2. Crea un paciente (se genera su círculo familiar) y registra un medicamento.
3. En el panel pulsa **Confirmar toma** para sumar puntos, o ve a **Gamificación**
   (en el menú lateral) para ver puntos, ranking, insignias y registrar acciones.
4. Pulsa **Activar notificaciones** para permitir las alarmas del navegador a la
   hora de cada toma, y marca las alertas como leídas desde el panel o la página
   de gamificación.
