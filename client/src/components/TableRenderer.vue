<template>
	<div class="table-parent-container">
		<filter id="dropshadow" height="130%">
	    <feGaussianBlur in="SourceAlpha" stdDeviation="18"/>
	    <feOffset dx="0" dy="8" result="offsetblur"/>
	    <feComponentTransfer>
	      <feFuncA type="linear" slope="0.6"/>
	    </feComponentTransfer>
	    <feMerge> 
	      <feMergeNode/>
	      <feMergeNode in="SourceGraphic"/>
	    </feMerge>
	  </filter>
	  <svg style="filter:url(#dropshadow)" :width="width" :height="height">
	    <polygon class="tablepoly" :points="tablepolyPoints"/>
	  </svg>
	  <div class="board">
	  	<div class="cards">
	  		<div v-for="(card, $index) in gameState.board" :class="{ 'not-empty' : card !== null }" class="card">
	      	<span v-if="card" :class="{ 'red-card' : card.suit === 'diamonds' || card.suit === 'hearts' }">{{ cardDisplay(card) }}</span>
	    	</div>
	  	</div>
	  	<div class="pot">
		  	<div class="pot-icon"></div>
		  	<span>{{ gameState.pot }}</span>
		  </div>
	  </div>
	</div>
</template>

<script>
export default {
	name: 'TableRenderer',
	props: {
		width: {
			type: Number,
			default: 600,
		},
		height: {
			type: Number,
			default: 400,
		},
		tablepolyPoints: {
			type: String,
			default: '',
		},
		gameState: {
			type: Object,
			default: () => { pot: 0 },
		},
	},
	methods: {
		cardDisplay(card) {
			if(card === null) { return; }
      let suit;
      switch(card.suit) {
        case 'diamonds':
          suit = '♦';
          break;
          case 'hearts':
          suit = '♥';
          break;
          case 'spades':
          suit = '♠';
          break;
          case 'clubs':
          suit = '♣';
          break;
      }
      let value;
      switch(card.value) {
        case 11:
          value = 'J';
          break;
        case 12:
          value = 'Q';
          break;
        case 13:
          value = 'K';
          break;
        case 14:
          value = 'A';
          break;
        default:
          value = card.value;
      }
      return `${value}${suit}`;
    },
	},
}
</script>

<style scoped lang="scss">
.table-parent-container {
	position: relative;
	.tablepoly {
		fill: green;
	}
	.board {
		position: absolute;
		top: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		.cards {
			display: flex;
			margin-bottom: 20px;
			.card {
	      height: 70px;
	      width: 49px;
	      border-radius: 6px;
	      font-size: 1.4em;
	      display: flex;
	      align-items: center;
	      justify-content: center;
	      padding-bottom: 26px;
	      &.not-empty {
					background: white;
	      	border: 1px solid black;
	      }
	      .red-card {
	        color: red;
	      }
	    }
		}
		.pot {
			display: flex;
			font-size: 2em;
			align-items: center;
			background: #fff;
			border-radius: 4px;
			padding: 0 12px;
			.pot-icon {
				height: 12px;
				width: 16px;
				background: red;
				border-radius: 100%;
				margin-right: 10px;
			}
		}
	}
}
</style>