<template>
  <div class="message-viewer" :class="{[`uid${uid}`]: true}">
    <q-window-resize-observable @resize="onWindowResize" />
    <q-toolbar class="viewer__toolbar" :color="currentTheme.bgColor" v-if="needShowToolbar">
      <span v-if="title && $q.platform.is.desktop" style="margin-right: 10px">{{title}}</span>
      <q-icon :color="currentTheme.color" name="search" @click.native="showSearch = true"
              v-if="$q.platform.is.mobile && currentViewConfig.needShowFilter && !showSearch"
              :style="{fontSize: '24px', marginBottom: currentTheme.controlsInverted ? '' : '8px', paddingLeft: currentTheme.controlsInverted ? '8px' : ''}"></q-icon>
      <q-search
        :class="{'full-width': $q.platform.is.desktop || showSearch, collapsed: $q.platform.is.mobile && !showSearch}"
        @focus="showSearch = true"
        :autofocus="$q.platform.is.mobile"
        @blur="searchBlurHandler"
        v-if="currentViewConfig.needShowFilter && ((showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
        @keyup.enter="searchSubmitHandler"
        type="text" v-model="currentFilter"
        :inverted="currentTheme.controlsInverted"
        :color="currentTheme.controlsInverted ? 'none' : currentTheme.color"
        placeholder="param1=n*,param2,param3>=5"
        :debounce="0"
      />
      <q-toolbar-title/>
      <q-btn :color="currentTheme.color" flat class="on-left" v-if="colsConfigurator === 'toolbar'"
             @click="colsModalOpenHandler">
        <q-icon name="tune"></q-icon>
      </q-btn>
      <div class="pagination on-left" style="min-width: 52px"
           v-if="!currentMode && currentViewConfig.needShowPageScroll && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)">
        <q-icon :color="currentTheme.color" class="cursor-pointer on-right"
                v-if="currentViewConfig.needShowPageScroll.indexOf('left') !== -1"
                @click.native="$emit('change:pagination-prev')" size="1.5rem" name="arrow_back">
          <q-tooltip>{{i18n.from}}</q-tooltip>
        </q-icon>
        <q-icon :color="currentTheme.color" class="cursor-pointer on-right"
                v-if="currentViewConfig.needShowPageScroll.indexOf('right') !== -1"
                @click.native="$emit('change:pagination-next')" size="1.5rem" name="arrow_forward">
          <q-tooltip>{{i18n.to}}</q-tooltip>
        </q-icon>
      </div>
      <div class="on-left date" style="min-width: 180px"
           v-if="!currentMode && currentViewConfig.needShowDate && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)">
        <q-icon :color="currentTheme.color" v-if="$q.platform.is.desktop && (currentViewConfig.needShowDate === true || currentViewConfig.needShowDate.prev)" @click.native="$emit('change:date-prev')"
                class="cursor-pointer arrows" size="1.5rem" name="keyboard_arrow_left"/>
        <q-datetime
          format="DD-MM-YYYY HH:mm:ss"
          @change="(val) => { currentDate = val; $emit('change:date', val)}"
          :value="currentDate"
          :inverted="currentTheme.controlsInverted"
          :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"
          type="datetime"
          format24h
          modal
          class="vsl-date"
        />
        <q-tooltip v-if="$q.platform.is.desktop">{{formatedDate}}</q-tooltip>
        <q-icon :color="currentTheme.color" v-if="$q.platform.is.desktop && (currentViewConfig.needShowDate === true || currentViewConfig.needShowDate.next)" @click.native="$emit('change:date-next')"
                class="cursor-pointer arrows" size="1.5rem" name="keyboard_arrow_right"/>
      </div>
      <div v-if="!currentMode && currentViewConfig.needShowDateRange" class="on-left q-v-date-range-picker">
        <q-btn @click="dateRangeToggle" flat :color="currentTheme.color" style="min-width: 130px; font-size: .8rem;" class="q-pa-none">
          <div>
            <div>{{formatDate(dateRange[0])}}</div>
            <div style="font-size: .5rem">|</div>
            <div>{{formatDate(dateRange[1])}}</div>
          </div>
        </q-btn>
        <q-popover ref="dateRangePicker" v-show="$q.platform.is.desktop && !dateRangeModalView" class="q-pa-sm bg-dark" anchor="top left" self="center left" max-height="500px" fit>
          <date-range-picker
            v-model="currentDateRange"
            :mode="currentDateRangeMode"
            @change:mode="changeModeDateTimeRangeHandler"
            :theme="currentTheme"
          />
          <q-btn style="float: right" color="white" flat icon="check" label="Set" @click="setDateRange" />
        </q-popover>
        <q-modal v-if="$q.platform.is.mobile || dateRangeModalView" ref="dateRangePickerModal" :content-css="{maxWidth: '500px'}" class="modal-date-range">
          <q-modal-layout :class="[`bg-${theme.bgColor}`]">
            <q-toolbar :color="theme.bgColor" slot="header">
              <div class="q-toolbar-title" :class="[`text-${theme.color}`]">
                Time range
              </div>
            </q-toolbar>
            <div class="flex flex-center">
              <date-range-picker
                class="q-ma-sm"
                v-model="currentDateRange"
                :mode="currentDateRangeMode"
                @change:mode="changeModeDateTimeRangeHandler"
                :theme="currentTheme"
              />
            </div>
            <q-toolbar :color="currentTheme.bgColor" slot="footer" style="justify-content: flex-end;">
              <q-btn flat class="pull-right" :color="currentTheme.color" @click="dateRangeModalClose">close</q-btn>
              <q-btn flat class="pull-right" :color="currentTheme.color" @click="dateRangeModalSave">save</q-btn>
            </q-toolbar>
          </q-modal-layout>
        </q-modal>
      </div>
      <q-checkbox
        v-if="currentViewConfig.needShowMode && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
        class="no-margin" @change="$emit('change:mode', Number(currentMode))" :color="currentTheme.color"
        v-model="currentMode" checked-icon="playlist_play" unchecked-icon="history"/>
    </q-toolbar>
    <q-modal ref="colsModal" :content-css="{minWidth: '50vw', minHeight: '50vh', maxWidth: '500px'}"
             class="modal-cols-configurator">
      <q-modal-layout :class="[`bg-${currentTheme.bgColor}`]">
        <q-toolbar :color="currentTheme.bgColor" slot="header">
          <div class="q-toolbar-title" :class="[`text-${currentTheme.color}`]">
            Configure cols
          </div>
        </q-toolbar>
        <div class="layout-padding" :class="[`bg-${currentTheme.bgColor}`]">
          <q-field v-if="actions && actions.length" :label="actionField.name" :labelWidth="3"
                   :dark="currentTheme.bgColor === 'dark'" class="q-pt-sm q-pb-sm">
            <div class="row">
              <q-slider class="col-8" :min="50" :max="800"
                        :value="actionField.width"
                        @input="(val) => { onResize(val,'actions') }" label
                        :label-value="`${actionField.width}px`"
                        :inverted="currentTheme.controlsInverted"
                        :color="currentTheme.controlsInverted ? actionField.display ? 'white' : 'grey-8' : currentTheme.color"
              />
              <q-icon size="1.5rem" class="col-1 cursor-pointer"
                      :name="actionField.display ? 'mdi-eye' : 'mdi-eye-off'"
                      @click.native="actionField.display = !actionField.display"
                      :inverted="currentTheme.controlsInverted"
                      :color="currentTheme.controlsInverted ? actionField.display ? 'white' : 'grey-8' : currentTheme.color"/>
            </div>
          </q-field>
          <draggable :list="currentCols" handle=".handle">
            <q-field v-for="(col, index) in currentCols" :key="col.name" :label="col.name" :labelWidth="3"
                     :dark="currentTheme.bgColor === 'dark'" class="q-pt-sm q-pb-sm">
              <div class="row">
                <q-slider class="col-8" :min="50" :max="800" v-model="col.width" label
                          :label-value="`${col.width}px`" :inverted="currentTheme.controlsInverted"
                          :color="currentTheme.controlsInverted ? col.display ? 'white' : 'grey-8' : currentTheme.color"/>
                <q-icon size="1.5rem" class="col-1 cursor-pointer"
                        :name="col.display ? 'mdi-eye' : 'mdi-eye-off'" @click.native="col.display = !col.display"
                        :inverted="currentTheme.controlsInverted"
                        :color="currentTheme.controlsInverted ? col.display ? 'white' : 'grey-8' : currentTheme.color"/>
                <q-btn flat class="col-1" @click="customFieldRemove(index)"
                       :inverted="currentTheme.controlsInverted"
                       :color="currentTheme.controlsInverted ? col.display ? 'white' : 'grey-8' : currentTheme.color">
                  <q-icon name="remove"></q-icon>
                </q-btn>
                <q-icon size="1.5rem" class="col-1 handle" name="mdi-drag" :inverted="currentTheme.controlsInverted" style="cursor: move"
                        :color="currentTheme.controlsInverted ? col.display ? 'white' : 'grey-8' : currentTheme.color"/>
              </div>
            </q-field>
          </draggable>
          <q-field :label="etcField.name" :labelWidth="3" :dark="currentTheme.bgColor === 'dark'"
                   class="q-pt-sm q-pb-sm">
            <div class="row">
              <q-slider class="col-8" :min="50" :max="800" :value="etcField.width"
                        @input="(val) => { onResize(val,'etc')}" label
                        :label-value="`${etcField.width}px`"
                        :inverted="currentTheme.controlsInverted"
                        :color="currentTheme.controlsInverted ? etcField.display ? 'white' : 'grey-8' : currentTheme.color"
              />
              <q-icon size="1.5rem" class="col-1 cursor-pointer"
                      :name="etcField.display ? 'mdi-eye' : 'mdi-eye-off'"
                      @click.native="etcField.display = !etcField.display" :inverted="currentTheme.controlsInverted"
                      :color="currentTheme.controlsInverted ? etcField.display ? 'white' : 'grey-8' : currentTheme.color"/>
            </div>
          </q-field>
          <q-field label="add custom field" style="border-top: 1px solid #333; padding-top: 10px" :labelWidth="3"
                   :dark="currentTheme.bgColor === 'dark'" class="q-pt-lg">
            <div class="row">
              <q-input class="col-4" :placeholder="customField.error ? customField.errMessages : 'name'"
                       type="text" v-model="customField.name" :error="customField.error"
                       :inverted="currentTheme.controlsInverted"
                       :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"
              />
              <q-slider class="col-4" :min="50" :max="800" v-model="customField.width" label
                        :label-value="`${customField.width}px`" :inverted="currentTheme.controlsInverted"
                        :color="currentTheme.controlsInverted ? customField.display ? 'white' : 'grey-8' : currentTheme.color"/>
              <q-icon size="1.5rem" class="col-1 cursor-pointer"
                      :name="customField.display ? 'mdi-eye' : 'mdi-eye-off'"
                      @click.native="customField.display = !customField.display"
                      :inverted="currentTheme.controlsInverted"
                      :color="currentTheme.controlsInverted ? customField.display ? 'white' : 'grey-8' : currentTheme.color"/>
              <q-btn flat class="col-1" @click="customFieldSave" :inverted="currentTheme.controlsInverted"
                     :color="currentTheme.controlsInverted ? 'white' : currentTheme.color">
                <q-icon name="add"/>
              </q-btn>
            </div>
          </q-field>
        </div>
        <q-toolbar :color="currentTheme.bgColor" slot="footer" style="justify-content: flex-end;">
          <q-btn flat class="pull-right" :color="currentTheme.color" @click="colsModalClose">close</q-btn>
          <q-btn flat class="pull-right" :color="currentTheme.color" @click="colsModalSave">save</q-btn>
        </q-toolbar>
      </q-modal-layout>
    </q-modal>
    <div ref="wrapper" class="list-wrapper" :class="{'bg-dark': currentTheme.contentInverted}"
         :style="{top: needShowToolbar ? '50px' : '0',  bottom: 0, right: 0, left: 0}">
      <q-resize-observable @resize="wrapperResizeHandler"/>
      <div class="list__header" :class="[`text-${currentTheme.color}`, `bg-${currentTheme.bgColor}`]"
           v-if="items.length && currentTheme.headerShow" :style="{height: `${itemHeight}px`}" ref="header"
           @dblclick="colsConfigurator === 'header' ? $refs.colsModal.show() : ''">
        <div class="header__inner" :style="{width: `${rowWidth}px` }">
          <div class="header__item item_actions" v-if="actionField.display">
            <q-tooltip>Actions</q-tooltip>
            <span class="item__label">{{actionField.name}}</span>
            <vue-draggable-resizable ref="dragActions" v-if="$q.platform.is.desktop && isNeedResizer" :active="true" style="background-color: transparent;"
                                     :draggable="false" :handles="['mr']" :w="actionField.width" :h="itemHeight"
                                     :minw="50" @resizestop="(left, top, width) => {onResize(width, 'actions')}"/>
          </div>
          <draggable :list="cols" element="span" @end="$emit('update:cols', cols)">
            <template v-for="(prop, index) in cols">
              <div class="header__item" :key="prop.name" v-if="prop.display"
                  :class="{[`item_${activeColsIndexes[index]}`]: true}" style="cursor: move">
                <q-tooltip v-if="prop.description || prop.title">{{`${prop.name}: ${prop.description ? prop.description :
                  ''}`}}
                </q-tooltip>
                <span class="item__label">{{prop.title || prop.name}}<span v-if="prop.addition">({{prop.addition}})</span></span>
                <vue-draggable-resizable :ref="`drag${activeColsIndexes[index]}`" v-if="$q.platform.is.desktop && isNeedResizer"
                                        :active="true" :draggable="false" :handles="['mr']" :w="prop.width" :preventDeactivation="true"
                                        :h="itemHeight * (itemsCount + 1)" :minw="50" :z='1'
                                        @resizestop="(left, top, width) => {onResize(width, activeColsIndexes[index])}"/>
              </div>
            </template>
          </draggable>
          <div v-if="etcField.display" class="header__item item_etc">
            <q-tooltip>Another info by message</q-tooltip>
            <span class="item__label">{{etcField.name}}</span>
            <vue-draggable-resizable ref="dragEtc" v-if="$q.platform.is.desktop && isNeedResizer" :active="true" :enable-native-drag="true"
                                     :draggable="false" :handles="['mr']" :w="etcField.width" :h="itemHeight" :minw="50"
                                     @resizestop="(left, top, width) => {onResize(width, 'etc')}"/>
          </div>
        </div>
      </div>
      <div class="no-messages text-center" :class="{'text-grey-6': currentTheme.contentInverted}"
           style="font-size: 3rem; padding-top: 40px; " v-if="!items.length">{{i18n['Messages not found'] || 'Messages not found'}}
      </div>
      <VirtualList
        v-auto-bottom="needAutoScroll"
        :onscroll="listScroll"
        v-if="items.length"
        ref="scroller"
        :style="{position: 'absolute', top: `${itemHeight}px`, bottom: 0, right: 0, left: 0, height: 'auto'}"
        :class="{'bg-dark': currentTheme.contentInverted, 'text-white': currentTheme.contentInverted, 'cursor-pointer': hasItemClickHandler}"
        :size="itemHeight"
        :remain="itemsCount"
        :debounce="10"
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
import { uid, date, debounce } from 'quasar'
import VueDraggableResizable from 'vue-draggable-resizable'
import ListItem from './ListItem.vue'
import draggable from 'vuedraggable'
import DateRangePicker from 'datetimerangepicker'

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
    viewConfig: Object
  },
  components: { draggable, VirtualList, VueDraggableResizable, ListItem, DateRangePicker },
  data () {
    let defaultConfig = {
      needShowFilter: false,
      needShowMode: false,
      needShowPageScroll: '',
      needShowDate: false,
      needShowDateRange: false,
      needShowEtc: false
    }
    return {
      uid: 0,
      currentFilter: this.filter,
      currentMode: !!this.mode,
      dateValue: this.date,
      wrapperHeight: 0,
      itemsCount: 0,
      defaultItemWidth: 150,
      dynamicCSS: document.createElement('style'),
      showSearch: false,
      needAutoScroll: !!this.mode,
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
      dateRangeModalView: true
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
    },
    currentDate: {
      set (value) { this.dateValue = new Date(value).setSeconds(0) },
      get () { return this.dateValue }
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
      this.$refs.colsModal.show()
    },
    colsModalSave () {
      this.$refs.colsModal.hide()
      this.$emit('update:cols', this.currentCols)
    },
    colsModalClose () {
      this.$refs.colsModal.hide()
      this.currentCols = JSON.parse(JSON.stringify(this.cols))
      this.customField = {
        name: '',
        width: 150,
        display: false
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
        error: false,
        errMessages: ''
      }
    },
    customFieldRemove (index) {
      this.currentCols.splice(index, 1)
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
      let isFieldWidtherThanWrapper = this.rowWidth - this.$refs.wrapper.offsetWidth > 0
      this.wrapperHeight = this.$refs.wrapper.offsetHeight - this.itemHeight - (isFieldWidtherThanWrapper ? this.itemHeight : 0) // - header - scroll-bottom
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
    listScroll: function (e, data) {
      if (!this.currentScrollTop) {
        this.currentScrollTop = data.offset
      }
      if (this.$refs.scroller) {
        let el = this.$refs.scroller.$el || this.$refs.scroller
        this.allScrollTop = el.scrollHeight - el.clientHeight
      }
      if (this.items.length) {
        if (data.offset < this.currentScrollTop && this.needAutoScroll) {
          this.needAutoScroll = false
        } else if (!this.needAutoScroll && this.mode === 1 && data.offset >= this.allScrollTop) {
          this.needAutoScroll = true
        }
        this.currentScrollTop = data.offset
        if (this.$refs.wrapper) {
          this.$refs.wrapper.querySelector('.list__header .header__inner').style.left = (e.target.querySelector('.q-w-list').getBoundingClientRect().left - this.$refs.wrapper.getBoundingClientRect().left) + 'px'
        }
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
      } else {
        this.dynamicCSS.innerText = this.getDynamicCSS()
      }
      head.appendChild(this.dynamicCSS)
    },
    formatDate (timestamp) {
      return date.formatDate(timestamp, 'DD/MM/YYYY HH:mm:ss')
    },
    setDateRange () {
      this.$emit('change:date-range', this.currentDateRange)
      this.dateRangeModalClose()
    },
    changeModeDateTimeRangeHandler (mode) {
      this.currentDateRangeMode = mode
      /* change popup height fix */
      this.$nextTick(() => {
        this.$refs.dateRangePicker.$el.style.maxHeight = '500px'
      })
    },
    dateRangeToggle () {
      if (this.$q.platform.is.mobile || this.dateRangeModalView) {
        let el = this.$q.platform.is.desktop && !this.dateRangeModalView ? this.$refs.dateRangePicker : this.$refs.dateRangePickerModal
        el.toggle()
      }
    },
    dateRangeModalSave () {
      this.$emit('change:date-range', this.currentDateRange)
      this.dateRangeModalClose()
    },
    dateRangeModalClose () {
      let el = this.$q.platform.is.desktop && !this.dateRangeModalView ? this.$refs.dateRangePicker : this.$refs.dateRangePickerModal
      el.hide()
    },
    onWindowResize (size) {
      if (size.height < 670) {
        this.dateRangeModalView = true
      } else {
        this.dateRangeModalView = false
      }
    }
  },
  updated () {
    if (!this.items.length) { this.currentScrollTop = 0 } else {
      if (this.needAutoScroll && this.$refs.scroller) { this.$refs.scroller.$el.scrollTop = this.$refs.scroller.$el.scrollHeight }
    }
  },
  watch: {
    date (val) {
      this.currentDate = val
    },
    // dateRange (val) {
    //   this.$set(this.currentDateRange, 0, val[0])
    //   this.$set(this.currentDateRange, 1, val[1])
    // },
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
      handler (val) {
        if (!val.length) {
          this.etcField.display = true
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
        this.etcField.display = config.needShowEtc
        this.currentViewConfig = Object.assign(this.defaultConfig, config)
      }
    }
  },
  mounted () {
    this.hasItemClickHandler = !!this._events['item-click']
    this.uid = uid().split('-')[0]
    let fullWidth = this.$refs.wrapper.offsetWidth
    if (this.rowWidth < fullWidth) {
      this.etcField.width = fullWidth - (this.rowWidth - 150)
    }
    this.resetParams()
    this.updateDynamicCSS()
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

  .modal-cols-configurator
    .q-field-label-inner
      span
        text-overflow ellipsis
        width 100%
        overflow hidden

  .q-field[draggable="true"]
    background-color #9e9e9e
  .date
    .arrows
      position relative
    .vsl-date
      display inline-flex
      max-width 105px
      .row .col
        font-size 13px
        white-space inherit
        text-align center
        line-height 15px
      i
        display none
</style>
