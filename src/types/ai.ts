export type AiTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface GenerationParams {
  prompt: string
  seed?: number
  style?: string
}

export interface AiTask {
  id: string
  userId: string
  status: AiTaskStatus
  params: GenerationParams
  resultUrl: string | null
  createdAt: string
}
