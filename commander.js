const {Client, Collection} = require('discord.js');
const PersistentCollection = require('enmap');
const readdir = require("util").promisify(require("fs").readdir);
const klaw = require('klaw');
const path = require('path');
if (process.version.slice(1).split('.')[0] < 8) throw new Error('Node 8.0.0 or higher is required. Update Node on your system.');

class CommanderClient extends Client {
  constructor(options) {
    super(options);
    this.config = require('./lib/assets/json/config.json');
    this.error = require('./lib/assets/json/issueList.json');
    this.settings = new PersistentCollection({name: "settings"});
    this.commands = new Collection();
    this.aliases = new Collection();
  }
}

const commander = new CommanderClient({
  messageCacheMaxSize: 1,
  fetchAllMembers: true,
});

require('./lib/assets/functions/utilities.js')(commander);

const commanderRun = async () => {

  klaw('./lib/commands').on('data', (item) => {
    const file = path.parse(item.path);
    if (!file.ext || file.ext !== '.js') return;
    const response = commander.loadCommand(file.dir, `${file.name}${file.ext}`);
    if (response) console.log(response);
  });  

  const commanderEventFiles = await readdir('./lib/events/');
  await commander.log("Commander", `Loading a total of ${commanderEventFiles.length} events.`);
  
  commanderEventFiles.forEach(file => {
    const eventName = file.split('.')[0];
    const event = new (require(`./lib/events/${file}`))(commander);
    commander.on(eventName, (...args) => event.execute(...args));
    commander.log("Commander", `Loading Event: ${eventName}. ✔`);
    delete require.cache[require.resolve(`./lib/events/${file}`)];
  });

 commander.login(commander.config.token);
 
};

commanderRun();
