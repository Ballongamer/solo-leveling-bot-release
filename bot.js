require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment-timezone');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ] 
});

const CHANNEL_ID = '1342989356368924713'; // Verify this is a VOICE channel
const EPISODE_NUMBER = 9;
const TARGET_TIMEZONE = 'Asia/Tokyo';

function getNextRelease() {
  const firstEpisode = moment.tz('2025-03-02 00:00', 'YYYY-MM-DD HH:mm', TARGET_TIMEZONE);
  const now = moment().tz(TARGET_TIMEZONE);
  
  // If current time is before first episode, use first episode date
  if (now.isBefore(firstEpisode)) {
    return firstEpisode;
  }
  
  // Calculate next Sunday at 00:00 JST
  return moment.tz(TARGET_TIMEZONE)
    .day(7) // Next Sunday (0=Sunday, 7=next Sunday)
    .hour(0)
    .minute(0)
    .second(0);
}

async function updateChannel() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    
    // Verify channel exists and is voice
    if (!channel) {
      console.error('Channel not found!');
      return;
    }
    if (!channel.isVoiceBased()) {
      console.error('ERROR: Channel must be a VOICE channel!');
      return;
    }

    const target = getNextRelease();
    const now = moment().tz(TARGET_TIMEZONE);
    const duration = moment.duration(target.diff(now));

    console.log('Current JST:', now.format('YYYY-MM-DD HH:mm'));
    console.log('Next Episode:', target.format('YYYY-MM-DD HH:mm'));
    
    if (duration.asMilliseconds() <= 0) {
      await channel.setName('🕛 Episode Released!');
    } else {
      await channel.setName(
        `⌛ EP${EPISODE_NUMBER} - ${Math.floor(duration.asDays())}d ` +
        `${duration.hours()}h ${duration.minutes()}m`
      );
    }
  } catch (error) {
    console.error('Critical error:', error);
  }
}

// Restored to 1-minute interval with rate limit protection
let isUpdating = false;
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  updateChannel();
  setInterval(() => {
    if (!isUpdating) {
      isUpdating = true;
      updateChannel().finally(() => isUpdating = false);
    }
  }, 60000); // 1 minute
});

client.login(process.env.TOKEN);
