import { useProjectConversations } from "@/lib/hooks/use-projects"
import { cn } from "@/lib/utils/cn"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface ProjectSidebarProps {
  projectId: string
  currentConversationId?: string
}

export function ProjectSidebar({ projectId, currentConversationId }: ProjectSidebarProps) {
  const { data: conversations, isLoading } = useProjectConversations(projectId)
  const router = useRouter()

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading chats...</div>
        ) : conversations?.conversations.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">
            No chats yet. Start a new conversation above!
          </div>
        ) : (
          <div className="divide-y">
            <AnimatePresence>
              {conversations?.conversations.map((conv, index) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => router.push(
                    conv.conversation_mode === "deep_agent"
                      ? `/chat/deep-agent/${conv.id}`
                      : `/chat/agent/${conv.id}`
                  )}
                  className={cn(
                    "flex w-full flex-col gap-1 px-6 py-4 text-left transition-colors hover:bg-accent/50 cursor-pointer",
                    currentConversationId === conv.id && "bg-accent"
                  )}
                >
                  <span className="font-medium">
                    {conv.title || "New Conversation"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Last message {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: false })} ago
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
