import type { Order, InventoryItem, User, LegacyUser } from './types';

export const users: LegacyUser[] = [
  { id: 'USR-ANAG', name: 'Ana Garcia', email: 'ana.garcia@example.com', avatar: '/avatars/01.png', role: 'OPERADOR_LOGISTICO' },
  { id: 'USR-CARLOSR', name: 'Carlos Rodriguez', email: 'carlos.rodriguez@example.com', avatar: '/avatars/02.png', role: 'OPERADOR_LOGISTICO' },
  { id: 'USR-SOFIAM', name: 'Sofia Martinez', email: 'sofia.martinez@example.com', avatar: '/avatars/03.png', role: 'ADMINISTRADOR' },
  { id: 'USR-LUISH', name: 'Luis Hernandez', email: 'luis.h@example.com', avatar: '/avatars/04.png', role: 'GERENTE' },
  { id: 'USR-MARISOL', name: 'MARISOL', email: 'marisol@example.com', avatar: '/avatars/05.png', role: 'OPERADOR_LOGISTICO' },
  { id: 'USR-FIORELLA', name: 'FIORELLA', email: 'fiorella@example.com', avatar: '/avatars/06.png', role: 'OPERADOR_LOGISTICO' },
];

export const inventory: InventoryItem[] = [
  {
    sku: "LAP-001",
    id_producto_base: "LAP-PRO",
    nombre: "Laptop Pro 15\"",
    tienda: "Novi Perú",
    descripcion: "Laptop potente para profesionales",
    stock_actual: 25,
    stock_minimo: 10,
    ubicacion_almacen: "A1-F2",
    precios: { compra: 900.00, venta: 1200.00 },
    proveedor: { id_proveedor: "PROV-TECH-01", nombre: "TechSupplier Inc." },
    estado: "ACTIVO",
    variantes: [{ sku: "LAP-001", talla: "15-inch", color: "Gris Espacial", stock: 25 }],
    historial_stock: []
  },
  {
    sku: "MON-002",
    id_producto_base: "MON-4K",
    nombre: "Monitor 4K 27\"",
    tienda: "Novi Perú",
    descripcion: "Monitor Ultra HD para visuales nítidos",
    stock_actual: 8,
    stock_minimo: 5,
    ubicacion_almacen: "B2-F1",
    precios: { compra: 300.00, venta: 450.00 },
    proveedor: { id_proveedor: "PROV-VISION-02", nombre: "Vision Electronics" },
    estado: "ACTIVO",
    variantes: [],
    historial_stock: []
  },
  {
    sku: "KBD-003",
    id_producto_base: "KBD-MECH",
    nombre: "Teclado Mecánico RGB",
    tienda: "Novi Perú",
    descripcion: "Teclado mecánico para gaming y productividad",
    stock_actual: 50,
    stock_minimo: 15,
    ubicacion_almacen: "A1-F3",
    precios: { compra: 100.00, venta: 150.00 },
    proveedor: { id_proveedor: "PROV-GADGET-03", nombre: "Gadget World" },
    estado: "ACTIVO",
    variantes: [],
    historial_stock: []
  },
   {
    sku: "MSE-004",
    id_producto_base: "MSE-WL",
    nombre: "Mouse Inalámbrico Ergo",
    tienda: "Novi Perú",
    descripcion: "Mouse inalámbrico ergonómico para largas horas de uso",
    stock_actual: 3,
    stock_minimo: 5,
    ubicacion_almacen: "C3-F1",
    precios: { compra: 50.00, venta: 80.00 },
    proveedor: { id_proveedor: "PROV-GADGET-03", nombre: "Gadget World" },
    estado: "ACTIVO",
    historial_stock: []
  }
];

export const orders: Order[] = [
  {
    id_pedido: "N-15032",
    id_interno: "51081369",
    tienda: { id_tienda: "T02", nombre: "Novi Perú" },
    estado_actual: "PENDIENTE",
    cliente: { id_cliente: "CLI-LIMA-51936239203", nombres: "Lucia Fernandez", dni: "12345678", celular: "51936239203" },
    items: [{ sku: "LAP-001", nombre: "Laptop Pro 15\"", variante: "Gris Espacial", cantidad: 1, precio_unitario: 1200.00, subtotal: 1200.00 }],
    pago: { monto_total: 1210.00, monto_pendiente: 0.00, metodo_pago_previsto: "TRANSFERENCIA", estado_pago: "PAGADO", comprobante_url: null, fecha_pago: "2025-08-27T14:15:00Z" },
    envio: { tipo: "LIMA", provincia: "Lima", direccion: "Av. Siempre Viva 123, San Isidro", courier: "MOTORIZADO INTERNO", agencia_shalom: null, nro_guia: null, link_seguimiento: null, costo_envio: 10.00 },
    asignacion: { id_usuario_actual: "USR-ANAG", nombre_usuario_actual: "Ana Garcia" },
    historial: [{ fecha: "2025-08-27T14:17:00Z", id_usuario: "USR-ANAG", nombre_usuario: "Ana Garcia", accion: "PEDIDO_CREADO", detalle: "Pedido ingresado al sistema." }],
    fechas_clave: { creacion: "2025-08-27T14:17:00Z", preparacion: null, despacho: null, entrega_estimada: "2025-08-28", entrega_real: null, anulacion: null },
    notas: { nota_pedido: "Entregar en horario de oficina.", observaciones_internas: "", motivo_anulacion: null }
  },
  {
    id_pedido: "N-15033",
    id_interno: "51081370",
    tienda: { id_tienda: "T01", nombre: "Cumbre" },
    estado_actual: "EN_PREPARACION",
    cliente: { id_cliente: "CLI-AREQUIPA-51987654321", nombres: "Javier Torres", dni: "87654321", celular: "51987654321" },
    items: [{ sku: "MON-002", nombre: "Monitor 4K 27\"", variante: "Única", cantidad: 2, precio_unitario: 450.00, subtotal: 900.00 }],
    pago: { monto_total: 925.00, monto_pendiente: 0.00, metodo_pago_previsto: "YAPE", estado_pago: "PAGADO", comprobante_url: null, fecha_pago: "2025-08-27T15:00:00Z" },
    envio: { tipo: "PROVINCIA", provincia: "Arequipa", direccion: "Calle Falsa 456, Yanahuara", courier: "SHALOM", agencia_shalom: "Agencia Arequipa Centro", nro_guia: null, link_seguimiento: null, costo_envio: 25.00 },
    asignacion: { id_usuario_actual: "USR-CARLOSR", nombre_usuario_actual: "Carlos Rodriguez" },
    historial: [
        { fecha: "2025-08-27T15:02:10Z", id_usuario: "USR-CARLOSR", nombre_usuario: "Carlos Rodriguez", accion: "PEDIDO_CREADO", detalle: "Pedido ingresado al sistema." },
        { fecha: "2025-08-27T16:00:00Z", id_usuario: "USR-CARLOSR", nombre_usuario: "Carlos Rodriguez", accion: "ASIGNADO_A_PREPARACION", detalle: "Stock confirmado." },
    ],
    fechas_clave: { creacion: "2025-08-27T15:02:10Z", preparacion: "2025-08-27T16:00:00Z", despacho: null, entrega_estimada: "2025-08-30", entrega_real: null, anulacion: null },
    notas: { nota_pedido: "Llamar antes de entregar.", observaciones_internas: "Verificar DNI.", motivo_anulacion: null }
  }
];
