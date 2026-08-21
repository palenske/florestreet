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

export type GeoPermission = 'granted' | 'denied' | 'prompt' | 'unknown'

export interface GeoState {
  location: GeoLocation | null
  loading: boolean
  error: string | null
  warning: string | null
  supported: boolean
  permission: GeoPermission
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

function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

function GeoProviderImpl({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [permission, setPermission] = useState<GeoPermission>('unknown')

  const supported = typeof navigator !== 'undefined' && !!navigator.geolocation
  const watchIdRef = useRef<number | null>(null)
  const requestingRef = useRef(false)

  const requestGeo = useCallback(async () => {
    if (!supported || requestingRef.current) return
    requestingRef.current = true
    setLoading(true)
    setError(null)
    setWarning(null)

    const finish = (loc: GeoLocation | null, warn: string | null, errMsg: string | null, perm: GeoPermission) => {
      if (loc) setLocation(loc)
      if (warn) setWarning(warn)
      if (errMsg) setError(errMsg)
      setPermission(perm)
      setLoading(false)
      requestingRef.current = false
    }

    try {
      let quick: GeolocationPosition
      try {
        quick = await getPosition({ enableHighAccuracy: false, timeout: 3000, maximumAge: 30000 })
      } catch (quickErr) {
        const err = quickErr as GeolocationPositionError
        if (err.code === err.PERMISSION_DENIED) {
          finish(null, null, describeError(err), 'denied')
          return
        }
        const fallback = await getPosition({ enableHighAccuracy: true, timeout: 25000, maximumAge: 0 })
        finish(toLocation(fallback), accuracyWarning(fallback.coords.accuracy), null, 'granted')
        return
      }

      const loc = toLocation(quick)
      finish(loc, accuracyWarning(loc.accuracy), null, 'granted')

      try {
        const precise = await getPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 })
        const refined = toLocation(precise)
        setLocation(refined)
        setWarning(accuracyWarning(refined.accuracy))
      } catch (refineErr) {
        const err = refineErr as GeolocationPositionError
        setWarning(`Localização aproximada (~${Math.round(loc.accuracy)}m). ${
          err.code === err.TIMEOUT ? 'GPS ainda calibrando.' : ''
        }`)
      }
    } catch (finalErr) {
      finish(null, null, describeError(finalErr as GeolocationPositionError), permission)
    }
  }, [supported, permission])

  const watchPos = useCallback(() => {
    if (!supported || watchIdRef.current !== null) return () => {}

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = toLocation(pos)
        setLocation(loc)
        setWarning(accuracyWarning(loc.accuracy))
        setPermission('granted')
        if (!requestingRef.current) setError(null)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Permissão de localização revogada. Habilite novamente nas configurações.')
          setPermission('denied')
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
  }, [supported])

  const value: GeoContextValue = {
    location,
    loading,
    error,
    warning,
    supported,
    permission,
    request: requestGeo,
    watch: watchPos,
    refresh: requestGeo,
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
