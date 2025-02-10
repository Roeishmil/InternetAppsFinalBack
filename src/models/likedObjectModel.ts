import mongoose from "mongoose";

export interface ILikedObject {
    userId: string;
    objType: string;
    objectId: string;
    createdAt: Date;
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Add compound index to prevent duplicate likes
likedObjSchema.index({ userId: 1, objectId: 1, objType: 1 }, { unique: true });

const likedObjectModel = mongoose.model<ILikedObject>("likedObject", likedObjSchema);

export default likedObjectModel;