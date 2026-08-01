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

    const prompt =
      'Você é um especialista em marketing digital para instagram.\n' +
      'Crie um post engajador em Português do Brasil com base no tema e modelo fornecidos.\n\n' +
      'Tema do Post: ' +
      theme +
      '\n' +
      'Modelo de Estrutura a Seguir:\n' +
      baseModel +
      '\n\n' +
      'Data agendada: ' +
      scheduledDate +
      '\n\n' +
      'Instruções:\n' +
      '- Mantenha o tom de voz dinâmico e atrativo.\n' +
      '- Inclua emojis adequados ao tema.\n' +
      '- Mantenha a estrutura sugerida no modelo base.\n' +
      '- Adicione 3 a 5 hashtags relevantes no final.\n' +
      '- Retorne APENAS o texto final do post, sem explicações adicionais.'

    const aiRes = $ai.chat({
      model: 'fast',
      messages: [
        { role: 'system', content: 'Você é um gerador de conteúdo para Instagram em Português.' },
        { role: 'user', content: prompt },
      ],
    })

    const generatedText = aiRes.choices[0].message.content.trim()

    var baseImage = agenda.getString('base_image')
    var instructions = (agenda.getString('instructions') || '').trim()

    var imageUrl = ''
    var logDetails =
      'Conteúdo e imagem gerados com sucesso para o post agendado em ' + scheduledDate

    if (baseImage && instructions) {
      var webhookSuccess = false
      var failureReason = ''

      try {
        var pbUrl = $secrets.get('PB_INSTANCE_URL') || ''
        var publicImageUrl = pbUrl + '/api/files/agendas/' + agenda.id + '/' + baseImage

        var webhookRes = $http.send({
          url: 'https://devtasks.fksato.cloud/webhook/tratar-imagem',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: instructions,
            imageUrl: publicImageUrl,
            callbackUrl: '',
          }),
          timeout: 120,
        })

        if (webhookRes.statusCode >= 200 && webhookRes.statusCode < 300) {
          var data = webhookRes.json
          if (data && data.status === 'ok' && data.imagemTratadaBase64) {
            var base64Data = data.imagemTratadaBase64
            if (base64Data.indexOf('base64,') >= 0) {
              base64Data = base64Data.split('base64,')[1]
            }
            imageUrl = 'data:image/png;base64,' + base64Data
            webhookSuccess = true
            if (data.promptUsado) {
              logDetails =
                logDetails + ' | Prompt usado (tratamento de imagem): ' + data.promptUsado
            }
          } else {
            failureReason = 'Resposta sem imagemTratadaBase64 ou status diferente de ok'
          }
        } else {
          failureReason = 'Webhook retornou status HTTP ' + webhookRes.statusCode
        }
      } catch (err) {
        failureReason = 'Erro de rede/timeout: ' + String(err.message || err)
      }

      if (!webhookSuccess) {
        imageUrl =
          'https://img.usecurling.com/p/800/800?q=' + encodeURIComponent(theme.slice(0, 30))
        logDetails =
          logDetails +
          ' | Falha no tratamento de imagem: ' +
          failureReason +
          '. Usando imagem por tema.'
      }
    } else {
      imageUrl = 'https://img.usecurling.com/p/800/800?q=' + encodeURIComponent(theme.slice(0, 30))
    }

    post.set('content', generatedText)
    post.set('image_url', imageUrl)
    post.set('status', 'generated')
    $app.save(post)

    var logsCol = $app.findCollectionByNameOrId('automation_logs')
    var logRec = new Record(logsCol)
    logRec.set('event', 'Conteúdo Gerado por IA')
    logRec.set('details', logDetails)
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
