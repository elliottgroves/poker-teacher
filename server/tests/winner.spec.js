const winner = require('../winner.js');

describe('winner.js', () => {
	describe('checkHand', () => {
  	const royalFlush = [[14, 'c'], [13, 'c'], [12, 'c'], [11, 'c'], [10, 'c'], [8, 'h'], [10, 's']];
		const straightFlush = [[2, 'c'], [3, 'c'], [4, 'c'], [6, 'c'], [5, 'c'], [8, 'h'], [10, 's']];
		const quads = [[12, 'd'], [12, 'h'], [12, 'c'], [12, 's'], [3, 'd'], [4, 'd'], [7, 'd']];
		const fullHouse = [[10, 'd'], [10, 'h'], [10, 'c'], [9, 'd'], [9, 'c'], [4, 'h'], [4, 'c']];
		const flush = [[2, 'c'], [3, 'c'], [4, 'c'], [6, 'c'], [7, 'c'], [8, 'h'], [10, 's']];
		const aceHighStraight = [[14, 'c'], [13, 'c'], [12, 'c'], [11, 'c'], [14, 'h'], [8, 'h'], [10, 's']];
		const aceLowStraight = [[2, 'c'], [3, 'c'], [4, 'c'], [5, 'c'], [14, 'h'], [8, 'h'], [10, 's']];
		const trips = [[12, 'd'], [12, 'h'], [12, 'c'], [10, 's'], [3, 'd'], [4, 'd'], [7, 'd']];
		const twoPair = [[12, 'd'], [12, 'h'], [10, 'c'], [10, 's'], [2, 'd'], [4, 'd'], [7, 'd']];
		const pair = [[12, 'd'], [12, 'h'], [11, 'c'], [10, 's'], [3, 'd'], [4, 'd'], [7, 'd']];
		const highCard = [[2, 'c'], [3, 'c'], [4, 'c'], [6, 'c'], [7, 'h'], [8, 'h'], [10, 's']];

		const exampleHands = [
		  { id: 1, hand: royalFlush.map(c => ({ value: c[0], suit: c[1] })) },
		  { id: 2, hand: straightFlush.map(c => ({ value: c[0], suit: c[1] })) },
		  { id: 3, hand: quads.map(c => ({ value: c[0], suit: c[1] })) },
		  { id: 4, hand: fullHouse.map(c => ({ value: c[0], suit: c[1] })) },
		  { id: 5, hand: quads.map(c => ({ value: c[0], suit: c[1] })) },
		  { id: 6, hand: royalFlush.map(c => ({ value: c[0], suit: c[1] })) },
		];

		const testTable = [
			// { hand: royalFlush, expected: {}}
			// { hand: straightFlush, expected: {}}
			{ hand: quads, name: 'quads', expected: expect.objectContaining({ strength: 7, modifier: 12, restOfCards: expect.anything() }) },
			{ hand: fullHouse, name: 'full house', expected: expect.objectContaining({ strength: 6, modifier: 10, restOfCards: expect.anything() }) },
			{ hand: flush, name: 'flush', expected: expect.objectContaining({ strength: 5, modifier: 7, restOfCards: expect.anything() }) },
			{ hand: aceHighStraight, name: 'ace high straight', expected: expect.objectContaining({ strength: 4, modifier: 14, restOfCards: expect.anything() }) },
			{ hand: aceLowStraight, name: 'ace low straight', expected: expect.objectContaining({ strength: 4, modifier: 5, restOfCards: expect.anything() }) },
			{ hand: trips, name: 'trips', expected: expect.objectContaining({ strength: 3, modifier: 12, restOfCards: expect.anything() }) },
			{ hand: twoPair, name: 'two pair', expected: expect.objectContaining({ strength: 2, modifier: 12, restOfCards: expect.anything() }) },
			{ hand: pair, name: 'pair', expected: expect.objectContaining({ strength: 1, modifier: 12, restOfCards: expect.anything() }) },
			{ hand: highCard, name: 'high card', expected: expect.objectContaining({ strength: 0, modifier: 10, restOfCards: expect.anything() }) },
		];

		testTable.forEach((t) => {
			it(`returns rank for example ${t.name}`, () => {
				const hand = t.hand.map(c => ({ value: c[0], suit: c[1] }));
				expect(winner.checkHand(hand)).toEqual(t.expected);
			});
		});
	});
});