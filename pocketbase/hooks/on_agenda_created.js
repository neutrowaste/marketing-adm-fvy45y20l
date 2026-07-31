onRecordAfterCreateSuccess((e) => {
  const agenda = e.record
  const startDateStr = agenda.getString('start_date')
  const endDateStr = agenda.getString('end_date')
  const frequency = agenda.getString('frequency')
  const createdBy = agenda.getString('created_by')

  if (!startDateStr || !endDateStr) return e.next()

  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return e.next()

  const customDays = agenda.get('custom_days') || []

  const postsCol = $app.findCollectionByNameOrId('posts')
  let createdCount = 0

  const current = new Date(start)
  while (current <= end) {
    let shouldAdd = false
    const dayOfWeek = current.getDay()

    if (frequency === 'daily') {
      shouldAdd = true
    } else if (frequency === 'every_two_days') {
      const diffTime = Math.abs(current - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays % 2 === 0) shouldAdd = true
    } else if (frequency === 'weekly') {
      if (current.getDay() === start.getDay()) shouldAdd = true
    } else if (frequency === 'custom') {
      if (Array.isArray(customDays) && customDays.includes(dayOfWeek)) {
        shouldAdd = true
      }
    }

    if (shouldAdd) {
      const postRec = new Record(postsCol)
      postRec.set('agenda', agenda.id)
      postRec.set('scheduled_date', current.toISOString().split('T')[0] + ' 10:00:00.000Z')
      postRec.set('content', '')
      postRec.set('image_url', '')
      postRec.set('status', 'draft')
      postRec.set('created_by', createdBy)
      $app.save(postRec)
      createdCount++
    }

    current.setDate(current.getDate() + 1)
  }

  const logsCol = $app.findCollectionByNameOrId('automation_logs')
  const logRec = new Record(logsCol)
  logRec.set('event', 'Agenda Criada')
  logRec.set(
    'details',
    `Agenda "${agenda.getString('title')}" gerou ${createdCount} posts em rascunho.`,
  )
  logRec.set('agenda', agenda.id)
  logRec.set('created_by', createdBy)
  $app.save(logRec)

  return e.next()
}, 'agendas')
