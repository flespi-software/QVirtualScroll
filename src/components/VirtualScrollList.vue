<template>
  <div class="message-viewer full-height" :class="{[`uid${uid}`]: true}" @contextmenu.prevent.stop @select.prevent.stop>
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
        <slot name="filter-append" slot="append"/>
      </q-input>
      <q-toolbar-title/>
      <date-range-modal
        v-if="currentViewConfig.needShowDateRange && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
        class="on-left"
        :date="dateRange"
        :theme="currentTheme"
        @save="dateRangeModalSave"
      />
      <q-btn icon="mdi-dots-vertical" flat dense>
        <q-menu>
          <q-list dark class="bg-grey-7 q-py-sm" style="min-width: 180px">
            <q-item clickable dense v-ripple @click="colsAddition = true" class="q-px-sm" v-close-popup>
              <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
                <q-icon name="mdi-playlist-plus " />
              </q-item-section>
              <q-item-section>Add column</q-item-section>
            </q-item>
            <q-item clickable v-ripple dense class="q-px-sm" v-close-popup @click="toDefaultCols" v-if="toDefaultCols">
              <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
                <q-icon name="mdi-playlist-star" />
              </q-item-section>
              <q-item-section>{{(i18n && i18n['Default columns']) || 'Default columns'}}</q-item-section>
            </q-item>
            <q-item clickable v-ripple dense class="q-px-sm" v-close-popup @click="toProtocolSchemaCols">
              <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
                <q-icon name="mdi-playlist-check" />
              </q-item-section>
              <q-item-section>{{(i18n && i18n['Columns by schema']) || 'Columns by schema'}}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-toolbar>
    <div ref="wrapper" class="list-wrapper" :class="{'bg-grey-9': currentTheme.contentInverted}" :style="{height: needShowToolbar ? 'calc(100% - 50px)' : '100%'}">
      <q-resize-observer @resize="wrapperResizeHandler"/>
      <q-btn
        v-if="currentScrollTop < allScrollTop && items.length"
        fab-mini flat icon="mdi-chevron-down"
        @click="$emit('action-to-bottom')"
        class="absolute-bottom-right action action__to-bottom" style="z-index: 2"
        :class="{ 'bg-white': currentTheme.contentInverted, 'text-grey-9': currentTheme.contentInverted }"
        :style="{right: colsAddition ? '270px' : ''}"
      >
        <q-tooltip>To bottom</q-tooltip>
      </q-btn>
      <q-chip
        v-if="hasNewMessages"
        removable clickable
        @remove="$emit('action-to-new-messages-hide')"
        @click="$emit('action-to-new-messages')"
        icon="mdi-bell-outline"
        class="absolute-bottom-right action action__to-new-messages"
        color="amber-8"
        text-color="grey-2" style="z-index: 2"
      >
        new messages
      </q-chip>
      <slot name="empty" v-if="!items.length && !loading">
        <div class="no-messages text-center" :class="{'text-grey-6': currentTheme.contentInverted}" style="font-size: 3rem; padding-top: 40px;">
          {{(i18n && i18n['Messages not found']) || 'Messages not found'}}
        </div>
      </slot>
      <div v-else-if="!items.length && loading && itemsCount > 0"
        :style="{height: `${wrapperHeight + headerHeight - 0.5}px`, overflow: 'auto'}"
        :class="{'bg-grey-9': currentTheme.contentInverted, 'text-white': currentTheme.contentInverted}"
        class="absolute-top-left absolute-bottom-right"
      >
        <div class="list__header" :class="[`text-${currentTheme.color}`, `bg-${currentTheme.header}`]"
          v-if="(items.length || loading) && currentTheme.headerShow" :style="{height: `${headerHeight}px`, width: colsAddition ? 'calc(100% - 250px)' : '100%'}" ref="header"
        >
          <div class="header__inner" :style="{ width: `${rowWidth}px` }">
            <template v-for="(prop, index) in cols">
              <div class="header__item" :key="prop.name" v-if="prop.display" :class="{[`item_${activeColsIndexes[index]}`]: true}">
                <span class="item__label">
                  {{prop.title || prop.name}}
                  <span v-if="prop.addition">({{prop.addition}})</span>
                  <span v-if="prop.unit" style="font-size: .8rem" class="text-grey-4">, {{prop.unit}}</span>
                </span>
              </div>
            </template>
          </div>
        </div>
        <table-skeleton v-for="(i, key) in new Array(itemsCount - 1).fill('')" :key="key" :rows="rowWidths"/>
      </div>
      <div v-else class="full-height">
        <q-menu
          ref="menu" v-if="items.length && !loading"
          context-menu touch-position
          @before-show="menuShow"
          @before-hide="menuHide"
        >
          <slot name="context-menu" :col="editableCol" :row="editableRow">
            <cols-menu
              :col="editableCol"
              :row="editableRow"
              @add="colsAddition = true, addingRow = editableRow"
              @remove="toggleCol"
              @action="(type) => clickHandler({ index: this.editableRow.index, type, content: this.editableRow.data })"
            />
          </slot>
        </q-menu>
        <div class="list__header" :class="[`text-${currentTheme.color}`, `bg-${currentTheme.header}`]"
          v-if="(items.length || loading) && currentTheme.headerShow" :style="{height: '100%', width: colsAddition ? 'calc(100% - 250px)' : '100%'}" ref="header"
        >
          <div class="header__inner" :style="{width: `${rowWidth}px` }">
            <draggable :list="cols" ghostClass="ghost" tag="span" @end="$emit('update-cols', cols)" :move="moveDragHandler">
              <transition-group type="transition" name="flip-list">
                <template v-for="(prop, index) in cols">
                  <div class="header__item" :key="prop.name" v-if="prop.display"
                    :class="{[`item_${activeColsIndexes[index]}`]: true}" style="cursor: move"
                  >
                    <q-tooltip v-if="prop.description || prop.title">{{`${prop.name}: ${prop.description ? prop.description :
                      ''}`}}
                    </q-tooltip>
                    <span class="item__label">{{prop.title || prop.name}}<span v-if="prop.addition">({{prop.addition}})</span><span v-if="prop.unit" style="font-size: .8rem" class="text-grey-4">, {{prop.unit}}</span></span>
                    <vue-draggable-resizable
                      :ref="`drag${activeColsIndexes[index]}`"
                      class="absolute-top-left"
                      v-if="$q.platform.is.desktop && needResizeControl"
                      :active="true" :draggable="false" :handles="['mr']" :w="prop.width" :preventDeactivation="true"
                      :h="(itemHeight * itemsCount) + headerHeight" :minw="50" :z='1'
                      @resizing="() => { resizing = true }"
                      @resizestop="(left, top, width) => {onResize(width, activeColsIndexes[index]), $emit('update-cols', cols), resizing = false}"
                    />
                  </div>
                </template>
              </transition-group>
            </draggable>
          </div>
        </div>
        <virtual-list
          ref="scroller"
          :style="{height: `${wrapperHeight - 0.5}px`, overflow: 'auto', top: `${headerHeight}px`, zIndex: resizing ? '' : 1, right: colsAddition ? '250px' : ''}"
          class="list__content absolute-top-left absolute-bottom-right"
          :class="{'bg-grey-9': currentTheme.contentInverted, 'text-white': currentTheme.contentInverted, 'cursor-pointer': hasItemClickHandler}"
          wclass="q-w-list"
          v-auto-bottom="needAutoScroll"
          :onscroll="listScroll"
          :size="itemHeight"
          :remain="itemsCount"
          :item="item"
          :itemcount="items.length"
          :itemprops="getItemProps"
        />
        <cols-additing
          v-if="colsAddition"
          style="width: 250px"
          class="absolute-bottom-right absolute-top-right"
          :cols="additionCols"
          @add="addCustomColumnHandler"
          @done="colsAddition = false, addingRow = undefined"
        />
      </div>
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
import ColsMenu from './ColsMenu'
import ColsAdditing from './ColsAdditing'
import draggable from 'vuedraggable'
import get from 'lodash/get'
import debounce from 'lodash/debounce'

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
    itemHeight: {
      type: Number,
      default: 19
    },
    theme: Object,
    viewConfig: Object,
    loading: Boolean,
    scrollOffset: [Number, String],
    hasNewMessages: [Object, Boolean],
    toDefaultCols: Function
  },
  components: { draggable, VirtualList, VueDraggableResizable, TableSkeleton, DateRangeModal, ColsMenu, ColsAdditing },
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
      headerHeight: this.itemHeight + 5,
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
      allScrollTop: 0,
      resizing: false,
      editableCol: null,
      addingRow: undefined,
      editableRow: null,
      colsAddition: false,
      menuModel: false
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
    currentTheme () {
      const theme = Object.assign(this.defaultTheme, this.theme)
      theme.header = `${theme.bgColor.split('-')[0]}-8`
      return theme
    },
    rowWidth () {
      let res = 0
      res += this.rowWidths.reduce((acc, width) => acc + width, 0)
      return res
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
    },
    additionCols () {
      let cols = this.cols.reduce((res, col) => {
        if (col.display) {
          res.existed[col.name] = true
        } else {
          res.notExisted[col.name] = true
        }
        return res
      }, { existed: {}, notExisted: {} })
      if (this.addingRow) {
        const params = Object.keys(this.addingRow.data)
        params.forEach((param) => {
          if (!cols.existed[param] && !cols.notExisted[param] && param.indexOf('x-flespi') === -1) {
            cols.notExisted[param] = true
          }
        })
      }
      cols = Object.keys(cols.notExisted)
      return cols
    }
  },
  methods: {
    getItemProps (index) {
      const active = this.editableRow && this.editableCol ? { col: this.editableCol.index, row: this.editableRow.index } : null
      const props = {
        key: index,
        props: {
          item: this.items[index],
          index: index,
          actions: this.actions,
          cols: this.activeCols,
          itemHeight: this.itemHeight,
          rowWidth: this.rowWidth,
          menuCellActive: active
        },
        attrs: {
          'data-index': index
        }
      }
      this.itemprops(index, props)
      return props
    },
    searchSubmitHandler () {
      this.$emit('change-filter', this.currentFilter)
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
      this.wrapperHeight = wrapper.offsetHeight - this.headerHeight // - header
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
          this.$emit('scroll-top')
        } else if (verticalDirection && (verticalDirection === 'bottom' || verticalDirection === 'none') && offset + scrollOffset >= offsetAll) {
          this.$emit('scroll-bottom')
        }
      } else {
        if (verticalDirection && verticalDirection === 'top' && offset === 0) {
          this.$emit('scroll-top')
        } else if (verticalDirection && verticalDirection === 'bottom' && offset >= offsetAll) {
          this.$emit('scroll-bottom')
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
      this.$emit('change-date-range', dateRange)
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
    },
    menuShow (evt) {
      const el = evt.target.closest('[class*="item_"]')
      const colIndex = el ? el.className.replace(/.*item_(\d+).*/, '$1') : ''
      this.editableCol = colIndex ? {
        index: Number(colIndex),
        data: this.activeCols[colIndex]
      } : null
      const rowEl = el ? el.closest('[data-index]') : null
      if (rowEl) {
        const rowIndex = Number(rowEl.getAttribute('data-index'))
        const rowData = this.getItemProps(rowIndex)
        const rowContent = Object.keys(rowData.props.item).reduce((result, key) => {
          if (key.indexOf('x-flespi') === 0) {
            return result
          }
          result[key] = rowData.props.item[key]
          return result
        }, {})
        this.editableRow = {
          index: rowIndex,
          data: rowContent,
          actions: rowData.props.actions,
          dataHandler: rowData.dataHandler
        }
      }
    },
    menuHide (evt) {
      this.editableCol = null
      this.editableRow = null
    },
    addCustomColumnHandler (colName) {
      let existingIndex = -1
      const existingCol = this.cols.filter((existingCol, index) => {
        const flag = existingCol.name === colName
        if (flag) { existingIndex = index }
        return flag
      })
      let scrollWidth = 0
      const lastCol = this.cols[this.cols.length - 1]
      if (existingCol.length) {
        existingCol[0].display = true
        for (let i = 0; i < this.cols.length; i++) {
          if (i === existingIndex) { break }
          const col = this.cols[i]
          if (col.display) { scrollWidth += this.cols[i].width }
        }
      } else if (lastCol.__dest === 'etc') {
        this.cols.splice(this.cols.length - 1, 0, { name: colName, width: 150, display: true, custom: true })
        scrollWidth = this.$refs.scroller.$el.scrollWidth - (lastCol.display ? lastCol.width : 0)
      } else {
        this.cols.push({ name: colName, width: 150, display: true, custom: true })
        scrollWidth = this.$refs.scroller.$el.scrollWidth
      }
      if (scrollWidth) {
        this.$nextTick(() => { this.$refs.scroller.$el.scrollLeft = scrollWidth - (this.wrapperWidth / 2) })
      }
      this.updateCols()
    },
    removeCol () {
      this.cols.splice(this.editableCol.index, 1)
      this.updateCols()
    },
    toggleCol () {
      const col = this.activeCols[this.editableCol.index]
      if (col.custom) {
        this.removeCol()
      } else {
        this.$set(this.activeCols[this.editableCol.index], 'display', !this.activeCols[this.editableCol.index].display)
        this.updateCols()
      }
    },
    toProtocolSchemaCols () {
      this.cols.forEach((col, index, cols) => {
        if (col.custom) {
          cols.splice(index, 1)
        } else if (!col.display) {
          this.$set(col, 'display', true)
        }
      })
      this.updateCols()
    },
    updateCols () {
      this.$emit('update-cols', this.cols)
    },
    moveDragHandler: debounce(function (evt, oevt) {
      const wrapperWidth = this.wrapperWidth
      const el = this.$refs.scroller.$el
      const { left, right } = evt.relatedRect
      const borderValue = 50
      let changeWidthPerTick = 0
      if (right - wrapperWidth + borderValue > 0) {
        changeWidthPerTick = (wrapperWidth / 2) / 20
      } else if (el.scrollLeft - left < borderValue) {
        changeWidthPerTick = -((wrapperWidth / 2) / 20)
      }
      if (changeWidthPerTick) {
        let counter = 0
        this.scrollHorizontalInterval = setInterval(() => {
          el.scrollLeft += changeWidthPerTick
          counter++
          if (counter === 10) { clearInterval(this.scrollHorizontalInterval) }
        }, 10)
      }
    }, 300)
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
  body.mobile
    -webkit-touch-callout none
    -webkit-user-select none
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
            position: relative
            border-right 2px solid $grey-6
            .item__label
              text-overflow ellipsis
              overflow hidden
              display block
              padding-left 5px
              line-height 24px
            .handle-mr
              position: absolute
              width: 5px
              font-size: 1px
              background: $grey-3
              right: 0px
              cursor: e-resize
              top 0
              height 100%
              margin-top 0
              border none
              border-right 2px solid $grey-6
              background-color inherit
            .resizing .handle-mr
              border-right 2px solid $yellow-6
              z-index 2
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
  .flip-list-move
    transition transform 0.5s
  .ghost
    opacity 0.5
    color $grey-7
    background $grey-3
</style>
