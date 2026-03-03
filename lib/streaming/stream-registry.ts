/**
 * Module-level registry that keeps streaming sessions alive across React
 * component mounts/unmounts. When a user navigates away mid-stream and
 * comes back, the component can subscribe to the existing session and
 * receive the buffered + live message state.
 *
 * Lifecycle:
 *  1. handleSend creates a session (key = conversationId || "new")
 *  2. Stream loop calls registry.update() after each chunk (alongside setMessages)
 *  3. When new_conversation arrives, registry.renameKey() moves "new" → real ID
 *  4. On stream completion, registry.complete() marks done + schedules cleanup
 *  5. On component remount, chatId useEffect checks for an active session,
 *     subscribes, and syncs React state from the registry snapshot
 */

import type { Message } from "@/components/chat/chat-interface"

// Minimal artifact shape — mirrors ArtifactData from artifact-context to
// avoid a circular import
export interface StreamArtifact {
  id: string
  type: string
  title: string
  data: any
  toolName?: string
  session?: any
}

export interface StreamSession {
  key: string
  conversationId: string | null
  messages: Message[]
  isStreaming: boolean
  lastArtifact: StreamArtifact | null
}

type Listener = () => void

class StreamRegistry {
  private sessions = new Map<string, StreamSession>()
  private listeners = new Map<string, Set<Listener>>()

  /** Create (or replace) a session. Call this before the for-await loop. */
  createSession(key: string, messages: Message[]): StreamSession {
    this.sessions.delete(key)
    const session: StreamSession = {
      key,
      conversationId: key === "new" ? null : key,
      messages: [...messages],
      isStreaming: true,
      lastArtifact: null,
    }
    this.sessions.set(key, session)
    return session
  }

  getSession(key: string): StreamSession | undefined {
    return this.sessions.get(key)
  }

  /** Apply an update to the session and notify all subscribers. */
  update(key: string, updater: (s: StreamSession) => void): void {
    const session = this.sessions.get(key)
    if (!session) return
    updater(session)
    this.notify(key)
  }

  /**
   * Rename a session key (used when "new" → real conversationId).
   * Existing listeners are transferred to the new key.
   */
  renameKey(oldKey: string, newKey: string): void {
    const session = this.sessions.get(oldKey)
    if (!session) return
    session.key = newKey
    session.conversationId = newKey
    this.sessions.delete(oldKey)
    this.sessions.set(newKey, session)
    const existing = this.listeners.get(oldKey)
    if (existing) {
      this.listeners.delete(oldKey)
      this.listeners.set(newKey, existing)
    }
  }

  /** Subscribe to session updates. Returns an unsubscribe function. */
  subscribe(key: string, listener: Listener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(listener)
    return () => this.listeners.get(key)?.delete(listener)
  }

  /**
   * Mark the session as complete and schedule cleanup after 30 s.
   * The delay gives the user time to navigate back and still reconnect.
   */
  complete(key: string): void {
    const session = this.sessions.get(key)
    if (!session) return
    session.isStreaming = false
    this.notify(key)
    setTimeout(() => {
      if (!this.sessions.get(key)?.isStreaming) {
        this.sessions.delete(key)
        this.listeners.delete(key)
      }
    }, 30_000)
  }

  private notify(key: string): void {
    this.listeners.get(key)?.forEach(cb => cb())
  }
}

export const streamRegistry = new StreamRegistry()
