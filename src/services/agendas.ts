import pb from '@/lib/pocketbase/client'
import { Agenda } from '@/types'

export const getAgendas = async () => {
  return pb.collection('agendas').getFullList<Agenda>({
    sort: '-created',
    expand: 'created_by',
  })
}

export const getAgenda = async (id: string) => {
  return pb.collection('agendas').getOne<Agenda>(id, {
    expand: 'created_by',
  })
}

export const createAgenda = async (data: Partial<Agenda>) => {
  return pb.collection('agendas').create<Agenda>(data)
}

export const updateAgenda = async (id: string, data: Partial<Agenda>) => {
  return pb.collection('agendas').update<Agenda>(id, data)
}

export const deleteAgenda = async (id: string) => {
  return pb.collection('agendas').delete(id)
}
