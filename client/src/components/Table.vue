<template>
  <div class="parent-container">
    <v-toolbar absolute width="100%" color="#444" class="navbar">
      <img class="logo" src="/favicon.png" />
      <v-toolbar-title><h1>Poker Teacher</h1></v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn @click="winnerDebug">Winner</v-btn>
        <v-btn @click="flopDebug">Board</v-btn>
        <v-btn @click="nextActionDebug">Debug</v-btn>
        <v-fade-transition>
          <v-btn v-if="!gameState.started" @click="startGame">Start Game</v-btn>
        </v-fade-transition>
      </v-toolbar-items>
    </v-toolbar>
    <div class="table">
      <table-renderer :width="tableSizeX"
                      :height="tableSizeY"
                      :tablepolyPoints="tablepolyPoints"
                      :gameState="gameState">
      </table-renderer>
      <div class="table--seats">
        <div v-for="(seat, $index) in table.seats"
             :style="seatStyle($index)"
             :key="$index"
             class="table--seats--seat">
          <v-btn v-if="seat === null && !playing"
                 :disabled="joining"
                 @click="sit($index)">Sit Here</v-btn>
          <div v-else-if="seat !== null">
            <div class="d-flex justify-center">
              <v-slide-y-transition group class="d-flex">
                <!-- :class="{ 'hidden' : self.id !== seat.id, 'folded' : seat.folded }" -->
                <div v-for="(card, $index) in seat.hand"
                     class="card"
                     
                     :key="$index">
                      <!-- v-if="self.id === seat.id" -->
                  <span :class="{ 'red-card' : card.suit === 'diamonds' || card.suit === 'hearts' }">{{ cardDisplay(card) }}</span>
                </div>
              </v-slide-y-transition>
            </div>
            <div :class="{ 'active' : seat.active, 'folded' : seat.folded }" class="stack d-flex align-center flex-column">
              <span>{{ seat.name }}</span>
              <div class="d-flex align-center">
                <div class="stack-icon"></div>
                <v-slide-y-transition mode="out-in">
                  <span :key="seat.stack">{{ seat.stack }}</span>
                </v-slide-y-transition>
              </div>
            </div>
            <div v-if="seat.dealer" class="dealer-chip">
              <div class="chip">D</div>
            </div>
          </div>
        </div>
        <v-slide-y-transition>
          <div v-if="joining" @keyup.enter="join" class="table--seats--join">
            <p class="overline">Enter a name and a stack size to join</p>
            <v-text-field v-model="name"
                          placeholder="Name"
                          outlined
                          hide-details
                          color="black"
                          class="mb-2">
            </v-text-field>
            <v-text-field v-model="stack"
                          placeholder="Stack"
                          outlined
                          hide-details
                          color="black"
                          class="mb-4">
            </v-text-field>
            <div class="d-flex">
              <v-spacer></v-spacer>
              <v-btn @click="joining=false" color="grey" class="mr-2">
                <v-icon color="white">arrow_back</v-icon>
              </v-btn>
              <v-btn @click="join" color="blue darken-2">
                <v-icon color="white">done</v-icon>
              </v-btn>
            </div>
          </div>
        </v-slide-y-transition>
      </div>
    </div>
    <v-slide-y-transition group mode="out-in">
      <div v-if="!playing" class="ui" key="spectating"></div>
      <v-fade-transition group key="ingame" mode="out-in">
        <div v-if="playing && !self.active" class="ui" key="waiting">
          <v-btn @click="toggleQueueFold"
                 :color="queueingFold ? 'red' : 'red lighten-3'" 
                 x-large
                 class="white--text">
            <v-icon class="mr-2 ml-0">{{ queueingFold ? 'check_box' : 'check_box_outline_blank' }}</v-icon>{{ foldQueueLabel }}
          </v-btn>
        </div>
        <div v-if="playing && self.active" class="ui" key="playing">
          <div class="ui-spacer"></div>
          <v-btn @click="fold" color="red" x-large class="white--text mr-2 ml-4">Fold</v-btn>
          <v-btn @click="check" color="yellow darken-2" x-large class="white--text mr-2">Check</v-btn>
          <v-btn @click="placeBet" color="green" x-large class="white--text mr-4">Bet</v-btn>
          <div class="bet">
            <span class="mr-5">{{ bet }}</span>
            <div class="d-flex flex-column">
              <v-slider v-model="bet"
                        thumb-label="always"
                        color="green"
                        hide-details
                        :min="gameState.bigBlind"
                        :max="self.stack"></v-slider>
              <div class="d-flex">
                <v-btn class="mx-2">2 Big Blinds</v-btn>
                <v-btn class="mr-2">1/2 pot</v-btn>
                <v-btn class="mr-2">Pot</v-btn>
                <v-btn class="mr-2">All in</v-btn>
              </div>
            </div>
          </div>
        </div>
      </v-fade-transition>
    </v-slide-y-transition>
  </div>
</template>

<script>
import io from 'socket.io-client';
import TableRenderer from './TableRenderer.vue';

export default {
  name: 'Table',
  components: {
    TableRenderer,
  },
  data: () => ({
    socket: {},
    gameState: { pot: 0, table: { seats: [] } },
    joining: false,
    sittingAt: -1,
    name: null,
    stack: 200,
    tableSizeX: 600,
    tableSizeY: 400,
    playing: false,
    bet: 0,
    queueingFold: false,
  }),
  computed: {
    tablepolyPoints() {
      return this.tableCoords.map((c) => `${c.x},${c.y}`).join(' ');
    },
    table() {
      if(this.gameState === null) { return { seats: [] }; }
      return this.gameState.table;
    },
    tableCoords() {
      return [
        { x: this.tableSizeX / 4, y: 0 },
        { x: this.tableSizeX * 0.75, y: 0 },
        { x: this.tableSizeX, y: this.tableSizeY / 4 },
        { x: this.tableSizeX, y: this.tableSizeY * 0.75 },
        { x: this.tableSizeX * 0.75, y: this.tableSizeY },
        { x: this.tableSizeX / 4, y: this.tableSizeY },
        { x: 0, y: this.tableSizeY * 0.75 },
        { x: 0, y: this.tableSizeY / 4 },
      ];
    },
    betLabel() {

    },
    self() {
      if(this.table.seats.length === 0 || this.sittingAt === -1 || !this.playing || this.table.seats[this.sittingAt] === null) {
        return { stack: 0 };
      }
      return this.table.seats[this.sittingAt];
    },
    minBet() {
      const highestOtherBet = 0;
      return highestOtherBet > this.gameState.bigBlind ?
        highestOtherBet * 2 : 
        this.gameState.bigBlind * 2;
    },
    active() {
      return this.self.active;
    },
    foldQueueLabel() {
      return this.self.bet === this.gameState.bigBlind ? 'Check/Fold' : 'Fold';
    },
  },
  methods: {
    winnerDebug() {
      this.socket.emit('winner-debug');
    },
    flopDebug() {
      this.socket.emit('flop-debug');
    },
    startGame() {
      this.socket.emit('start');
    },
    nextActionDebug() {
      this.socket.emit('next-debug');
    },
    seatStyle(index) {
      return { transform: `translateX(${this.tableCoords[index].x - (this.tableSizeX / 2)}px) translateY(${this.tableCoords[index].y - (this.tableSizeY / 2)}px)` };
    },
    sit(position) {
      if(!this.joining) {
        this.joining = true;
        this.sittingAt = position;
      }
    },
    join() {
      this.joining = false;
      this.playing = true;
      this.socket.emit('sit', this.sittingAt, this.name, this.stack);
    },
    toggleQueueFold() {
      this.queueingFold = !this.queueingFold;
    },
    fold() {
      this.socket.emit('fold', this.self.id);
    },
    check() {

    },
    placeBet() {

    },
    cardDisplay(card) {
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
  created() {
    this.socket = io('http://localhost:3000');
  },
  watch: {
    active() {
      if(this.queueingFold) {
        this.fold();
        this.queueingFold = false;
      }
    }
  },
  mounted() {
    this.socket.on('update', (data) => {
      this.gameState = data;
      console.log(data);
    });
  },
};
</script>

<style scoped lang="scss">
.parent-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-flow: column;
  height: 100%;
  width: 100%;
  .navbar {
    .logo {
      margin-left: 10px;
      width: 40px;
      border-radius: 100%;
    }
    h1 {
      color: #ddd;
      margin-left: 15px;
    }
  }
  .table {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px;
    .table--seats {
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      .table--seats--join {
        background: #fff;
        padding: 15px;
        border-radius: 10px;
        z-index: 10;
      }
      .table--seats--seat {
        position: absolute;
        .card {
          height: 70px;
          width: 49px;
          background: white;
          border: 1px solid black;
          border-radius: 6px;
          font-size: 1.4em;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-bottom: 26px;
          transition: background 0.2s ease;
          &.hidden {
            background: red;
            border: 3px solid #fff;
          }
          &.folded {
            background: #999;
          }
          .red-card {
            color: red;
          }
        }
        .stack {
          padding: 0 10px;
          justify-content: center;
          align-items: center;
          background: #fff;
          border-radius: 6px;
          margin-top: 10px;
          transition: background 0.2s ease, color 0.2s ease;
          &.folded {
            background: #999;
            color: white;
          }
          &.active {
            background: rgb(100,100,255);
            color: white;
          }
          span {
            font-size: 1.2em;
          }
          .stack-icon {
            background: red;
            border-radius: 100%;
            width: 16px;
            height: 12px;
            border: 1px solid #ddd;
            margin-right: 4px;
          }
        }
        .dealer-chip {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(20px);
          .chip {
            border: 1px solid #fff;
            height: 24px;
            width: 28px;
            background: red;
            border-radius: 100%;
            color: #fff;
            text-align: center;
          }
        }
      }
    }
  }
  .ui {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: flex-end;
    flex-grow: 1;
    .ui-spacer {
      width: 600px;
    }
    .bet {
      display: flex;
      align-items: center;
      width: 600px;
      span {
        text-align: center;
        font-size: 2.6em;
        width: 60px;
      }
    }
  }
}
</style>