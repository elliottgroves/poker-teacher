const Express = require('express')();
const Http = require('http').Server(Express);
const Socketio = require('socket.io')(Http);

var table = {
	pot: 0,
	seats: [null, null, null, null, null, null, null, null],
  board: [null, null, null, null, null],
};

var gameState = {
  smallBlind: 1,
  bigBlind: 2,
  pot: 0,
  table,
  activePlayer: -1,
  handNumber: 0,
  playersInHand: 0,
  dealer: -1,
  playersInGame: [],
  board: [null, null, null, null, null],
}

Http.listen(3000, () => {
    console.log('Listening at :3000...');
});

Socketio.on('connection', socket => {
  socket.emit('update', gameState);

  socket.on('sit', (position, name, stack) => {
    const newPlayer = { id: position, name, stack, hand: null, active: false, away: false, dealer: false, bet: 0 };
    table.seats[position] = newPlayer;
    gameState.playersInGame.push(newPlayer);
    if(gameState.playersInGame.length >= 2) {
      startGame();
    }
    socket.emit('update', gameState);
  });

  socket.on('disconnect', () => {
  	console.log(socket);
  	socket.emit('update', gameState);
  });
});

const startGame = () => {
  deal();
  const randomActivePlayer = gameState.playersInGame[Math.floor(Math.random()*gameState.playersInGame.length)];
  gameState.activePlayer = randomActivePlayer.id;
  gameState.table.seats[randomActivePlayer.id].dealer = true;
  startHand();
}

const startHand = () => {
  gameState.handNumber++;
  determineDealer();
  payBlindsAndAntes();
  deal();
}

const determineDealer = () => {
  const currentDealerIndex = gameState.playersInGame.findIndex(p => p.dealer);
  let newIndex;
  if(currentDealerIndex + 1 >= gameState.playersInGame.length) {
    newIndex = 0;
  } else {
    newIndex = currentDealerIndex + 1;
  }
  gameState.playersInGame[currentDealerIndex].dealer = false;
  gameState.playersInGame[newIndex].dealer = true;
  gameState.dealer = gameState.playersInGame[newIndex].id;
}

const payBlindsAndAntes = () => {
  let bbIndex;
  let sbIndex;
  const currentDealerIndex = gameState.playersInGame.findIndex(p => p.dealer);
  if(currentDealerIndex + 1 >= gameState.playersInGame.length) {
    bbIndex = 0;
    sbIndex = 1;
  } else if(currentDealerIndex + 2 >= gameState.playersInGame.length) {
    bbIndex = currentDealerIndex + 1;
    sbIndex = 0;
  } else {
    bbIndex = currentDealerIndex + 1;
    sbIndex = currentDealerIndex + 2;
  }
  gameState.playersInGame[bbIndex].stack -= gameState.bigBlind;
  gameState.playersInGame[sbIndex].stack -= gameState.smallBlind;
  gameState.pot = gameState.bigBlind + gameState.smallBlind;
}

const deal = () => {
  table.seats.forEach(seat => {
    if(seat !== null) {
      seat.hand = [{ suit: 'hearts', value: '9' }, { suit: 'diamonds', value: '8' }];
    }
  });
}

const flop = () => {

}