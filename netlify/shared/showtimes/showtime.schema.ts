import mongoose, { InferSchemaType } from 'mongoose'

const { Schema } = mongoose

export const ShowtimeSchema = new Schema({
  time: Date,
  theater: String,
  url: String,
  tags: [String],
  movie: { type: Schema.Types.ObjectId, ref: 'Movie' },
  soldOut: Boolean
})

// TODO: WHY IS BOOLEAN INFERRED AS DATE???
export type Showtime = Omit<
  InferSchemaType<typeof ShowtimeSchema>,
  'soldOut'
> & { soldOut?: boolean }

export const ShowtimeModel = mongoose.model('Showtime', ShowtimeSchema)
