const fs = require('fs');
const db = require('./data.json');
const igConfig = db.businesses['business-1'].instagram;
const imgUrl = 'https://res.cloudinary.com/fxjwtjqs/image/upload/v1725442654/b4xayb2tlyokevdydz2u.jpg';

async function testIg() {
  const containerPayload = {
    access_token: igConfig.accessToken,
    caption: 'Test post',
    image_url: imgUrl
  };
  const res = await fetch(`https://graph.facebook.com/v18.0/${igConfig.igAccountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(containerPayload)
  });
  const data = await res.json();
  console.log('IG CONTAINER:', data);
}
testIg();
