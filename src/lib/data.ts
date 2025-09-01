import type { Order, InventoryItem, User } from './types';

// Datos de ejemplo con la NUEVA estructura.
// Se usarán para poblar la base de datos con el script.

const users: User[] = [
  {
    id_usuario: 'USR-MARISOL',
    nombre: 'Marisol',
    email: 'marisol@example.com',
    rol: 'OPERADOR_LOGISTICO',
    activo: true,
    permisos: {
      puede_crear_pedido: true,
      puede_preparar: true,
      puede_despachar: true,
      puede_confirmar_entrega: true,
      puede_anular: true,
      puede_gestionar_inventario: true,
      puede_ver_reportes: true,
    },
    avatar: 'https://i.pravatar.cc/150?u=marisol'
  },
  {
    id_usuario: 'USR-FIORELLA',
    nombre: 'Fiorella',
    email: 'fiorella@example.com',
    rol: 'OPERADOR_LOGISTICO',
    activo: true,
    permisos: {
      puede_crear_pedido: true,
      puede_preparar: true,
      puede_despachar: true,
      puede_confirmar_entrega: true,
      puede_anular: false,
      puede_gestionar_inventario: false,
      puede_ver_reportes: false,
    },
    avatar: 'https://i.pravatar.cc/150?u=fiorella'
  },
  {
    id_usuario: 'USR-ADMIN-001',
    nombre: 'Administrador Principal',
    email: 'sjaquer@outlook.es',
    rol: 'ADMIN',
    activo: true,
    permisos: {
      puede_crear_pedido: true,
      puede_preparar: true,
      puede_despachar: true,
      puede_confirmar_entrega: true,
      puede_anular: true,
      puede_gestionar_inventario: true,
      puede_ver_reportes: true,
    },
    avatar: 'https://i.pravatar.cc/150?u=sjaquer'
  }
];

const inventory: InventoryItem[] = [
  {
    sku: "5100-GR-34",
    id_producto_base: "5100",
    nombre: "Pantalón para Hombre Nylon + Strech | K2",
    tienda: "Cumbre",
    descripcion: "Pantalón táctico de secado rápido ideal para outdoor.",
    stock_actual: 45,
    stock_minimo: 5,
    ubicacion_almacen: "A2-F3",
    precios: { compra: 80.00, venta: 149.00 },
    proveedor: { id_proveedor: "PROV-CUMBRE-01", nombre: "Cumbre Textiles" },
    estado: "ACTIVO",
    variantes: [
      { sku: "5100-GR-32", talla: "32", color: "Gris", stock: 20 },
      { sku: "5100-GR-34", talla: "34", color: "Gris", stock: 45 },
      { sku: "5100-AZ-32", talla: "32", color: "Azul Noche", stock: 15 }
    ],
    historial_stock: []
  },
  {
    sku: "5201",
    id_producto_base: "5201",
    nombre: "SOPORTE MAGNÉTICO PARA CELULAR",
    tienda: "Novi Perú",
    descripcion: "Soporte magnético universal para celular, ideal para auto.",
    stock_actual: 150,
    stock_minimo: 20,
    ubicacion_almacen: "C1-F1",
    precios: { compra: 25.00, venta: 59.00 },
    proveedor: { id_proveedor: "PROV-TECH-01", nombre: "TechSupplier Inc." },
    estado: "ACTIVO",
    variantes: [],
    historial_stock: []
  }
];

const orders: Order[] = [
  {
    id_pedido: "N-15032",
    id_interno: "51081369",
    tienda: { id_tienda: "T02", nombre: "Novi Perú" },
    estado_actual: "EN_PREPARACION",
    cliente: { id_cliente: "CLI-LIMA-51936239203", nombres: "David", dni: null, celular: "51936239203" },
    items: [
      { sku: "5201", nombre: "SOPORTE MAGNÉTICO PARA CELULAR", variante: "Negro", cantidad: 1, precio_unitario: 59.00, subtotal: 59.00, estado_item: 'PENDIENTE' }
    ],
    pago: { monto_total: 59.00, monto_pendiente: 39.00, metodo_pago_previsto: "Efectivo", estado_pago: "PENDIENTE", comprobante_url: null, fecha_pago: null },
    envio: { tipo: "LIMA", provincia: "Lima (departamento)", direccion: "Calle Taurija, Los Olivos", courier: "INTERNO", agencia_shalom: null, nro_guia: null, link_seguimiento: null, costo_envio: 10.00 },
    asignacion: { id_usuario_actual: "USR-MARISOL", nombre_usuario_actual: "MARISOL" },
    historial: [
      { fecha: "2025-08-27T14:17:00Z", id_usuario: "USR-MARISOL", nombre_usuario: "MARISOL", accion: "PEDIDO_CREADO", detalle: "Pedido ingresado al sistema." },
      { fecha: "2025-08-27T15:02:10Z", id_usuario: "USR-FIORELLA", nombre_usuario: "FIORELLA", accion: "ASIGNADO_A_PREPARACION", detalle: "Stock confirmado. Movido a 'En Preparación'." }
    ],
    fechas_clave: { creacion: "2025-08-27T14:17:00Z", preparacion: "2025-08-27T15:02:10Z", despacho: null, entrega_estimada: "2025-08-28", entrega_real: null, anulacion: null },
    notas: { nota_pedido: "MAÑANA SIN ESPERA HASTA LAS 2PM", observaciones_internas: "Cliente contactado, confirmar dirección.", motivo_anulacion: null }
  },
  {
    id_pedido: "N-15033",
    id_interno: "51081370",
    tienda: { id_tienda: "T01", nombre: "Cumbre" },
    estado_actual: "PENDIENTE",
    cliente: { id_cliente: "CLI-AREQUIPA-51987654321", nombres: "Javier Torres", dni: "87654321", celular: "51987654321" },
    items: [
      { sku: "5100-GR-34", nombre: "Pantalón para Hombre Nylon + Strech | K2", variante: "Gris / 34", cantidad: 2, precio_unitario: 149.00, subtotal: 298.00, estado_item: 'PENDIENTE' }
    ],
    pago: { monto_total: 323.00, monto_pendiente: 0.00, metodo_pago_previsto: "Tarjeta de Crédito", estado_pago: "PAGADO", comprobante_url: null, fecha_pago: "2025-08-27T15:00:00Z" },
    envio: { tipo: "PROVINCIA", provincia: "Arequipa", direccion: "Calle Falsa 456, Yanahuara", courier: "SHALOM", agencia_shalom: "Agencia Arequipa Centro", nro_guia: null, link_seguimiento: null, costo_envio: 25.00 },
    asignacion: { id_usuario_actual: "USR-FIORELLA", nombre_usuario_actual: "FIORELLA" },
    historial: [
      { fecha: "2025-08-27T15:02:10Z", id_usuario: "USR-FIORELLA", nombre_usuario: "FIORELLA", accion: "PEDIDO_CREADO", detalle: "Pedido ingresado al sistema." }
    ],
    fechas_clave: { creacion: "2025-08-27T15:02:10Z", preparacion: null, despacho: null, entrega_estimada: "2025-08-30", entrega_real: null, anulacion: null },
    notas: { nota_pedido: "Llamar antes de entregar.", observaciones_internas: "Verificar DNI.", motivo_anulacion: null }
  }
];

module.exports = { users, inventory, orders };
