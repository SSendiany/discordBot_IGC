const {MessageEmbed} = require('discord.js');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const selection = new Set();
//Global queue for your bot. Every server will have a key and value pair in this map. { guild.id, queue_constructor{} }
const queue = new Map();


module.exports = {
    name: 'play',
    aliases: ['skip', 'stop', 'p'], //We are using aliases to run the skip and stop command follow this tutorial if lost: https://www.youtube.com/watch?v=QBUJ3cdofqc
    cooldown: 0,
    description: 'IGC music bot',
    async execute(client, message,args, cmd, Discord){
        //Checking for the voicechannel and permissions (you can add more permissions if you like).
        const voice_channel = message.member.voice.channel;
        const important = new MessageEmbed()
        .setColor(0x164995)
        .setDescription(`Kamu harus berada dalam Voice channel untuk melakukannya!`)
        if (!voice_channel) return message.channel.send(important);
        const permissions = voice_channel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT')) return message.channel.send('Kamu tidak memiliki permission yang tepat');
        if (!permissions.has('SPEAK')) return message.channel.send('Kamu tidak memiliki permission yang tepat');

        //This is our server queue. We are getting this server queue from the global queue.
        const server_queue = queue.get(message.guild.id);

        //If the user has used the play command
        if (cmd === 'play' || cmd === 'p'){
            const error = new MessageEmbed()
      .setTitle('Musik')
      .setColor(0x164995)
      .setDescription(`Silakan Masukan Judul Lagu / Link youtube terlebih dahulu`)
            if (!args.length) return message.channel.send(error)
            let song = {};

            //If the first argument is a link. Set the song object to have two keys. Title and URl.
            if (ytdl.validateURL(args[0])) {
                const song_info = await ytdl.getInfo(args[0]);
                song = { title: song_info.videoDetails.title, url: song_info.videoDetails.video_url }
            } else {
                //If there was no link, we use keywords to search for a video. Set the song object to have two keys. Title and URl.
                const video_finder = async (query) =>{
                    let filter = m => m.author.id === message.author.id;
                    const video_result = await ytSearch(query);
                    const videos = video_result.videos.slice( 0, 5 )
                    let number = 1;
                    const trackInfo = videos.map(videos => `${number++}. ${ videos.title } (${ videos.timestamp })`)
                        const embed = new MessageEmbed()
                        .setTitle('List Lagu')
                        .setColor(0x164995)
                        .setDescription(trackInfo)
                    filter = m => (m.author.id === message.author.id) && m.content >= 1 && m.content <= videos.length;
                    message.channel.send(embed).then(() => { 
                        message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }) 
                        .then(collected => {
                            const selected = video_result.videos[collected.first().content - 1];
                            return (video_result.videos.length > 1) ? selected : null;
                        })
                         .catch(collected => { message.channel.send('Time up'); }); });
                }
                
                const video = await video_finder(args.join(' '));
                if (video){
                    song = { title: video.title, url: video.url }
                } else {
                     message.channel.send('Error finding video.');
                     server_queue.connection.dispatcher.end();
                }
            }
            //If the server queue does not exist (which doesn't for the first video queued) then create a constructor to be added to our global queue.
            if (!server_queue){

                const queue_constructor = {
                    voice_channel: voice_channel,
                    text_channel: message.channel,
                    connection: null,
                    songs: []
                }
                //Add our key and value pair into the global queue. We then use this to get our server queue.
                queue.set(message.guild.id, queue_constructor);
                queue_constructor.songs.push(song);
    
                //Establish a connection and play the song with the vide_player function.
                try {
                    const connection = await voice_channel.join();
                    queue_constructor.connection = connection;
                    video_player(message.guild, queue_constructor.songs[0]);
                } catch (err) {
                    queue.delete(message.guild.id);
                    message.channel.send('There was an error connecting!');
                    throw err;
                }
            } else{
                server_queue.songs.push(song);
                return message.channel.send(`👍 **${song.title}** added to queue!`);
            }
        }

        else if(cmd === 'skip') skip_song(message, server_queue);
        else if(cmd === 'stop') stop_song(message, server_queue);
        client.on('voiceStateUpdate', (oldState, newState) => {
            if (oldState.channelID === null || typeof oldState.channelID == 'undefined') return;    
            if (newState.id !== client.user.id) return;
            return queue.delete(oldState.guild.id);
        });
    }
    
}

const video_player = async (guild, song) => {
    const song_queue = queue.get(guild.id);

    //If no song is left in the server queue. Leave the voice channel and delete the key and value pair from the global queue.
    if (!song) {
        song_queue.voice_channel.leave();
        queue.delete(guild.id);
        return;
    }
    const stream = ytdl(song.url, { filter: 'audioonly' });
    song_queue.connection.play(stream, { seek: 0, volume: 0.5 })
    .on('finish', () => {
        song_queue.songs.shift();
        video_player(guild, song_queue.songs[0]);
    });
    await song_queue.text_channel.send(`🎶 Now playing **${song.title}**`)
}

const skip_song = (message, server_queue) => {
    if (!message.member.voice.channel) return message.channel.send('Kamu harus berada dalam Voice channel untuk melakukannya!');
    if(!server_queue){
        return message.channel.send(`Tidak ada lagu dalam queue (antrian)😔`);
    }
    server_queue.connection.dispatcher.end();
}

const stop_song = (message, server_queue) => {
    if (!message.member.voice.channel) return message.channel.send('Kamu harus berada dalam Voice channel untuk melakukannya!');
    let queue_length = server_queue.songs.length; 
    server_queue.songs = [];
    message.channel.send('`' + `${queue_length}`+ '`' + ' Antrian telah diberhentikan')
    server_queue.connection.dispatcher.end();
}
