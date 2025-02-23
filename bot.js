require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment-timezone');

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds] 
});

const CHANNEL_ID = '1342989356368924713';
const EPISODE_NUMBER = 9; // Update this for new episodes
const TARGET_TIMEZONE = 'Asia/Tokyo'; // JST

function getNextRelease() {
  const now = moment().tz(TARGET_TIMEZONE);
  
  // First episode specific date
  const firstEpisodeDate = moment.tz('2025-03-02 00:00', 'YYYY-MM-DD HH:mm', TARGET_TIMEZONE);
  
  // If we're past the first episode, calculate weekly releases
  if (now.isAfter(firstEpisodeDate)) {
    return moment.tz(TARGET_TIMEZONE)
      .day(0) // Sunday
      .hour(0)
      .minute(0)
      .second(0)
      .add(7 * Math.ceil(now.diff(firstEpisodeDate, 'weeks', true)), 'weeks');
  }
  
  return firstEpisodeDate;
}

async function updateChannel() {
  try {
    const target = getNextRelease();
    const now = moment().tz(TARGET_TIMEZONE);
    const duration = moment.duration(target.diff(now));
    const channel = await client.channels.fetch(CHANNEL_ID);

    if (duration.asMilliseconds() <= 0) {
      await channel.setName('🕛 New Episode Out!');
    } else {
      const days = Math.floor(duration.asDays());
      const hours = duration.hours();
      const minutes = duration.minutes();
      
      await channel.setName(`⌛ EP${EPISODE_NUMBER} - ${days}d ${hours}h ${minutes}m`);
    }
  } catch (error) {
    console.error('Update failed:', error);
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  updateChannel();
  setInterval(updateChannel, 60000); // Update every minute
});

client.login(process.env.TOKEN);