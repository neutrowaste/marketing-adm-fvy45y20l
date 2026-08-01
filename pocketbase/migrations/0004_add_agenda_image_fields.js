migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('agendas')

    if (!col.fields.getByName('base_image')) {
      col.fields.add(
        new FileField({
          name: 'base_image',
          maxSelect: 1,
          maxSize: 26214400,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        }),
      )
    }

    if (!col.fields.getByName('instructions')) {
      col.fields.add(new TextField({ name: 'instructions' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('agendas')
    const baseImage = col.fields.getByName('base_image')
    if (baseImage) col.fields.remove(baseImage)
    const instructions = col.fields.getByName('instructions')
    if (instructions) col.fields.remove(instructions)
    app.save(col)
  },
)
