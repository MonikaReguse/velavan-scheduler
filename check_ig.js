const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const pageId = db.businesses['business-1'].facebook.pageId;
const token = db.businesses['business-1'].facebook.accessToken;

async function checkIg() {
  const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${token}`);
  const data = await res.json();
  console.log('IG DATA:', data);
  if (data.instagram_business_account) {
    db.businesses['business-1'].instagram.igAccountId = data.instagram_business_account.id;
    fs.writeFileSync('data.json', JSON.stringify(db, null, 2));
    console.log('SAVED IG TO DB!');
  }
}
checkIg();
