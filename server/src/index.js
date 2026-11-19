import { app } from './app.js'

const port = Number(process.env.PORT ?? 4000)

app.listen(port, () => {
  console.log(`Tripdesk API siap di http://localhost:${port}/api`)
})
