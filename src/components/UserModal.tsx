import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createUser, updateUser } from '@/services/users'
import { User } from '@/types'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from '@/hooks/use-toast'

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSuccess: () => void
}

export function UserModal({ open, onOpenChange, user, onSuccess }: UserModalProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'analyst'>('analyst')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open) {
      setName(user?.name || '')
      setEmail(user?.email || '')
      setPassword('')
      setRole(user?.role || 'analyst')
      setFieldErrors({})
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    if (!email) {
      setFieldErrors({ email: 'E-mail é obrigatório.' })
      return
    }
    if (!user && !password) {
      setFieldErrors({ password: 'Senha é obrigatória.' })
      return
    }

    try {
      setLoading(true)
      if (user?.id) {
        const data: Record<string, any> = { name, email, role }
        if (password) {
          data.password = password
          data.passwordConfirm = password
        }
        await updateUser(user.id, data)
        toast({
          title: 'Usuário atualizado',
          description: 'Dados do usuário alterados com sucesso.',
        })
      } else {
        await createUser({ email, password, name, role })
        toast({ title: 'Usuário criado', description: `Usuário ${email} cadastrado com sucesso.` })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      const errors = extractFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
      } else {
        toast({
          title: 'Erro ao salvar',
          description: err.message || 'Verifique as informações.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="userName">Nome Completo</Label>
            <Input
              id="userName"
              placeholder="Ex: Maria Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="userEmail">E-mail *</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="maria@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {fieldErrors.email && <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <Label htmlFor="userPass">Senha {user ? '(deixe em branco para manter)' : '*'}</Label>
            <Input
              id="userPass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!user}
              minLength={user ? 0 : 8}
            />
            {fieldErrors.password && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.password}</p>
            )}
          </div>
          <div>
            <Label htmlFor="userRole">Papel do Usuário *</Label>
            <Select value={role} onValueChange={(val: any) => setRole(val)}>
              <SelectTrigger id="userRole">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="analyst">Analista de Marketing</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
