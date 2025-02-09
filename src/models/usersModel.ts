import mongoose from "mongoose";


export interface IUser {
  username: string;
  email: string;
  password?: string;
  _id?: string;
  imgUrl: string,
  googleId?: string;  // Added for Google OAuth
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
    required: function(this: any) {
      return !this.googleId; // Only required if not using Google OAuth
    },
  },
  imgUrl: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows null/undefined while maintaining uniqueness
  },
  refreshToken: {
    type: [String],
    default: [],
    required: false,
  }
});

const usersModel = mongoose.model("Users", userSchema);

export default usersModel;