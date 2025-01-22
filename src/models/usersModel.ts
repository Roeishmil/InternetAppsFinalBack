import mongoose from "mongoose";


export interface IUser {
  username: string;
  email: string;
  password: string;
  _id?: string;
  imgUrl: File,
  refreshToken?: string[];
}


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  imgUrl: {
    type: File,
  },
  refreshToken: {
    type: [String],
    default: [],
    required: false,
  }
});

const usersModel = mongoose.model("Users", userSchema);

export default usersModel;