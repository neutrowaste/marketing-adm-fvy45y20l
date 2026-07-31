import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Post } from '@/types'
import { Calendar, Image as ImageIcon } from 'lucide-react'

interface PostDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: Post | null
}

const statusBadges: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  generated: { label: 'Gerado', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  posted: { label: 'Publicado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Falhou', className: 'bg-red-50 text-red-700 border-red-200' },
}

export function PostDetailModal({ open, onOpenChange, post }: PostDetailModalProps) {
  if (!post) return null

  const status = statusBadges[post.status] || statusBadges.draft
  const formattedDate = post.scheduled_date
    ? new Date(post.scheduled_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <span>Detalhes do Post Agendado</span>
            </DialogTitle>
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-square flex items-center justify-center relative">
              {post.image_url ? (
                <img
                  src={post.image_url}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImageIcon className="h-10 w-10 stroke-1" />
                  <span className="text-xs">Imagem ainda não gerada</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>
                Data de publicação: <strong>{formattedDate}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col h-full space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Legenda do Instagram
            </h4>
            <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm whitespace-pre-wrap font-sans text-slate-800 leading-relaxed overflow-y-auto max-h-[300px]">
              {post.content ? (
                post.content
              ) : (
                <span className="italic text-slate-400">
                  O conteúdo por IA ainda não foi gerado para este post.
                </span>
              )}
            </div>

            {post.expand?.agenda && (
              <div className="rounded-md bg-indigo-50/60 p-3 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                <p className="font-semibold">Agenda: {post.expand.agenda.title}</p>
                <p className="text-indigo-700 line-clamp-1">Tema: {post.expand.agenda.theme}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
