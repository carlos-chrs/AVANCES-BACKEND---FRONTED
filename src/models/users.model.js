const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    permissionLevel: { type: Number, required: true },
    departament: { type: Schema.Types.ObjectId, ref: 'Departament' },
    refreshToken: { type: String },
    revokedTokens: [{ type: String }],
    loggedOut: { type: Boolean, default: false },
    resetPassword: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetPasswordTokenExpires: Date,
});

module.exports = mongoose.model('User', UserSchema);