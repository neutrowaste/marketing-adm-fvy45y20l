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

    var post
    try {
      post = $app.findRecordById('posts', postId)
    } catch (_) {
      return e.notFoundError('Post não encontrado')
    }

    var agendaId = post.getString('agenda')
    var agenda
    try {
      agenda = $app.findRecordById('agendas', agendaId)
    } catch (_) {
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
    var logDetails = 'Conteúdo gerado com sucesso para o post agendado em ' + scheduledDate

    if (baseImage && instructions) {
      var fileContent = null

      try {
        var fsys = $app.newFilesystem()
        var storageKey = agenda.baseFilesPath() + '/' + baseImage
        fileContent = fsys.get(storageKey)
        fsys.close()
      } catch (fsErr) {
        // fallback below
      }

      if (!fileContent) {
        var pbUrl = $secrets.get('PB_INSTANCE_URL') || ''
        var fileUrl = pbUrl + '/api/files/agendas/' + agenda.id + '/' + baseImage
        try {
          var fileRes = $http.send({ url: fileUrl, method: 'GET', timeout: 30 })
          if (fileRes.statusCode >= 200 && fileRes.statusCode < 300) {
            fileContent = fileRes.body
          }
        } catch (fetchErr) {
          // handled below
        }
      }

      if (fileContent) {
        var base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
        var isString = typeof fileContent === 'string'
        var parts = []
        var contentLen = fileContent.length
        for (var i = 0; i < contentLen; i += 3) {
          var byte1 = isString ? fileContent.charCodeAt(i) : fileContent[i]
          var byte2 =
            i + 1 < contentLen ? (isString ? fileContent.charCodeAt(i + 1) : fileContent[i + 1]) : 0
          var byte3 =
            i + 2 < contentLen ? (isString ? fileContent.charCodeAt(i + 2) : fileContent[i + 2]) : 0
          parts.push(base64Chars.charAt(byte1 >> 2))
          parts.push(base64Chars.charAt(((byte1 & 0x03) << 4) | (byte2 >> 4)))
          parts.push(
            i + 1 < contentLen ? base64Chars.charAt(((byte2 & 0x0f) << 2) | (byte3 >> 6)) : '=',
          )
          parts.push(i + 2 < contentLen ? base64Chars.charAt(byte3 & 0x3f) : '=')
        }
        var imageBase64 = parts.join('')

        try {
          var webhookRes = $http.send({
            url: 'https://devtasks.fksato.cloud/webhook-test/tratar-imagem',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              context: instructions,
              imageBase64: imageBase64,
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
              logDetails = logDetails + ' | Imagem tratada gerada via webhook'
              if (data.promptUsado) {
                logDetails = logDetails + ' | Prompt usado: ' + data.promptUsado
              }
            } else {
              logDetails = logDetails + ' | Falha: resposta do webhook sem imagem válida'
            }
          } else {
            logDetails = logDetails + ' | Falha: webhook retornou HTTP ' + webhookRes.statusCode
          }
        } catch (err) {
          logDetails =
            logDetails + ' | Falha no tratamento de imagem: ' + String(err.message || err)
        }
      } else {
        logDetails = logDetails + ' | Imagem não gerada: não foi possível ler a imagem base'
      }
    } else {
      logDetails = logDetails + ' | Imagem não gerada: agenda sem imagem base ou instruções'
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
