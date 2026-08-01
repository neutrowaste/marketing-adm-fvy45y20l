routerAdd(
  'POST',
  '/backend/v1/generate-image',
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

    var baseImage = agenda.getString('base_image')
    var instructions = (agenda.getString('instructions') || '').trim()

    if (!baseImage || !instructions) {
      return e.json(400, {
        error:
          'A agenda precisa ter uma imagem base e instruções definidas antes de gerar a imagem. Adicione uma imagem base e instruções à agenda.',
      })
    }

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

    if (!fileContent) {
      return e.json(400, {
        error: 'Não foi possível ler a imagem base da agenda.',
      })
    }

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

    var webhookRes
    try {
      webhookRes = $http.send({
        url: 'https://devtasks.fksato.cloud/webhook-test/tratar-imagem',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: instructions,
          imageBase64: imageBase64,
        }),
        timeout: 120,
      })
    } catch (err) {
      return e.json(504, {
        error:
          'O serviço de tratamento de imagem não respondeu no tempo limite (120s). Tente novamente.',
      })
    }

    if (webhookRes.statusCode < 200 || webhookRes.statusCode >= 300) {
      return e.json(502, {
        error: 'O serviço de tratamento de imagem retornou um erro. Tente novamente.',
      })
    }

    var data = webhookRes.json
    if (!data || data.status !== 'ok' || !data.imagemTratadaBase64) {
      return e.json(502, {
        error: 'O serviço de tratamento de imagem não retornou uma imagem válida. Tente novamente.',
      })
    }

    var base64Data = data.imagemTratadaBase64
    if (base64Data.indexOf('base64,') >= 0) {
      base64Data = base64Data.split('base64,')[1]
    }
    var imageUrl = 'data:image/png;base64,' + base64Data

    post.set('image_url', imageUrl)
    $app.save(post)

    var logDetails = 'Imagem gerada via webhook de tratamento'
    if (data.promptUsado) {
      logDetails = logDetails + ' | Prompt usado: ' + data.promptUsado
    }

    var logsCol = $app.findCollectionByNameOrId('automation_logs')
    var logRec = new Record(logsCol)
    logRec.set('event', 'Imagem Gerada via Webhook')
    logRec.set('details', logDetails)
    logRec.set('post', post.id)
    logRec.set('agenda', agenda.id)
    logRec.set('created_by', userId)
    $app.save(logRec)

    return e.json(200, {
      success: true,
      image_url: imageUrl,
      promptUsado: data.promptUsado || '',
    })
  },
  $apis.requireAuth(),
)
