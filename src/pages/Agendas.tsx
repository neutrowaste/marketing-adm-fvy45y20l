import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react'
import { getAgendas, deleteAgenda } from '@/services/agendas'
import { Agenda } from '@/types'
import { AgendaModal } from '@/components/AgendaModal'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function AgendasPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null)
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      const data = await getAgendas()
      setAgendas(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('agendas', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Tem certeza que deseja excluir esta agenda? Todos os posts associados serão removidos.',
      )
    )
      return
    try {
      await deleteAgenda(id)
      toast({ title: 'Agenda removida', description: 'Agenda excluída com sucesso.' })
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro ao remover', description: e.message, variant: 'destructive' })
    }
  }

  const filtered = agendas.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.theme.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Agendas de Publicação
          </h1>
          <p className="text-sm text-slate-500">Gerencie seus temas e modelos de automação.</p>
        </div>
        <Button
          onClick={() => {
            setEditingAgenda(null)
            setModalOpen(true)
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Agenda
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-subtle">
        <Search className="h-4 w-4 text-slate-400 ml-1" />
        <Input
          placeholder="Buscar por título ou tema..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 text-sm"
        />
      </div>

      <Card className="border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                    Nenhuma agenda encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((agenda) => {
                  const sDate = new Date(agenda.start_date).toLocaleDateString('pt-BR')
                  const eDate = new Date(agenda.end_date).toLocaleDateString('pt-BR')
                  return (
                    <TableRow key={agenda.id} className="hover:bg-slate-50">
                      <TableCell className="font-semibold text-slate-800">{agenda.title}</TableCell>
                      <TableCell className="max-w-xs text-xs text-slate-600 line-clamp-2">
                        {agenda.theme}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {sDate} - {eDate}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="capitalize bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                          {agenda.frequency === 'daily'
                            ? 'Diário'
                            : agenda.frequency === 'every_two_days'
                              ? 'A cada 2 dias'
                              : agenda.frequency === 'weekly'
                                ? 'Semanal'
                                : 'Personalizado'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/agendas/${agenda.id}/posts`)}
                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 text-xs gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Posts
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingAgenda(agenda)
                              setModalOpen(true)
                            }}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(agenda.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AgendaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        agenda={editingAgenda}
        onSuccess={loadData}
      />
    </div>
  )
}
