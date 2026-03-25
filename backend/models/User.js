const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    //  NAYA: Admin aur User ke beech fark karne ke liye
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    }
}, { timestamps: true }); // Isse 'createdAt' aur 'updatedAt' apne aap ban jayenge

module.exports = mongoose.model('User', userSchema);