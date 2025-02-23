require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const moment = require('moment-timezone');
const schedule = require('node-schedule');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ] 
});

const CHANNEL_ID = '1343260278388691095';
const EPISODE_NUMBER = 9;
const TARGET_TIMEZONE = 'Asia/Tokyo';

function getNextRelease() {
  const firstEpisode = moment.tz('2025-03-02 00:00', 'YYYY-MM-DD HH:mm', TARGET_TIMEZONE);
  const now = moment().tz(TARGET_TIMEZONE);
  
  if (now.isBefore(firstEpisode)) {
    return firstEpisode;
  }
  
  // Next Sunday at midnight JST
  return moment.tz(TARGET_TIMEZONE)
    .startOf('week')
    .add(1, 'week')
    .hour(0)
    .minute(0)
    .second(0);
}

async function updateChannel() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel?.isVoiceBased()) return;

    const target = getNextRelease();
    const now = moment().tz(TARGET_TIMEZONE);
    const duration = moment.duration(target.diff(now));

    let name;
    if (duration.asMilliseconds() <= 0) {
      name = '🕛 Episode Released!';
    } else {
      name = `⌛ EP${EPISODE_NUMBER} - ${Math.floor(duration.asDays())}d ` +
             `${duration.hours()}h ${duration.minutes()}m`;
    }

    await channel.setName(name);
    
    // Schedule next update exactly when needed
    const nextUpdateTime = new Date(now.add(1, 'minute').toDate());
    schedule.scheduleJob(nextUpdateTime, () => {
      updateChannel();
      scheduleNextDailyCheck();
    });

  } catch (error) {
    console.error('Update error:', error);
    // Retry in 5 minutes on error
    setTimeout(updateChannel, 300000);
  }
}

// Daily alignment check at 00:00 JST
function scheduleNextDailyCheck() {
  const checkTime = moment.tz(TARGET_TIMEZONE)
    .add(1, 'day')
    .startOf('day')
    .toDate();
  
  schedule.scheduleJob(checkTime, () => {
    updateChannel();
    scheduleNextDailyCheck();
  });
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  updateChannel(); // Initial update
  scheduleNextDailyCheck(); // Daily alignment
});

client.login(process.env.TOKEN);
