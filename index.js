// require('dotenv').config(); //for local test
const {Client,Collection} = require('discord.js');
const { readdirSync } = require("fs");
const { join } = require("path");
const PREFIX = "//"

const client = new Client(
    {
        disableMentions:'everyone'
    }
);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('IGC | Testing //help' ,{
      type: 'PLAYING'
  })
});

client.commands = new Collection();
client.aliases = new Collection();
client.categories = readdirSync("./commands/");

const commandFiles = readdirSync(join(__dirname, "commands")).filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(join(__dirname, "commands", `${file}`));
    client.commands.set(command.name, command);
}

client.on("message", async (message) => {
    if (message.author.bot) return ;
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).split(/ +/);
        const cmd = args.shift().toLowerCase();
        const command = client.commands.get(cmd) || client.commands.find(a => a.aliases && a.aliases.includes(cmd));
        try {
                command.execute(client, message, args,cmd ,PREFIX);
        } catch (error) {
            message.reply("Command ini tidak tersedia silakan check `//help` untuk list command yang ada");
            console.error(error);
        };
    };
});


client.login(process.env.TOKEN)