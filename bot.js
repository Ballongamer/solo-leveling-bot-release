require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment-timezone');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates // ADDED FOR VOICE CHANNEL ACCESS
  ] 
});

const CHANNEL_ID = '1342989356368924713';
const EPISODE_NUMBER = 9;
const TARGET_TIMEZONE = 'Asia/Tokyo';

// IMPROVED DATE CALCULATION
function getNextRelease() {
  const now = moment().tz(TARGET_TIMEZONE);
  const firstEpisode = moment.tz('2025-03-02 00:00', 'YYYY-MM-DD HH:mm', TARGET_TIMEZONE);
  
  if (now.isSameOrAfter(firstEpisode)) {
    // Calculate next Sunday after last episode
    return firstEpisode.add(
      Math.ceil(now.diff(firstEpisode, 'weeks', true)), 
      'weeks'
    ).day(0).hour(0).minute(0).second(0);
  }
  return firstEpisode;
}

async function updateChannel() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    
    // VOICE CHANNEL VERIFICATION
    if (!channel?.isVoiceBased()) {
      console.error('Target channel is not a voice channel!');
      return;
    }

    const target = getNextRelease();
    const now = moment().tz(TARGET_TIMEZONE);
    const duration = moment.duration(target.diff(now));

    // DEBUG LOGS
    console.log('Current JST:', now.format());
    console.log('Next episode:', target.format());
    
    if (duration.asMilliseconds() <= 0) {
      await channel.setName('🕛 Episode Available Now!');
    } else {
      await channel.setName(
        `⌛ EP${EPISODE_NUMBER} - ${Math.floor(duration.asDays())}d ` +
        `${duration.hours()}h ${duration.minutes()}m`
      );
    }
  } catch (error) {
    console.error('Update error:', error);
  }
}

// SAFER INTERVAL (5 MINUTES TO AVOID RATE LIMITS)
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  updateChannel();
  setInterval(updateChannel, 300000); // 5-minute intervals
});

client.login(process.env.TOKEN);
