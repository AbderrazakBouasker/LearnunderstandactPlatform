import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // firstName: {
    //   type: String,
    //   required: true,
    //   min: 1,
    //   max: 50,
    // },
    // lastName: {
    //   type: String,
    //   required: true,
    //   min: 1,
    //   max: 50,
    // },
    username: {
      type: String,
      required: true,
      unique: true,
      min: 1,
      max: 50,
    },
    email: {
      type: String,
      required: true,
      max: 20,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 8,
    },
    role: {
      type: String,
      required: true,
      default: "user",
    },
    organization: {
      type: [String],
      required: true,
      default: function () {
        return [this.username + "@org"];
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual("organizationDetails", {
  ref: "Organization",
  localField: "organization",
  foreignField: "identifier",
  justOne: false,
});

UserSchema.methods.populateOrganizations = async function () {
  return await this.populate("organizationDetails").execPopulate();
};

const User = mongoose.model("User", UserSchema);

export default User;
