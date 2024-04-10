import mongoose, { InferSchemaType } from 'mongoose'

const { Schema } = mongoose

export const MovieSchema = new Schema({
  title: String,
  sourceName: String,
  sourceId: String,
  duration: Number,
  genres: [String],
  url: String,
  synopsis: String
})

// export type Movie = InferSchemaType<typeof MovieSchema>

export interface Movie {
  title: string
  sourceName: string
  sourceId: string
  duration: number
  genres: string[]
  url: string
  synopsis: string
}

export const MovieModel = mongoose.model('Movie', MovieSchema)
