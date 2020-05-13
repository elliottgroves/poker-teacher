const Express = require('express')();
const Http = require('http').Server(Express);
const Socketio = require('socket.io')(Http);
const winner = require('./winner.js');

var table = {
	pot: 0,
	seats: [null, null, null, null, null, null, null, null],
  board: [null, null, null, null, null],
};

var deck = [];

var gameState = {
  smallBlind: 1,
  bigBlind: 2,
  pot: 0,
  table,
  activePlayer: -1,
  handNumber: 0,
  playersInHand: 0,
  playersInGame: [],
  board: [null, null, null, null, null],
  started: false,
}

Http.listen(3000, () => {
    console.log('Listening at :3000...');
});

Socketio.on('connection', socket => {
  socket.emit('update', gameState);

  socket.on('winner-debug', () => {
    const hands = gameState.playersInGame.map(p => ({ id: p.id, hand: p.hand.concat(gameState.board) }));
    winner.checkWinner(hands);
    socket.emit('update', gameState);
  });

  socket.on('flop-debug', () => {
    if(gameState.board[2] === null) {
      flop();
    } else if(gameState.board[3] === null) {
      addCardToBoard(3);
    } else if(gameState.board[4] === null) {
      addCardToBoard(4);
    }
    socket.emit('update', gameState);
  });

  socket.on('next-debug', () => {
    nextPlayerAction();
    socket.emit('update', gameState);
  });

  socket.on('sit', (position, name, stack) => {
    const newPlayer = { id: position,
                        socketId: socket.id,
                        name, 
                        stack, 
                        hand: [], 
                        active: false, 
                        away: false, 
                        dealer: false,
                        folded: false,
                        bet: 0 };
    table.seats[position] = newPlayer;
    gameState.playersInGame.push(newPlayer);
    socket.emit('update', gameState);
  });

  socket.on('fold', (id) => {
    gameState.table.seats[id].folded = true;
    nextPlayerAction();
    socket.emit('update', gameState);
  });

  socket.on('start', () => {
    addAi(0, 'Foo', 200);
    addAi(1, 'Bar', 200);
    addAi(2, 'Fizz', 200);
    addAi(3, 'Buzz', 200);
    startGame();
    socket.emit('update', gameState);
  });

  socket.on('disconnect', () => {
  	table.seats.splice(table.seats.findIndex(s => s && s.socketId === socket.id), 1, null);
    gameState.playersInGame.splice(gameState.playersInGame.findIndex(s => s && s.socketId === socket.id), 1);
  	socket.emit('update', gameState);
  });
});

const addAi = (position, name, stack) => {
  const newPlayer = { id: position,
                      name, 
                      stack, 
                      hand: [], 
                      active: false, 
                      away: false, 
                      dealer: false, 
                      bet: 0 };
  table.seats[position] = newPlayer;
  gameState.playersInGame.push(newPlayer);
}

const startGame = () => {
  gameState.started = true;
  const randomActivePlayer = gameState.playersInGame[Math.floor(Math.random()*gameState.playersInGame.length)];
  gameState.activePlayer = randomActivePlayer.id;
  // gameState.table.seats[randomActivePlayer.id].dealer = true;
  table.seats[0].dealer = true;
  startHand();
}

const startHand = () => {
  gameState.handNumber++;
  resetState();
  reshuffleDeck();
  deal();
  determineDealer();
  payBlindsAndAntes();
  determineUtg();
}

const resetState = () => {
  gameState.playersInGame.forEach(p => {
    p.folded = false;
  });
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
}

const payBlindsAndAntes = () => {
  let bbIndex;
  let sbIndex;
  const currentDealerIndex = gameState.playersInGame.findIndex(p => p.dealer);
  if(currentDealerIndex + 1 >= gameState.playersInGame.length) {
    sbIndex = 0;
    bbIndex = 1;
  } else if(currentDealerIndex + 2 >= gameState.playersInGame.length) {
    sbIndex = currentDealerIndex + 1;
    bbIndex = 0;
  } else {
    sbIndex = currentDealerIndex + 1;
    bbIndex = currentDealerIndex + 2;
  }
  const bb = gameState.playersInGame[bbIndex];
  bb.stack -= gameState.bigBlind;
  bb.bet = gameState.bigBlind;
  const sb = gameState.playersInGame[sbIndex];
  sb.stack -= gameState.smallBlind;
  sb.bet = gameState.smallBlind;

  gameState.pot = gameState.bigBlind + gameState.smallBlind;
}

const reshuffleDeck = () => {
  gameState.playersInGame.forEach(p => {
    p.hand = [];
  });
  deck = [];
  const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
  for(i = 0; i < 52; i++) {
    let newCard = {};
    newCard.value = (i % 13) + 2;
    newCard.suit = suits[Math.floor(4 * i / 52)];
    deck.push(newCard);
  }
}

const deal = () => {
  gameState.playersInGame.forEach(p => {
    for(i = 0; i < 2; i++) {
      p.hand.push(deck.splice(Math.floor(Math.random() * deck.length), 1)[0]);
    }
  });
}

const determineUtg = () => {
  const currentDealerIndex = gameState.playersInGame.findIndex(p => p.dealer);
  const newActiveIndex = (currentDealerIndex + 3) % gameState.playersInGame.length;
  gameState.playersInGame[newActiveIndex].active = true;
}

const nextPlayerAction = () => {
  const oldActiveIndex = gameState.playersInGame.findIndex(p => p.active);
  const newActiveIndex = (oldActiveIndex + 1) % gameState.playersInGame.length;
  gameState.playersInGame[oldActiveIndex].active = false;
  gameState.playersInGame[newActiveIndex].active = true;
}

const flop = () => {
  for(i = 0; i < 3; i++) {
    gameState.board[i] = deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
  }
}

const addCardToBoard = (position) => {
  gameState.board[position] = deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
}
