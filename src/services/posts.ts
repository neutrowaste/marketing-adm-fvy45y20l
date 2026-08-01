import pb from '@/lib/pocketbase/client'
import { Post } from '@/types'

export const getPosts = async (
  agendaId?: string,
  status?: string,
  startDate?: string,
  endDate?: string,
) => {
  const filters: string[] = []
  if (agendaId) filters.push(`agenda = "${agendaId}"`)
  if (status && status !== 'all') filters.push(`status = "${status}"`)
  if (startDate) filters.push(`scheduled_date >= "${new Date(startDate).toISOString()}"`)
  if (endDate) filters.push(`scheduled_date <= "${new Date(endDate).toISOString()}"`)

  const filter = filters.length ? filters.join(' && ') : ''

  return pb.collection('posts').getFullList<Post>({
    filter,
    sort: 'scheduled_date',
    expand: 'agenda,created_by',
  })
}

export const getPost = async (id: string) => {
  return pb.collection('posts').getOne<Post>(id, {
    expand: 'agenda,created_by',
  })
}

export const updatePostStatus = async (
  id: string,
  status: 'draft' | 'generated' | 'posted' | 'failed',
) => {
  return pb.collection('posts').update<Post>(id, { status })
}

export const generatePostContent = async (postId: string) => {
  return pb.send<{ success: boolean; post: Partial<Post> }>('/backend/v1/generate-post', {
    method: 'POST',
    body: JSON.stringify({ postId }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const generatePostImage = async (postId: string) => {
  try {
    return await pb.send<{ success: boolean; image_url: string; promptUsado: string }>(
      '/backend/v1/generate-image',
      {
        method: 'POST',
        body: JSON.stringify({ postId }),
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    if (err?.status === 0 || err?.isAbort) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.')
    }
    const msg = err?.response?.error || err?.message || 'Erro desconhecido ao gerar imagem'
    throw new Error(msg)
  }
}

export const deletePost = async (id: string) => {
  return pb.collection('posts').delete(id)
}
