# 🧪 Guía de Prueba - Nueva Interfaz LogiFlow

## ✅ Lista de Verificación para Pruebas

### 1. Pruebas de Login ✨

#### Desktop
- [ ] Abrir https://dataweave-bi.vercel.app/login
- [ ] Verificar que el gradiente de fondo se vea correctamente
- [ ] Verificar que el logo esté dentro de un círculo azul
- [ ] Ingresar credenciales: `sjaquer@outlook.es` / `A901230b`
- [ ] Verificar que el botón muestre spinner durante carga
- [ ] Verificar que aparezca toast de "¡Bienvenido!" al login exitoso
- [ ] Verificar redirección a `/call-center-queue`

#### Mobile
- [ ] Repetir pruebas en móvil
- [ ] Verificar que el card se adapte bien al ancho de pantalla
- [ ] Verificar que los inputs tengan altura adecuada para touch (h-11)

---

### 2. Pruebas de Sidebar 🔲

#### Desktop (≥768px)
- [ ] Verificar que el sidebar sea visible al cargar
- [ ] Verificar que muestre el logo completo de LogiFlow
- [ ] Verificar 3 items de navegación:
  - [ ] Call Center (icono Phone)
  - [ ] Procesar Pedido (icono PackagePlus)
  - [ ] Inventario (icono Box)
- [ ] Hacer clic en cada item y verificar:
  - [ ] El item activo tiene fondo azul (bg-primary)
  - [ ] El texto es blanco cuando está activo
  - [ ] Los otros items tienen hover gris claro
- [ ] Verificar footer del sidebar:
  - [ ] Si eres Desarrollador: Switch de "Modo Dev" visible
  - [ ] Botón de "Configuración" visible
  - [ ] Botón de "Cerrar Sesión" visible con hover rojo

#### Mobile (<768px)
- [ ] Verificar que el sidebar NO esté visible por defecto
- [ ] Hacer clic en el botón hamburguesa del header
- [ ] Verificar que el sidebar se deslice desde la izquierda
- [ ] Navegar a diferentes secciones
- [ ] Verificar que el sidebar se cierre automáticamente

#### Sidebar Colapsado
- [ ] Hacer clic en el ícono de colapsar (si está disponible)
- [ ] Verificar que se muestre solo iconos
- [ ] Verificar que aparezca el logo abreviado "LF" en círculo azul
- [ ] Hover sobre los iconos debe mostrar tooltips

---

### 3. Pruebas de Header 📱

#### Elementos Visibles
- [ ] Verificar backdrop blur (efecto de cristal esmerilado)
- [ ] Verificar sombra sutil debajo del header
- [ ] Verificar separador vertical entre hamburguesa y título
- [ ] Verificar que el título cambie según la página:
  - `/call-center-queue` → "Call Center"
  - `/create-order` → "Procesar Pedido"
  - `/inventory` → "Inventario"
- [ ] Verificar NotificationsDropdown en la derecha
- [ ] Verificar UserNav con datos del usuario

#### Responsive
- [ ] Desktop: Hamburguesa + separador + título + notificaciones + user
- [ ] Mobile: Todos los elementos deben ser visibles y usables

---

### 4. Pruebas de Footer 🦶

#### Desktop
- [ ] Verificar que el footer esté pegado al fondo de la página
- [ ] Verificar backdrop blur matching el header
- [ ] Verificar que muestre:
  - [ ] "© 2024 LogiFlow. Todos los derechos reservados." (año dinámico)
  - [ ] Links: Privacidad • Términos • Ayuda
- [ ] Hover sobre los links debe:
  - [ ] Cambiar color a foreground
  - [ ] Mostrar underline

#### Mobile
- [ ] Verificar que el contenido se apile en columna
- [ ] Verificar que todo sea legible
- [ ] Verificar que los links sean clickeables (touch targets adecuados)

---

### 5. Pruebas de Colores y Tema 🎨

#### Tema Claro (Default)
- [ ] Verificar que la app cargue en tema claro por defecto
- [ ] Verificar colores:
  - [ ] Fondo principal: Blanco
  - [ ] Texto principal: Negro/Gris oscuro
  - [ ] Sidebar: Fondo blanco con borde gris claro
  - [ ] Primary (botones): Azul vibrante HSL(217 91% 60%)
  - [ ] Active nav: Azul con texto blanco

#### Cambiar a Tema Oscuro
- [ ] Ir a Configuración
- [ ] Cambiar a tema oscuro
- [ ] Verificar que todos los colores se inviertan correctamente
- [ ] Volver a tema claro
- [ ] Verificar que el cambio persista al recargar

---

### 6. Pruebas de Navegación 🧭

#### Call Center Queue
- [ ] Navegar a Call Center
- [ ] Verificar que el título del header diga "Call Center"
- [ ] Verificar que el item esté activo en el sidebar (azul)
- [ ] Verificar que la tabla de leads cargue correctamente

#### Procesar Pedido
- [ ] Navegar a Procesar Pedido
- [ ] Verificar cambio de título
- [ ] Verificar item activo
- [ ] Verificar que el formulario se vea bien con los nuevos colores

#### Inventario
- [ ] Navegar a Inventario
- [ ] Verificar cambio de título
- [ ] Verificar item activo
- [ ] Verificar que la tabla de productos se vea correctamente

---

### 7. Pruebas de Responsive Design 📱

#### Breakpoints a Probar
- [ ] **Mobile S** (320px): iPhone SE
- [ ] **Mobile M** (375px): iPhone 12/13
- [ ] **Mobile L** (425px): iPhone 14 Pro Max
- [ ] **Tablet** (768px): iPad
- [ ] **Laptop** (1024px): Laptop estándar
- [ ] **Desktop** (1440px): Monitor grande

#### Verificaciones en Cada Breakpoint
- [ ] Sidebar se comporta correctamente (visible/oculta)
- [ ] Header mantiene todos los elementos visibles
- [ ] Footer se adapta (columna vs fila)
- [ ] Contenido principal tiene padding adecuado
- [ ] No hay overflow horizontal
- [ ] Touch targets son de mínimo 44px en mobile

---

### 8. Pruebas de Estados Interactivos 🖱️

#### Hover States
- [ ] Sidebar items: Cambio a gris claro
- [ ] Header items: Cambio sutil de color
- [ ] Footer links: Cambio de color + underline
- [ ] Botones: Ligero oscurecimiento
- [ ] Configuración y Cerrar Sesión: Colores específicos

#### Active States
- [ ] Sidebar item activo: Azul con texto blanco
- [ ] Focus rings visibles en inputs y botones
- [ ] Tabs activos (si aplica): Underline o fondo

#### Loading States
- [ ] Login: Spinner en botón con texto "Ingresando..."
- [ ] Tablas: Skeleton loaders con rounded-lg
- [ ] Operaciones async: Feedback visual claro

---

### 9. Pruebas de Accesibilidad ♿

#### Teclado
- [ ] Tab navega por todos los elementos interactivos
- [ ] Enter activa botones y links
- [ ] Escape cierra modales/sheets
- [ ] Focus visible en todos los elementos

#### Screen Reader (opcional)
- [ ] Labels asociados a inputs correctamente
- [ ] Buttons tienen nombres descriptivos
- [ ] Navegación landmark (header, main, footer) correcta

#### Contraste
- [ ] Texto tiene contraste mínimo 4.5:1 (WCAG AA)
- [ ] Botones primary tienen buen contraste
- [ ] Links son distinguibles del texto normal

---

### 10. Pruebas de Performance ⚡

#### Tiempo de Carga
- [ ] Login page carga en < 2 segundos
- [ ] Dashboard carga en < 3 segundos (con cache)
- [ ] Navegación entre páginas es instantánea
- [ ] No hay flickering de temas

#### Animaciones
- [ ] Transiciones suaves (no laggy)
- [ ] Hover states inmediatos
- [ ] Backdrop blur no causa lag
- [ ] Smooth scrolling funciona bien

---

### 11. Pruebas de Funcionalidad Específica 🔧

#### Dev Mode (solo Desarrolladores)
- [ ] Toggle visible en sidebar footer
- [ ] Al activar, aparecen logs en consola con emojis
- [ ] Logs muestran: pathname, user, timestamp
- [ ] Toggle persiste al navegar

#### Notificaciones
- [ ] Badge de notificaciones visible si hay items
- [ ] Dropdown muestra inventory y orders
- [ ] Cerrar sesión funciona correctamente
- [ ] Toast de bienvenida aparece al login

---

### 12. Pruebas de Integración 🔗

#### Firestore
- [ ] Datos de usuarios se cargan correctamente
- [ ] Call center queue muestra leads
- [ ] Inventario muestra productos
- [ ] Pedidos aparecen en notificaciones

#### Firebase Auth
- [ ] Login funciona con las credenciales
- [ ] Logout funciona y redirige a /login
- [ ] Sesión persiste al recargar
- [ ] Usuario sin permisos no ve ciertas secciones

---

## 🐛 Reporte de Bugs

Si encuentras algún problema, documenta:

```markdown
### Bug: [Título descriptivo]
**Severidad**: Alta / Media / Baja
**Página**: [URL o ruta]
**Device**: [Desktop / Mobile / Tablet]
**Browser**: [Chrome / Firefox / Safari]
**Pasos para reproducir**:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Comportamiento esperado**: [Qué debería pasar]
**Comportamiento actual**: [Qué está pasando]
**Screenshot**: [Si es posible]
```

---

## ✅ Checklist Final

Antes de dar por aprobada la nueva UI:

- [ ] ✅ Todas las pruebas de login pasadas
- [ ] ✅ Sidebar funciona en desktop y mobile
- [ ] ✅ Header muestra todos los elementos correctamente
- [ ] ✅ Footer visible y con links funcionales
- [ ] ✅ Tema claro es el default
- [ ] ✅ Navegación entre páginas funciona
- [ ] ✅ Responsive funciona en todos los breakpoints
- [ ] ✅ Estados hover/active/focus visibles
- [ ] ✅ Accesibilidad básica cumplida
- [ ] ✅ Performance es aceptable
- [ ] ✅ No hay errores en consola
- [ ] ✅ Integraciones funcionan correctamente

---

## 📊 Matriz de Compatibilidad

| Browser | Desktop | Mobile | Tablet | Status |
|---------|---------|--------|--------|--------|
| Chrome 90+ | ⬜ | ⬜ | ⬜ | Pending |
| Firefox 88+ | ⬜ | ⬜ | ⬜ | Pending |
| Safari 14+ | ⬜ | ⬜ | ⬜ | Pending |
| Edge 90+ | ⬜ | ⬜ | ⬜ | Pending |

Marca con:
- ✅ = Funciona perfectamente
- ⚠️ = Funciona con problemas menores
- ❌ = No funciona / Bug crítico
- ⬜ = No probado

---

## 🎯 Criterios de Aceptación

La nueva UI se considera **APROBADA** cuando:

1. ✅ **100% de pruebas de login** pasadas
2. ✅ **Sidebar visible y funcional** en desktop y mobile
3. ✅ **Header y Footer** renderizados correctamente
4. ✅ **Tema claro** como default
5. ✅ **Responsive** funciona en al menos 4 breakpoints
6. ✅ **Navegación** entre todas las páginas funciona
7. ✅ **No bugs críticos** reportados
8. ✅ **Performance aceptable** (<3s carga inicial)

---

**Versión del Test Plan**: v1.0.0
**Última actualización**: Diciembre 2024
