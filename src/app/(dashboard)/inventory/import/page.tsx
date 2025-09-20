
'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UploadCloud, File, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function InventoryImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'Ningún archivo seleccionado', description: 'Por favor, selecciona un archivo para importar.', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/inventory/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Importación Exitosa',
          description: `${result.created} productos creados y ${result.updated} productos actualizados.`,
          variant: 'default',
        });
        setFile(null);
      } else {
        throw new Error(result.message || 'Error al procesar el archivo.');
      }
    } catch (error: any) {
      toast({
        title: 'Error en la importación',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const templateHeaders = [ 'sku', 'nombre', 'descripcion', 'stock_actual', 'stock_minimo', 'precios.compra', 'precios.venta', 'tienda', 'proveedor.nombre', 'ubicacion_almacen'];

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
       <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Importar Inventario desde Excel</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cargar Archivo</CardTitle>
          <CardDescription>Arrastra y suelta tu archivo Excel (.xlsx) o haz clic para seleccionarlo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            {
              isDragActive ?
                <p>Suelta el archivo aquí...</p> :
                <p>Arrastra un archivo o haz clic para seleccionar</p>
            }
          </div>
          {file && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <File className="h-6 w-6" />
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full" size="lg">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Procesar e Importar Inventario
          </Button>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Instrucciones y Formato de Plantilla</CardTitle>
              <CardDescription>
                  Asegúrate de que tu archivo Excel cumpla con el siguiente formato para una importación exitosa.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>El archivo debe ser de tipo Excel (`.xlsx` o `.xls`).</li>
                  <li>La primera hoja del archivo debe llamarse **`Inventario`**.</li>
                  <li>La primera fila de esta hoja debe contener los siguientes encabezados (en este orden exacto):</li>
              </ul>
              <div className="mt-4 p-2 bg-muted rounded-md text-sm font-mono overflow-x-auto">
                 <code className="whitespace-nowrap">{templateHeaders.join(', ')}</code>
              </div>
               <div className="mt-4 space-y-4">
                  <p className="font-semibold">Descripción de Columnas:</p>
                   <ul className="space-y-3 text-sm text-muted-foreground list-disc list-inside">
                        <li><span className="font-semibold text-foreground">sku (Obligatorio):</span> Identificador único del producto. Si ya existe, se actualiza; si no, se crea.</li>
                        <li><span className="font-semibold text-foreground">nombre (Obligatorio):</span> Nombre completo del producto.</li>
                        <li><span className="font-semibold text-foreground">descripcion (Opcional):</span> Texto descriptivo del producto.</li>
                        <li><span className="font-semibold text-foreground">stock_actual (Obligatorio):</span> Cantidad de stock. Debe ser un número.</li>
                        <li><span className="font-semibold text-foreground">stock_minimo (Obligatorio):</span> Número para alertas de bajo stock.</li>
                        <li><span className="font-semibold text-foreground">precios.compra (Obligatorio):</span> Costo del producto. Usa punto (`.`) para decimales.</li>
                        <li><span className="font-semibold text-foreground">precios.venta (Obligatorio):</span> Precio al público. Usa punto (`.`) para decimales.</li>
                        <li><span className="font-semibold text-foreground">tienda (Obligatorio):</span> Nombre de la tienda a la que pertenece (Ej: Trazto, Blumi).</li>
                        <li><span className="font-semibold text-foreground">proveedor.nombre (Opcional):</span> Nombre del proveedor.</li>
                        <li><span className="font-semibold text-foreground">ubicacion_almacen (Opcional):</span> Código de ubicación en el almacén.</li>
                   </ul>
               </div>
          </CardContent>
      </Card>
    </div>
  );
}
