import { createApp } from './app.js'
import { env } from './config/env.js'
import { hasOpenRouter } from './lib/openrouter.js'
import { hasExaKey } from './lib/exa.js'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`Dira API listening on http://localhost:${env.PORT}`)
  if (hasOpenRouter()) {
    console.log('OpenRouter: configured')
  } else {
    console.log('OpenRouter: missing — custom-role skills analysis disabled')
  }
  if (hasExaKey()) {
    console.log('Exa: configured (web snippets for custom roles)')
  }
})
