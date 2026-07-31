import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Send, Eye, Image as ImageIcon, Calendar } from 'lucide-react'
import { getPosts, generatePostContent, updatePostStatus } from '@/services/posts'
import { Post } from '@/types'
import { PostDetailModal } from '@/components/PostDetailModal'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

const statusMap: Record<string, { label: string; badge: string }> = {
  draft: { label: 'Rascunho', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  generated: { label: 'Gerado', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  posted: { label: 'Publicado', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Falhou', badge: 'bg-red-50 text-red-700 border-red-200' },
}

export default function PostsPage() {
  const { agendaId } = useParams<{ agendaId?: string }>()
  const [posts, setPosts] = useState<Post[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const data = await getPosts(agendaId, statusFilter)
      setPosts(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [agendaId, statusFilter])

  useRealtime('posts', () => {
    loadData()
  })

  const handleGenerate = async (postId: string) => {
    try {
      setGeneratingId(postId)
      toast({ title: 'Gerando Conteúdo com IA', description: 'Por favor, aguarde...' })
      await generatePostContent(postId)
      toast({ title: 'Conteúdo Gerado!', description: 'Post atualizado com texto e imagem.' })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao gerar', description: err.message, variant: 'destructive' })
    } finally {
      setGeneratingId(null)
    }
  }

  const handleSimulatePost = async (postId: string) => {
    try {
      await updatePostStatus(postId, 'posted')
      toast({
        title: 'Publicação Simulada',
        description: 'O post foi marcado como publicado com sucesso no Instagram.',
      })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro na simulação', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gerenciamento de Posts
          </h1>
          <p className="text-sm text-slate-500">
            Gere conteúdo com IA e simule a publicação no Instagram.
          </p>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="all" className="text-xs">
            Todos
          </TabsTrigger>
          <TabsTrigger value="draft" className="text-xs">
            Rascunhos
          </TabsTrigger>
          <TabsTrigger value="generated" className="text-xs">
            Gerados
          </TabsTrigger>
          <TabsTrigger value="posted" className="text-xs">
            Publicados
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border border-slate-200 bg-white shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data Agendada</TableHead>
                <TableHead>Imagem</TableHead>
                <TableHead>Conteúdo Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                    Nenhum post encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => {
                  const sInfo = statusMap[post.status] || statusMap.draft
                  const dateFormatted = post.scheduled_date
                    ? new Date(post.scheduled_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'N/A'

                  return (
                    <TableRow key={post.id} className="hover:bg-slate-50">
                      <TableCell className="text-xs font-medium text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{dateFormatted}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-10 h-10 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden">
                          {post.image_url ? (
                            <img
                              src={post.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md text-xs text-slate-600 line-clamp-2">
                        {post.content ? (
                          post.content
                        ) : (
                          <span className="italic text-slate-400">
                            Conteúdo pendente de geração
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium ${sInfo.badge}`}
                        >
                          {sInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {post.status === 'draft' && (
                            <Button
                              size="sm"
                              disabled={generatingId === post.id}
                              onClick={() => handleGenerate(post.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1 py-1 h-8"
                            >
                              <Sparkles className="h-3 w-3" />
                              {generatingId === post.id ? 'Gerando...' : 'Gerar Conteúdo'}
                            </Button>
                          )}

                          {post.status === 'generated' && (
                            <Button
                              size="sm"
                              onClick={() => handleSimulatePost(post.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 py-1 h-8"
                            >
                              <Send className="h-3 w-3" />
                              Simular Publicação
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPost(post)
                              setModalOpen(true)
                            }}
                            className="text-slate-600 hover:text-slate-900 text-xs gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Detalhes
                          </Button>
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

      <PostDetailModal open={modalOpen} onOpenChange={setModalOpen} post={selectedPost} />
    </div>
  )
}
