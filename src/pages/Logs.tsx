import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAutomationLogs } from '@/services/automation_logs'
import { AutomationLog } from '@/types'
import { useRealtime } from '@/hooks/use-realtime'

export default function LogsPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterText, setFilterString] = useState('')

  const loadData = async () => {
    try {
      const f = filterText ? `event ~ "${filterText}" || details ~ "${filterText}"` : ''
      const res = await getAutomationLogs(page, 20, f)
      setLogs(res.items)
      setTotalPages(res.totalPages || 1)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, filterText])

  useRealtime('automation_logs', () => {
    loadData()
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Logs de Automação</h1>
        <p className="text-sm text-slate-500">
          Histórico de eventos, gerações por IA e postagens simuladas.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-subtle">
        <Search className="h-4 w-4 text-slate-400 ml-1" />
        <Input
          placeholder="Filtrar eventos ou detalhes..."
          value={filterText}
          onChange={(e) => {
            setFilterString(e.target.value)
            setPage(1)
          }}
          className="border-0 shadow-none focus-visible:ring-0 text-sm"
        />
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
                logs.map((log) => {
                  const dateStr = new Date(log.created).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap font-mono">
                        {dateStr}
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
                  )
                })
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
