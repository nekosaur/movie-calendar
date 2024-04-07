import mongoose, { ConnectOptions } from 'mongoose'

// @ts-expect-error TODO fix this
const uri = process.env.MONGODB_URI

const clientOptions: Partial<ConnectOptions> = {
  serverApi: { version: '1', strict: true, deprecationErrors: true }
}

mongoose.plugin(upsertMany)

export async function withDatabase<T>(callback: () => Promise<T>) {
  try {
    // @ts-expect-error connect method require whole options object for some reason
    await mongoose.connect(uri, clientOptions)
    console.log('connected')

    const result = await callback()

    return result
  } catch (e) {
    console.log('catch')
    throw e
  } finally {
    console.log('disconnect')
    await mongoose.disconnect()
  }
}

/**
 * Lookup dotted path in an object
 */
function lookupPath(obj, path) {
  const keys = path.split('.')
  for (let i = 0; i < keys.length && obj !== undefined; i++) {
    const key = keys[i]
    obj = obj !== null ? obj[key] : undefined
  }
  return obj
}

/**
 * Helper to extract match criteria
 */
function matchCriteria(item, fields) {
  const match = {}
  for (const field of fields) {
    match[field] = lookupPath(item, field)
  }
  return match
}

/**
 * Parse item
 */
function parseItem(item, Model, config) {
  //Get config
  const { ensureModel, toObjectConfig } = config

  //Ensure item is a model, to allow inclusion of default values
  if (ensureModel && !(item instanceof Model)) {
    item = new Model(item)
  }

  //Convert to plain object now if model given
  if (item instanceof Model) {
    item = item.toObject(toObjectConfig)
  }

  //Return
  return item
}

/**
 * Apply bulk upsert helper to schema
 */
function upsertMany(schema) {
  //Extract schema wide config
  const defaults = Object.assign(
    {
      matchFields: ['_id'],
      type: 'updateOne',
      ensureModel: false,
      ordered: true,
      toObjectConfig: {
        depopulate: true,
        versionKey: false
      }
    },
    schema.options.upsertMany || {}
  )

  //Create helper
  schema.statics.upsertMany = function (items, config) {
    //Merge config
    config = Object.assign({}, defaults, config || {})

    //Get config
    const { type, ordered } = config
    const upsert = true

    //Use default match fields if none provided
    let { matchFields } = config
    if (!Array.isArray(matchFields) || matchFields.length === 0) {
      matchFields = ['_id']
    }

    //Create bulk operations
    const ops = items.map((item) => {
      //Parse item
      item = parseItem(item, this, config)

      //Extract match criteria
      const filter = matchCriteria(item, matchFields)

      //Can't have _id field when upserting item
      if (typeof item._id !== 'undefined') {
        delete item._id
      }

      //Check type
      switch (type) {
        //Insert op
        case 'insertOne':
          return { [type]: { document: item } }

        //Update op
        case 'updateOne':
        case 'updateMany':
          return { [type]: { filter, upsert, update: item } }

        //Delete op
        case 'deleteOne':
        case 'deleteMany':
          return { [type]: { filter } }

        //Replace op
        case 'replaceOne':
          return { [type]: { filter, upsert, replacement: item } }

        //Unknown
        default:
          throw new Error(`Unsupported bulkOp type: ${type}`)
      }
    })

    //Bulk write
    return this.bulkWrite(ops, { ordered })
  }
}
