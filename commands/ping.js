const {MessageEmbed} = require('discord.js');
module.exports = {
    name: "ping",
    execute: async (client, message) => {
        const embed = new MessageEmbed()
        .setTitle('Ping')
        .setColor(0x164995)
        .setDescription(`Latency is ${Date.now() - message.createdTimestamp}ms.  API Latency is ${client.ws.ping}ms.`)
    message.channel.send(embed)
    }
}