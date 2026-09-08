const appId = '1783820169426826';
const appSecret = '51438a4f84d5638e6ebe69a0db299b8e';
const shortLivedUserToken = 'EAAZAWXZCZBKt4oBSaBxstjspLZCba6Olf7q4FkI8tkNZCNtwdSUZANcYZB1fXYdANs0nkTUrzCJpFH3a2kpE12C5xIEanUtZCZCM8lTSUZAIHPtyLfmbZCGa1PQ6qC6Km25RZBaC3tHp6PcHGkVgSuz8BD4O2SdlrVhPlYUCtxZCJI4rq5I92r5h5VEa2QJWMXYGGA9zwfeKWxXPnrUi68AZAvrRtsN0q2wdZBSHCQT9wZDZD';
const pageId = '683818888146016';

async function run() {
  console.log('1. Exchanging short-lived user token for long-lived user token...');
  let res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedUserToken}`);
  let data = await res.json();
  if (data.error) {
    console.error('Error exchanging token:', data.error);
    return;
  }
  const longLivedUserToken = data.access_token;
  console.log('Got long-lived user token!');

  console.log('2. Fetching NEVER EXPIRING Page Token using the long-lived user token...');
  res = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${longLivedUserToken}`);
  data = await res.json();
  if (data.error) {
    console.error('Error fetching page token:', data.error);
    return;
  }
  const neverExpiringPageToken = data.access_token;
  console.log('Got never-expiring page token!');
  
  console.log('3. Updating data.json...');
  const fs = require('fs');
  const db = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  db.businesses['business-1'].facebook.pageId = pageId;
  db.businesses['business-1'].facebook.pageName = 'Velavan Properties';
  db.businesses['business-1'].facebook.accessToken = neverExpiringPageToken;
  fs.writeFileSync('data.json', JSON.stringify(db, null, 2));
  console.log('SUCCESSFULLY SAVED TO DATABASE!');
}
run();
