/**
 * Cache Manager - Sistema de caché con localStorage para optimizar lecturas de Firestore
 * 
 * Estrategia:
 * 1. Primera carga: Lee desde Firestore y guarda en localStorage
 * 2. Cargas subsecuentes: Lee desde localStorage (instantáneo)
 * 3. Sincronización: Listener de Firestore actualiza caché en segundo plano
 * 4. Invalidación: TTL configurable y limpieza automática
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheConfig {
  ttl?: number; // Time to live en milisegundos (default: 1 hora)
  version?: string; // Versión del caché para invalidación
  compressionEnabled?: boolean; // Habilitar compresión (futuro)
}

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hora
const CACHE_VERSION = '1.0.0';

export class CacheManager {
  private static instance: CacheManager;
  
  private constructor() {}
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Guarda datos en localStorage con metadata
   */
  set<T>(key: string, data: T, config: CacheConfig = {}): void {
    try {
      const ttl = config.ttl || DEFAULT_TTL;
      const version = config.version || CACHE_VERSION;
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version,
      };

      localStorage.setItem(key, JSON.stringify(entry));
      
      // Guardar metadata de todas las claves para limpieza
      this.updateCacheRegistry(key, ttl);
    } catch (error) {
      console.error(`[CacheManager] Error saving to cache (${key}):`, error);
      // Si localStorage está lleno, limpiar caché antiguo
      this.clearExpiredCache();
    }
  }

  /**
   * Obtiene datos del caché si están disponibles y válidos
   */
  get<T>(key: string, config: CacheConfig = {}): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const ttl = config.ttl || DEFAULT_TTL;
      const version = config.version || CACHE_VERSION;

      // Verificar versión
      if (entry.version !== version) {
        console.log(`[CacheManager] Version mismatch for ${key}, invalidating cache`);
        this.remove(key);
        return null;
      }

      // Verificar TTL
      const age = Date.now() - entry.timestamp;
      if (age > ttl) {
        console.log(`[CacheManager] Cache expired for ${key} (age: ${age}ms)`);
        this.remove(key);
        return null;
      }

      console.log(`[CacheManager] Cache hit for ${key} (age: ${age}ms)`);
      return entry.data;
    } catch (error) {
      console.error(`[CacheManager] Error reading from cache (${key}):`, error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Elimina una entrada del caché
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
      this.removeFromRegistry(key);
    } catch (error) {
      console.error(`[CacheManager] Error removing cache (${key}):`, error);
    }
  }

  /**
   * Limpia todo el caché
   */
  clearAll(): void {
    try {
      const registry = this.getCacheRegistry();
      registry.forEach(key => {
        localStorage.removeItem(key);
      });
      localStorage.removeItem('cache_registry');
      console.log('[CacheManager] All cache cleared');
    } catch (error) {
      console.error('[CacheManager] Error clearing cache:', error);
    }
  }

  /**
   * Limpia entradas expiradas del caché
   */
  clearExpiredCache(): void {
    try {
      const registry = this.getCacheRegistry();
      let cleaned = 0;

      registry.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const entry: CacheEntry<any> = JSON.parse(item);
            const age = Date.now() - entry.timestamp;
            
            // Si tiene más de 1 hora, eliminar
            if (age > DEFAULT_TTL) {
              this.remove(key);
              cleaned++;
            }
          } catch {
            // Si hay error parseando, eliminar
            this.remove(key);
            cleaned++;
          }
        }
      });

      if (cleaned > 0) {
        console.log(`[CacheManager] Cleaned ${cleaned} expired cache entries`);
      }
    } catch (error) {
      console.error('[CacheManager] Error cleaning expired cache:', error);
    }
  }

  /**
   * Verifica si existe una entrada válida en caché
   */
  has(key: string, config: CacheConfig = {}): boolean {
    return this.get(key, config) !== null;
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): {
    totalKeys: number;
    totalSize: number;
    keys: string[];
  } {
    const registry = this.getCacheRegistry();
    let totalSize = 0;

    registry.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
      }
    });

    return {
      totalKeys: registry.size,
      totalSize,
      keys: Array.from(registry),
    };
  }

  /**
   * Registro de todas las claves en caché
   */
  private getCacheRegistry(): Set<string> {
    try {
      const registry = localStorage.getItem('cache_registry');
      return registry ? new Set(JSON.parse(registry)) : new Set();
    } catch {
      return new Set();
    }
  }

  private updateCacheRegistry(key: string, ttl: number): void {
    try {
      const registry = this.getCacheRegistry();
      registry.add(key);
      localStorage.setItem('cache_registry', JSON.stringify(Array.from(registry)));
    } catch (error) {
      console.error('[CacheManager] Error updating cache registry:', error);
    }
  }

  private removeFromRegistry(key: string): void {
    try {
      const registry = this.getCacheRegistry();
      registry.delete(key);
      localStorage.setItem('cache_registry', JSON.stringify(Array.from(registry)));
    } catch (error) {
      console.error('[CacheManager] Error removing from registry:', error);
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

/**
 * Hook personalizado para usar caché con React
 */
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  config: CacheConfig = {}
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFn();
      cacheManager.set(key, result, config);
      setData(result);
    } catch (err) {
      setError(err as Error);
      console.error(`[useCachedData] Error fetching data for ${key}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, config]);

  React.useEffect(() => {
    // Intentar cargar desde caché primero
    const cached = cacheManager.get<T>(key, config);
    
    if (cached) {
      setData(cached);
      setIsLoading(false);
      
      // Refrescar en segundo plano si el caché es antiguo
      const item = localStorage.getItem(key);
      if (item) {
        const entry: CacheEntry<T> = JSON.parse(item);
        const age = Date.now() - entry.timestamp;
        
        // Si tiene más de 5 minutos, refrescar en background
        if (age > 5 * 60 * 1000) {
          refresh().catch(console.error);
        }
      }
    } else {
      // No hay caché, cargar desde fuente
      refresh();
    }
  }, [key, config, refresh]);

  return { data, isLoading, error, refresh };
}

// Para compatibilidad con componentes existentes
import React from 'react';
