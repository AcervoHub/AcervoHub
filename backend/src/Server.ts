import "dotenv/config";
import app from "./App.js";

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Bookspace API disponível em http://localhost:${port}`);
});
