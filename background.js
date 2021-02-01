console.log('background running');

chrome.browserAction.onClicked.addListener(buttonClicked)

function buttonClicked(tab) {
  let msg = {
    command: 'nextGen'
  }
  chrome.tabs.sendMessage(tab.id, msg);
}
