import { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Loader2, AlertCircle, ImagePlus, RotateCcw } from 'lucide-react'
import { generatePostImage } from '@/services/posts'
import { cn } from '@/lib/utils'

interface GenerateImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string | null
  onSuccess?: () => void
}

const STEPS = [
  'Enviando imagem base e instruções para o serviço...',
  'Aguardando o processamento (pode levar até 2 minutos)...',
  'Recebendo e decodificando a imagem processada...',
  'Imagem gerada com sucesso!',
]

type StepState = 'pending' | 'active' | 'done'

function getErrorMessage(err: any): string {
  const msg = (err?.message || '').toLowerCase()
  if (msg.includes('tempo limite') || msg.includes('120s')) {
    return 'O tempo limite de 120 segundos foi atingido. Tente novamente.'
  }
  if (msg.includes('imagem base e instruções')) {
    return 'A agenda precisa ter uma imagem base e instruções definidas antes de gerar.'
  }
  if (msg.includes('não foi possível ler a imagem base')) {
    return 'Não foi possível ler a imagem base da agenda. Verifique se a imagem foi enviada corretamente.'
  }
  if (msg.includes('não retornou uma imagem')) {
    return 'O serviço não retornou uma imagem válida. Tente novamente.'
  }
  if (msg.includes('retornou um erro')) {
    return 'O serviço de tratamento de imagem retornou um erro. Tente novamente.'
  }
  if (
    msg.includes('failed') ||
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('conexão') ||
    msg.includes('connection')
  ) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  }
  return 'O serviço de tratamento de imagem retornou um erro. Tente novamente.'
}

export function GenerateImageDialog({
  open,
  onOpenChange,
  postId,
  onSuccess,
}: GenerateImageDialogProps) {
  const [stepStates, setStepStates] = useState<StepState[]>([
    'pending',
    'pending',
    'pending',
    'pending',
  ])
  const [error, setError] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
  }

  const runGeneration = useCallback(async () => {
    if (!postId) return
    clearTimers()
    setError(null)
    setResultImage(null)
    setLoading(true)
    setStepStates(['active', 'pending', 'pending', 'pending'])

    const t = setTimeout(() => {
      setStepStates((prev) => {
        const next = [...prev]
        if (next[0] === 'active') {
          next[0] = 'done'
          next[1] = 'active'
        }
        return next
      })
    }, 1500)
    timersRef.current.push(t)

    try {
      const result = await generatePostImage(postId)
      setStepStates(['done', 'done', 'active', 'pending'])

      const t2 = setTimeout(() => {
        setStepStates(['done', 'done', 'done', 'active'])
        setResultImage(result.image_url)
      }, 500)
      timersRef.current.push(t2)

      const t3 = setTimeout(() => {
        setStepStates(['done', 'done', 'done', 'done'])
        setLoading(false)
        onSuccess?.()
      }, 900)
      timersRef.current.push(t3)
    } catch (err: any) {
      clearTimers()
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }, [postId, onSuccess])

  useEffect(() => {
    if (open && postId) {
      runGeneration()
    }
    return () => clearTimers()
  }, [open, postId, runGeneration])

  useEffect(() => {
    if (!open) {
      clearTimers()
      setStepStates(['pending', 'pending', 'pending', 'pending'])
      setError(null)
      setResultImage(null)
      setLoading(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <ImagePlus className="h-5 w-5 text-indigo-600" />
            Geração de Imagem
          </DialogTitle>
        </DialogHeader>

        {error ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">Erro na geração da imagem</p>
                <p className="mt-1 text-xs text-red-600">{error}</p>
              </div>
            </div>
            <Button
              onClick={runGeneration}
              variant="outline"
              className="w-full gap-2"
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {STEPS.map((label, i) => {
              const state = stepStates[i]
              return (
                <div key={i} className="flex items-center gap-3">
                  {state === 'done' && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                  )}
                  {state === 'active' && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    </div>
                  )}
                  {state === 'pending' && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-200" />
                  )}
                  <span
                    className={cn(
                      'text-sm',
                      state === 'done' && 'text-slate-500',
                      state === 'active' && 'font-medium text-slate-900',
                      state === 'pending' && 'text-slate-400',
                    )}
                  >
                    {label}
                  </span>
                </div>
              )
            })}

            {resultImage && (
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <img src={resultImage} alt="Imagem gerada" className="w-full" />
              </div>
            )}

            {loading && !resultImage && (
              <p className="pt-2 text-center text-xs text-slate-400">
                Aguarde, não feche esta janela...
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
