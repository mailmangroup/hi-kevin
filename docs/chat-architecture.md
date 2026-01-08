# Chat Architecture

This document describes the chat interface implementation, including message rendering, streaming support, and conversation management.

## Overview

The chat system consists of several components that work together to provide a rich messaging experience:

```
components/chat/
├── chat-interface.tsx    # Main chat component with streaming & history
├── message-content.tsx   # Markdown rendering for message text
├── tool-call-display.tsx # Tool call visualization with input/output
├── artifact-display.tsx  # Artifact display (charts, tables, code)
├── quick-chat.tsx        # Floating chat widget
└── index.ts              # Component exports
```

## Data Flow

### 1. Loading from Database (Conversation History)

When a user opens an existing conversation:

```
chatId prop → loadHistory(id) → aiService.getMessages() → parseSubContentList() → setMessages()
           → loadConversationTitle(id) → aiService.getConversation() → setConversationTitle()
```

### 2. Live Streaming (New Messages)

When a user sends a message:

```
handleSend() → aiService.chatStream() → for await (chunk)
                                            ├── chunk.new_conversation → setConversationId, update URL
                                            ├── chunk.content → append to message
                                            ├── chunk.tool_start → add tool to toolCalls[]
                                            ├── chunk.tool_end → update tool with output/artifact
                                            ├── chunk.follow_up_questions → store for display
                                            └── chunk.error → append error to content
                                        → finally: fetch title if new conversation
```

## Message Data Structure

### Database Format (sub_content_list)

Messages from the database include a `sub_content_list` array that contains the sequence of events:

```typescript
interface SubContentItem {
  type: "tool_input" | "tool_output" | "assistant_message" | "user_message"
  tool?: string           // Tool name (for tool_input/tool_output)
  tool_input?: any        // Input parameters
  tool_output?: any       // Output data
  artifact?: any          // Associated artifact data
  content?: string        // Message text content
}
```

Example from database:
```json
{
  "sub_content_list": [
    {
      "type": "tool_input",
      "tool": "get_account_insights",
      "tool_input": { "action": "best_time_to_publish", "network_list": ["xhs"] }
    },
    {
      "type": "tool_output",
      "tool": "get_account_insights",
      "tool_output": { "xhs": { "markdown_summary": "**Best Times:**\n..." } },
      "artifact": null
    },
    {
      "type": "assistant_message",
      "content": "For your Xiaohongshu account..."
    }
  ]
}
```

### Internal Message Format

The chat interface converts database messages to this format:

```typescript
interface Message {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
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
}
```

## Parsing Logic

The `parseSubContentList()` function converts database format to internal format:

1. **Maintains sequence order** - Items are processed in array order
2. **Matches tool inputs with outputs** - Uses a Map to pair tool_input with corresponding tool_output
3. **Handles multiple calls to same tool** - Tracks pending tools in an array per tool name
4. **Associates artifacts with tool calls** - Artifacts are stored on the specific ToolCall, not at message level

```typescript
function parseSubContentList(subContentList): { toolCalls: ToolCall[], content: string }
```

## Components

### MessageContent

Renders markdown content with full GFM (GitHub Flavored Markdown) support:

- Headers (h1-h3)
- Lists (ordered, unordered)
- Tables
- Code blocks (inline and fenced)
- Links
- Blockquotes
- Bold/Italic text

Features:
- Theme-aware styling (different colors for user vs assistant)
- Proper whitespace handling
- Mobile-responsive

### ToolCallDisplay

Displays tool execution with expandable details:

- **Header**: Icon, tool name, state indicator (spinner/checkmark)
- **Expanded view**: Input parameters, output data, artifact preview
- **Collapsed view**: Markdown summary (if available) or "Data available" indicator

Behavior:
- Auto-collapses when tool completes during streaming
- Remembers user toggle state
- Shows inline summary when collapsed

### ArtifactDisplay (Standalone)

For rendering artifacts outside of tool calls:

- Type-specific icons and colors
- Copy to clipboard
- Collapsible content
- Supports: chart, code, table, report, data types

## Streaming Events

The backend sends these event types via SSE:

| Event | Description |
|-------|-------------|
| `chunk.new_conversation` | New conversation created, includes `conversation_id` |
| `chunk.content` | Incremental text content |
| `chunk.tool_start` | Tool execution started, includes `tool` name and `input` |
| `chunk.tool_end` | Tool execution completed, includes `tool`, `output`, optional `artifact` |
| `chunk.follow_up_questions` | Array of suggested follow-up questions |
| `chunk.error` | Error message |

## Conversation Title

- **On load**: Fetched via `aiService.getConversation(id)`
- **After first message**: Fetched 1 second after stream completes (allows backend to generate title)
- **Document title**: Updated to `{title} - Kevin`

## State Management

Key states in ChatInterface:

```typescript
const [messages, setMessages] = useState<Message[]>([])
const [input, setInput] = useState("")
const [isThinking, setIsThinking] = useState(false)
const [conversationId, setConversationId] = useState<string | undefined>()
const [conversationTitle, setConversationTitle] = useState<string>("New Conversation")
```

## API Integration

### Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/proxy/agent/conversations/{id}` | Get conversation details |
| GET | `/proxy/agent/conversations/{id}/messages` | Get message history |
| POST | `/proxy/agent/chat` | Stream chat response (SSE) |

### Authentication

- Credentials (orgId, brandId) are loaded from Supabase user profile
- Passed to API via proxy headers

## Error Handling

1. **Credentials missing**: Shows error banner, disables input
2. **Stream error**: Displays error message in chat
3. **History load error**: Logs to console (silent failure)

## Events Dispatched

| Event | When | Purpose |
|-------|------|---------|
| `chat-created` | New conversation created | Refresh sidebar chat list |

## Usage

```tsx
import { ChatInterface } from "@/components/chat"

// New chat
<ChatInterface initialMessage="Hello!" />

// Existing conversation
<ChatInterface chatId="conversation-id-123" />
```

## File Locations

- **Main component**: `components/chat/chat-interface.tsx`
- **API client**: `lib/api/client.ts`
- **Proxy route**: `app/api/proxy/[...path]/route.ts`
- **Chat pages**: `app/(dashboard)/chat/[id]/page.tsx`, `app/(dashboard)/chat/new/page.tsx`
