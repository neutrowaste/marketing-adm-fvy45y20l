import { useState } from 'react'
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
import { createUser } from '@/services/users'
import { toast } from '@/hooks/use-toast'

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UserModal({ open, onOpenChange, onSuccess }: UserModalProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'analyst'>('analyst')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: 'Erro de validação',
        description: 'E-mail e senha são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      await createUser({ email, password, name, role })
      toast({ title: 'Usuário criado', description: `Usuário ${email} cadastrado com sucesso.` })
      onSuccess()
      onOpenChange(false)
      setName('')
      setEmail('')
      setPassword('')
      setRole('analyst')
    } catch (err: any) {
      toast({
        title: 'Erro ao criar usuário',
        description: err.message || 'Verifique as informações prestadas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
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
          </div>

          <div>
            <Label htmlFor="userPass">Senha *</Label>
            <Input
              id="userPass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
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
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
