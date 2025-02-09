import mongoose from "mongoose";


export interface IUser {
  username: string;
  email: string;
  password: string;
  _id?: string;
  imgUrl: string,
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
    type: String,
    required: false,
  },
  refreshToken: {
    type: [String],
    default: [],
    required: false,
  },
  twoFactorSecret: {
    type: String, default: null 
  },
  twoFactorEnabled: {
    type: Boolean, default: false
  },
});

const usersModel = mongoose.model("Users", userSchema);

export default usersModel;