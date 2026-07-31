migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('role')) {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'analyst'],
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(usersCol)
    }

    const agendas = new Collection({
      name: 'agendas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'theme', type: 'text', required: true },
        { name: 'base_model', type: 'text', required: true },
        { name: 'start_date', type: 'date', required: true },
        { name: 'end_date', type: 'date', required: true },
        {
          name: 'frequency',
          type: 'select',
          values: ['daily', 'every_two_days', 'weekly', 'custom'],
          maxSelect: 1,
          required: true,
        },
        { name: 'custom_days', type: 'json' },
        {
          name: 'created_by',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(agendas)

    const posts = new Collection({
      name: 'posts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'agenda',
          type: 'relation',
          required: true,
          collectionId: agendas.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'scheduled_date', type: 'date', required: true },
        { name: 'content', type: 'text' },
        { name: 'image_url', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['draft', 'generated', 'posted', 'failed'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'created_by',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_posts_status ON posts (status)',
        'CREATE INDEX idx_posts_scheduled_date ON posts (scheduled_date DESC)',
        'CREATE INDEX idx_posts_agenda ON posts (agenda)',
      ],
    })
    app.save(posts)

    const automationLogs = new Collection({
      name: 'automation_logs',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'event', type: 'text', required: true },
        { name: 'details', type: 'text' },
        {
          name: 'post',
          type: 'relation',
          collectionId: posts.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'agenda',
          type: 'relation',
          collectionId: agendas.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'created_by',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_logs_event ON automation_logs (event)',
        'CREATE INDEX idx_logs_post ON automation_logs (post)',
        'CREATE INDEX idx_logs_created ON automation_logs (created DESC)',
      ],
    })
    app.save(automationLogs)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('automation_logs'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('posts'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('agendas'))
    } catch (_) {}
  },
)
