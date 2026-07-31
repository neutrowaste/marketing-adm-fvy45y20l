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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Agenda } from '@/types'
import { createAgenda, updateAgenda } from '@/services/agendas'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'

interface AgendaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agenda?: Agenda | null
  onSuccess: () => void
}

const WEEKDAYS = [
  { label: 'Dom', val: 0 },
  { label: 'Seg', val: 1 },
  { label: 'Ter', val: 2 },
  { label: 'Qua', val: 3 },
  { label: 'Qui', val: 4 },
  { label: 'Sex', val: 5 },
  { label: 'Sáb', val: 6 },
]

export function AgendaModal({ open, onOpenChange, agenda, onSuccess }: AgendaModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState(agenda?.title || '')
  const [theme, setTheme] = useState(agenda?.theme || '')
  const [baseModel, setBaseModel] = useState(agenda?.base_model || '')
  const [startDate, setStartDate] = useState(
    agenda?.start_date ? agenda.start_date.split('T')[0] : '',
  )
  const [endDate, setEndDate] = useState(agenda?.end_date ? agenda.end_date.split('T')[0] : '')
  const [frequency, setFrequency] = useState<Agenda['frequency']>(agenda?.frequency || 'daily')
  const [customDays, setCustomDays] = useState<number[]>(agenda?.custom_days || [1, 3, 5])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !theme || !baseModel || !startDate || !endDate) {
      toast({
        title: 'Erro de validação',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const payload = {
        title,
        theme,
        base_model: baseModel,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        frequency,
        custom_days: frequency === 'custom' ? customDays : [],
        created_by: user?.id,
      }

      if (agenda?.id) {
        await updateAgenda(agenda.id, payload)
        toast({ title: 'Agenda atualizada', description: 'A agenda foi alterada com sucesso.' })
      } else {
        await createAgenda(payload)
        toast({
          title: 'Agenda criada',
          description: 'A agenda e seus posts rascunho foram gerados.',
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Ocorreu um erro ao salvar a agenda.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (dayVal: number) => {
    setCustomDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agenda ? 'Editar Agenda' : 'Nova Agenda de Posts'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="title">Título da Agenda *</Label>
            <Input
              id="title"
              placeholder="Ex: Campanha Dia das Mães"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="theme">Tema do Conteúdo *</Label>
            <Textarea
              id="theme"
              placeholder="Descreva o tema principal (ex: Promoção de ofertas exclusivas e dicas de presente)"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              required
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="baseModel">Modelo Base (Estrutura do Post) *</Label>
            <Textarea
              id="baseModel"
              placeholder="Ex: 🎁 Surpreenda quem você ama!\n\n[CONTEÚDO]\n\n#DiaDasMaes #Ofertas"
              value={baseModel}
              onChange={(e) => setBaseModel(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data Inicial *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="frequency">Frequência de Publicação</Label>
            <Select value={frequency} onValueChange={(val: any) => setFrequency(val)}>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="every_two_days">A cada 2 dias</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === 'custom' && (
            <div className="space-y-2 rounded-lg border p-3 bg-slate-50">
              <Label className="text-xs font-semibold text-slate-700">Dias da Semana</Label>
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map((day) => (
                  <label
                    key={day.val}
                    className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Checkbox
                      checked={customDays.includes(day.val)}
                      onCheckedChange={() => toggleDay(day.val)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Salvando...' : 'Salvar Agenda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
