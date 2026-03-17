import { redirect } from "next/navigation"

export default function NewChatPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const query = new URLSearchParams()
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, value)
  })
  const suffix = query.toString() ? `?${query.toString()}` : ""
  redirect(`/chat/agent/new${suffix}`)
}
