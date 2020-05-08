<template>
  <v-app id="application">
    <router-view/>
  </v-app>
</template>

<style lang="scss">
#application {
  font-family: Helvetica;
  background: #ddd;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  scroll: none !important;
}
</style>
