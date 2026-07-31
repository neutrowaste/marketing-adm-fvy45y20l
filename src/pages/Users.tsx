import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { getUsers, deleteUser } from '@/services/users'
import { User } from '@/types'
import { UserModal } from '@/components/UserModal'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { user: currentUser } = useAuth()

  const loadData = async () => {
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', () => loadData())

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      toast({
        title: 'Operação não permitida',
        description: 'Você não pode remover seu próprio usuário.',
        variant: 'destructive',
      })
      return
    }
    if (!confirm('Deseja realmente remover este usuário?')) return
    try {
      await deleteUser(id)
      toast({ title: 'Usuário removido', description: 'Usuário deletado com sucesso.' })
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao remover', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gerenciamento de Usuários
          </h1>
          <p className="text-sm text-slate-500">
            Cadastre e controle os papéis de acesso no sistema.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null)
            setModalOpen(true)
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <Card className="border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isAdmin = u.role === 'admin'
                const isSelf = u.id === currentUser?.id
                return (
                  <TableRow key={u.id} className="hover:bg-slate-50">
                    <TableCell className="font-semibold text-slate-800">{u.name || '-'}</TableCell>
                    <TableCell className="text-xs text-slate-600">{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isAdmin
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }
                      >
                        {isAdmin ? 'Administrador' : 'Analista'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(u.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingUser(u)
                            setModalOpen(true)
                          }}
                          className="text-slate-500 hover:text-slate-700"
                          disabled={isSelf}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(u.id)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isSelf}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserModal
        key={editingUser?.id || 'new'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={editingUser}
        onSuccess={loadData}
      />
    </div>
  )
}
