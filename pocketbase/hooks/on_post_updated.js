onRecordAfterUpdateSuccess((e) => {
  const post = e.record
  const oldStatus = post.original().getString('status')
  const newStatus = post.getString('status')

  if (oldStatus !== newStatus) {
    const userId = post.getString('created_by')
    const agendaId = post.getString('agenda')

    let eventName = 'Status do Post Alterado'
    if (newStatus === 'posted') {
      eventName = 'Publicação Simulada'
    } else if (newStatus === 'failed') {
      eventName = 'Falha na Publicação'
    } else if (newStatus === 'generated') {
      eventName = 'Conteúdo Atualizado'
    }

    const logsCol = $app.findCollectionByNameOrId('automation_logs')
    const logRec = new Record(logsCol)
    logRec.set('event', eventName)
    logRec.set('details', `Status alterado de "${oldStatus}" para "${newStatus}".`)
    logRec.set('post', post.id)
    if (agendaId) logRec.set('agenda', agendaId)
    logRec.set('created_by', userId)
    $app.save(logRec)
  }

  return e.next()
}, 'posts')
