import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getAutomationLogs } from '@/services/automation_logs'
import { getAgendas } from '@/services/agendas'
import { getPosts } from '@/services/posts'
import { AutomationLog, Agenda, Post } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'

const EVENT_TYPES = [
  'agenda_created',
  'post_generated',
  'post_published',
  'post_failed',
  'post_updated',
]

export default function LogsPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [eventFilter, setEventFilter] = useState('all')
  const [agendaFilter, setAgendaFilter] = useState('all')
  const [postFilter, setPostFilter] = useState('all')
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [posts, setPosts] = useState<Post[]>([])

  const loadData = async () => {
    try {
      const filters: string[] = []
      if (eventFilter !== 'all') filters.push(`event = "${eventFilter}"`)
      if (agendaFilter !== 'all') filters.push(`agenda = "${agendaFilter}"`)
      if (postFilter !== 'all') filters.push(`post = "${postFilter}"`)
      const res = await getAutomationLogs(page, 20, filters.join(' && '))
      setLogs(res.items)
      setTotalPages(res.totalPages || 1)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    getAgendas()
      .then(setAgendas)
      .catch(() => {})
    getPosts()
      .then(setPosts)
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadData()
  }, [page, eventFilter, agendaFilter, postFilter])
  useRealtime('automation_logs', () => loadData())

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Logs de Automação</h1>
        <p className="text-sm text-slate-500">Histórico de eventos, gerações por IA e postagens.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={eventFilter}
          onValueChange={(v) => {
            setEventFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Eventos</SelectItem>
            {EVENT_TYPES.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={agendaFilter}
          onValueChange={(v) => {
            setAgendaFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Agenda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Agendas</SelectItem>
            {agendas.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={postFilter}
          onValueChange={(v) => {
            setPostFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Post" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Posts</SelectItem>
            {posts.slice(0, 50).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.content?.slice(0, 30) || p.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data / Hora</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-400 text-sm">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50">
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap font-mono">
                      {new Date(log.created).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-800">
                      {log.event}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-lg line-clamp-2">
                      {log.details || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {log.expand?.created_by?.name || log.expand?.created_by?.email || 'Sistema'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 gap-1"
              >
                Próximo <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
