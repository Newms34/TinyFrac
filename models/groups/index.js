const mongoose = require('mongoose');
const groupSchema = new mongoose.Schema({
    times: { type: String, required: true },
    grpId:{type:String, required:true, default:Math.floor(Math.random()*99999999).toString(32)},
    levels:{ type: String, required: true },
    members:[{name:String,prof:String,race:String}],
    notes: String,//not required, but can be helpful if this is a non-standard thing (like "making pretty websites" instead of "CSS3 Box Model"),
    creator: {name:String,prof:String,race:String},
    
}, { collection: 'group' });
mongoose.model('group', groupSchema);
