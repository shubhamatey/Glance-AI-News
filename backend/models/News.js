const mongoose = require('mongoose');

// Ye News ka blueprint hai
const newsSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true // required: true ka matlab hai ki title hona hi chahiye
    },
    summary: { 
        type: String, 
        required: true 
    },
    url: { 
        type: String, 
        required: true 
    },
    imageUrl: { 
        type: String // News ki photo ka link (ye optional hai)
    },
    createdAt: { 
        type: Date, 
        default: Date.now // Jis time news save hogi, wo time apne aap record ho jayega
    }
});

// Is blueprint ko 'News' naam se export kar rahe hain taaki baaki files isko use kar sakein
module.exports = mongoose.model('News', newsSchema);