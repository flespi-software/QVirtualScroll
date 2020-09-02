<template>
  <div class="message-viewer full-height" :class="{[`uid${uid}`]: true}">
    <q-toolbar class="viewer__toolbar" v-if="needShowToolbar" :class="{[`bg-${currentTheme.bgColor}`]: true, 'text-white': !!currentTheme.bgColor}">
      <span v-if="title && $q.platform.is.desktop" style="margin-right: 10px">{{title}}</span>
      <q-icon :color="currentTheme.color" name="search" @click.native="showSearch = true"
        v-if="$q.platform.is.mobile && currentViewConfig.needShowFilter && !showSearch"
        :style="{fontSize: '24px', marginBottom: currentTheme.controlsInverted ? '' : '8px', paddingLeft: currentTheme.controlsInverted ? '8px' : ''}"
      />
      <q-input
        :class="{'full-width': $q.platform.is.desktop || showSearch, collapsed: $q.platform.is.mobile && !showSearch}" outlined hide-bottom-space dense
        @focus="showSearch = true"
        :autofocus="$q.platform.is.mobile"
        @blur="searchBlurHandler"
        v-if="currentViewConfig.needShowFilter && ((showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
        @keyup.enter="searchSubmitHandler"
        type="text" v-model="currentFilter"
        :dark="currentTheme.controlsInverted"
        :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"
        placeholder="param1=n*,param2,param3>=5"
        :debounce="0"
      >
        <q-btn slot="prepend" :color="currentTheme.color" icon="mdi-magnify" @click="searchSubmitHandler" flat round dense/>
      </q-input>
      <q-toolbar-title/>
      <q-btn :color="currentTheme.color" flat dense class="on-left" @click="$emit('edit:cols')" icon="tune" v-if="colsConfigurator === 'toolbar' && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)">
        <q-tooltip>Edit columns</q-tooltip>
      </q-btn>
      <date-range-modal
        v-if="currentViewConfig.needShowDateRange && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
        class="on-left"
        :date="dateRange"
        :theme="currentTheme"
        @save="dateRangeModalSave"
      />
    </q-toolbar>
    <div ref="wrapper" class="list-wrapper" :class="{'bg-grey-9': currentTheme.contentInverted}"
      :style="{height: needShowToolbar ? 'calc(100% - 50px)' : '100%'}"
    >
      <q-resize-observer @resize="wrapperResizeHandler"/>
      <div class="list__header" :class="[`text-${currentTheme.color}`, `bg-${currentTheme.header}`]"
        v-if="(items.length || loading) && currentTheme.headerShow" :style="{height: `${itemHeight}px`}" ref="header"
        @dblclick="colsConfigurator === 'header' ? $emit('edit:cols') : ''"
      >
        <div class="header__inner" :style="{width: `${rowWidth}px` }">
          <draggable :list="cols" tag="span" @end="$emit('update:cols', cols)">
            <template v-for="(prop, index) in cols">
              <div class="header__item" :key="prop.name" v-if="prop.display"
                  :class="{[`item_${activeColsIndexes[index]}`]: true}" style="cursor: move">
                <q-tooltip v-if="prop.description || prop.title">{{`${prop.name}: ${prop.description ? prop.description :
                  ''}`}}
                </q-tooltip>
                <span class="item__label">{{prop.title || prop.name}}<span v-if="prop.addition">({{prop.addition}})</span><span v-if="prop.unit" style="font-size: .8rem" class="text-grey-4">, {{prop.unit}}</span></span>
                <vue-draggable-resizable :ref="`drag${activeColsIndexes[index]}`"
                  v-if="$q.platform.is.desktop && needResizeControl"
                  :active="true" :draggable="false" :handles="['mr']" :w="prop.width" :preventDeactivation="true"
                  :h="itemHeight * (itemsCount + 1)" :minw="50" :z='1'
                  @resizestop="(left, top, width) => {onResize(width, activeColsIndexes[index]), $emit('update:cols', cols)}"
                />
              </div>
            </template>
          </draggable>
        </div>
      </div>
      <q-btn
        v-if="currentScrollTop < allScrollTop && items.length"
        fab-mini flat icon="mdi-chevron-down"
        @click="$emit('action:to-bottom')"
        class="absolute-bottom-right action action__to-bottom"
        :class="{ 'bg-white': currentTheme.contentInverted, 'text-grey-9': currentTheme.contentInverted }"
      >
        <q-tooltip>To bottom</q-tooltip>
      </q-btn>
      <q-chip
        v-if="hasNewMessages"
        removable clickable
        @remove="$emit('action:to-new-messages-hide')"
        @click="$emit('action:to-new-messages')"
        icon="mdi-bell-outline"
        class="absolute-bottom-right action action__to-new-messages"
        color="amber-8"
        text-color="grey-2"
      >
        new messages
      </q-chip>
      <slot name="empty" v-if="!items.length && !loading">
        <div class="no-messages text-center" :class="{'text-grey-6': currentTheme.contentInverted}" style="font-size: 3rem; padding-top: 40px;">
          {{(i18n && i18n['Messages not found']) || 'Messages not found'}}
        </div>
      </slot>
      <div
        v-else-if="!items.length && loading && itemsCount > 0"
        :style="{position: 'relative', height: `${wrapperHeight - 1}px`, overflow: 'auto'}"
        :class="{'bg-grey-9': currentTheme.contentInverted, 'text-white': currentTheme.contentInverted, 'cursor-pointer': hasItemClickHandler}"
      >
        <table-skeleton v-for="(i, key) in new Array(itemsCount - 1).fill('')" :key="key" :rows="rowWidths"/>
      </div>
      <VirtualList
        v-else
        v-auto-bottom="needAutoScroll"
        :onscroll="listScroll"
        ref="scroller"
        :style="{position: 'relative', height: `${wrapperHeight - 1}px`, overflow: 'auto'}"
        :class="{'bg-grey-9': currentTheme.contentInverted, 'text-white': currentTheme.contentInverted, 'cursor-pointer': hasItemClickHandler}"
        :size="itemHeight"
        :remain="itemsCount"
        wclass="q-w-list"
        :item="item"
        :itemcount="items.length"
        :itemprops="getItemProps"
      />
    </div>
  </div>
</template>

<script>
import VirtualList from 'vue-virtual-scroll-list'
import { uid, scroll } from 'quasar'
import VueDraggableResizable from 'vue-draggable-resizable'
import DateRangeModal from './DateRangeModal'
import ListItem from './ListItem.vue'
import TableSkeleton from './TableSkeleton'
import draggable from 'vuedraggable'
import get from 'lodash/get'

const { setScrollPosition } = scroll

export default {
  name: 'VirtualScrollList',
  props: {
    item: {
      type: Object,
      default: () => ListItem
    },
    itemprops: {
      type: Function,
      default: () => () => {}
    },
    items: {
      type: Array,
      required: true,
      default () { return [] }
    },
    i18n: {
      type: Object
    },
    cols: {
      type: Array,
      required: true
    },
    actions: {
      type: Array,
      required: true
    },
    dateRange: {
      type: Array
    },
    filter: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    autoscroll: {
      type: Boolean,
      default: false
    },
    colsConfigurator: {
      type: String,
      default: 'none'
    },
    itemHeight: {
      type: Number,
      default: 19
    },
    theme: Object,
    viewConfig: Object,
    loading: Boolean,
    scrollOffset: [Number, String],
    hasNewMessages: [Object, Boolean]
  },
  components: { draggable, VirtualList, VueDraggableResizable, TableSkeleton, DateRangeModal },
  data () {
    const defaultConfig = {
      needShowFilter: false,
      needShowDateRange: false
    }
    return {
      uid: 0,
      currentFilter: this.filter,
      wrapperHeight: 0,
      wrapperWidth: 0,
      itemsCount: 0,
      defaultItemWidth: 150,
      dynamicCSS: document.createElement('style'),
      showSearch: false,
      needAutoScroll: false,
      autoscrollEnabled: this.autoscroll,
      defaultTheme: {
        color: 'grey-9',
        bgColor: 'white',
        controlsInverted: false,
        contentInverted: false,
        headerShow: true
      },
      defaultConfig: defaultConfig,
      hasItemClickHandler: false,
      currentScrollTop: 0,
      currentViewConfig: Object.assign(defaultConfig, this.viewConfig),
      needResizeControl: true,
      allScrollTop: 0
    }
  },
  computed: {
    needShowToolbar () {
      return this.currentViewConfig.needShowFilter || this.currentViewConfig.needShowDateRange
    },
    activeCols () {
      return this.cols.filter(col => col.display)
    },
    activeColsIndexes () {
      let i = 0
      return this.cols.reduce((result, col, index) => {
        if (col.display) {
          result[index] = i
          i++
        }
        return result
      }, {})
    },
    notActiveCols () {
      return this.cols.filter(col => !col.display)
    },
    currentTheme () {
      const theme = Object.assign(this.defaultTheme, this.theme)
      theme.header = `${theme.bgColor.split('-')[0]}-8`
      return theme
    },
    rowWidth () {
      let res = 0
      res += this.rowWidths.reduce((acc, width) => acc + width + 15, 0)
      return res + 5 // 5 is margin of container
    },
    wrapperOverflowing () {
      return this.wrapperWidth < this.rowWidth
    },
    rowWidths () {
      const widths = []
      this.activeCols.forEach((col) => {
        widths.push(col.width)
      })
      return widths
    }
  },
  methods: {
    getItemProps (index) {
      const props = {
        key: index,
        props: {
          item: this.items[index],
          index: index,
          actions: this.actions,
          cols: this.activeCols,
          itemHeight: this.itemHeight,
          rowWidth: this.rowWidth
        }
      }
      this.itemprops(index, props)
      return props
    },
    searchSubmitHandler () {
      this.$emit('change:filter', this.currentFilter)
    },
    searchClearHandler () {
      this.currentFilter = ''
      this.searchSubmitHandler()
    },
    searchBlurHandler () {
      this.searchSubmitHandler()
      this.showSearch = false
    },
    openSearch () {
      this.showSearch = true
    },
    clickHandler ({ index, type, content }) {
      this.$emit('action', { index, type, content })
    },
    itemClickHandler ({ index, content }) {
      this.$emit('item-click', { index, content })
    },
    resetParams () {
      const wrapper = this.$refs.wrapper
      if (!wrapper) {
        return false
      }
      this.wrapperHeight = wrapper.offsetHeight - this.itemHeight // - header
      this.wrapperWidth = wrapper.offsetWidth
      this.itemsCount = Math.ceil(this.wrapperHeight / this.itemHeight)
      const scrollerElement = get(this.$refs, 'scroller.$el', undefined)
      if (scrollerElement) {
        setScrollPosition(scrollerElement, scrollerElement.scrollTop + 1)
      }
    },
    wrapperResizeHandler () {
      this.resetParams()
    },
    onResize (width, index) {
      if (typeof index === 'number') {
        this.activeCols[index].width = width
      }
      this.updateDynamicCSS()
    },
    scrollNormalize () {
      const scrollerElement = get(this.$refs, 'scroller.$el', undefined)
      if (!scrollerElement) { return }
      const offsetAll = scrollerElement.scrollHeight - scrollerElement.clientHeight,
        offset = scrollerElement.scrollTop
      if (offsetAll < this.allScrollTop) {
        if (this.needAutoScroll) {
          this.currentScrollTop = offset
          this.allScrollTop = offsetAll
        } else {
          const prevScrollPosition = offsetAll - (this.allScrollTop - offsetAll) - (this.allScrollTop - this.currentScrollTop)
          this.currentScrollTop = prevScrollPosition >= 0 ? prevScrollPosition : 0
          this.allScrollTop = offsetAll
          scrollerElement.scrollTop = this.currentScrollTop
        }
      } else {
        this.allScrollTop = offsetAll
      }
    },
    getScrollDirection (offset) {
      let verticalDirection = null
      if (offset > this.currentScrollTop) {
        verticalDirection = 'bottom'
      } else if (offset < this.currentScrollTop) {
        verticalDirection = 'top'
      } else {
        verticalDirection = 'none'
      }
      return verticalDirection
    },
    listScroll: function (e, data) {
      const { offset } = data
      const scrollerElement = get(this.$refs, 'scroller.$el', undefined)
      const offsetAll = scrollerElement.scrollHeight - scrollerElement.clientHeight
      this.scrollNormalize()
      if (!this.currentScrollTop) {
        this.currentScrollTop = offset
      }
      const verticalDirection = this.getScrollDirection(offset)
      let scrollOffset = this.scrollOffset ? typeof this.scrollOffset === 'number' ? this.scrollOffset : (offsetAll * this.scrollOffset.replace('%', '') / 100) : 0
      if (scrollOffset && scrollOffset < 36) { scrollOffset = 0 }
      if (this.items.length) {
        /* horizontal scroll logic start */
        const wrapper = this.$refs.wrapper
        if (wrapper) {
          wrapper.querySelector('.list__header .header__inner').style.left = (e.target.querySelector('.q-w-list').getBoundingClientRect().left - wrapper.getBoundingClientRect().left) + 'px'
        }
        /* horizontal scroll logic end */
        if (offset < this.currentScrollTop && this.needAutoScroll) {
          this.needAutoScroll = false
        } else if (!this.needAutoScroll && this.autoscrollEnabled && offset >= this.allScrollTop) {
          this.needAutoScroll = true
        }
      }
      this.$emit('scroll', { event: e, data })
      if (scrollOffset) {
        if (verticalDirection && (verticalDirection === 'top' || verticalDirection === 'none') && offset < scrollOffset) {
          this.$emit('scroll:top')
        } else if (verticalDirection && (verticalDirection === 'bottom' || verticalDirection === 'none') && offset + scrollOffset >= offsetAll) {
          this.$emit('scroll:bottom')
        }
      } else {
        if (verticalDirection && verticalDirection === 'top' && offset === 0) {
          this.$emit('scroll:top')
        } else if (verticalDirection && verticalDirection === 'bottom' && offset >= offsetAll) {
          this.$emit('scroll:bottom')
        }
      }
      this.currentScrollTop = offset
    },
    enableAutoscroll () {
      this.autoscrollEnabled = true
      this.needAutoScroll = true
    },
    disableAutoscroll () {
      this.autoscrollEnabled = false
      this.needAutoScroll = false
    },
    getDynamicCSS () {
      let result = ''
      result += this.activeCols.reduce((acc, col, index) => {
        acc += `.uid${this.uid} .item_${index} { width: ${col.width}px }`
        return acc
      }, '')
      return result
    },
    updateDynamicCSS () {
      this.dynamicCSS.type = 'text/css'
      const head = document.head || document.getElementsByTagName('head')[0]
      if (this.dynamicCSS.styleSheet) {
        this.dynamicCSS.styleSheet.cssText = this.getDynamicCSS()
      } else {
        this.dynamicCSS.innerText = this.getDynamicCSS()
      }
      head.appendChild(this.dynamicCSS)
    },
    dateRangeModalSave (dateRange) {
      this.$emit('change:date-range', dateRange)
    },
    scrollTo (index) {
      const scrollerElement = get(this.$refs, 'scroller.$el', undefined)
      if (typeof index !== 'number' || index < 0 || !scrollerElement) { return }
      let height = index * this.itemHeight
      if (index > this.items.length - this.itemsCount) { height = scrollerElement.scrollHeight }
      setScrollPosition(scrollerElement, height)
    },
    scrollToWithSavePadding (index) {
      const scrollerElement = get(this.$refs, 'scroller.$el', undefined)
      if (typeof index !== 'number' || index < 0 || !scrollerElement) { return }
      if (index > this.items.length - this.itemsCount) { index = this.items.length - this.itemsCount }
      const height = index * this.itemHeight
      setScrollPosition(scrollerElement, height + this.currentScrollTop)
    },
    updateScrollState () {
      if (!this.items.length) {
        this.currentScrollTop = 0
      } else {
        const scrollerElement = get(this.$refs, 'scroller.$el', undefined)
        if (this.needAutoScroll && scrollerElement) {
          setScrollPosition(scrollerElement, scrollerElement.scrollHeight)
        }
      }
      this.scrollNormalize()
    }
  },
  beforeUpdate () {
    const scrollerElement = get(this.$refs, 'scroller', undefined)
    scrollerElement && scrollerElement.forceRender()
  },
  updated () {
    this.updateScrollState()
  },
  watch: {
    filter (val) {
      if (this.currentFilter !== val) {
        this.currentFilter = val
      }
    },
    cols: {
      deep: true,
      handler (val, prevCols) {
        if (!(prevCols && prevCols.length) && val) {
          const fullWidth = this.$refs.wrapper.offsetWidth
          if (this.rowWidth < fullWidth) {
            this.cols[this.cols.length - 1].width = fullWidth - (this.rowWidth - 150)
          }
        }
        this.updateDynamicCSS()
        this.needResizeControl = false
        this.$nextTick(() => {
          this.needResizeControl = true
        })
      }
    },
    viewConfig: {
      deep: true,
      handler (config) {
        this.currentViewConfig = Object.assign(this.defaultConfig, config)
      }
    },
    autoscroll (flag, prev) {
      if (flag !== prev) {
        flag ? this.enableAutoscroll() : this.disableAutoscroll()
      }
    }
  },
  mounted () {
    const fullWidth = this.$refs.wrapper.offsetWidth
    if (this.rowWidth < fullWidth && this.cols && this.cols.length) {
      this.cols[this.cols.length - 1].width = fullWidth - (this.rowWidth - 150)
    }
    this.hasItemClickHandler = !!this._events['item-click']
    this.uid = uid().split('-')[0]
    this.resetParams()
    this.updateDynamicCSS()
    this.updateScrollState()
  },
  destroyed () {
    const head = document.head || document.getElementsByTagName('head')[0]
    head.removeChild(this.dynamicCSS)
  },
  directives: {
    'auto-bottom': {
      inserted: (el, { value }) => {
        if (value) {
          setScrollPosition(el, el.scrollHeight)
        }
      },
      componentUpdated: (el, { value }) => {
        if (value) {
          setScrollPosition(el, el.scrollHeight)
        }
      }
    }
  }
}
</script>

<style lang="stylus">
  .message-viewer
    .viewer__toolbar
      .on-right
        margin-left 0
    .list-wrapper
      position relative
      .list__header
        display block
        overflow hidden
        width 100%
        position relative
        .header__inner
          position absolute
          white-space: nowrap;
          .header__item
            display inline-block
            white-space nowrap
            margin 0 10px 0 5px
            position: relative
            .item__label
              text-overflow ellipsis
              overflow hidden
              display block
              line-height 19px
            .handle-mr
              box-sizing: border-box
              position: absolute
              width: 5px
              font-size: 1px
              background: $grey-3
              right: -10px
              cursor: e-resize
              top 0
              height 100%
              margin-top 0
              border none
              border-right 2px solid $grey-5
              background-color inherit
    .collapsed
      max-width 40px
    .q-w-list
      & > *
        display block
        white-space nowrap
        &:nth-child(odd)
          background-color rgba(0, 0, 0, .2)
  .cols-editor__col[draggable="true"]
    background-color $grey-5
  .action
    &:hover
      opacity 1
    opacity .8
    z-index 1
    &__to-bottom
      right 18px
      bottom 18px
    &__to-new-messages
      right calc(50% - 76px)
      bottom 18px
</style>
