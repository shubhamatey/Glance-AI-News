const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    // User ID taaki pata chale ki kis user ne save/share kiya hai
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    url: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String },
    description: { type: String },
    // 'save' for bookmarks, 'share' for sharing history
    action: { 
        type: String, 
        enum: ['save', 'share'], 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Interaction', interactionSchema);