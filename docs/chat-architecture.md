# Chat Architecture

Frontend chat for Kevin: one `ChatInterface` with two modes (`agent` / `deep_agent`), SSE streaming to the KAWO backend, ordered message `parts`, side-panel artifacts/reports, and a module-level stream registry so navigation mid-stream does not lose state.

Credentials / mock mode: see [CLAUDE.md](../CLAUDE.md).

## Modes & routes

| Mode | Wrapper | Stream endpoint | Routes |
|------|---------|-----------------|--------|
| `agent` | `AgentChatInterface` → `ChatInterface conversationMode="agent"` | `POST /agent/query` | `/chat/agent`, `/chat/agent/new`, `/chat/agent/[id]` |
| `deep_agent` | `DeepAgentChatInterface` → `ChatInterface conversationMode="deep_agent"` | `POST /deep-agent/query` | `/chat/deep-agent`, `/chat/deep-agent/new`, `/chat/deep-agent/[id]` |

- `/chat` redirects to `/chat/agent`.
- Legacy `/chat/[id]` also mounts `AgentChatInterface`.
- If a loaded conversation’s `conversation_mode` disagrees with the route, the UI `router.replace`s to the correct path.
- Mode can also be toggled via `?deepAgent=` when not locked by `conversationMode`.

## Component map

```
components/chat/
├── chat-interface.tsx           # Core UI + stream loop (everything goes through here)
├── agent-chat-interface.tsx     # Thin wrapper: conversationMode="agent"
├── deep-agent-chat-interface.tsx
├── chat-input-area.tsx          # Composer (model, web search, uploads, mode toggles)
├── message-content.tsx          # Markdown / GFM
├── memoized-markdown.tsx
├── thinking-display.tsx
├── tool-call-display.tsx
├── deep-agent-display.tsx       # Subagents + todos
├── artifact-context.tsx         # Selected artifact + panel state
├── artifact-panel.tsx           # Side panel shell
├── artifact-display.tsx         # Inline / typed artifact views
├── artifact-renderers.tsx
├── artifact-snippet.tsx
├── brand-posts-artifact.tsx
├── web-search-artifact.tsx
├── help-center-artifact.tsx
├── report-content.tsx
├── report-outline-sidebar.tsx
├── conversation-list.tsx
├── conversation-list-item.tsx
├── message-actions.tsx
├── quick-chat.tsx               # Floating widget (simpler path)
└── index.ts

lib/
├── api/client.ts                # aiService.chatStream, conversations, reports
├── hooks/use-deep-agent-stream.ts
├── utils/parse-sub-content.ts   # History → Message parts
└── streaming/stream-registry.ts # Survives remount mid-stream
```

## Data flow

### Load history

```
chatId → streamRegistry.getSession(id)?  # reconnect live stream if any
       → aiService.getConversation(id)   # title, conversation_mode, report id
       → aiService.getMessages(id)
       → parseSubContentList(msg.sub_content_list)
       → setMessages + hydrateDeepAgent(from deep_agent parts)
```

### Send + stream

```
handleSend()
  → append user + empty assistant message
  → streamRegistry.createSession(key)
  → aiService.chatStream(query, { deepAgent, conversationId, images, documentIds, … })
  → for await (chunk):
        new_conversation → set id, history.replaceState(`/chat/{mode}/{id}`), `chat-created`
        content / coordinator_token → text part
        thinking / coordinator_thinking → thinking part
        tool_start / tool_end → tool parts (+ auto-open artifact panel)
        tool_input_stream → live create_artifact / write_file preview
        execute_status → sandbox status on running `execute` tool
        report → open report artifact
        deep-agent typed events → useDeepAgentStream.processEvent
        follow_up_questions | done | stopped → clear isThinking
        error → append to content
  → finally: streamRegistry.complete; fetch title if new
```

URL updates for new chats use `window.history.replaceState` (not `router.replace`) so `/new` → `/[id]` does not remount and flash.

## Message model

Messages are ordered **parts** (text / thinking / tool / deep_agent), not a flat string + optional tools.

```typescript
interface ContentPart {
  type: "text" | "thinking" | "tool" | "deep_agent"
  content?: string
  tool?: ToolCall
  deepAgent?: DeepAgentStreamState
}

interface Message {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
  images?: Array<{ image_url: string; filename?: string; file_type?: string }>
  documents?: any[]
  parts?: ContentPart[]
  thinking?: string
  report?: any
  isStreaming?: boolean
  followUpQuestions?: string[]
}

interface ToolCall {
  id: string
  name: string
  input: any
  output?: any
  artifact?: any
  state: "running" | "completed" | "failed"
  executeStatus?: "executing" | "done" | "error"
}
```

## History parsing (`parseSubContentList`)

Converts DB `sub_content_list` → `{ toolCalls, content, images, documents, parts }`.

Recognized item types include:

| `type` | Behavior |
|--------|----------|
| `tool_input` / `tool_output` | Pair tools (by `tool_call_id` or last matching name) |
| `tool_call` / `tool_use` | Single tool entry (optional output) |
| `ai_message` / `tool_message` | LangChain-style messages + nested `tool_calls` |
| `assistant_message` / `user_message` / `text` | Text parts |
| `thinking` | Thinking part |
| `deep_agent_state` | Rebuild `DeepAgentStreamState` + coordinator tools/content |
| `image` / `user_image` / `document` / `user_document` | Attachments |

## SSE events

### Shared / agent (`/agent/query`)

| Event | Role |
|-------|------|
| `new_conversation` | Includes conversation id (several shapes accepted) |
| `content` or untyped `content` | Assistant text tokens |
| `thinking` or untyped `thinking` | Thinking tokens |
| `tool_start` / `tool_end` | Tool lifecycle; `tool_end` may include `artifact` |
| `tool_input_stream` | Partial tool args (`create_artifact` / `write_file`) |
| `execute_status` | Sandbox execute progress |
| `follow_up_questions` | Suggestions; clears thinking/send lock |
| `report` | Full report payload → panel |
| `done` / `stopped` / `error` | Terminal / cancel / error |

### Deep agent (`/deep-agent/query`)

Handled by `useDeepAgentStream` when `chunk.type` is set:

| `type` | Role |
|--------|------|
| `coordinator_token` / `coordinator_thinking` | Coordinator text/thinking (also handled in main loop) |
| `todo_update` | Todo list |
| `subagent_started` | Spawn subagent under `parent_message_id` |
| `subagent_token` / `subagent_thinking` | Subagent stream |
| `subagent_tool_start` / `subagent_tool_end` | Subagent tools (+ artifacts) |
| `subagent_execute_status` | Subagent sandbox execute |
| `subagent_completed` / `subagent_error` | Subagent terminal |
| `done` / `stopped` | Run complete / user cancel |

Deep-agent UI: `deep-agent-display.tsx` + todo list from `deepAgentState.values.todos`.

## Artifacts & reports

- `ArtifactProvider` wraps `ChatInterface`; `useArtifact()` opens/updates the side panel.
- Types: `chart | code | table | report | data | html | markdown | mermaid | file`.
- Specialized inline views: brand posts, web search, help center.
- Reports use `report-content` + `report-outline-sidebar`; APIs: `getReport`, `updateReportInsights`, `exportReport`.
- Streaming artifacts open early via `tool_input_stream`, then finalize on `tool_end`.

## Stream registry

`lib/streaming/stream-registry.ts` keeps sessions alive across remounts:

1. `createSession(conversationId || "new")` before the stream loop  
2. `update` after each chunk (messages + `lastArtifact`)  
3. `renameKey("new" → realId)` on `new_conversation`  
4. `complete` when finished (scheduled cleanup)  
5. On remount, subscribe and sync React state from the session snapshot  

## API (chat-related)

| Method | Path | Use |
|--------|------|-----|
| GET | `/agent/conversations` | List (`conversation_mode` filter) |
| GET | `/agent/conversations/{id}` | Title / mode / metadata |
| GET | `/agent/conversations/{id}/messages` | History |
| POST | `/agent/query` | Agent SSE |
| POST | `/deep-agent/query` | Deep-agent SSE |
| GET | `/agent/conversations/{id}/report/{reportId}` | Report body |
| PUT | `/agent/reports/{id}/pages/{page}/sections/{section}/insights` | Edit insights |
| GET | `/agent/reports/{id}/export` | HTML export |

`chatStream` options include: `conversationId`, `projectId`, `model`, `includeWebSearch`, `thinkingEnabled`, `toolSelectionEnabled`, `images`, `documentIds`, `reportFromTemplate`, `reportContext`, `fastPath`, `deepAgent`, `sqlEnabled`.

Auth headers: Bearer + `X-KAWO-Org-Id` / `X-KAWO-Brand-Id` (see CLAUDE.md for credential sources).

## Events

| DOM event | When | Purpose |
|-----------|------|---------|
| `chat-created` | New conversation id from stream | Refresh sidebar list |

## Usage

```tsx
import { AgentChatInterface } from "@/components/chat/agent-chat-interface"
import { DeepAgentChatInterface } from "@/components/chat/deep-agent-chat-interface"

<AgentChatInterface chatId="…" />
<DeepAgentChatInterface initialMessage="Research …" />
// Or: <ChatInterface conversationMode="agent" | "deep_agent" />
```
