const BruceLeroy = require('../lib/bruceleroy')
const token = process.env.BOT_API_KEY
const dbPath = process.env.BOT_DB_PATH
const name = process.env.BOT_NAME

const bruceleroy = new BruceLeroy({
    token: token,
    dbPath: dbPath,
    name: name
})

bruceleroy.run()
