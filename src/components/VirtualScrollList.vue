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
      <q-btn :color="currentTheme.color" flat class="on-left" @click="colsModalOpenHandler"
        v-if="colsConfigurator === 'toolbar' && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
      >
        <q-icon name="tune"></q-icon>
      </q-btn>
      <div class="pagination on-left" style="min-width: 52px"
        v-if="!currentMode && currentViewConfig.needShowPageScroll && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
      >
        <q-icon :color="currentTheme.color" class="cursor-pointer on-right"
          v-if="currentViewConfig.needShowPageScroll.indexOf('left') !== -1"
          @click.native="$emit('change:pagination-prev')" size="1.5rem" name="arrow_back"
        >
          <q-tooltip>{{i18n.from}}</q-tooltip>
        </q-icon>
        <q-icon :color="currentTheme.color" class="cursor-pointer on-right"
          v-if="currentViewConfig.needShowPageScroll.indexOf('right') !== -1"
          @click.native="$emit('change:pagination-next')" size="1.5rem" name="arrow_forward"
        >
          <q-tooltip>{{i18n.to}}</q-tooltip>
        </q-icon>
      </div>
      <div class="on-left date" style="min-width: 180px" v-if="!currentMode && currentViewConfig.needShowDate && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)">
        <q-icon :color="currentTheme.color"
          v-if="$q.platform.is.desktop && (currentViewConfig.needShowDate === true || currentViewConfig.needShowDate.prev)"
          @click.native="$emit('change:date-prev')"
          class="cursor-pointer arrows" size="1.5rem" name="keyboard_arrow_left"
        />
        <q-btn flat :color="currentTheme.color" style="max-width: 120px; font-size: .8rem; line-height: .8rem;" class="q-pa-sm" @click="$refs.datePickerModal.toggle()">
          <div>{{formatDate(date)}}</div>
        </q-btn>
        <q-dialog ref="datePickerModal" :content-css="{maxWidth: '500px'}" class="modal-date" :maximized="$q.platform.is.mobile">
          <q-card :style="{minWidth: $q.platform.is.mobile ? '100%' : '30vw'}">
            <q-card-section class="q-pa-none">
              <q-toolbar :class="{[`bg-${theme.bgColor}`]: true, 'text-white': !!theme.bgColor}">
                <div class="q-toolbar-title text-h6" :class="[`text-${theme.color}`]">
                  Date/Time
                </div>
              </q-toolbar>
            </q-card-section>
            <q-separator />
            <q-card-section :style="{height: $q.platform.is.mobile ? 'calc(100% - 104px)' : ''}" class="scroll" :class="{[`bg-${theme.bgColor}`]: true, 'text-white': !!theme.bgColor}">
              <div class="flex flex-center">
                <vue-flat-pickr
                  :value="dateValue"
                  @input="dateInputHandler"
                  :config="dateConfig"
                  :theme="currentTheme"
                />
              </div>
            </q-card-section>
            <q-separator />
            <q-card-actions align="right" :class="{[`bg-${currentTheme.bgColor}`]: true, 'text-white': !!currentTheme.bgColor}">
              <q-btn flat :color="currentTheme.color" @click="datePickerModalClose">close</q-btn>
              <q-btn flat :color="currentTheme.color" @click="datePickerModalSave">save</q-btn>
            </q-card-actions>
          </q-card>
        </q-dialog>
        <q-tooltip v-if="$q.platform.is.desktop">{{formatedDate}}</q-tooltip>
        <q-icon :color="currentTheme.color"
          v-if="$q.platform.is.desktop && (currentViewConfig.needShowDate === true || currentViewConfig.needShowDate.next)"
          @click.native="$emit('change:date-next')"
          class="cursor-pointer arrows" size="1.5rem" name="keyboard_arrow_right"
        />
      </div>
      <div v-if="!currentMode && currentViewConfig.needShowDateRange && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)" class="on-left q-v-date-range-picker">
        <q-btn @click="dateRangeToggle" flat :color="currentTheme.color" style="min-width: 154px; font-size: .8rem; line-height: .8rem;" class="q-pa-none">
          <div>
            <div>{{formatDate(dateRange[0])}}</div>
            <div style="font-size: .5rem">|</div>
            <div>{{formatDate(dateRange[1])}}</div>
          </div>
        </q-btn>
        <q-dialog ref="dateRangePickerModal" :content-css="{maxWidth: '500px'}" class="modal-date-range" :maximized="$q.platform.is.mobile">
          <q-card :style="{minWidth: $q.platform.is.mobile ? '100%' : '30vw'}">
            <q-card-section class="q-pa-none">
              <q-toolbar :class="{[`bg-${currentTheme.bgColor}`]: true, 'text-white': !!currentTheme.bgColor}">
                <div class="q-toolbar-title text-h6" :class="[`text-${currentTheme.color}`]">
                  Time range
                </div>
              </q-toolbar>
            </q-card-section>
            <q-separator />
            <q-card-section :style="{height: $q.platform.is.mobile ? 'calc(100% - 104px)' : ''}" class="scroll" :class="{[`bg-${currentTheme.bgColor}`]: true, 'text-white': !!currentTheme.bgColor}">
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
            <q-separator />
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
    <q-dialog ref="colsModal" :content-css="{minWidth: '70vw', minHeight: '50vh', maxWidth: '100vw'}" class="modal-cols-configurator" :maximized="$q.platform.is.mobile">
      <q-card :style="{minWidth: $q.platform.is.mobile ? '100%' : '70vw'}">
        <q-card-section class="q-pa-none">
          <q-toolbar :class="{[`bg-${currentTheme.bgColor}`]: true, 'text-white': !!currentTheme.bgColor}">
            <div class="q-toolbar-title text-h6" :class="[`text-${currentTheme.color}`]">
              Configure cols
            </div>
          </q-toolbar>
        </q-card-section>
        <q-separator />
        <q-card-section :style="{ height: $q.platform.is.mobile ? 'calc(100% - 104px)' : '55vh'}" class="scroll" :class="{[`bg-${currentTheme.bgColor}`]: true, 'text-white': !!currentTheme.bgColor}">
          <div class="layout-padding" :class="[`bg-${currentTheme.bgColor}`]">
            <div class="row full-width">
              <div class="col-md-2 col-12 ellipsis text-bold" style="font-size: 1.1rem;" :style="{lineHeight: $q.screen.lt.md ? '' : '40px'}"><span>Name</span></div>
              <div class="col-md-7 col-9 text-bold" style="font-size: 1.1rem;" :style="{lineHeight: $q.screen.lt.md ? '' : '40px'}">Width</div>
              <div class="col-1 flex flex-center" style="font-size: 1.1rem;" :style="{lineHeight: $q.screen.lt.md ? '' : '40px'}">
                <q-icon size="1.5rem" class="cursor-pointer"
                  name="mdi-eye-settings-outline"
                  @click.native="toggleAllCols"
                  :color="currentTheme.controlsInverted ? 'white' : currentTheme.color"
                >
                  <q-tooltip>Toggle all columns</q-tooltip>
                </q-icon>
              </div>
            </div>
            <q-separator spaced :color="currentTheme.controlsInverted ? 'white' : 'grey-9'"/>
            <div class="row full-width q-pt-sm q-pb-sm" v-if="actions && actions.length">
              <div class="col-md-2 col-12 ellipsis" style="font-size: 1.1rem;" :style="{lineHeight: $q.screen.lt.md ? '' : '40px'}"><span>{{actionField.name}}</span></div>
              <div class="col-md-7 col-9">
                <q-slider :min="50" :max="800" :step="25"
                  :value="actionField.width"
                  @input="(val) => { onResize(val,'actions') }" label
                  :label-value="`${actionField.width}px`"
                  :dark="currentTheme.controlsInverted"
                  :color="currentTheme.controlsInverted ? currentActionFieldDisplay ? 'white' : 'grey-8' : currentTheme.color"
                  :label-color="currentTheme.controlsInverted ? 'grey-9' : 'white'"
                />
              </div>
              <div class="col-1 flex flex-center">
                <q-icon size="1.5rem" class="cursor-pointer"
                  :name="currentActionFieldDisplay ? 'mdi-eye' : 'mdi-eye-off'"
                  @click.native="currentActionFieldDisplay = !currentActionFieldDisplay"
                  :color="currentTheme.controlsInverted ? currentActionFieldDisplay ? 'white' : 'grey-8' : currentTheme.color"
                />
              </div>
            </div>
            <draggable :list="currentCols" handle=".handle">
              <div class="cols-editor__col row full-width q-pt-sm q-pb-sm" v-for="(col, index) in currentCols" :key="col.name">
                <div class="col-md-2 col-12 ellipsis" style="font-size: 1.1rem;" :style="{lineHeight: $q.screen.lt.md ? '' : '40px'}"><span>{{col.name}}</span></div>
                <div class="col-md-7 col-9">
                  <q-slider :min="50" :max="800" :step="25" v-model="col.width" label
                    :label-value="`${col.width}px`"
                    :dark="currentTheme.controlsInverted"
                    :color="currentTheme.controlsInverted ? actionField.display ? 'white' : 'grey-8' : currentTheme.color"
                    :label-color="currentTheme.controlsInverted ? 'grey-9' : 'white'"
                  />
                </div>
                <div class="col-1 flex flex-center">
                  <q-icon size="1.5rem" class="cursor-pointer"
                    :name="col.display ? 'mdi-eye' : 'mdi-eye-off'" @click.native="col.display = !col.display"
                    :color="currentTheme.controlsInverted ? col.display ? 'white' : 'grey-8' : currentTheme.color"
                  />
                </div>
                <div class="col-1 flex flex-center">
                  <q-btn flat @click="customFieldRemove(index)" icon="remove"
                    :color="currentTheme.controlsInverted ? col.display ? 'white' : 'grey-8' : currentTheme.color"
                  />
                </div>
                <div class="col-1 flex flex-center">
                  <q-icon size="1.5rem" class="handle" name="mdi-drag" style="cursor: move"
                    :color="currentTheme.controlsInverted ? col.display ? 'white' : 'grey-8' : currentTheme.color"
                  />
                </div>
              </div>
            </draggable>
            <div class="row full-width q-pt-sm q-pb-sm">
              <div class="col-md-2 col-12 ellipsis" style="font-size: 1.1rem;" :style="{lineHeight: $q.screen.lt.md ? '' : '40px'}"><span>{{etcField.name}}</span></div>
              <div class="col-md-7 col-9">
                <q-slider class="col-8" :min="50" :max="800" :step="25" v-model="etcField.width" label
                  :label-value="`${etcField.width}px`"
                  :dark="currentTheme.controlsInverted"
                  :color="currentTheme.controlsInverted ? currentEtcFieldDisplay ? 'white' : 'grey-8' : currentTheme.color"
                  :label-color="currentTheme.controlsInverted ? 'grey-9' : 'white'"
                />
              </div>
              <div class="col-1 flex flex-center">
                <q-icon size="1.5rem" class="cursor-pointer"
                  :name="currentEtcFieldDisplay ? 'mdi-eye' : 'mdi-eye-off'"
                  @click.native="currentEtcFieldDisplay = !currentEtcFieldDisplay"
                  :color="currentTheme.controlsInverted ? currentEtcFieldDisplay ? 'white' : 'grey-8' : currentTheme.color"
                />
              </div>
            </div>
            <q-separator spaced :color="currentTheme.controlsInverted ? 'white' : 'grey-9'"/>
            <div class="row full-width q-pt-sm q-pb-sm">
              <div class="col-md-2 col-12 ellipsis" style="font-size: 1.1rem;" :style="{lineHeight: $q.screen.lt.md ? '' : '40px'}"><span>add custom field</span></div>
              <div class="col-md-3 col-4 q-pr-sm">
                <q-input :placeholder="customField.error ? customField.errMessages : 'name'" outlined hide-bottom-space dense
                  type="text" v-model="customField.name" :error="customField.error"
                  :dark="currentTheme.controlsInverted"
                  :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"
                />
              </div>
              <div class="col-md-4 col-5">
                <q-slider :min="50" :max="800" :step="25" v-model="customField.width" label
                  :label-value="`${customField.width}px`" :dark="currentTheme.controlsInverted"
                  :color="currentTheme.controlsInverted ? customField.display ? 'white' : 'grey-8' : currentTheme.color"
                  :label-color="currentTheme.controlsInverted ? 'grey-9' : 'white'"
                />
              </div>
              <div class="col-1 flex flex-center">
                <q-icon size="1.5rem" class="cursor-pointer"
                  :name="customField.display ? 'mdi-eye' : 'mdi-eye-off'"
                  @click.native="customField.display = !customField.display"
                  :color="currentTheme.controlsInverted ? customField.display ? 'white' : 'grey-8' : currentTheme.color"
                />
              </div>
              <div class="col-1 flex flex-center">
                <q-btn flat @click="customFieldSave" icon="add"
                  :color="currentTheme.controlsInverted ? 'white' : currentTheme.color"
                />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" :class="{[`bg-${currentTheme.bgColor}`]: true, 'text-white': !!currentTheme.bgColor}">
          <q-btn flat :color="currentTheme.color" @click="colsModalClose">close</q-btn>
          <q-btn flat :color="currentTheme.color" @click="colsModalSave">save</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <div ref="wrapper" class="list-wrapper" :class="{'bg-grey-9': currentTheme.contentInverted}"
      :style="{height: needShowToolbar ? 'calc(100% - 50px)' : '100%'}"
    >
      <q-resize-observer @resize="wrapperResizeHandler"/>
      <div class="list__header" :class="[`text-${currentTheme.color}`, `bg-${currentTheme.bgColor}`]"
        v-if="(items.length || loading) && currentTheme.headerShow" :style="{height: `${itemHeight}px`}" ref="header"
        @dblclick="colsConfigurator === 'header' ? $refs.colsModal.show() : ''"
      >
        <div class="header__inner" :style="{width: `${rowWidth}px` }">
          <div class="header__item item_actions" v-if="actionField.display">
            <q-tooltip>Actions</q-tooltip>
            <span class="item__label">{{actionField.name}}</span>
            <vue-draggable-resizable ref="dragActions" v-if="$q.platform.is.desktop && isNeedResizer"
              :active="true" :z="1" :preventDeactivation="true"
              :draggable="false" :handles="['mr']" :w="actionField.width" :h="itemHeight"
              :minw="50" @resizestop="(left, top, width) => {onResize(width, 'actions')}"
            />
          </div>
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
                  @resizestop="(left, top, width) => {onResize(width, activeColsIndexes[index])}"
                />
              </div>
            </template>
          </draggable>
          <div v-if="etcField.display" class="header__item item_etc">
            <q-tooltip>Another info by message</q-tooltip>
            <span class="item__label">{{etcField.name}}</span>
            <vue-draggable-resizable ref="dragEtc" v-if="$q.platform.is.desktop && isNeedResizer"
              :active="true" :z="1" :preventDeactivation="true"
              :draggable="false" :handles="['mr']" :w="etcField.width" :h="itemHeight" :minw="50"
              @resizestop="(left, top, width) => {onResize(width, 'etc')}"
            />
          </div>
        </div>
      </div>
      <div class="no-messages text-center" :class="{'text-grey-6': currentTheme.contentInverted}"
        style="font-size: 3rem; padding-top: 40px; " v-if="!items.length && !loading"
      >
        {{i18n['Messages not found'] || 'Messages not found'}}
      </div>
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
        wclass="q-w-list">
        <template v-if="loading">
          <table-skeleton v-for="(i, key) in new Array(itemsCount + 2).fill('')" :key="key" :rows="rowWidths"/>
        </template>
        <slot name="items" v-else
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
import TableSkeleton from './TableSkeleton'
import draggable from 'vuedraggable'
import DateRangePicker, { VueFlatPickr } from 'datetimerangepicker'
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
  components: { draggable, VirtualList, VueDraggableResizable, ListItem, DateRangePicker, VueFlatPickr, TableSkeleton },
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
      dateConfig: {
        enableTime: true,
        time_24hr: true,
        inline: true,
        maxDate: (new Date()).setHours(23, 59, 59, 999),
        mode: 'single',
        locale: { firstDayOfWeek: 1 }
      },
      wrapperHeight: 0,
      wrapperWidth: 0,
      itemsCount: 0,
      defaultItemWidth: 150,
      dynamicCSS: document.createElement('style'),
      showSearch: false,
      needAutoScroll: !!this.mode,
      currentCols: [],
      customField: {
        name: '',
        width: 150,
        display: true,
        custom: true,
        error: false,
        errMessages: ''
      },
      actionField: {
        name: 'action',
        width: !this.actions.length ? 150 : this.actions.length >= 2 ? this.actions.length * 28 : 50,
        display: this.actions && !!this.actions.length
      },
      currentActionFieldDisplay: this.actions && !!this.actions.length,
      etcField: {
        name: 'etc',
        width: 150,
        display: this.viewConfig.needShowEtc || false
      },
      currentEtcFieldDisplay: this.viewConfig.needShowEtc || false,
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
    formatedDate () {
      return date.formatDate(this.dateValue, 'DD MMMM YYYY')
    },
    wrapperOverflowing () {
      return this.wrapperWidth < this.rowWidth
    },
    rowWidths () {
      let widths = []
      if (this.actionField.display) {
        widths.push(this.actionField.width)
      }
      this.activeCols.forEach((col) => {
        widths.push(col.width)
      })
      if (this.etcField.display) {
        widths.push(this.etcField.width)
      }
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
    colsModalOpenHandler () {
      if (this.cols.length) {
        this.currentCols = JSON.parse(JSON.stringify(this.cols))
      }
      this.$refs.colsModal.show()
    },
    colsModalSave () {
      this.$refs.colsModal.hide()
      this.$set(this.actionField, 'display', this.currentActionFieldDisplay)
      this.$set(this.etcField, 'display', this.currentEtcFieldDisplay)
      this.$emit('update:cols', this.currentCols)
    },
    colsModalClose () {
      this.$refs.colsModal.hide()
      this.currentCols = JSON.parse(JSON.stringify(this.cols))
      this.currentActionFieldDisplay = this.actionField.display
      this.currentEtcFieldDisplay = this.etcField.display
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
    datePickerModalClose () {
      this.dateValue = this.date
      this.$refs.datePickerModal.hide()
    },
    datePickerModalSave () {
      this.$emit('change:date', this.dateValue.valueOf())
      this.$refs.datePickerModal.hide()
    },
    dateInputHandler (date) {
      this.dateValue = date ? date.setSeconds(0) : new Date()
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
    toggleAllCols () {
      let flag = this.currentCols.reduce((flag, col) => flag || col.display, false)
      if (this.actions && this.actions.length) {
        flag = flag || this.currentActionFieldDisplay
      }
      flag = !flag
      this.currentCols.forEach((_, index) => {
        this.$set(this.currentCols[index], 'display', flag)
      })
      if (this.actions && this.actions.length) {
        this.currentActionFieldDisplay = flag
      }
      if (!flag && this.viewConfig.needShowEtc) { this.currentEtcFieldDisplay = !flag }
    },
    scrollInit () {
      if (this.items.length) {
        let el = get(this.$refs, 'scroller.$el', undefined)
        this.ps ? this.ps.update() : this.ps = new PerfectScrollbar(el, { scrollXMarginOffset: 15, scrollYMarginOffset: 15 })
      } else {
        if (this.ps) {
          this.ps.destroy()
          this.ps = null
        }
      }
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
    let fullWidth = this.$refs.wrapper.offsetWidth
    if (this.rowWidth < fullWidth) {
      this.etcField.width = fullWidth - (this.rowWidth - 150)
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
</style>
