'use client'

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy: number
  heading: number | null
  speed: number | null
  timestamp: number
}

export type GeoLoadingState = 'idle' | 'locating' | 'refining' | 'ready'
export type GeoPermission = 'granted' | 'denied' | 'prompt' | 'unknown'

export interface GeoState {
  location: GeoLocation | null
  loading: GeoLoadingState
  error: string | null
  warning: string | null
  supported: boolean
  permission: GeoPermission
  refining: boolean
}

interface GeoContextValue extends GeoState {
  request: () => void
  watch: () => () => void
  refresh: () => void
}

const GeoContext = createContext<GeoContextValue | null>(null)

function toLocation(pos: GeolocationPosition): GeoLocation {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    heading: pos.coords.heading,
    speed: pos.coords.speed,
    timestamp: pos.timestamp,
  }
}

function describeError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Permissão de localização negada. Habilite nas configurações do navegador para continuar.'
    case err.POSITION_UNAVAILABLE:
      return 'Posição indisponível. Verifique seu GPS ou conexão e tente novamente.'
    case err.TIMEOUT:
      return 'Tempo esgotado ao obter localização. Tente novamente em local aberto.'
    default:
      return 'Não foi possível obter a localização.'
  }
}

function accuracyWarning(accuracy: number): string | null {
  if (accuracy > 100) return `Precisão baixa (~${Math.round(accuracy)}m). Saia para local aberto.`
  if (accuracy > 50) return `Precisão média (~${Math.round(accuracy)}m).`
  return null
}

async function queryPermission(): Promise<GeoPermission> {
  try {
    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
      return result.state as GeoPermission
    }
  } catch {
    // ignore - some browsers don't support permissions API for geolocation
  }
  return 'unknown'
}

function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

function GeoProviderImpl({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GeoState>({
    location: null,
    loading: 'idle',
    error: null,
    warning: null,
    supported: typeof navigator !== 'undefined' && !!navigator.geolocation,
    permission: 'unknown',
    refining: false,
  })

  const watchIdRef = useRef<number | null>(null)
  const needsRefreshRef = useRef(false)
  const lastLocationRef = useRef<GeoLocation | null>(null)

  // Check permission on mount
  useEffect(() => {
    queryPermission().then((perm) => {
      setState((s) => ({ ...s, permission: perm }))
    })
  }, [])

  // Resume watch when tab becomes visible again (mobile browsers pause watch on background)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && needsRefreshRef.current) {
        needsRefreshRef.current = false
        // Re-query permission (iOS expires after 24h)
        queryPermission().then((perm) => {
          setState((s) => ({ ...s, permission: perm }))
          if (perm === 'granted') {
            requestHighAccuracy()
          }
        })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Two-stage request: fast low-accuracy first, then refine with high accuracy
  const requestHighAccuracy = useCallback(async () => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocalização não suportada neste dispositivo' }))
      return
    }

    setState((s) => ({
      ...s,
      loading: 'locating',
      error: null,
      warning: null,
      refining: false,
    }))

    // Stage 1: quick low-accuracy (3s, accepts cache up to 30s)
    try {
      const quick = await getPosition({
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 30000,
      })
      const loc = toLocation(quick)
      lastLocationRef.current = loc
      setState((s) => ({
        ...s,
        location: loc,
        loading: 'refining',
        refining: true,
        permission: 'granted',
        warning: accuracyWarning(loc.accuracy),
      }))

      // Stage 2: refine with high accuracy (20s, fresh)
      try {
        const precise = await getPosition({
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        })
        const refined = toLocation(precise)
        lastLocationRef.current = refined
        setState((s) => ({
          ...s,
          location: refined,
          loading: 'ready',
          refining: false,
          warning: accuracyWarning(refined.accuracy),
        }))
      } catch (refineErr) {
        // Stage 2 failed - keep stage 1 result with a warning
        const err = refineErr as GeolocationPositionError
        setState((s) => ({
          ...s,
          loading: 'ready',
          refining: false,
          warning: `Localização aproximada (~${Math.round(loc.accuracy)}m). ${
            err.code === err.TIMEOUT ? 'GPS ainda calibrando.' : ''
          }`,
        }))
      }
    } catch (quickErr) {
      // Stage 1 failed - try high accuracy directly with longer timeout
      const err = quickErr as GeolocationPositionError
      if (err.code === err.PERMISSION_DENIED) {
        setState((s) => ({
          ...s,
          loading: 'idle',
          error: describeError(err),
          permission: 'denied',
        }))
        return
      }
      // Try once more with high accuracy and longer timeout
      try {
        const fallback = await getPosition({
          enableHighAccuracy: true,
          timeout: 25000,
          maximumAge: 0,
        })
        const loc = toLocation(fallback)
        lastLocationRef.current = loc
        setState((s) => ({
          ...s,
          location: loc,
          loading: 'ready',
          refining: false,
          permission: 'granted',
          warning: accuracyWarning(loc.accuracy),
        }))
      } catch (finalErr) {
        setState((s) => ({
          ...s,
          loading: 'idle',
          error: describeError(finalErr as GeolocationPositionError),
        }))
      }
    }
  }, [])

  const request = useCallback(() => {
    queryPermission().then((perm) => {
      setState((s) => ({ ...s, permission: perm }))
      if (perm === 'denied') {
        setState((s) => ({
          ...s,
          error: 'Permissão de localização negada. Habilite nas configurações do navegador.',
          loading: 'idle',
        }))
        return
      }
      requestHighAccuracy()
    })
  }, [requestHighAccuracy])

  // Watch with proper error handling - always high accuracy, fresh
  const watch = useCallback(() => {
    if (!navigator.geolocation) return () => {}
    if (watchIdRef.current !== null) return () => {}

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = toLocation(pos)
        lastLocationRef.current = loc
        setState((s) => ({
          ...s,
          location: loc,
          loading: 'ready',
          refining: false,
          error: null,
          warning: accuracyWarning(loc.accuracy),
          permission: 'granted',
        }))
      },
      (err) => {
        // Don't clear last known location on transient errors
        if (err.code === err.PERMISSION_DENIED) {
          setState((s) => ({
            ...s,
            error: 'Permissão de localização revogada. Habilite novamente nas configurações.',
            permission: 'denied',
            loading: 'idle',
          }))
        }
        // For TIMEOUT / POSITION_UNAVAILABLE - keep last location, just warn
        else if (lastLocationRef.current) {
          setState((s) => ({
            ...s,
            warning: 'Sinal de GPS instável. Mantendo última localização conhecida.',
          }))
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    )
    watchIdRef.current = id

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  const refresh = useCallback(() => {
    requestHighAccuracy()
  }, [requestHighAccuracy])

  const value: GeoContextValue = {
    ...state,
    request,
    watch,
    refresh,
  }

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>
}

export function GeoProvider({ children }: { children: React.ReactNode }) {
  return <GeoProviderImpl>{children}</GeoProviderImpl>
}

export function useGeolocation() {
  const ctx = useContext(GeoContext)
  if (!ctx) {
    throw new Error('useGeolocation deve ser usado dentro de <GeoProvider>')
  }
  return ctx
}
