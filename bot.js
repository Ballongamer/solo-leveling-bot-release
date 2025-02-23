require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment-timezone');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ] 
});

const CHANNEL_ID = '1343260278388691095';
const EPISODE_NUMBER = 9;
const TARGET_TIMEZONE = 'Asia/Tokyo';
const UPDATE_INTERVAL = 300000; // 5 minutes in milliseconds

let lastUpdate = 0;

function getNextRelease() {
  const firstEpisode = moment.tz('2025-03-02 00:00', 'YYYY-MM-DD HH:mm', TARGET_TIMEZONE);
  const now = moment().tz(TARGET_TIMEZONE);
  
  return now.isBefore(firstEpisode) 
    ? firstEpisode 
    : firstEpisode.add(
        Math.ceil(now.diff(firstEpisode, 'weeks', true)), 
        'weeks'
      ).day(0).hour(0).minute(0).second(0);
}

async function safeUpdate() {
  try {
    const now = Date.now();
    
    // Enforce 5-minute cooldown
    if (now - lastUpdate < UPDATE_INTERVAL) {
      console.log('Skipping update - cooldown active');
      return;
    }

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel?.isVoiceBased()) return;

    const target = getNextRelease();
    const duration = moment.duration(target.diff(moment().tz(TARGET_TIMEZONE)));
    
    await channel.setName(
      duration.asMilliseconds() <= 0
        ? '🕛 Episode Released!'
        : `⌛ EP${EPISODE_NUMBER} - ${Math.floor(duration.asDays())}d ` +
          `${duration.hours()}h ${duration.minutes()}m`
    );

    lastUpdate = Date.now();
    console.log('Successfully updated at:', new Date().toISOString());

  } catch (error) {
    console.error('Update error:', error.message);
    
    // If rate limited, wait full cooldown
    if (error.code === 429) {
      lastUpdate = Date.now() + error.timeout;
    }
  }
}

// Precise 5-minute interval with drift protection
function startInterval() {
  const now = Date.now();
  const next = Math.ceil(now / UPDATE_INTERVAL) * UPDATE_INTERVAL;
  
  setTimeout(() => {
    safeUpdate();
    setInterval(safeUpdate, UPDATE_INTERVAL);
  }, next - now);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  startInterval();
});

client.login(process.env.TOKEN);
