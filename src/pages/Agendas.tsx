import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { getAgendas, deleteAgenda } from '@/services/agendas'
import { getPosts } from '@/services/posts'
import { Agenda } from '@/types'
import { AgendaCard } from '@/components/AgendaCard'
import { AgendaModal } from '@/components/AgendaModal'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function AgendasPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [postCounts, setPostCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null)
  const { user, isAdmin } = useAuth()

  const loadData = async () => {
    try {
      const filter = isAdmin ? '' : `created_by = "${user?.id}"`
      const data = await getAgendas(filter)
      setAgendas(data)
      const posts = await getPosts()
      const counts: Record<string, number> = {}
      posts.forEach((p) => {
        counts[p.agenda] = (counts[p.agenda] || 0) + 1
      })
      setPostCounts(counts)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id, isAdmin])

  useRealtime('agendas', () => loadData())
  useRealtime('posts', () => loadData())

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
          <Plus className="h-4 w-4" /> Nova Agenda
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

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Nenhuma agenda encontrada.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agenda) => (
            <AgendaCard
              key={agenda.id}
              agenda={agenda}
              postCount={postCounts[agenda.id] || 0}
              onEdit={(a) => {
                setEditingAgenda(a)
                setModalOpen(true)
              }}
              onDelete={handleDelete}
              canDelete={isAdmin}
            />
          ))}
        </div>
      )}

      <AgendaModal
        key={editingAgenda?.id || 'new'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        agenda={editingAgenda}
        onSuccess={loadData}
      />
    </div>
  )
}
