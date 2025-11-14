'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Search, RefreshCw, User, FileText } from 'lucide-react';

export default function KommoTestPage() {
    // Estados para cada pestaña
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Obtener Lead
    const [leadId, setLeadId] = useState('');

    // Buscar Leads
    const [searchQuery, setSearchQuery] = useState('');

    // Obtener Contacto
    const [contactId, setContactId] = useState('');

    // Actualizar Lead
    const [updateLeadId, setUpdateLeadId] = useState('');
    const [updatePrice, setUpdatePrice] = useState('');
    const [updateName, setUpdateName] = useState('');

    // Función helper para hacer requests
    const makeRequest = async (url: string, options?: RequestInit) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.message || 'Error desconocido');
            }
        } catch (err: any) {
            setError(err.message || 'Error de red');
        } finally {
            setLoading(false);
        }
    };

    // Handlers para cada acción
    const handleGetLead = () => {
        if (!leadId.trim()) {
            setError('Por favor ingresa un Lead ID');
            return;
        }
        makeRequest(`/api/kommo/test/get-lead?leadId=${encodeURIComponent(leadId)}`);
    };

    const handleSearchLeads = () => {
        if (!searchQuery.trim()) {
            setError('Por favor ingresa una búsqueda');
            return;
        }
        makeRequest(`/api/kommo/test/search-leads?query=${encodeURIComponent(searchQuery)}`);
    };

    const handleGetContact = () => {
        if (!contactId.trim()) {
            setError('Por favor ingresa un Contact ID');
            return;
        }
        makeRequest(`/api/kommo/test/get-contact?contactId=${encodeURIComponent(contactId)}`);
    };

    const handleUpdateLead = () => {
        if (!updateLeadId.trim()) {
            setError('Por favor ingresa un Lead ID');
            return;
        }

        const updates: any = {};
        if (updatePrice) updates.price = parseFloat(updatePrice);
        if (updateName) updates.name = updateName;

        if (Object.keys(updates).length === 0) {
            setError('Por favor ingresa al menos un campo para actualizar');
            return;
        }

        makeRequest('/api/kommo/test/update-test-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId: updateLeadId, updates })
        });
    };

    const handleTestRealUpdate = () => {
        // Redirigir a la página de create order para probar el flujo real
        window.open('/create-order', '_blank');
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">🧪 Pruebas de Kommo CRM</h1>
                <p className="text-muted-foreground">
                    Herramienta de testing para probar la integración con Kommo API
                </p>
                <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Información</AlertTitle>
                    <AlertDescription>
                        Esta página solo funciona en desarrollo. Asegúrate de tener las variables de entorno de Kommo configuradas.
                        <br />
                        <strong>Reporte Técnico:</strong>{' '}
                        <a href="/docs/KOMMO_TECHNICAL_REPORT.md" className="underline text-blue-600" target="_blank">
                            Ver documentación completa
                        </a>
                    </AlertDescription>
                </Alert>
            </div>

            <Tabs defaultValue="get-lead" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="get-lead">Obtener Lead</TabsTrigger>
                    <TabsTrigger value="search">Buscar Leads</TabsTrigger>
                    <TabsTrigger value="get-contact">Obtener Contacto</TabsTrigger>
                    <TabsTrigger value="update">Actualizar Lead</TabsTrigger>
                    <TabsTrigger value="real">Prueba Real</TabsTrigger>
                </TabsList>

                {/* Tab: Obtener Lead */}
                <TabsContent value="get-lead">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Obtener Detalles de un Lead
                            </CardTitle>
                            <CardDescription>
                                Obtiene información completa de un lead específico incluyendo contactos asociados
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="leadId">Lead ID</Label>
                                <Input
                                    id="leadId"
                                    placeholder="Ej: 123456"
                                    value={leadId}
                                    onChange={(e) => setLeadId(e.target.value)}
                                    disabled={loading}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Puedes encontrar el ID del lead en la URL de Kommo o buscándolo primero
                                </p>
                            </div>
                            <Button onClick={handleGetLead} disabled={loading} className="w-full">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Consultando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Obtener Lead
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Buscar Leads */}
                <TabsContent value="search">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Buscar Leads
                            </CardTitle>
                            <CardDescription>
                                Busca leads por nombre, teléfono, email o cualquier texto
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="searchQuery">Búsqueda</Label>
                                <Input
                                    id="searchQuery"
                                    placeholder="Ej: #1234, Juan Pérez, +51900000000"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={loading}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Puedes buscar por Shopify Order ID (ej: #1234), nombre, teléfono o email
                                </p>
                            </div>
                            <Button onClick={handleSearchLeads} disabled={loading} className="w-full">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Buscando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Buscar Leads
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Obtener Contacto */}
                <TabsContent value="get-contact">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Obtener Detalles de un Contacto
                            </CardTitle>
                            <CardDescription>
                                Obtiene información completa de un contacto incluyendo leads asociados
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactId">Contact ID</Label>
                                <Input
                                    id="contactId"
                                    placeholder="Ej: 654321"
                                    value={contactId}
                                    onChange={(e) => setContactId(e.target.value)}
                                    disabled={loading}
                                />
                                <p className="text-sm text-muted-foreground">
                                    El Contact ID lo puedes obtener de la respuesta de un lead
                                </p>
                            </div>
                            <Button onClick={handleGetContact} disabled={loading} className="w-full">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Consultando...
                                    </>
                                ) : (
                                    <>
                                        <User className="mr-2 h-4 w-4" />
                                        Obtener Contacto
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Actualizar Lead */}
                <TabsContent value="update">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5" />
                                Actualizar un Lead (Prueba Simple)
                            </CardTitle>
                            <CardDescription>
                                Prueba actualizar campos básicos de un lead existente
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="updateLeadId">Lead ID</Label>
                                <Input
                                    id="updateLeadId"
                                    placeholder="Ej: 123456"
                                    value={updateLeadId}
                                    onChange={(e) => setUpdateLeadId(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="updateName">Nombre del Lead (opcional)</Label>
                                <Input
                                    id="updateName"
                                    placeholder="Ej: #1234 - Juan Pérez - TEST"
                                    value={updateName}
                                    onChange={(e) => setUpdateName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="updatePrice">Presupuesto/Precio (opcional)</Label>
                                <Input
                                    id="updatePrice"
                                    type="number"
                                    placeholder="Ej: 350.00"
                                    value={updatePrice}
                                    onChange={(e) => setUpdatePrice(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Esta es una prueba simple. Para probar el flujo completo de pedido, usa la pestaña &quot;Prueba Real&quot;
                                </AlertDescription>
                            </Alert>
                            <Button onClick={handleUpdateLead} disabled={loading} className="w-full">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Actualizando...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Actualizar Lead
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Prueba Real */}
                <TabsContent value="real">
                    <Card>
                        <CardHeader>
                            <CardTitle>🎯 Prueba del Flujo Real</CardTitle>
                            <CardDescription>
                                Prueba el flujo completo de actualización de lead al confirmar un pedido
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>Flujo Implementado</AlertTitle>
                                <AlertDescription>
                                    Esta es la funcionalidad que <strong>SÍ está implementada</strong> y funciona en producción.
                                </AlertDescription>
                            </Alert>
                            <div className="space-y-2">
                                <h3 className="font-semibold">Pasos para probar:</h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                    <li>Ve a la página de Call Center Queue</li>
                                    <li>Selecciona un lead que tenga <Badge variant="outline">kommo_lead_id</Badge> o <Badge variant="outline">shopify_order_id</Badge></li>
                                    <li>Click en &quot;Crear Pedido&quot;</li>
                                    <li>Llena el formulario de pedido con todos los datos</li>
                                    <li>Click en &quot;Guardar Pedido&quot;</li>
                                    <li>El sistema automáticamente actualizará el lead en Kommo</li>
                                </ol>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold">Datos que se sincronizan:</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <Badge variant="secondary">ID del pedido</Badge>
                                    <Badge variant="secondary">Dirección de envío</Badge>
                                    <Badge variant="secondary">Productos y cantidades</Badge>
                                    <Badge variant="secondary">Tienda</Badge>
                                    <Badge variant="secondary">Provincia</Badge>
                                    <Badge variant="secondary">Courier</Badge>
                                    <Badge variant="secondary">Monto total</Badge>
                                    <Badge variant="secondary">Monto pendiente</Badge>
                                    <Badge variant="secondary">Notas del pedido</Badge>
                                    <Badge variant="secondary">Link de seguimiento</Badge>
                                    <Badge variant="secondary">Número de guía</Badge>
                                    <Badge variant="secondary">Status → Venta Confirmada</Badge>
                                </div>
                            </div>
                            <Button onClick={handleTestRealUpdate} className="w-full" variant="default">
                                Ir a Create Order
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Área de Resultados */}
            <div className="mt-8 space-y-4">
                {/* Error */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Resultado */}
                {result && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                Resultado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={JSON.stringify(result, null, 2)}
                                readOnly
                                className="font-mono text-xs min-h-[400px]"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Respuesta de la API de Kommo. Puedes copiar este JSON para análisis.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Guía Rápida */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>📖 Guía Rápida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <h3 className="font-semibold mb-2">Variables de Entorno Necesarias</h3>
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`KOMMO_SUBDOMAIN=blumiperu0102
KOMMO_ACCESS_TOKEN=eyJ0eXA...
KOMMO_INTEGRATION_ID=2e45f509-...
KOMMO_SECRET_KEY=anihbY...`}
                        </pre>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Endpoints de Prueba</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li><code>/api/kommo/test/get-lead?leadId=123456</code></li>
                            <li><code>/api/kommo/test/search-leads?query=Juan</code></li>
                            <li><code>/api/kommo/test/get-contact?contactId=654321</code></li>
                            <li><code>/api/kommo/test/update-test-lead</code> (POST)</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Documentación</h3>
                        <p className="text-muted-foreground">
                            Para más detalles técnicos, consulta el reporte completo:{' '}
                            <code>docs/KOMMO_TECHNICAL_REPORT.md</code>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
