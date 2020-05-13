const _ = require('lodash');

const checkWinner = (hands) => {
  const evaluated = hands.map(h => ({ id: h.id, strength: checkHand(h.hand) }));
  const ranked = _.sortBy(evaluated, ['strength.strength', 'strength.modifier']).reverse();
  const candidates = ranked.filter(h => h.strength.strength === ranked[0].strength.strength);
  // check modifier for tied flushes?
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
  const flushes = groups.filter(g => g.length >= 5);
  if(flushes.length > 0) {
    const straight = checkStraight(flushes[0], true);
    if(straight) {
      // royal flush
      console.log(straight.modifier);
      if(straight.modifier === 14) {

      // straight flush
      } else {

      }
    }

    //flush
    const cardsInFlush = cards.filter(c => c.suit === groups.filter(g => g.length >= 5)[0][0].suit);
    const sorted = cardsInFlush.map(c => c.value).sort().reverse();
    return { strength: 5, modifier: sorted[0], restOfCards: [] };
  }
}

const checkStraight = (cards, fiveCards = false) => {
  const values = cards.map(c => c.value).sort((a, b) => b - a);
  // Repeat the following process:
  // Once sorted into descending values, check the 1st and 5th card.
  // If their difference is 4, then you have a possible straight.
  // (e.g. 2 to 6, 10 to A, etc.)
  // If not, check the 2nd and 6th, then 3rd and 7th.
  // If you have a candidate, iterate through e.g. 1st through 5th;
  // If any of the values dosen't equal the next plus one, then you've broken the straight
  // Finally, check if there's an ace-low straight by
  // adding 1 to the end of the array and removing the first value then re-starting at offset = 2

  let o = fiveCards ? 2 : 0;
  for(o; o < 3; o++) {
    if(values[o] - values[4 + o] === 4 || values[0] === 14 && values[6] === 2) {
      for(let i = 1 + o; i < 5 + o; i++) {
        if(values[i-1] !== values[i] + 1) {
          if(o === 2) {
            if(values[0] === 14) {
              values.push(1);
              values.shift();
              i = 1 + o;
            } else {
              return false;
            }
          }
        }
      }
    } else if(o === 2) {
      return false;
    }
  }
  // if successfully evaded failure conditions,
  // then the succeeding straight was at offset = 2
  if(o === 3) { o = 2; }
  const straight = values.slice(o, o + 5).map(v => v === 1 ? 14 : v);

  // straight
  const restOfCards = cards.filter(c =>  !straight.includes(c.value));
  return { strength: 4, modifier: values[o], restOfCards };
}

const checkGroups = (cards) => {
  let groups = [];
  const groupsObject = _.groupBy(cards, 'value');
  const keys = Object.keys(groupsObject);
  keys.forEach(k => {
    groups.push(groupsObject[k]);
  });

  // Returns values of groups sorted high to low
  // (Quads don't need to be sorted since there can only be one set of quads in 7 cards)
  const quads = groups.filter(g => g.length === 4).map(g => g[0].value);
  const trips = groups.filter(g => g.length === 3).map(g => g[0].value).sort().reverse();
  const pairs = groups.filter(g => g.length === 2).map(g => g[0].value).sort().reverse();

  // quads
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

module.exports.checkHand = checkHand;
module.exports.checkWinner = checkWinner;