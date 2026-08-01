import pb from '@/lib/pocketbase/client'
import { Agenda } from '@/types'

export const getAgendas = async (filter?: string) => {
  return pb.collection('agendas').getFullList<Agenda>({
    sort: '-created',
    expand: 'created_by',
    filter: filter || '',
  })
}

export const getAgenda = async (id: string) => {
  return pb.collection('agendas').getOne<Agenda>(id, {
    expand: 'created_by',
  })
}

export const createAgenda = async (data: Record<string, unknown> | FormData) => {
  return pb.collection('agendas').create<Agenda>(data)
}

export const updateAgenda = async (id: string, data: Record<string, unknown> | FormData) => {
  return pb.collection('agendas').update<Agenda>(id, data)
}

export const deleteAgenda = async (id: string) => {
  return pb.collection('agendas').delete(id)
}
