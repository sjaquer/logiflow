# Kanban-SalesHub: Sistema de Gestión Logística y de Ventas

Kanban-SalesHub es una aplicación web integral diseñada para optimizar y gestionar operaciones de logística y ventas de manera eficiente. Construida con un stack tecnológico moderno, ofrece una interfaz de usuario intuitiva y potente para el seguimiento de pedidos, gestión de inventario, análisis de datos y administración de usuarios.

![Captura de Pantalla de Kanban-SalesHub](https://i.imgur.com/gO2kY8a.png)

---

## ✨ Características Principales

- **Gestión de Pedidos con Kanban:** Visualiza y gestiona el ciclo de vida completo de los pedidos a través de un tablero Kanban interactivo con funcionalidad de arrastrar y soltar (`drag-and-drop`).
- **Control de Inventario:** Mantén un registro detallado de los productos, niveles de stock, precios, proveedores y ubicación en el almacén.
- **Dashboard de Reportes y Analíticas:** Obtén una visión clara del rendimiento de tu negocio con tarjetas de KPIs (Ingresos, Pedidos Totales), gráficos de estado de pedidos, análisis de ventas por tienda/usuario y niveles de inventario.
- **Gestión de Usuarios y Roles:** Sistema de permisos basado en roles (Administrador, Ventas, Operador Logístico, Gerente) para controlar el acceso a las diferentes funcionalidades.
- **Autenticación Segura:** Inicio de sesión robusto gestionado por Firebase Authentication.
- **Interfaz Personalizable:**
  - **Modo Claro y Oscuro:** Cambia entre temas para una mejor comodidad visual.
  - **Paletas de Colores:** Elige entre varias paletas de colores para personalizar la apariencia de la aplicación.
  - **Persistencia de Tema:** Tus preferencias de diseño se guardan en el `localStorage` para una experiencia de usuario consistente.
- **Modo Desarrollador:** Un interruptor especial en la barra lateral (solo visible en desarrollo) para alternar entre la base de datos de Firebase en tiempo real y datos locales de prueba, agilizando el desarrollo y las pruebas de la UI.

---

## 🚀 Stack Tecnológico

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://reactjs.org/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI:** [ShadCN UI](https://ui.shadcn.com/)
- **Base de Datos y Autenticación:** [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Gestión de Estado:** React Context API

---

## 🛠️ Instalación y Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 20.x o superior)
- [npm](https://www.npmjs.com/) o un gestor de paquetes compatible

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/kanban-saleshub.git
cd kanban-saleshub
```

### 2. Instalar Dependencias

Ejecuta el siguiente comando para instalar todas las dependencias del proyecto:

```bash
npm install
```

### 3. Configurar Firebase

Para que la aplicación se conecte con Firebase, necesitarás tus propias credenciales.

1.  Ve a la [Consola de Firebase](https://console.firebase.google.com/) y crea un nuevo proyecto.
2.  Dentro de tu proyecto, crea una nueva aplicación web.
3.  Copia las credenciales de configuración de tu aplicación (el objeto `firebaseConfig`).
4.  En la raíz del proyecto, crea un archivo llamado `.env.local`.
5.  Pega tus credenciales de Firebase en el archivo `.env.local` correspondiente a cada variable (puedes usar el archivo `.env.example` como plantilla).
6. Habilita **Firestore Database** y **Authentication** (con el proveedor de Email/Contraseña) en la consola de Firebase.

### 4. Poblar la Base de Datos con Datos de Ejemplo (Seed)

Para llenar tu base de datos de Firestore con datos de ejemplo (usuarios, inventario y pedidos), ejecuta el script de seed.

**Importante:** Antes de ejecutar, asegúrate de que el usuario administrador (`sjaquer@outlook.es` o el que hayas configurado en `src/lib/data.ts`) ya exista en Firebase Authentication para que el script pueda asignarle el rol correcto.

```bash
npm run seed
```

### 5. Ejecutar la Aplicación

Una vez completados los pasos anteriores, puedes iniciar la aplicación en modo de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:9002](http://localhost:9002) en tu navegador para ver la aplicación en funcionamiento.

---

## ⚙️ Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia un servidor de producción.
- `npm run seed`: Puebla la base de datos de Firestore con datos de ejemplo.
- `npm run lint`: Ejecuta el linter de Next.js para verificar la calidad del código.
