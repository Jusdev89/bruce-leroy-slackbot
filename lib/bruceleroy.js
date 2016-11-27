const path = require('path')
const fs = require('fs')
const SQLite = require('sqlite3').verbose()
const Bot = require('slackbots')

class LeroyBot extends Bot {
  constructor(settings) {
    super(settings)
    this.settings = settings
    this.settings.name = this.settings.name || 'bruceleroy'
    this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'leroybot.db')
    this.user = null
    this.db = null
  }
  _loadBotUser(){
    const self = this
    this.user = this.users.filter(user => {
      return user.name === self.settings.name
    })[0]
  }
  _connectDb() {
    if (!fs.existsSync(this.dbPath)) {
      console.error(
        `Database path ${this.dbPath} does not exists of it's not readable`
      )
      process.exit(1)
    }
    this.db = new SQLite.Database(this.dbPath)
  }
  _welcomeMessage() {
    console.log('we get here', this.channels)
    this.postMessageToChannel(this.channels[0].name,
      'Could you teach me some moves!' + '\n I can tell jokes, but very honest ones. Just say `Bruce Leroy` or `' + this.name + '` to invoke me!',
      {as_user: true}
    )
  }
  _firstRunCheck() {
    const self = this
    self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', (err, record) => {
      if (err) {return console.error('DATABASE ERROR:', err)}
      const currentTime = (new Date()).toJSON()
      if (!record) {
        self._welcomeMessage()
        return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime)
      }
      self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime)
    })
  }
  _onStart() {
    this._loadBotUser()
    this._connectDb()
    this._firstRunCheck()
  }
  _isChatMessage(message) {
    return message.type === 'message' && Boolean(message.text)
  }
  _isChannelConversation(message) {
    return typeof message.channel === 'string' && message.channel[0] === 'C'
  }
  _isFromLeroyBot(message) {
    return message.user === this.user.id
  }
  _isMentioningBruceLeroy(message) {
    return message.text.toLowerCase().indexOf('bruce leroy') > -1 ||
      message.text.toLowerCase().indexOf(this.name) > -1
  }
  _onMessage(message) {
    console.log('Message', message)
    if (this._isChatMessage(message) &&
      this._isChannelConversation(message) &&
      !this._isFromLeroyBot(message) &&
      this._isMentioningBruceLeroy(message)
    ) {
      this._replyWithRandomJoke(message)
    }
  }
  _getChannelById(channelId) {
    console.log(this.channels)
    return this.channels.filter((item) => {
      return item.id === channelId
    })[0]
  }
  _replyWithRandomJoke(originalMessage) {
    const self = this
    self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', (err, record) => {
      console.log('Record', record)
      if (err) {return console.error('DATABASE ERROR:', err)}
      const channel = this._getChannelById(originalMessage.channel)
      self.postMessageToChannel(channel.name, record.joke, {as_user: true})
      self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id)
    })
  }
  run() {
    LeroyBot.super_.call(this, this.settings)
    this.on('start', this._onStart)
    this.on('message', this._onMessage)
  }
}

module.exports = LeroyBot
