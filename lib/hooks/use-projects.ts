import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { aiService, type Project, type Skill } from "@/lib/api/client"

export function useProjects(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['projects', limit, offset],
    queryFn: () => aiService.getProjects(limit, offset),
  })
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => aiService.getProject(projectId),
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; instructions?: string }) => 
      aiService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => 
      aiService.updateProject(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', data.id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aiService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: () => aiService.getProjectDocuments(projectId),
    enabled: !!projectId,
  })
}

export function useDeleteProjectDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, documentId }: { projectId: string; documentId: string }) => 
      aiService.deleteProjectDocument(projectId, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] }) // Update count
    },
  })
}

export function useProjectConversations(projectId: string, limit = 20, skip = 0) {
  return useQuery({
    queryKey: ['project-conversations', projectId, limit, skip],
    queryFn: () => aiService.getProjectConversations(projectId, limit, skip),
    enabled: !!projectId,
  })
}

export function useCreateProjectConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => aiService.createProjectConversation(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-conversations', projectId] })
    },
  })
}

export function useProjectMemory(projectId: string) {
  return useQuery({
    queryKey: ['project-memory', projectId],
    queryFn: () => aiService.getProjectMemory(projectId),
    enabled: !!projectId,
  })
}

export function useGlobalMemory() {
  return useQuery({
    queryKey: ['global-memory'],
    queryFn: () => aiService.getGlobalMemory(),
  })
}

export function useClearGlobalMemoryCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (category: string) => aiService.clearGlobalMemoryCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-memory'] })
    },
  })
}

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => aiService.getSkills(),
  })
}

export function useCreateSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description: string; content: string }) =>
      aiService.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
    },
  })
}

export function useUpdateSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Skill, 'name' | 'description' | 'content' | 'is_enabled'>> }) =>
      aiService.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
    },
  })
}

export function useDeleteSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aiService.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
    },
  })
}
