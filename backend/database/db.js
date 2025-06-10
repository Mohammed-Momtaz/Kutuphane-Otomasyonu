import mongoose from "mongoose";

export const connectDB = async () => {
    mongoose.connect(process.env.MONGO_URI, {
        dbName: 'Kutuphane'
    }).then(() => {
        console.log("Veri tabanina basariyal baglanilmistir")
    }).catch(err => {
        console.log("Baglanti basarisiz", err)
    })
}