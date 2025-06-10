import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Kitap adı zorunludur.'],
        trim: true,
        minlength: [2, 'Kitap adı en az 2 karakter olmalı.'],
        maxlength: [255, 'Kitap adı en fazla 255 karakter olmalı.']
    },
    author: {
        type: String,
        required: [true, 'Yazar adı zorunludur.'],
        trim: true,
        minlength: [2, 'Yazar adı en az 2 karakter olmalı.'],
        maxlength: [255, 'Yazar adı en fazla 255 karakter olmalı.']
    },
    description: {
        type: String,
        maxlength: [1000, 'Açıklama en fazla 1000 karakter olmalı.'],
    },
    genre: {
        type: String,
        required: [true, 'Kitap türü zorunludur.'],
        trim: true,
        minlength: [2, 'Kitap türü en az 2 karakter olmalı.']
    },
    price: {
        type: Number,
        required: [true, 'Kitap fiyatı zorunludur']
    },
    stock: {
        type: Number,
        required: [true, 'Stok miktarı zorunludur.'],
        default: 0,
        min: [0, 'Stok miktarı 0 veya daha fazla olmalı.']
    },
    borrowedCount: {
        type: Number,
        default: 0,
        min: [0, 'Ödünç verilen miktar 0 veya daha fazla olmalı.'],
        validate: { 
            validator: function(value) {
                return value <= this.stock;
            },
            message: 'Ödünç verilen miktar mevcut stoktan fazla olamaz.'
        }
    },
    publicationYear: {
        type: Number,
        required: [true, 'Yayın yılı zorunludur.'],
        min: [1000, 'Geçerli bir yayın yılı girin.'],
        max: [new Date().getFullYear() + 1, 'Yayın yılı gelecekte olamaz.']
    },
    imageUrl: {
        type: String,
        default: 'https://myersedpress.presswarehouse.com/publishers/default_cover.png',
    },
    addedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true
});

export const Book = mongoose.model('Book', bookSchema);