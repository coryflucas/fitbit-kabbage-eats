import * as messaging from "messaging";

messaging.peerSocket.onerror = (err) => console.log(`Connection error: ${err.code} - ${err.message}`);

messaging.peerSocket.onmessage = (evt) => {
  console.log('Recieved message: ' + JSON.stringify(evt));
  let data = evt.data;
  if(data && data.message) {
    switch(data.message) {
      case "get_lunch":
        getLunch(data.date)
        break;
    }
  }
}

function getLunch(date) {
  fetch(`https://lunch.kabbage.com/api/v2/lunches/${date}`)
    .then(response => {
      if(response.ok) {
        return response.json();
      }
      throw new Error('Unknown');
    })
    .then(json => sendLunchResult(date, json.menu))
    .catch(error => sendLunchResult(date, error.message));
}

function sendLunchResult(date, menu) {
  let data = {
    message: 'lunch',
    date: date, 
    menu: menu
  };
  messaging.peerSocket.send(data);
}

console.log("Companion Started");