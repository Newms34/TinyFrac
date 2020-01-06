const mongoose = require('mongoose'),
    events = require('events');
require('./users/');
require('./groups/');
console.log('Node Environment:', process.env.NODE_ENV || '(unknown)');
if(!process.argv.find(q=>q.includes('jest.js'))){
    console.log('connecting to regular DB (prod/dev mode, not test)');
    mongoose.connect(process.env.NODE_ENV && process.env.NODE_ENV == 'production' ? process.env.MONGODB_URI : 'mongodb://localhost:27017/tinyfracs', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function (e) {
        console.log('Database connected!');
    });
    
}