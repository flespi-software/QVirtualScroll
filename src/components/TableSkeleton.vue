<template>
  <section class="table-skeleton">
    <div class="table-skeleton__row">
      <span class="row__item" v-for="(rowWidth, i) in rowsWidths" :key="i" :style="{ minWidth: `${rowWidth ? rowWidth : '150'}px` }"></span>
    </div>
  </section>
</template>

<script>
export default {
  name: 'TableSkeleton',
  props: ['rows'],
  computed: {
    rowsWidths () {
      const rows = this.rows ? this.rows : new Array(12)
      return rows
    }
  }
}
</script>

<style lang="stylus">
  .table-skeleton
    overflow hidden
    &__row
      line-height 19px
      margin 0
      padding 2px 0
      height: 19px
      display flex
      .row__item
        height 15px
        animation flashing 1s infinite
        background-color rgba(255, 255, 255, .6)
        margin 0 10px 0 5px
        border-radius 5px
  @keyframes flashing
    0%
      opacity .3
    50%
      opacity .2
    100%
      opacity .3
</style>
