migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('posts')

    if (!col.fields.getByName('generated_image')) {
      col.fields.add(
        new FileField({
          name: 'generated_image',
          maxSelect: 1,
          maxSize: 26214400,
          mimeTypes: ['image/png'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('posts')
    const field = col.fields.getByName('generated_image')
    if (field) col.fields.remove(field)
    app.save(col)
  },
)
