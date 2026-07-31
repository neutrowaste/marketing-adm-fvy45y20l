migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    let adminUser = null

    try {
      adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'fsato@fksato.com.br')
      adminUser.set('role', 'admin')
      adminUser.set('name', 'Admin Marketing')
      app.save(adminUser)
    } catch (_) {
      const record = new Record(usersCol)
      record.setEmail('fsato@fksato.com.br')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin Marketing')
      record.set('role', 'admin')
      app.save(record)
      adminUser = record
    }

    try {
      const agendasCol = app.findCollectionByNameOrId('agendas')
      const postsCol = app.findCollectionByNameOrId('posts')
      const logsCol = app.findCollectionByNameOrId('automation_logs')

      if (app.countRecords('agendas') === 0) {
        const today = new Date()
        const startDate = new Date(today)
        const endDate = new Date(today)
        endDate.setDate(today.getDate() + 7)

        const agendaRec = new Record(agendasCol)
        agendaRec.set('title', 'Lançamento de Verão 2026')
        agendaRec.set('theme', 'Moda e tendências de verão para praias e piscinas')
        agendaRec.set(
          'base_model',
          '✨ Dica de Estilo de Verão! 🌴\n\n[CONTEÚDO]\n\n👉 Confira em nosso site no link da bio!\n\n#Verao2026 #ModaPraia #Estilo',
        )
        agendaRec.set('start_date', startDate.toISOString().split('T')[0] + ' 00:00:00.000Z')
        agendaRec.set('end_date', endDate.toISOString().split('T')[0] + ' 00:00:00.000Z')
        agendaRec.set('frequency', 'daily')
        agendaRec.set('created_by', adminUser.id)
        app.save(agendaRec)

        const samplePosts = [
          {
            daysOffset: 0,
            status: 'posted',
            content:
              '✨ Dica de Estilo de Verão! 🌴\n\nO look monocromático em tons pasteis é a grande aposta dessa estação. Aposte em tecidos leves como linho e algodão para manter o frescor com elegância.\n\n👉 Confira em nosso site no link da bio!\n\n#Verao2026 #ModaPraia #Estilo',
            image_url: 'https://img.usecurling.com/p/800/800?q=summer%20fashion',
          },
          {
            daysOffset: 1,
            status: 'generated',
            content:
              '✨ Dica de Estilo de Verão! 🌴\n\nAcessórios de palha e óculos oversized nunca saem de moda. Combinados com biquínis minimalistas, transformam qualquer dia de praia num desfile.\n\n👉 Confira em nosso site no link da bio!\n\n#Verao2026 #ModaPraia #Estilo',
            image_url: 'https://img.usecurling.com/p/800/800?q=beach%20sunglasses',
          },
          {
            daysOffset: 2,
            status: 'draft',
            content: '',
            image_url: '',
          },
        ]

        for (const p of samplePosts) {
          const pDate = new Date(today)
          pDate.setDate(today.getDate() + p.daysOffset)

          const postRec = new Record(postsCol)
          postRec.set('agenda', agendaRec.id)
          postRec.set('scheduled_date', pDate.toISOString().split('T')[0] + ' 10:00:00.000Z')
          postRec.set('content', p.content)
          postRec.set('image_url', p.image_url)
          postRec.set('status', p.status)
          postRec.set('created_by', adminUser.id)
          app.save(postRec)

          const logRec = new Record(logsCol)
          logRec.set(
            'event',
            p.status === 'posted'
              ? 'Publicação Simulada'
              : p.status === 'generated'
                ? 'Conteúdo Gerado'
                : 'Post Agendado',
          )
          logRec.set(
            'details',
            `Post para a data ${pDate.toLocaleDateString()} status: ${p.status}`,
          )
          logRec.set('post', postRec.id)
          logRec.set('agenda', agendaRec.id)
          logRec.set('created_by', adminUser.id)
          app.save(logRec)
        }
      }
    } catch (_) {}
  },
  (app) => {},
)
