import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import type { Release, Track } from '@/types/database'

export type RepeatMode = 'off' | 'all' | 'one'

interface PlayerState {
  release: Release | null
  tracks: Track[]
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: RepeatMode
  expanded: boolean
}

type Action =
  | { type: 'PLAY_RELEASE'; release: Release; trackIndex?: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE' }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SEEK'; time: number }
  | { type: 'SET_TIME'; time: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'SET_TRACK'; index: number }
  | { type: 'SET_EXPANDED'; expanded: boolean }
  | { type: 'STOP' }

const initialState: PlayerState = {
  release: null,
  tracks: [],
  currentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  shuffle: false,
  repeat: 'off',
  expanded: false,
}

function pickNextIndex(state: PlayerState): number {
  const { tracks, currentIndex, shuffle, repeat } = state
  if (tracks.length === 0) return 0
  if (shuffle && tracks.length > 1) {
    let next = currentIndex
    while (next === currentIndex) {
      next = Math.floor(Math.random() * tracks.length)
    }
    return next
  }
  if (currentIndex < tracks.length - 1) return currentIndex + 1
  return repeat === 'all' ? 0 : -1
}

function pickPrevIndex(state: PlayerState): number {
  const { tracks, currentIndex, repeat } = state
  if (tracks.length === 0) return 0
  if (currentIndex > 0) return currentIndex - 1
  return repeat === 'all' ? tracks.length - 1 : 0
}

function reducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case 'PLAY_RELEASE': {
      const tracks = action.release.tracks ?? []
      const idx = Math.min(action.trackIndex ?? 0, Math.max(tracks.length - 1, 0))
      return {
        ...state,
        release: action.release,
        tracks,
        currentIndex: idx,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      }
    }
    case 'PLAY':
      return { ...state, isPlaying: true }
    case 'PAUSE':
      return { ...state, isPlaying: false }
    case 'TOGGLE':
      return { ...state, isPlaying: !state.isPlaying }
    case 'NEXT': {
      const next = pickNextIndex(state)
      if (next === -1) return { ...state, isPlaying: false }
      return { ...state, currentIndex: next, currentTime: 0, duration: 0 }
    }
    case 'PREV': {
      const prev = pickPrevIndex(state)
      return { ...state, currentIndex: prev, currentTime: 0, duration: 0 }
    }
    case 'SEEK':
      return { ...state, currentTime: action.time }
    case 'SET_TIME':
      return { ...state, currentTime: action.time }
    case 'SET_DURATION':
      return { ...state, duration: action.duration }
    case 'SET_VOLUME':
      return { ...state, volume: action.volume }
    case 'TOGGLE_SHUFFLE':
      return { ...state, shuffle: !state.shuffle }
    case 'TOGGLE_REPEAT': {
      const order: RepeatMode[] = ['off', 'all', 'one']
      const next = order[(order.indexOf(state.repeat) + 1) % order.length]
      return { ...state, repeat: next }
    }
    case 'SET_TRACK':
      return { ...state, currentIndex: action.index, currentTime: 0, duration: 0, isPlaying: true }
    case 'SET_EXPANDED':
      return { ...state, expanded: action.expanded }
    case 'STOP':
      return { ...initialState, volume: state.volume }
    default:
      return state
  }
}

interface PlayerContextValue extends PlayerState {
  currentTrack: Track | null
  audioRef: React.RefObject<HTMLAudioElement | null>
  playRelease: (release: Release, trackIndex?: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  setTrack: (index: number) => void
  setExpanded: (expanded: boolean) => void
  stop: () => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const currentTrack = state.tracks[state.currentIndex] ?? null

  const playRelease = useCallback((release: Release, trackIndex?: number) => {
    dispatch({ type: 'PLAY_RELEASE', release, trackIndex })
  }, [])
  const play = useCallback(() => dispatch({ type: 'PLAY' }), [])
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), [])
  const toggle = useCallback(() => dispatch({ type: 'TOGGLE' }), [])
  const next = useCallback(() => dispatch({ type: 'NEXT' }), [])
  const prev = useCallback(() => dispatch({ type: 'PREV' }), [])
  const seek = useCallback((time: number) => {
    dispatch({ type: 'SEEK', time })
    if (audioRef.current) audioRef.current.currentTime = time
  }, [])
  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', volume })
    if (audioRef.current) audioRef.current.volume = volume
  }, [])
  const toggleShuffle = useCallback(() => dispatch({ type: 'TOGGLE_SHUFFLE' }), [])
  const toggleRepeat = useCallback(() => dispatch({ type: 'TOGGLE_REPEAT' }), [])
  const setTrack = useCallback((index: number) => dispatch({ type: 'SET_TRACK', index }), [])
  const setExpanded = useCallback((expanded: boolean) => dispatch({ type: 'SET_EXPANDED', expanded }), [])
  const stop = useCallback(() => dispatch({ type: 'STOP' }), [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = state.volume
  }, [state.volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack?.audio_url) return
    if (audio.src !== currentTrack.audio_url) {
      audio.src = currentTrack.audio_url
      audio.load()
    }
    if (state.isPlaying) {
      audio.play().catch(() => {
        dispatch({ type: 'PAUSE' })
      })
    } else {
      audio.pause()
    }
  }, [currentTrack?.audio_url, state.isPlaying, currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => dispatch({ type: 'SET_TIME', time: audio.currentTime })
    const onDuration = () => dispatch({ type: 'SET_DURATION', duration: audio.duration || 0 })
    const onEnded = () => {
      if (state.repeat === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
        return
      }
      const next = pickNextIndex(state)
      if (next === -1) {
        dispatch({ type: 'PAUSE' })
      } else {
        dispatch({ type: 'NEXT' })
      }
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('ended', onEnded)
    }
  }, [state])

  const value: PlayerContextValue = {
    ...state,
    currentTrack,
    audioRef,
    playRelease,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    setTrack,
    setExpanded,
    stop,
  }

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
