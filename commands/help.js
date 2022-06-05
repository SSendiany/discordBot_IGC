const {MessageEmbed} = require('discord.js');

module.exports = {
    name: "help",
    execute : async (client, message, args,cmd, PREFIX) => {
        const embed = new MessageEmbed()
        .setTitle('List Command IGC Bot')
        .setColor(0x164995)
        .setThumbnail(`${client.user.displayAvatarURL()}`)
        .setDescription('***Musik***' +
            '\n`' + PREFIX + 'p` or `' + PREFIX +'play` for play music' + 
              '\n`' + PREFIX + 'stop` for stop music ' + 
              '\n `' + PREFIX + 'skip` for skip music playlist' +
              '\n\n ***Utility***' +
              '\n `' + PREFIX + 'ping` Check Ping')
        .setFooter('Created by SSendiany', `${client.user.displayAvatarURL()}`);
    message.channel.send(embed)
    }
}