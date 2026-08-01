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
          'A agenda precisa ter uma imagem base e instruções definidas antes de gerar a imagem.',
      })
    }

    var fileContent = null

    try {
      var fsys = $app.newFilesystem()
      var storageKey = agenda.baseFilesPath() + '/' + baseImage
      fileContent = fsys.get(storageKey)
      fsys.close()
    } catch (fsErr) {}

    if (!fileContent) {
      var pbUrl0 = $secrets.get('PB_INSTANCE_URL') || ''
      var dlUrl = pbUrl0 + '/api/files/agendas/' + agenda.id + '/' + baseImage
      try {
        var dlRes = $http.send({ url: dlUrl, method: 'GET', timeout: 30 })
        if (dlRes.statusCode >= 200 && dlRes.statusCode < 300) {
          fileContent = dlRes.body
        }
      } catch (fetchErr) {}
    }

    if (!fileContent) {
      return e.json(400, { error: 'Não foi possível ler a imagem base da agenda.' })
    }

    var lowerName = baseImage.toLowerCase()
    var mimeType = 'image/png'
    if (lowerName.indexOf('.jpg') >= 0 || lowerName.indexOf('.jpeg') >= 0) {
      mimeType = 'image/jpeg'
    } else if (lowerName.indexOf('.webp') >= 0) {
      mimeType = 'image/webp'
    }

    var b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    var isStr = typeof fileContent === 'string'
    var encParts = []
    var clen = fileContent.length
    for (var i = 0; i < clen; i += 3) {
      var b1 = isStr ? fileContent.charCodeAt(i) : fileContent[i]
      var b2 = i + 1 < clen ? (isStr ? fileContent.charCodeAt(i + 1) : fileContent[i + 1]) : 0
      var b3 = i + 2 < clen ? (isStr ? fileContent.charCodeAt(i + 2) : fileContent[i + 2]) : 0
      encParts.push(b64chars.charAt(b1 >> 2))
      encParts.push(b64chars.charAt(((b1 & 0x03) << 4) | (b2 >> 4)))
      encParts.push(i + 1 < clen ? b64chars.charAt(((b2 & 0x0f) << 2) | (b3 >> 6)) : '=')
      encParts.push(i + 2 < clen ? b64chars.charAt(b3 & 0x3f) : '=')
    }
    var imageBase64 = encParts.join('')

    var webhookRes
    try {
      webhookRes = $http.send({
        url: 'https://devtasks.fksato.cloud/webhook-test/tratar-imagem',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: instructions,
          imageBase64: imageBase64,
          mimeType: mimeType,
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

    var treatedB64 = data.imagemTratadaBase64
    if (treatedB64.indexOf('base64,') >= 0) {
      treatedB64 = treatedB64.split('base64,')[1]
    }
    treatedB64 = treatedB64.replace(/[^A-Za-z0-9+/]/g, '')

    var decBytes = []
    for (var k = 0; k < treatedB64.length; k += 4) {
      var d1 = b64chars.indexOf(treatedB64.charAt(k))
      var d2 = b64chars.indexOf(treatedB64.charAt(k + 1))
      var d3 = b64chars.indexOf(treatedB64.charAt(k + 2))
      var d4 = b64chars.indexOf(treatedB64.charAt(k + 3))
      if (d1 < 0) d1 = 0
      if (d2 < 0) d2 = 0
      decBytes.push((d1 << 2) | (d2 >> 4))
      if (d3 >= 0) decBytes.push(((d2 & 0x0f) << 4) | (d3 >> 2))
      if (d4 >= 0) decBytes.push(((d3 & 0x03) << 6) | d4)
    }

    var generatedFile = $filesystem.fileFromBytes(decBytes, 'generated.png')
    post.set('generated_image', generatedFile)
    $app.save(post)

    var storedFilename = post.getString('generated_image')
    var pbUrl = $secrets.get('PB_INSTANCE_URL') || ''
    var imageUrl = pbUrl + '/api/files/posts/' + post.id + '/' + storedFilename
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
