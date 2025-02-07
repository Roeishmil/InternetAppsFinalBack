import mongoose from "mongoose";

export interface Ipost{
  title: string;
  content: string;
  owner: string;
  imgUrl: string;
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
  imgUrl: {
    type : String,
    requierd: false,
  }
});

const postModel = mongoose.model<Ipost>("Posts", postSchema);

export default postModel;
