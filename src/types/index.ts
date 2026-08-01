export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role?: 'admin' | 'analyst'
  created: string
  updated: string
}

export interface Agenda {
  id: string
  title: string
  theme: string
  base_model: string
  start_date: string
  end_date: string
  frequency: 'daily' | 'every_two_days' | 'weekly' | 'custom'
  custom_days?: number[]
  base_image?: string
  instructions?: string
  created_by: string
  expand?: {
    created_by?: User
  }
  created: string
  updated: string
}

export interface Post {
  id: string
  agenda: string
  scheduled_date: string
  content: string
  image_url: string
  generated_image?: string
  status: 'draft' | 'generated' | 'posted' | 'failed'
  created_by: string
  expand?: {
    agenda?: Agenda
    created_by?: User
  }
  created: string
  updated: string
}

export interface AutomationLog {
  id: string
  event: string
  details?: string
  post?: string
  agenda?: string
  created_by: string
  expand?: {
    post?: Post
    agenda?: Agenda
    created_by?: User
  }
  created: string
  updated: string
}
