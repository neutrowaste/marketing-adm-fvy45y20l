import pb from '@/lib/pocketbase/client'
import { Post } from '@/types'

export const getPosts = async (agendaId?: string, status?: string) => {
  const filters: string[] = []
  if (agendaId) filters.push(`agenda = "${agendaId}"`)
  if (status && status !== 'all') filters.push(`status = "${status}"`)

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

export const deletePost = async (id: string) => {
  return pb.collection('posts').delete(id)
}
