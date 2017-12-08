<template>
  <div class="message-viewer" :class="{[`uid${uid}`]: true}">
    <q-toolbar class="viewer__toolbar" :color="currentTheme.bgColor" v-if="needShowToolbar">
      <span v-if="title && $q.platform.is.desktop" style="margin-right: 10px">{{title}}</span>
      <q-icon :color="currentTheme.color" name="search" @click="showSearch = true" v-if="$q.platform.is.mobile && currentViewConfig.needShowFilter && !showSearch" :style="{fontSize: '24px', marginBottom: currentTheme.controlsInverted ? '' : '8px', paddingLeft: currentTheme.controlsInverted ? '8px' : ''}"></q-icon>
      <q-search
              :class="{'full-width': $q.platform.is.mobile && showSearch, collapsed: $q.platform.is.mobile && !showSearch}"
              @focus="showSearch = true"
              :autofocus="$q.platform.is.mobile"
              @blur="searchBlurHandler"
              v-if="currentViewConfig.needShowFilter && ((showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
              @keyup.enter="searchSubmitHandler"
              type="text" v-model="currentFilter"
              :inverted="currentTheme.controlsInverted"
              :color="currentTheme.controlsInverted ? 'none' : currentTheme.color"
              placeholder="param1=n*,param2,param3>=5"
              :before="[{icon: 'search', handler: openSearch}]"
      />
      <q-btn :color="currentTheme.color" flat class="on-left" v-if="colsConfigurator === 'toolbar'" @click="colsModalOpenHandler"><q-icon name="tune"></q-icon></q-btn>
      <div class="pagination on-left" v-if="!currentMode && currentViewConfig.needShowPageScroll && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)">
        <q-icon :color="currentTheme.color" class="cursor-pointer on-right" v-if="currentViewConfig.needShowPageScroll.indexOf('left') !== -1" @click="$emit('change:pagination-prev')" size="1.5rem" name="arrow_back">
          <q-tooltip>{{i18n.from}}</q-tooltip>
        </q-icon>
        <q-icon :color="currentTheme.color" class="cursor-pointer on-right" v-if="currentViewConfig.needShowPageScroll.indexOf('right') !== -1" @click="$emit('change:pagination-next')" size="1.5rem" name="arrow_forward">
          <q-tooltip>{{i18n.to}}</q-tooltip>
        </q-icon>
      </div>
      <div class="on-left date" v-if="!currentMode && currentViewConfig.needShowDate && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)">
        <q-icon :color="currentTheme.color" v-if="$q.platform.is.desktop" @click="$emit('change:date-prev')" class="cursor-pointer" size="1.5rem" name="keyboard_arrow_left"/>
        <q-datetime
           format="DD-MM-YYYY"
           class="no-margin no-padding"
           @change="$emit('change:date', currentDate)"
           style="display: inline-flex;"
           v-model="currentDate"
           :inverted="currentTheme.controlsInverted"
           :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"
        />
        <q-tooltip v-if="$q.platform.is.desktop">{{formatedDate}}</q-tooltip>
        <q-icon :color="currentTheme.color" v-if="$q.platform.is.desktop" @click="$emit('change:date-next')" class="cursor-pointer" size="1.5rem" name="keyboard_arrow_right"/>
      </div>
      <q-checkbox v-if="currentViewConfig.needShowMode && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)" class="no-margin" @change="$emit('change:mode', Number(currentMode))" :color="currentTheme.color" v-model="currentMode" checked-icon="playlist_play" unchecked-icon="history" />
    </q-toolbar>
    <q-modal ref="colsModal" :content-css="{minWidth: '50vw', minHeight: '50vh', maxWidth: '500px'}" class="modal-cols-configurator">
      <q-modal-layout>
        <q-toolbar :color="currentTheme.bgColor" slot="header">
          <div class="q-toolbar-title" :class="[`text-${currentTheme.color}`]">
            Configure cols
          </div>
        </q-toolbar>
        <div class="layout-padding" :class="[`bg-${currentTheme.bgColor}`]">
          <q-field v-if="actions && actions.length" :label="actionField.name" :labelWidth="3" :dark="currentTheme.bgColor === 'dark'">
            <div class="row">
              <q-slider class="col-12 col-sm-10" :min="50" :max="800"
                        :value="actionField.width"
                        @input="(val) => { onResize(val,'actions') }" label
                        :label-value="`${actionField.width}px`"
                        :inverted="currentTheme.controlsInverted"
                        :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"
              />
              <q-checkbox class="col-12 col-sm-1" v-model="actionField.display" checked-icon="mdi-eye" unchecked-icon="mdi-eye-off" :inverted="currentTheme.controlsInverted" :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"/>
            </div>
          </q-field>
          <q-field v-for="(col, index) in currentCols" :key="index" :label="col.name" :labelWidth="3" :dark="currentTheme.bgColor === 'dark'">
            <div class="row">
              <q-slider class="col-12 col-sm-10" :min="50" :max="800" v-model="col.width" label :label-value="`${col.width}px`" :inverted="currentTheme.controlsInverted" :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"/>
              <q-checkbox class="col-12 col-sm-1" v-model="col.display" checked-icon="mdi-eye" unchecked-icon="mdi-eye-off" :inverted="currentTheme.controlsInverted" :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"/>
              <q-btn flat class="col-12 col-sm-1" v-if="col.custom" @click="customFieldRemove(index)" :inverted="currentTheme.controlsInverted" :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color">
                <q-icon name="remove"></q-icon>
              </q-btn>
            </div>
          </q-field>
          <q-field :label="etcField.name" :labelWidth="3" :dark="currentTheme.bgColor === 'dark'">
            <div class="row">
              <q-slider class="col-12 col-sm-10" :min="50" :max="800" :value="etcField.width" @input="(val) => { onResize(val,'etc')}" label
                        :label-value="`${etcField.width}px`"
                        :inverted="currentTheme.controlsInverted"
                        :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"
              />
              <q-checkbox class="col-12 col-sm-1" v-model="etcField.display" checked-icon="mdi-eye" unchecked-icon="mdi-eye-off" :inverted="currentTheme.controlsInverted" :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"/>
            </div>
          </q-field>
          <q-field label="add custom field" style="border-top: 1px solid #333; padding-top: 10px" :labelWidth="3" :dark="currentTheme.bgColor === 'dark'">
            <div class="row">
              <q-input class="col-12 col-sm-4" :placeholder="customField.error ? customField.errMessages : 'name'" type="text" v-model="customField.name" :error="customField.error"
                       :inverted="currentTheme.controlsInverted"
                       :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"
              />
              <q-slider class="col-12 col-sm-6" :min="50" :max="800" v-model="customField.width" label :label-value="`${customField.width}px`" :inverted="currentTheme.controlsInverted" :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"/>
              <q-checkbox class="col-12 col-sm-1" v-model="customField.display" checked-icon="mdi-eye" unchecked-icon="mdi-eye-off" :inverted="currentTheme.controlsInverted" :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"/>
              <q-btn flat class="col-12 col-sm-1" @click="customFieldSave" :inverted="currentTheme.controlsInverted" :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"><q-icon name="add"/></q-btn>
            </div>
          </q-field>
        </div>
        <q-toolbar :color="currentTheme.bgColor" slot="footer" style="justify-content: flex-end;">
          <q-btn flat class="pull-right" :color="currentTheme.color" flat @click="colsModalSave">
            save
          </q-btn>
          <q-btn flat class="pull-right" :color="currentTheme.color" flat @click="colsModalClose">
            close
          </q-btn>
        </q-toolbar>
      </q-modal-layout>
    </q-modal>
    <div ref="wrapper" class="list-wrapper" :class="{'bg-dark': currentTheme.contentInverted}" :style="{top: needShowToolbar ? '50px' : '0',  bottom: 0, right: 0, left: 0}">
      <q-window-resize-observable @resize="wrapperResizeHandler" />
      <div class="list__header" :class="[`text-${currentTheme.color}`, `bg-${currentTheme.bgColor}`]" v-if="items.length" :style="{height: `${itemHeight}px`}" ref="header" @dblclick="colsConfigurator === 'header' ? $refs.colsModal.open() : ''">
        <div class="header__inner" :style="{width: `${rowWidth}px` }">
          <div class="header__item item_actions" v-if="actionField.display">
            <q-tooltip>Actions</q-tooltip>
            <span class="item__label">{{actionField.name}}</span>
            <vue-draggable-resizable :active="true" :draggable="false" :handles="['mr']" :w="actionField.width" :h="itemHeight" :minw="50" @resizestop="(left, top, width) => {onResize(width, 'actions')}"/>
          </div>
          <div class="header__item" v-for="(prop, index) in activeCols" :key="index" :class="{[`item_${index}`]: true}">
            <q-tooltip v-if="prop.description || prop.title">{{`${prop.name}: ${prop.description ? prop.description : ''}`}}</q-tooltip>
            <span class="item__label">{{prop.title || prop.name}}</span>
            <vue-draggable-resizable :active="true" :draggable="false" :handles="['mr']" :w="prop.width" :h="itemHeight" :minw="50" @resizestop="(left, top, width) => {onResize(width, index)}"/>
          </div>
          <div v-if="etcField.display" class="header__item item_etc">
            <q-tooltip>Another info by message</q-tooltip>
            <span class="item__label">{{etcField.name}}</span>
            <vue-draggable-resizable :active="true" :draggable="false" :handles="['mr']" :w="etcField.width" :h="itemHeight" :minw="50" @resizestop="(left, top, width) => {onResize(width, 'etc')}"/>
          </div>
        </div>
      </div>
      <div class="no-messages text-center" :class="{'text-grey-6': currentTheme.contentInverted}" style="font-size: 3rem; padding-top: 40px; " v-if="!items.length">{{i18n['Messages not found'] || 'Messages not found'}}</div>
      <VirtualList
              :onscroll="listScroll"
              v-if="items.length"
              ref="scroller"
              :style="{position: 'absolute', top: `${itemHeight}px`, bottom: 0, right: 0, left: 0, height: 'auto'}"
              :class="{'bg-dark': currentTheme.contentInverted, 'text-white': currentTheme.contentInverted, 'cursor-pointer': hasItemClickHandler}"
              :size="itemHeight"
              :remain="itemsCount"
              :start="scrollerStart"
              :tobottom="enableAutoscroll"
              wclass="q-w-list">
        <slot name="items"
          v-for="(item, index) in items"
          :item="item"
          :index="index"
          :actions="actions"
          :cols="activeCols"
          :etcVisible="etcField.display"
          :actionsVisible="actionField.display"
          :itemHeight="itemHeight"
          :rowWidth="rowWidth"
        >
          <list-item
            :key="index"
            :item="item"
            :index="index"
            :actions="actions"
            :cols="activeCols"
            :etcVisible="etcField.display"
            :actionsVisible="actionField.display"
            :itemHeight="itemHeight"
            :rowWidth="rowWidth"
            @action="clickHandler"
            @item-click="itemClickHandler"
          />
        </slot>
      </VirtualList>
    </div>
  </div>
</template>

<script>
  import VirtualList from 'vue-virtual-scroll-list'
  import { QWindowResizeObservable, QInput, QToggle, QToolbar, QToolbarTitle, QDatetime, QBtn, QIcon, QSearch, QTooltip, QModal, QModalLayout, QSlider, QField, QCheckbox, uid, date } from 'quasar-framework'
  import VueDraggableResizable from 'vue-draggable-resizable'
  import ListItem from './ListItem.vue'

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
      theme: Object,
      viewConfig: Object
    },
    components: { VirtualList, QWindowResizeObservable, VueDraggableResizable, QInput, QToggle, QToolbar, QField, QToolbarTitle, QCheckbox, QDatetime, QSlider, QBtn, QIcon, QSearch, ListItem, QTooltip, QModal, QModalLayout },
    data () {
      return {
        uid: 0,
        currentFilter: this.filter,
        currentMode: !!this.mode,
        currentDate: this.date,
        wrapperHeight: 0,
        itemHeight: 19,
        itemsCount: 0,
        defaultItemWidth: 150,
        dynamicCSS: document.createElement('style'),
        showSearch: false,
        needAutoScroll: !!this.mode,
        start: 0,
        currentCols: [],
        customField: {
          name: '',
          width: 150,
          display: false,
          custom: true,
          error: false,
          errMessages: ''
        },
        actionField: {
          name: 'action',
          width: !this.actions.length ? 150 : this.actions.length >= 2 ? this.actions.length * 28 : 50,
          display: this.actions && !!this.actions.length
        },
        etcField: {
          name: 'etc',
          width: 150,
          display: this.viewConfig.needShowEtc || false
        },
        defaultTheme: {
          color: 'dark',
          bgColor: 'white',
          controlsInverted: false,
          contentInverted: false
        },
        defaultConfig: {
          needShowFilter: false,
          needShowMode: false,
          needShowPageScroll: '',
          needShowDate: false,
          needShowEtc: false
        },
        hasItemClickHandler: false
      }
    },
    computed: {
      needShowToolbar () {
        return this.currentViewConfig.needShowMode || this.currentViewConfig.needShowFilter || this.currentViewConfig.needShowDate || this.currentViewConfig.needShowPageScroll
      },
      scrollerStart () {
        return this.needAutoScroll ? this.items.length : this.start
      },
      activeCols () {
        return this.cols.filter(col => col.display)
      },
      notActiveCols () {
        return this.cols.filter(col => !col.display)
      },
      currentTheme () {
        return Object.assign(this.defaultTheme, this.theme)
      },
      currentViewConfig () {
        return Object.assign(this.defaultConfig, this.viewConfig)
      },
      rowWidth () {
        let res = 0
        if (this.etcField.display) {
          res += this.etcField.width + 15 // 15 is a margins of elements
        }
        if (this.actionField.display) {
          res += this.actionField.width + 15
        }
        res += this.activeCols.reduce((acc, col) => acc + col.width + 15, 0)
        return res + 5 // 5 is margin of container
      },
      formatedDate () {
          return date.formatDate(this.currentDate, 'DD MMMM YYYY')
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
      colsModalOpenHandler () {
        if (this.cols.length) {
           this.currentCols = JSON.parse(JSON.stringify(this.cols))
        }
        this.$refs.colsModal.open()
      },
      colsModalSave () {
        this.$refs.colsModal.close()
        this.$emit('update:cols', this.currentCols)
      },
      colsModalClose () {
        this.$refs.colsModal.close()
        this.currentCols = JSON.parse(JSON.stringify(this.cols))
        this.customField = {
          name: '',
          width: 150,
          display: false,
          custom: true
        }
      },
      customFieldSave () {
        if (!this.customField.name) {
          this.customField.error = true
          this.customField.errMessages = 'name is empty'
          return false
        }
        if (this.currentCols.filter(col => col.name === this.customField.name).length) {
          this.customField.error = true
          this.customField.name = ''
          this.customField.errMessages = 'name is duplicated'
          return false
        }
        this.currentCols.push(this.customField)
        this.customField = {
          name: '',
          width: 150,
          display: false,
          custom: true,
          error: false,
          errMessages: ''
        }
      },
      customFieldRemove (index) {
        this.currentCols.splice(index, 1)
      },
      clickHandler ({index, type, content}) {
        this.$emit(`action`, {index, type, content})
      },
      itemClickHandler ({index, content}) {
        this.$emit(`item-click`, {index, content})
      },
      resetParams () {
        this.wrapperHeight = this.$refs.wrapper.offsetHeight - 19 - 15 // - header - scroll-bottom
        this.itemsCount = Math.ceil(this.wrapperHeight / this.itemHeight)
      },
      wrapperResizeHandler () {
        this.resetParams()
      },
      onResize (width, index) {
        if (index === 'etc') {
          this.etcField.width = width
        }
        if (index === 'actions') {
          this.actionField.width = width
        }
        if (typeof index === 'number') {
          this.activeCols[index].width = width
        }
        this.updateDynamicCSS()
      },
      enableAutoscroll () {
        if (!this.needAutoScroll && this.mode) {
          this.needAutoScroll = true
        }
      },
      listScroll: function (e, data) {
        if (this.items.length) {
          if (data.end < this.items.length - 1 && this.needAutoScroll) {
            this.needAutoScroll = false
            this.start = data.start - 1 >= 0 ? data.start - 1 : 0
          }
          this.$refs.wrapper.querySelector('.list__header .header__inner').style.left = (e.target.querySelector('.q-w-list').getBoundingClientRect().left - this.$refs.wrapper.getBoundingClientRect().left) + 'px'
        }
      },
      getDynamicCSS () {
        let result = ''
        if (this.actionField.display) {
          result += `.uid${this.uid} .item_actions { width: ${this.actionField.width}px }`
        }
        if (this.etcField.display) {
          result += `.uid${this.uid} .item_etc { width: ${this.etcField.width}px }`
        }
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
        }
        else {
          this.dynamicCSS.innerText = this.getDynamicCSS()
        }

        head.appendChild(this.dynamicCSS)
      }
    },
    watch: {
      date (val) {
        this.currentDate = val
      },
      mode (val) {
        this.currentMode = !!val
        this.needAutoScroll = !!val
        this.start = 0
      },
      filter (val) {
        if (this.currentFilter !== val) {
          this.currentFilter = val
        }
      },
      cols: {
        deep: true,
        handler (val) {
          if (!val.length) {
            this.etcField.display = true
          }
          this.updateDynamicCSS()
        }
      }
    },
    mounted () {
      this.hasItemClickHandler = !!this._events['item-click']
      this.uid = uid().split('-')[0]
      this.resetParams()
      this.updateDynamicCSS()
    },
    destroyed () {
        let head = document.head || document.getElementsByTagName('head')[0]
        head.removeChild(this.dynamicCSS)
    }
  }
</script>

<style lang="stylus">
  .message-viewer
    .viewer__toolbar
      .on-right
        margin-left 0
    .list-wrapper
      position absolute
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
            .handle-mr
              top 0
              height 100%
              margin-top 0
              border none
              border-right 2px solid #616161
              background-color inherit
              display block!important
    .collapsed
      max-width 40px
    .q-w-list
      &>*
        display block
        white-space nowrap
        &:nth-child(odd)
          background-color rgba(0,0,0,.2)
  .modal-cols-configurator
    .q-field-label-inner
      span
        text-overflow ellipsis
        width 100%
        overflow hidden
</style>
