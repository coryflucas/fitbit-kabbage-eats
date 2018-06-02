import document from "document";
import * as messaging from "messaging";

let currentDate = null;
let mixedText = document.getElementById('text');
let dateText = mixedText.getElementById('header');
let menuText = mixedText.getElementById('copy');
let previousButton = document.getElementById('btn-previous');
let nextButton = document.getElementById('btn-next');
let spinner = document.getElementById("spinner");

spinner.state = 'enabled';

messaging.peerSocket.onerror = (err) => console.log(`Connection error: ${err.code} - ${err.message}`);

messaging.peerSocket.onmessage = (evt) => {
  console.log('Recieved message: ' + JSON.stringify(evt));
  let data = evt.data;
  if(data && data.message) {
    switch(data.message) {
      case "lunch":
        onLunchLoaded(data);
        break;
    }
  }
}

messaging.peerSocket.onopen = function() {
  requestLunch(getNextWeekDay(new Date()));
}

previousButton.onactivate = function(evt) {
  requestLunch(getPreviousWeekDay(addDaysToDate(currentDate, -1)));
}

nextButton.onactivate = function(evt) {
  requestLunch(getNextWeekDay(addDaysToDate(currentDate, 1)));
}

function onLunchLoaded(data) {
  let date = new Date(data.date);
  // check if this is the last requested menu
  if(date.toISOString().substring(0,10) === currentDate.toISOString().substring(0,10)) {
    let menuItems = data.menu.split(';');
    
    // Check for a "title"
    let title = '';
    let firstItem = menuItems[0];
    let pos = firstItem.indexOf(':')
    if(pos > 0) {
      title = firstItem.substring(0, pos + 1) + '\n';
      menuItems[0] = firstItem.substring(pos + 1);
    }
    
    // Build menu
    let menu = '';
    if(menuItems.length == 1) {
      menu = menuItems[0];
    } else {
      menu = menuItems
        .map(item => item.trim())
        .map(item => item.charAt(0).toUpperCase() + item.substr(1))
        .reduce((acc, curr) => acc + "\n\u2022 " + curr, "")
        .trim();
    }
    
    menuText.text = title + menu;
    spinner.state = 'disabled';
  }
}

function getNextWeekDay(date) {
  let adjustment = 0;
  switch(date.getDay()) {
    case 0:
      adjustment = 1;
      break;
    case 6:
      adjustment = 2;
      break;
  }
  return addDaysToDate(date, adjustment);
}

function getPreviousWeekDay(date) {
  let adjustment = 0;
  switch(date.getDay()) {
    case 0:
      adjustment = -2;
      break;
    case 6:
      adjustment = -1;
      break;
  }
  return addDaysToDate(date, adjustment);
}

function addDaysToDate(date, days) {
  switch(days) {
    case 0:
      return date
    default:
      let adjustedDate = new Date(date);
      adjustedDate.setDate(date.getDate() + days);
      return adjustedDate;
  }
}

function requestLunch(date) {
  currentDate = date;
  spinner.state = 'enabled';
  menuText.text = '';
  dateText.text = formatDate(date);
  
  console.log(`Requesting lunch for ${date}`);
  let data = {
    message: 'get_lunch',
    date: date.toISOString().substring(0, 10)
  };
  
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  }
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatDate(date) {
  return `${dayNames[date.getUTCDay()]}, ${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}`; 
}
