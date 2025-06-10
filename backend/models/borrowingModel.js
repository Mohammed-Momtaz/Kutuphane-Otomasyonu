import mongoose from 'mongoose';

const borrowingSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.ObjectId,
        ref: 'Book',
        required: true,
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    borrowDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    returnDate: {
        type: Date,
        required: [true, 'Teslim tarihi zorunludur.'],
        validate: {
            validator: function(v) {
                return v > Date.now();
            },
            message: props => `${props.value} teslim tarihi geçmişte olamaz!`
        }
    },
    actualReturnDate: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ['borrowed', 'returned', 'overdue'],
        default: 'borrowed',
        required: true,
    },
    fineAmount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true
});

export const Borrowing = mongoose.model('Borrowing', borrowingSchema);