routerAdd(
  'POST',
  '/backend/v1/generate-post',
  (e) => {
    const body = e.requestInfo().body || {}
    const postId = body.postId
    if (!postId) {
      return e.badRequestError('postId é obrigatório')
    }

    const userId = e.auth ? e.auth.id : null
    if (!userId) {
      return e.unauthorizedError('Autenticação necessária')
    }

    const post = $app.findRecordById('posts', postId)
    if (!post) {
      return e.notFoundError('Post não encontrado')
    }

    const agendaId = post.getString('agenda')
    const agenda = $app.findRecordById('agendas', agendaId)
    if (!agenda) {
      return e.notFoundError('Agenda não encontrada')
    }

    const theme = agenda.getString('theme')
    const baseModel = agenda.getString('base_model')
    const scheduledDate = post.getString('scheduled_date')

    const prompt = `Você é um especialista em marketing digital para Instagram.
Crie um post engajador em Português do Brasil com base no tema e modelo fornecidos.

Tema do Post: ${theme}
Modelo de Estrutura a Seguir:
${baseModel}

Data agendada: ${scheduledDate}

Instruções:
- Mantenha o tom de voz dinâmico e atrativo.
- Inclua emojis adequados ao tema.
- Mantenha a estrutura sugerida no modelo base.
- Adicione 3 a 5 hashtags relevantes no final.
- Retorne APENAS o texto final do post, sem explicações adicionais.`

    const aiRes = $ai.chat({
      model: 'fast',
      messages: [
        { role: 'system', content: 'Você é um gerador de conteúdo para Instagram em Português.' },
        { role: 'user', content: prompt },
      ],
    })

    const generatedText = aiRes.choices[0].message.content.trim()
    const queryEnc = encodeURIComponent(theme.slice(0, 30))
    const imageUrl = 'https://img.usecurling.com/p/800/800?q=' + queryEnc

    post.set('content', generatedText)
    post.set('image_url', imageUrl)
    post.set('status', 'generated')
    $app.save(post)

    const logsCol = $app.findCollectionByNameOrId('automation_logs')
    const logRec = new Record(logsCol)
    logRec.set('event', 'Conteúdo Gerado por IA')
    logRec.set(
      'details',
      `Conteúdo e imagem gerados com sucesso para o post agendado em ${scheduledDate}`,
    )
    logRec.set('post', post.id)
    logRec.set('agenda', agenda.id)
    logRec.set('created_by', userId)
    $app.save(logRec)

    return e.json(200, {
      success: true,
      post: {
        id: post.id,
        content: generatedText,
        image_url: imageUrl,
        status: 'generated',
      },
    })
  },
  $apis.requireAuth(),
)
