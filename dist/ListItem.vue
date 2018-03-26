<template>
  <div :style="{height: `${itemHeight}px`, width: `${rowWidth}px`}" @click="itemClickHandler">
    <span class="list__item item_actions" v-if="actionsVisible">
      <q-icon v-for="(action, i) in actions" :key="i" @click.stop.native="clickHandler(index, action.type, item)" :class="action.classes" class="cursor-pointer on-left" :name="action.icon">
        <q-tooltip>{{action.label}}</q-tooltip>
      </q-icon>
    </span>
    <span v-for="(prop, k) in cols" :key="k" class="list__item" :class="{[`item_${k}`]: true}">{{prop.custom ? JSON.stringify(item[prop.name]) : item[prop.name]}}</span>
    <span v-if="etcVisible" class="list__item item_etc">{{etc}}</span>
  </div>
</template>

<script>
  export default {
    props: [
      'item',
      'index',
      'actions',
      'cols',
      'itemHeight',
      'etcVisible',
      'rowWidth',
      'actionsVisible'
    ],
    computed: {
      etc () {
        let etcKeys = Object.keys(this.item).filter(key => !this.hasInCols(key))
        return etcKeys.reduce((acc, key) => {
          acc += `${key}: ${JSON.stringify(this.item[key])}; `
          return acc
        }, '') || '*Empty*'
      }
    },
    methods: {
      hasInCols (prop) {
        return !!this.cols.filter(col => prop === col.name).length
      },
      clickHandler (index, type, content) {
        this.$emit(`action`, {index, type, content})
      },
      itemClickHandler (index, content) {
        this.$emit(`item-click`, {index, content})
      }
    }
  }
</script>

<style lang="stylus">
  .list__item
    display inline-block
    white-space nowrap
    margin 0 10px 0 5px
    text-overflow ellipsis
    overflow hidden
</style>
