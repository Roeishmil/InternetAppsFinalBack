import mongoose from "mongoose";

export interface ILikedObject {
  userId: string;
  objType: string;
  objectId: string;
}
const likedObjSchema = new mongoose.Schema<ILikedObject>({
    userId: {
        type: String,
        required: true,
        },
    objType: {
    type: String,
    required: true,
  },
  objectId: {
    type: String,
    required: true,
  },
});

const likedObjectModel = mongoose.model<ILikedObject>("likedObject", likedObjSchema);

export default likedObjectModel;