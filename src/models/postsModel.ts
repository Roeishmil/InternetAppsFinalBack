import mongoose from "mongoose";

export interface Ipost{
  title: string;
  content: string;
  owner: string;
}

const postSchema = new mongoose.Schema<Ipost>({
  title: {
    type: String,
    required: true,
  },
  content: String,
  owner: {
    type: String,
    required: true,
  },
});

const postModel = mongoose.model<Ipost>("Posts", postSchema);

export default postModel;
