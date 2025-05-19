<template>
  <div :style="{height: `${itemHeight}px`, width: `${rowWidth}px`}" :class="`row_${index}`" @click="itemClickHandler(index, item)">
    <template v-for="(prop, k) in cols" :key="k" >
      <span v-if="prop.__dest === 'etc'" class="list__item item_etc" :class="{[`item_${k}`]: true, 'bg-grey-6': menuCellActive && menuCellActive.row === index && menuCellActive.col === k}" :key="k">{{etc}}</span>
      <span v-else class="list__item" :class="{[`item_${k}`]: true, 'bg-grey-6': menuCellActive && menuCellActive.row === index && menuCellActive.col === k}">{{prop.custom ? JSON.stringify(item[prop.name]) : item[prop.name]}}</span>
    </template>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ListItem',
  emits: [
    'item-click'
  ],
  props: [
    'item',
    'index',
    'cols',
    'itemHeight',
    'rowWidth',
    'menuCellActive'
  ],
  computed: {
    etc () {
      const etcKeys = Object.keys(this.item).filter(key => !this.hasInCols(key))
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
      this.$emit('action', { index, type, content })
    },
    itemClickHandler (index, content) {
      this.$emit('item-click', { index, content })
    }
  }
})
</script>

<style lang="sass" scoped>
.list__item
  display: inline-block
  min-height: 19px
  white-space: nowrap
  padding-left: 5px
  text-overflow: ellipsis
  overflow: hidden
  border-right: 2px solid $grey-8
</style>
