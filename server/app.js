const Express = require('express')();
const Http = require('http').Server(Express);
const Socketio = require('socket.io')(Http);
const _ = require('lodash');

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
    checkWinner();
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

const checkWinner = (hands) => {
  // const hands = gameState.playersInGame.map(p => ({ id: p.id, hand: p.hand.concat(gameState.board) }));
  const evaluated = hands.map(h => ({ id: h.id, strength: checkHand(h.hand) }));
  const ranked = _.sortBy(evaluated, ['strength.strength', 'strength.modifier']).reverse();
  const candidates = ranked.filter(h => h.strength.strength === ranked[0].strength.strength);
  const winnerId = _.sortBy(candidates.map(h => ({ id: h.id, restOfCards: h.strength.restOfCards.map(c => c.value)})), 'restOfCards').reverse()[0].id;
  console.log(ranked);
}

const checkHand = (hand) => {
  // check royal (9), straight (8), and regular (5) flushes
  const flush = checkFlush(hand);
  if(flush) { return flush; }

  // check straights (4)
  const straight = checkStraight(hand);
  if(straight) { return straight; }

  // check quads (7), full houses (6), trips (3), two pair (2), one pair (1)
  const group = checkGroups(hand);
  if(group) { return group; }

  // return high card
  const sortedHighCard = _.sortBy(hand, ['value']).reverse();
  return { strength: 0, modifier: sortedHighCard[0].value, restOfCards: sortedHighCard.slice(1) };
}

const checkFlush = (cards) => {
  let groups = [];
  const groupsObject = _.groupBy(cards, 'suit');
  const keys = Object.keys(groupsObject);
  keys.forEach(k => {
    groups.push(groupsObject[k]);
  });
  if(groups.filter(g => g.length >= 5).length > 0) {
    const cardsInFlush = cards.filter(c => c.suit === groups.filter(g => g.length >= 5)[0][0].suit);
    const sorted = cardsInFlush.map(c => c.value).sort().reverse();
    return { strength: 4, modifier: sorted[0], restOfCards: null };
  }
}

const checkStraight = (cards) => {
  
}

const checkGroups = (cards) => {
  let groups = [];
  const groupsObject = _.groupBy(cards, 'value');
  const keys = Object.keys(groupsObject);
  keys.forEach(k => {
    groups.push(groupsObject[k]);
  });

  // Returns values of groups sorted high to low
  const quads = groups.filter(g => g.length === 4).map(g => g[0].value);
  const trips = groups.filter(g => g.length === 3).map(g => g[0].value).sort().reverse();
  const pairs = groups.filter(g => g.length === 2).map(g => g[0].value).sort().reverse();

  if(quads.length > 0) {
    const restOfCards = cards.filter(c => c.value !== quads[0]).sort().reverse();
    return { strength: 7, modifier: quads[0], restOfCards };
  } else if(trips.length > 0) {
    // full house
    if(pairs.length > 0) {
      const restOfCards = cards.filter(c => c.value !== trips[0] && c.value !== pairs[0]).sort().reverse();
      return { strength: 6, modifier: trips[0], restOfCards };
    }
    // trips
    const restOfCards = cards.filter(c => c.value !== trips[0]).sort().reverse();
    return { strength: 3, modifier: trips[0], restOfCards };
  } else if(pairs.length > 0) {
    // two pair
    if(pairs.length >= 2) {
      const restOfCards = cards.filter(c => c.value !== pairs[0]).sort().reverse();
      return { strength: 2, modifier: pairs[0], restOfCards };
    }
    // pair
    const restOfCards = cards.filter(c => c.value !== pairs[0]).sort().reverse();
    return { strength: 1, modifier: pairs[0], restOfCards };
  }
}

const royalFlush = [[14, 'c'], [13, 'c'], [12, 'c'], [11, 'c'], [10, 'c'], [8, 'h'], [10, 's']];
const straightFlush = [[2, 'c'], [3, 'c'], [4, 'c'], [6, 'c'], [5, 'c'], [8, 'h'], [10, 's']];
const quads = [[12, 'd'], [12, 'h'], [12, 'c'], [12, 's'], [3, 'd'], [4, 'd'], [7, 'd']];
const fullHouse = [[10, 'd'], [10, 'h'], [10, 'c'], [9, 'd'], [9, 'c'], [4, 'h'], [4, 'c']];
const flush = [[2, 'c'], [3, 'c'], [4, 'c'], [6, 'c'], [7, 'c'], [8, 'h'], [10, 's']];
const straight = [[2, 'c'], [3, 'c'], [4, 'c'], [6, 'c'], [5, 'h'], [8, 'h'], [10, 's']];
const trips = [[12, 'd'], [12, 'h'], [12, 'c'], [10, 's'], [3, 'd'], [4, 'd'], [7, 'd']];
const twoPair = [[12, 'd'], [12, 'h'], [10, 'c'], [10, 's'], [2, 'd'], [4, 'd'], [7, 'd']];
const twoPairLower =  [[12, 'd'], [12, 'h'], [10, 'c'], [10, 's'], [2, 'd'], [4, 'd'], [6, 'd']];
const pair = [[12, 'd'], [12, 'h'], [11, 'c'], [10, 's'], [3, 'd'], [4, 'd'], [7, 'd']];
const pairLower = [[12, 'd'], [12, 'h'], [11, 'c'], [10, 's'], [2, 'd'], [4, 'd'], [7, 'd']];
const highCard = [[2, 'c'], [3, 'c'], [4, 'c'], [6, 'c'], [7, 'h'], [8, 'h'], [10, 's']];

const exampleHands = [
  { id: 1, hand: highCard.map(c => ({ value: c[0], suit: c[1] })) },
  { id: 2, hand: twoPairLower.map(c => ({ value: c[0], suit: c[1] })) },
  { id: 3, hand: twoPair.map(c => ({ value: c[0], suit: c[1] })) },
  { id: 4, hand: trips.map(c => ({ value: c[0], suit: c[1] })) },
  { id: 5, hand: quads.map(c => ({ value: c[0], suit: c[1] })) },
  { id: 6, hand: fullHouse.map(c => ({ value: c[0], suit: c[1] })) },
  { id: 7, hand: flush.map(c => ({ value: c[0], suit: c[1] })) },
];

checkWinner(exampleHands);

// checkHand(exampleHands[0].hand);
