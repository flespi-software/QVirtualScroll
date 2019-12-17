<template>
  <section class="table-skeleton">
    <div class="table-skeleton__row">
      <div class="row__item" v-for="(_, i) in new Array(12)" :key="i"></div>
    </div>
  </section>
</template>

<style lang="stylus">
  .table-skeleton
    overflow hidden
    &__row
      line-height 19px
      margin 0
      height: 19px
      display flex
      .row__item
        height 15px
        min-width 150px
        animation flashing 1s infinite
        background-color rgba(255, 255, 255, .6)
        margin 2px 4px
        border-radius 5px
  @keyframes flashing
    0%
      opacity 1
    50%
      opacity .7
    100%
      opacity 1
</style>
