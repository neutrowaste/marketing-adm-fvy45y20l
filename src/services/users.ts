import pb from '@/lib/pocketbase/client'
import { User } from '@/types'

export const getUsers = async () => {
  return pb.collection('users').getFullList<User>({
    sort: '-created',
  })
}

export const createUser = async (data: {
  email: string
  password: string
  name?: string
  role?: 'admin' | 'analyst'
}) => {
  return pb.collection('users').create<User>({
    ...data,
    passwordConfirm: data.password,
  })
}

export const updateUser = async (
  id: string,
  data: Partial<User> & { password?: string; passwordConfirm?: string },
) => {
  return pb.collection('users').update<User>(id, data)
}

export const deleteUser = async (id: string) => {
  return pb.collection('users').delete(id)
}
