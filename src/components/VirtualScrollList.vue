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
      <q-btn :color="currentTheme.color" flat dense class="on-left" @click="$emit('edit:cols')" icon="tune"
        v-if="colsConfigurator === 'toolbar' && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
      />
      <div v-if="!currentMode && currentViewConfig.needShowDateRange && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)" class="on-left q-v-date-range-picker" style="min-width: 180px">
        <q-btn :color="currentTheme.color" flat dense
          @click="$emit('change:date-range-prev')"
          icon="keyboard_arrow_left"
        />
        <q-btn @click="dateRangeToggle" flat :color="currentTheme.color" style="min-width: 124px; font-size: .8rem; line-height: .8rem;" class="q-pa-none">
          <div>
            <div>{{formatDate(dateRange[0])}}</div>
            <div style="font-size: .5rem">|</div>
            <div>{{formatDate(dateRange[1])}}</div>
          </div>
        </q-btn>
        <q-btn :color="currentTheme.color" flat dense
          @click="$emit('change:date-range-next')"
          icon="keyboard_arrow_right"
        />
        <q-dialog ref="dateRangePickerModal" content-class="modal-date-range">
          <q-card>
            <q-card-section class="scroll q-pa-none" :class="{[`bg-${currentTheme.bgColor}`]: true, 'text-white': !!currentTheme.bgColor}">
              <div class="flex flex-center">
                <date-range-picker
                  class="q-ma-sm"
                  v-model="currentDateRange"
                  :mode="currentDateRangeMode"
                  @change:mode="changeModeDateTimeRangeHandler"
                  :theme="currentTheme"
                />
              </div>
            </q-card-section>
            <q-card-actions align="right" :class="{[`bg-${currentTheme.bgColor}`]: true, 'text-white': !!currentTheme.bgColor}">
              <q-btn flat :color="currentTheme.color" @click="dateRangeModalClose">close</q-btn>
              <q-btn flat :color="currentTheme.color" @click="dateRangeModalSave">save</q-btn>
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
      <q-btn
        :icon="currentMode ? 'playlist_play' : 'history'" flat dense
        v-if="currentViewConfig.needShowMode && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
        @click="currentMode = !currentMode, $emit('change:mode', Number(currentMode))"
        :color="currentTheme.color"
      />
    </q-toolbar>
    <div ref="wrapper" class="list-wrapper" :class="{'bg-grey-9': currentTheme.contentInverted}"
      :style="{height: needShowToolbar ? 'calc(100% - 50px)' : '100%'}"
    >
      <q-resize-observer @resize="wrapperResizeHandler"/>
      <div class="list__header" :class="[`text-${currentTheme.color}`, `bg-${currentTheme.bgColor}`]"
        v-if="(items.length || loading) && currentTheme.headerShow" :style="{height: `${itemHeight}px`}" ref="header"
        @dblclick="colsConfigurator === 'header' ? $emit('edit:cols') : ''"
      >
        <div class="header__inner" :style="{width: `${rowWidth}px` }">
          <draggable :list="cols" element="span" @end="$emit('update:cols', cols)">
            <template v-for="(prop, index) in cols">
              <div class="header__item" :key="prop.name" v-if="prop.display"
                  :class="{[`item_${activeColsIndexes[index]}`]: true}" style="cursor: move">
                <q-tooltip v-if="prop.description || prop.title">{{`${prop.name}: ${prop.description ? prop.description :
                  ''}`}}
                </q-tooltip>
                <span class="item__label">{{prop.title || prop.name}}<span v-if="prop.addition">({{prop.addition}})</span></span>
                <vue-draggable-resizable :ref="`drag${activeColsIndexes[index]}`"
                  v-if="$q.platform.is.desktop && isNeedResizer"
                  :active="true" :draggable="false" :handles="['mr']" :w="prop.width" :preventDeactivation="true"
                  :h="itemHeight * (itemsCount + 1)" :minw="50" :z='1'
                  @resizestop="(left, top, width) => {onResize(width, activeColsIndexes[index]), $emit('update:cols', cols)}"
                />
              </div>
            </template>
          </draggable>
        </div>
      </div>
      <slot name="empty" v-if="!items.length && !loading">
        <div class="no-messages text-center" :class="{'text-grey-6': currentTheme.contentInverted}" style="font-size: 3rem; padding-top: 40px;">
          {{i18n['Messages not found'] || 'Messages not found'}}
        </div>
      </slot>
      <VirtualList
        v-else
        v-auto-bottom="needAutoScroll"
        :onscroll="listScroll"
        ref="scroller"
        :style="{position: 'relative', height: `${wrapperHeight - 1}px`, overflow: loading ? 'hidden' : 'auto', paddingBottom: wrapperOverflowing ? '15px' : ''}"
        :class="{'bg-grey-9': currentTheme.contentInverted, 'text-white': currentTheme.contentInverted, 'cursor-pointer': hasItemClickHandler}"
        :size="itemHeight"
        :remain="itemsCount"
        :debounce="10"
        wclass="q-w-list"
      >
        <template v-if="!items.length && loading">
          <table-skeleton v-for="(i, key) in new Array(itemsCount + 2).fill('')" :key="key" :rows="rowWidths"/>
        </template>
        <template v-else>
          <table-skeleton :rows="rowWidths" v-if="loading"/>
          <slot name="items"
            v-for="(item, index) in items"
            :item="item"
            :index="index"
            :actions="actions"
            :cols="activeCols"
            :itemHeight="itemHeight"
            :rowWidth="rowWidth"
          >
            <list-item
              :key="index"
              :item="item"
              :index="index"
              :actions="actions"
              :cols="activeCols"
              :itemHeight="itemHeight"
              :rowWidth="rowWidth"
              @action="clickHandler"
              @item-click="itemClickHandler"
            />
          </slot>
          <table-skeleton :rows="rowWidths" v-if="loading"/>
        </template>
      </VirtualList>
    </div>
  </div>
</template>

<script>
import VirtualList from 'vue-virtual-scroll-list'
import { uid, date, debounce } from 'quasar'
import VueDraggableResizable from 'vue-draggable-resizable'
import ListItem from './ListItem.vue'
import TableSkeleton from './TableSkeleton'
import draggable from 'vuedraggable'
import DateRangePicker from 'datetimerangepicker'
import PerfectScrollbar from 'perfect-scrollbar'
import get from 'lodash/get'
import 'perfect-scrollbar/css/perfect-scrollbar.css'

export default {
  name: 'VirtualScrollList',
  props: {
    items: {
      type: Array,
      required: true
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
    date: {
      type: Number
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
    mode: {
      type: Number,
      default: 0
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
    loading: Boolean
  },
  components: { draggable, VirtualList, VueDraggableResizable, ListItem, DateRangePicker, TableSkeleton },
  data () {
    let defaultConfig = {
      needShowFilter: false,
      needShowMode: false,
      needShowPageScroll: '',
      needShowDateRange: false
    }
    return {
      uid: 0,
      currentFilter: this.filter,
      currentMode: !!this.mode,
      dateValue: this.date,
      wrapperHeight: 0,
      wrapperWidth: 0,
      itemsCount: 0,
      defaultItemWidth: 150,
      dynamicCSS: document.createElement('style'),
      showSearch: false,
      needAutoScroll: !!this.mode,
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
      isNeedResizer: true,
      allScrollTop: 0,
      currentDateRange: this.dateRange,
      currentDateRangeMode: 0,
      ps: null
    }
  },
  computed: {
    needShowToolbar () {
      return this.currentViewConfig.needShowMode || this.currentViewConfig.needShowFilter || this.currentViewConfig.needShowDate || this.currentViewConfig.needShowPageScroll
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
      return Object.assign(this.defaultTheme, this.theme)
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
      let widths = []
      this.activeCols.forEach((col) => {
        widths.push(col.width)
      })
      return widths
    }
  },
  methods: {
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
      this.$emit(`action`, { index, type, content })
    },
    itemClickHandler ({ index, content }) {
      this.$emit(`item-click`, { index, content })
    },
    resetParams () {
      if (!this.$refs.wrapper) {
        return false
      }
      this.wrapperHeight = this.$refs.wrapper.offsetHeight - this.itemHeight // - header
      this.wrapperWidth = this.$refs.wrapper.offsetWidth
      this.itemsCount = Math.ceil(this.wrapperHeight / this.itemHeight)
      if (this.$refs.scroller) {
        let element = this.$refs.scroller.$el
        element.scrollTop += 1
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
    listScroll: function (e, data) {
      if (!this.currentScrollTop) {
        this.currentScrollTop = data.offset
      }
      if (this.$refs.scroller) {
        let el = this.$refs.scroller.$el || this.$refs.scroller
        this.allScrollTop = el.scrollHeight - el.clientHeight
      }
      let verticalDirection = null
      if (data.offset > this.currentScrollTop) {
        verticalDirection = 'bottom'
      } else if (data.offset < this.currentScrollTop) {
        verticalDirection = 'top'
      }
      if (this.items.length) {
        /* horizontal scroll logic start */
        if (this.$refs.wrapper) {
          this.$refs.wrapper.querySelector('.list__header .header__inner').style.left = (e.target.querySelector('.q-w-list').getBoundingClientRect().left - this.$refs.wrapper.getBoundingClientRect().left) + 'px'
        }
        /* horizontal scroll logic end */
        if (data.offset < this.currentScrollTop && this.needAutoScroll) {
          this.needAutoScroll = false
        } else if (!this.needAutoScroll && this.mode === 1 && data.offset >= this.allScrollTop) {
          this.needAutoScroll = true
        }
        this.currentScrollTop = data.offset
      }
      this.$emit('scroll', { event: e, data })
      if (verticalDirection && verticalDirection === 'top' && data.offset === 0) {
        this.$emit('scroll:top')
      } else if (verticalDirection && verticalDirection === 'bottom' && data.offset >= data.offsetAll) {
        this.$emit('scroll:bottom')
      }
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
      let head = document.head || document.getElementsByTagName('head')[0]
      if (this.dynamicCSS.styleSheet) {
        this.dynamicCSS.styleSheet.cssText = this.getDynamicCSS()
      } else {
        this.dynamicCSS.innerText = this.getDynamicCSS()
      }
      head.appendChild(this.dynamicCSS)
    },
    formatDate (timestamp) {
      return date.formatDate(timestamp, 'DD/MM/YYYY HH:mm:ss')
    },
    changeModeDateTimeRangeHandler (mode) {
      this.currentDateRangeMode = mode
    },
    dateRangeToggle () {
      this.$refs.dateRangePickerModal.toggle()
    },
    dateRangeModalSave () {
      this.$emit('change:date-range', this.currentDateRange)
      this.$refs.dateRangePickerModal.hide()
    },
    dateRangeModalClose () {
      this.currentDateRange = this.dateRange
      this.$refs.dateRangePickerModal.hide()
    },
    scrollInit () {
      if (this.items.length) {
        let el = get(this.$refs, 'scroller.$el', undefined)
        if (this.ps) {
          this.ps.update()
        } else {
          this.ps = new PerfectScrollbar(el, { scrollXMarginOffset: 15, scrollYMarginOffset: 15, minScrollbarLength: 20 })
        }
      } else {
        if (this.ps) {
          this.ps.destroy()
          this.ps = null
        }
      }
    },
    scrollTo (index) {
      if (typeof index !== 'number' || index < 0 || !this.$refs.scroller) { return }
      let height = index * this.itemHeight
      this.$refs.scroller.$el.scrollTop = height
    }
  },
  updated () {
    if (!this.items.length) { this.currentScrollTop = 0 } else {
      if (this.needAutoScroll && this.$refs.scroller) { this.$refs.scroller.$el.scrollTop = this.$refs.scroller.$el.scrollHeight }
    }
    this.scrollInit()
  },
  watch: {
    date (val) {
      if (val === this.dateValue.valueOf()) { return false }
      this.dateValue = new Date(val)
    },
    dateRange (dateRange) {
      this.currentDateRange = dateRange
    },
    mode (val) {
      this.currentMode = !!val
      this.needAutoScroll = !!val
    },
    filter (val) {
      if (this.currentFilter !== val) {
        this.currentFilter = val
      }
    },
    cols: {
      deep: true,
      handler (val, prevCols) {
        if (!(prevCols && prevCols.length) && val) {
          let fullWidth = this.$refs.wrapper.offsetWidth
          if (this.rowWidth < fullWidth) {
            this.cols[this.cols.length - 1].width = fullWidth - (this.rowWidth - 150)
          }
        }
        this.updateDynamicCSS()
        this.isNeedResizer = false
        this.$nextTick(() => {
          this.isNeedResizer = true
        })
      }
    },
    viewConfig: {
      deep: true,
      handler (config) {
        this.currentViewConfig = Object.assign(this.defaultConfig, config)
      }
    }
  },
  mounted () {
    let fullWidth = this.$refs.wrapper.offsetWidth
    if (this.rowWidth < fullWidth && this.cols && this.cols.length) {
      this.cols[this.cols.length - 1].width = fullWidth - (this.rowWidth - 150)
    }
    this.hasItemClickHandler = !!this._events['item-click']
    this.uid = uid().split('-')[0]
    this.resetParams()
    this.updateDynamicCSS()
    this.scrollInit()
  },
  destroyed () {
    let head = document.head || document.getElementsByTagName('head')[0]
    head.removeChild(this.dynamicCSS)
  },
  directives: {
    'auto-bottom': {
      inserted: debounce((el, { value }) => {
        if (value) {
          el.scrollTop = el.scrollHeight
        }
      }, 100),
      componentUpdated: (el, { value }) => {
        if (value) {
          el.scrollTop = el.scrollHeight
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
              background: #EEE
              right: -10px
              cursor: e-resize
              top 0
              height 100%
              margin-top 0
              border none
              border-right 2px solid #616161
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
    background-color #9e9e9e
  .date
    .arrows
      position relative
  .q-v-date-range-picker
    .q-btn__wrapper
      padding-left 0
      padding-right 0
  .modal-date-range
    .q-dialog__inner--minimized
      padding 6px
</style>
