const mongoose = require('mongoose');

const NoteSchema = mongoose.Schema({
    id: Number,
    delta: Object
}, {
    timestamps: true
});

module.exports = mongoose.model('Note', NoteSchema);
