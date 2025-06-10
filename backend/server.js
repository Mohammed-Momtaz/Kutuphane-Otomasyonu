import { app } from "./app.js";

app.listen(process.env.PORT, () => {
    console.log(`Sunucu bu portta calisiyor ${process.env.PORT} `);
});