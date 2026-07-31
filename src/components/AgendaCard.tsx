import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Edit2, Trash2, Eye, FileText } from 'lucide-react'
import { Agenda } from '@/types'

interface AgendaCardProps {
  agenda: Agenda
  postCount: number
  onEdit: (agenda: Agenda) => void
  onDelete: (id: string) => void
  canDelete: boolean
}

const frequencyLabels: Record<string, string> = {
  daily: 'Diário',
  every_two_days: 'A cada 2 dias',
  weekly: 'Semanal',
  custom: 'Personalizado',
}

export function AgendaCard({ agenda, postCount, onEdit, onDelete, canDelete }: AgendaCardProps) {
  const sDate = new Date(agenda.start_date).toLocaleDateString('pt-BR')
  const eDate = new Date(agenda.end_date).toLocaleDateString('pt-BR')

  return (
    <Card className="border border-slate-200 bg-white shadow-subtle hover:shadow-elevation transition-shadow">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 text-sm leading-tight">{agenda.title}</h3>
          <Badge
            variant="outline"
            className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] whitespace-nowrap"
          >
            {frequencyLabels[agenda.frequency] || agenda.frequency}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2">{agenda.theme}</p>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          <span>
            {sDate} - {eDate}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <span>{postCount} post(s)</span>
        </div>
        <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 text-xs gap-1"
          >
            <Link to={`/agendas/${agenda.id}/posts`}>
              <Eye className="h-3.5 w-3.5" /> Ver Posts
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(agenda)}
            className="text-slate-500 hover:text-slate-700 h-8 w-8"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(agenda.id)}
              className="text-red-500 hover:text-red-700 h-8 w-8"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
