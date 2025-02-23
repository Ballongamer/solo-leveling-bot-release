require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment-timezone');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates // Required for voice channels
  ] 
});

const CHANNEL_ID = '1343260278388691095'; // New voice channel ID
const EPISODE_NUMBER = 9;
const TARGET_TIMEZONE = 'Asia/Tokyo';

// Rate limit protection
let isUpdating = false;

function getNextRelease() {
  const firstEpisode = moment.tz('2025-03-02 00:00', 'YYYY-MM-DD HH:mm', TARGET_TIMEZONE);
  const now = moment().tz(TARGET_TIMEZONE);
  
  return now.isBefore(firstEpisode) 
    ? firstEpisode 
    : moment.tz(TARGET_TIMEZONE)
        .day(0)
        .hour(0)
        .minute(0)
        .second(0)
        .add(7 * Math.ceil(now.diff(firstEpisode, 'weeks', true)), 'weeks');
}

async function updateChannel() {
  try {
    if (isUpdating) return;
    isUpdating = true;

    const channel = await client.channels.fetch(CHANNEL_ID);
    
    if (!channel?.isVoiceBased()) {
      console.error('ERROR: Channel must be VOICE!');
      return;
    }

    const target = getNextRelease();
    const duration = moment.duration(target.diff(moment().tz(TARGET_TIMEZONE)));

    await channel.setName(
      duration.asMilliseconds() <= 0
        ? '🕛 Episode Released!'
        : `⌛ EP${EPISODE_NUMBER} - ${Math.floor(duration.asDays())}d ` +
          `${duration.hours()}h ${duration.minutes()}m`
    );
    
  } catch (error) {
    console.error('Update error:', error);
  } finally {
    isUpdating = false;
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  updateChannel();
  setInterval(updateChannel, 60000); // 1-minute interval
});

client.login(process.env.TOKEN);
