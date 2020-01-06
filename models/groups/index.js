const mongoose = require('mongoose');
//each topic that can be taught.
const topicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    desc: String,//not required, but can be helpful if this is a non-standard thing (like "making pretty websites" instead of "CSS3 Box Model"),
    creator: { type: String, required: true },
    votes: {
        //vote status is: 0 (pending), 1 (accepted), or 2 (rejected)
        status: {
            type: Number,
            default: 0
        },
        votesUp: [String],
        votesDown: [String],
        date: {
            type: Number,
            default: Date.now()
        }
    }
}, { collection: 'topic' });
mongoose.model('topic', topicSchema);
