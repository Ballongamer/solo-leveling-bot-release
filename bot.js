require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment-timezone');

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds] // Only needs basic guild intent
});

const CHANNEL_ID = '1342989356368924713'; // Your TEXT channel ID
const EPISODE_NUMBER = 9;
const TARGET_TIMEZONE = 'Asia/Tokyo';

function getNextRelease() {
  const firstEpisode = moment.tz('2025-03-02 00:00', 'YYYY-MM-DD HH:mm', TARGET_TIMEZONE);
  const now = moment().tz(TARGET_TIMEZONE);
  
  if (now.isBefore(firstEpisode)) {
    return firstEpisode;
  }
  return firstEpisode.add(
    Math.ceil(now.diff(firstEpisode, 'weeks', true)), 
    'weeks'
  ).day(0).hour(0).minute(0).second(0);
}

async function updateChannel() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    
    // TEXT CHANNEL VERIFICATION
    if (channel?.type !== 0) { // 0 = GUILD_TEXT
      console.error('ERROR: Channel must be a TEXT channel!');
      return;
    }

    const target = getNextRelease();
    const now = moment().tz(TARGET_TIMEZONE);
    const duration = moment.duration(target.diff(now));

    await channel.setName(`⌛ EP${EPISODE_NUMBER} - ${
      Math.floor(duration.asDays())}d ${
      duration.hours()}h ${
      duration.minutes()}m`
    );
    
  } catch (error) {
    console.error('Update error:', error);
  }
}

// Longer interval for text channels (10 minutes)
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  updateChannel();
  setInterval(updateChannel, 600000);
});

client.login(process.env.TOKEN);
