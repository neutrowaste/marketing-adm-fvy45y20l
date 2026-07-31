import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  FileEdit,
  CheckCircle2,
  AlertTriangle,
  Plus,
  History,
  ArrowRight,
} from 'lucide-react'
import { getAgendas } from '@/services/agendas'
import { getPosts } from '@/services/posts'
import { getRecentLogs } from '@/services/automation_logs'
import { AgendaModal } from '@/components/AgendaModal'
import { useRealtime } from '@/hooks/use-realtime'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [agendasCount, setAgendasCount] = useState(0)
  const [draftCount, setDraftCount] = useState(0)
  const [postedCount, setPostedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  const loadData = async () => {
    try {
      const agendas = await getAgendas()
      setAgendasCount(agendas.length)

      const posts = await getPosts()
      setDraftCount(posts.filter((p) => p.status === 'draft').length)
      setPostedCount(posts.filter((p) => p.status === 'posted').length)
      setFailedCount(posts.filter((p) => p.status === 'failed').length)

      const logsRes = await getRecentLogs(5)
      setRecentLogs(logsRes.items)

      const daysMap: Record<string, number> = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
        daysMap[dateStr] = 0
      }

      posts.forEach((p) => {
        const d = new Date(p.created)
        const dateStr = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
        if (daysMap[dateStr] !== undefined) {
          daysMap[dateStr] += 1
        }
      })

      const chartArr = Object.keys(daysMap).map((key) => ({
        dia: key,
        posts: daysMap[key],
      }))
      setChartData(chartArr)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('posts', () => {
    loadData()
  })
  useRealtime('agendas', () => {
    loadData()
  })
  useRealtime('automation_logs', () => {
    loadData()
  })

  const summaryCards = [
    {
      title: 'Total de Agendas',
      value: agendasCount,
      icon: Calendar,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Posts Pendentes',
      value: draftCount,
      icon: FileEdit,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Posts Publicados',
      value: postedCount,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Posts com Falha',
      value: failedCount,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50 border-red-100',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel Geral</h1>
          <p className="text-sm text-slate-500">Visão geral do agendamento e automação de posts.</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nova Agenda
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon
          return (
            <Card
              key={i}
              className="border border-slate-200 bg-white shadow-subtle hover:shadow-elevation transition"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                <CardTitle className="text-xs font-medium text-slate-500">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-slate-200 bg-white shadow-subtle">
          <CardHeader className="p-5 border-b">
            <CardTitle className="text-base font-semibold text-slate-800">
              Posts Criados (Últimos 7 Dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[260px] w-full">
              <ChartContainer config={{ posts: { label: 'Posts', color: 'hsl(243, 75%, 59%)' } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="dia"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="posts" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-subtle flex flex-col">
          <CardHeader className="p-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600" />
              Logs Recentes
            </CardTitle>
            <Link
              to="/logs"
              className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 divide-y divide-slate-100 overflow-hidden">
            {recentLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum log de automação encontrado.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50 transition text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.event}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-500 line-clamp-1">
                    {log.details || 'Sem detalhes fornecidos.'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AgendaModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={loadData} />
    </div>
  )
}
