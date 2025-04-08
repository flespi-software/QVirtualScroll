<template>
  <div class="message-viewer full-height" :class="{[`uid${uid}`]: true}" @contextmenu.prevent.stop @select.prevent.stop>
    <q-toolbar
      v-if="needShowToolbar"
      class="viewer__toolbar"
      :class="{ [`bg-${currentTheme.bgColor}`]: true, 'text-white': !!currentTheme.bgColor }"
    >
      <span v-if="title && $q.platform.is.desktop" style="margin-right: 10px">{{ title }}</span>
      <q-icon
        v-if="$q.platform.is.mobile && currentViewConfig.needShowFilter && !showSearch"
        name="search"
        :color="currentTheme.color"
        :style="{
          fontSize: '24px',
          marginBottom: currentTheme.controlsInverted ? '' : '8px',
          paddingLeft: currentTheme.controlsInverted ? '8px' : '',
        }"
        @click="showSearch = true"
      />
      <q-input outlined hide-bottom-space dense clearable
        v-if="
          currentViewConfig.needShowFilter &&
          ((showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)
        "
        v-model="currentFilter"
        type="text"
        :class="{
          'full-width': $q.platform.is.desktop || showSearch,
          collapsed: $q.platform.is.mobile && !showSearch,
        }"
        :autofocus="$q.platform.is.mobile"
        :dark="currentTheme.controlsInverted"
        :color="currentTheme.controlsInverted ? 'grey-8' : currentTheme.color"
        :bg-color="currentFilter && currentFilter === filter ? 'green-5' : undefined"
        :placeholder="currentViewConfig.filterPlaceholder"
        :debounce="0"
        @blur="searchBlurHandler"
        @focus="showSearch = true"
        @keyup.enter="searchSubmitHandler"
        @clear="searchSubmitHandler"
      >
        <template v-slot:prepend>
          <q-btn flat round dense
            icon="mdi-magnify"
            :color="currentTheme.color"
            @click="searchSubmitHandler"
          />
        </template>
        <template v-slot:append>
          <slot name="filter-append" />
        </template>
      </q-input>
      <q-toolbar-title />
      <date-range-modal
        v-if="
          currentViewConfig.needShowDateRange &&
          ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)
        "
        class="on-left"
        v-model="dateModel"
        :theme="{ color: `${currentTheme.datetimepickerColor}` }"
      />
      <q-checkbox dark
        v-if="currentViewConfig.needShowMode && ((!showSearch && $q.platform.is.mobile) || $q.platform.is.desktop)"
        v-model="currentMode"
        class="no-margin"
        :color="currentTheme.controlsInverted ? 'white' : currentTheme.color"
        unchecked-icon="mdi-play" checked-icon="mdi-pause"/>

      <q-btn flat dense round icon="mdi-dots-vertical" :loading="hasAsyncPanelActions">
        <template v-slot:loading>
          <q-icon size="1.5rem" name="mdi-dots-vertical" />
          <q-spinner class="absolute-bottom-right" color="white" size=".7rem" />
        </template>
        <q-menu ref="tableMenu" no-route-dismiss>
          <q-list dark class="bg-grey-7 q-py-xs" style="min-width: 180px; max-width: 500px">
            <template v-for="(action, index) in panelActions">
              <q-item clickable dense v-ripple v-close-popup
                v-if="action.condition"
                class="q-px-sm"
                :key="index"
                @click="action.handler"
              >
                <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
                  <q-icon :name="action.icon" />
                </q-item-section>
                <q-item-section>{{ action.label }}</q-item-section>
                <q-item-section side v-if="action.async">
                  <q-spinner color="white" size="1rem" />
                </q-item-section>
                <q-tooltip v-if="action.tooltip">{{ action.tooltip }}</q-tooltip>
              </q-item>
            </template>
            <q-separator v-if="panelActions.length" />
            <q-item clickable dense v-ripple v-close-popup
              class="q-px-sm"
              @click="colAddingHandler"
            >
              <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
                <q-icon name="mdi-playlist-plus" />
              </q-item-section>
              <q-item-section>Add column</q-item-section>
            </q-item>
            <q-separator />
            <q-item-label header class="q-pa-none q-pl-xs q-pt-xs" style="font-size: 0.8rem">
              Columns presets
            </q-item-label>

              <q-item clickable dense v-ripple v-close-popup
                class="q-px-sm schema-item"
                active-class="schema--active"
                :active="activeSchema === name"
                @click="customSchemaApply(name)"
                v-for="(schema, name) in cols.schemas"
                :key="name"
              >
                <div
                  @click.stop.prevent
                  class="absolute-botom-right absolute-top-left full-height full-width"
                  style="z-index: 1; padding-top: 3px; background-color: rgba(0, 0, 0, 0.5)"
                  v-if="prevDeleteSchemaName === name"
                >
                  <q-btn class="q-mx-sm" color="red" label="delete" dense @click.stop="colsSchemaRemoveHandler(name)"/>
                  <q-btn color="grey" label="cancel" dense @click.stop="closePreventRemoveSchema" />
                </div>
                <q-item-section avatar class="q-pr-sm" style="min-width: 32px">
                  <q-icon v-if="name === '_default'" name="mdi-playlist-star" />
                  <q-icon v-else-if="name === '_protocol'" name="mdi-playlist-check" />
                  <q-icon v-else name="mdi-table-large" />
                </q-item-section>
                <q-item-section>
                  <template v-if="name === '_default'">{{
                    (i18n && i18n['Default columns']) || 'Default columns'
                  }}</template>
                  <template v-else-if="name === '_protocol'">{{
                    (i18n && i18n['Columns by schema']) || 'Columns by schema'
                  }}</template>
                  <template v-else>{{ schema.name }}</template>
                </q-item-section>
                <q-item-section
                  avatar
                  v-if="activeSchema !== name && name !== '_default' && name !== '_protocol'"
                >
                  <q-btn flat round dense
                    icon="mdi-close"
                    color="white"
                    @click.stop="prevDeleteSchemaName = name"
                  />
                </q-item-section>
              </q-item>

            <q-separator />
            <q-item clickable dense v-ripple v-close-popup
              active-class="schema--active"
              class="q-px-sm"
              :disable="!colsSchemaEdited"
              @click="colsSchemaAddingHandler"
            >
              <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
                <q-icon name="mdi-table-plus" />
              </q-item-section>
              <q-item-section>Save preset</q-item-section>
              <q-tooltip v-if="!colsSchemaEdited">Configure columns schema first, then save</q-tooltip>
              <q-tooltip v-else>Save current columns schema</q-tooltip>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-toolbar>
    <div ref="wrapper" class="list-wrapper" :class="{'bg-grey-9': currentTheme.contentInverted}" :style="{height: needShowToolbar ? 'calc(100% - 50px)' : '100%'}">
      <q-resize-observer @resize="wrapperResizeHandler"/>
      <div :class="[`bg-${currentTheme.controlsInverted ? 'grey-8' : 'white'}`]" class="absolute-top-right rounded-borders" style="z-index: 2; right: 20px;">
        <q-input autofocus outlined hide-bottom-space dense
          v-if="colsSchemaAdd"
          v-model="newSchemaName"
          label="Preset name"
          :dark="currentTheme.controlsInverted"
          :color="!!cols.schemas[newSchemaName] ? 'yellow' : (!newSchemaName || newSchemaName.indexOf('_') === 0) ? 'red-4' : currentTheme.controlsInverted ? 'white' : currentTheme.color"
          @keyup.enter="() => { if (newSchemaName && newSchemaName.indexOf('_') !== 0) {colsSchemaAddingDoneHandler()} }"
          @keyup.esc="colsSchemaAddingCloseHandler()"
          :bottom-slots="!!cols.schemas[newSchemaName]"
        >
          <q-btn
            :color="currentTheme.controlsInverted ? 'white' : currentTheme.color" icon="mdi-content-save-outline"
            dense flat @click="colsSchemaAddingDoneHandler" :disable="(!newSchemaName || newSchemaName.indexOf('_') === 0)"
          />
          <q-btn
            :color="currentTheme.controlsInverted ? 'white' : currentTheme.color" icon="mdi-close"
            dense flat @click="colsSchemaAddingCloseHandler()"
          />
          <template v-slot:hint>
            <div  v-if="!!cols.schemas[newSchemaName]" class="text-yellow">Your schema will be owerwritten or change name</div>
          </template>
        </q-input>
      </div>

      <q-btn fab-mini flat
        v-if="items.length && !scrollStickToBottom"
        icon="mdi-chevron-down"
        class="absolute-bottom-right action action__to-bottom" style="z-index: 2"
        :class="{ 'bg-white': currentTheme.contentInverted, 'text-grey-9': currentTheme.contentInverted }"
        :style="{right: colsAddition ? '270px' : ''}"
        @click="toBottomClickHandler"
      >
        <q-tooltip>To bottom</q-tooltip>
      </q-btn>

      <q-chip removable clickable
        v-if="hasNewMessages"
        icon="mdi-bell-outline"
        class="absolute-bottom-right action action__to-new-messages"
        color="amber-8"
        text-color="grey-2" style="z-index: 2"
        @click="$emit('action-to-new-messages')"
        @remove="$emit('action-to-new-messages-hide')"

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
          <div class="header__inner" :style="{ width: `${rowTotalWidth}px` }">
            <template v-for="(prop, index) in activeCols" :key="prop.name">
              <div class="header__item"  :class="{[`item_${index}`]: true}">
                <span class="item__label">
                  {{colsEnum[prop.name] && colsEnum[prop.name].title || prop.name}}
                  <span v-if="colsEnum[prop.name] && colsEnum[prop.name].addition">({{colsEnum[prop.name].addition}})</span>
                  <span v-if="colsEnum[prop.name] && colsEnum[prop.name].unit" style="font-size: .8rem" class="text-grey-4">, {{colsEnum[prop.name].unit}}</span>
                </span>
              </div>
            </template>
          </div>
        </div>
        <table-skeleton v-for="(i, key) in new Array(itemsCount - 1).fill('')" :key="key" :rows="rowColsWidthsArray"/>
      </div>
      <div v-else class="full-height">
        <q-menu context-menu touch-position no-route-dismiss
          v-if="items.length && !loading"
          ref="menu"
          @before-show="menuShow"
          @before-hide="menuHide"
        >
          <slot name="context-menu" :col="editableCol" :row="editableRow">
            <cols-menu
              :col="editableCol"
              :row="editableRow"
              @add="colsAddition = true, addingRow = editableRow"
              @remove="toggleCol"
              @action="(type) => clickHandler({ index: editableRow.index, type, content: editableRow.data })"
            />
          </slot>
        </q-menu>

        <div class="list__header" :class="[`text-${currentTheme.color}`, `bg-${currentTheme.header}`]"
          v-if="(items.length || loading) && currentTheme.headerShow && activeCols.length" :style="{height: '100%', width: colsAddition ? 'calc(100% - 250px)' : '100%'}" ref="header"
        >
          <div class="header__inner" :style="{ width: `${rowTotalWidth + 15}px` }">
            <draggable
              :list="activeCols"
              v-bind="dragOptions"
              class="draggable-list"
              item-key="index"
              @end="endDragHandler"
              >
                <template #item="{ element, index }">
                  <div class="header__item"
                    :class="{[`item_${index}`]: true}" style="cursor: move"
                  >
                    <q-tooltip v-if="colsEnum[element.name] && (colsEnum[element.name].description || colsEnum[element.name].title)">
                      {{`${element.name}: ${colsEnum[element.name].description ? colsEnum[element.name].description : ''}`}}
                    </q-tooltip>
                    <span class="item__label">
                      {{colsEnum[element.name] && colsEnum[element.name].title || element.name}}
                      <span v-if="colsEnum[element.name] && colsEnum[element.name].addition">
                        ({{colsEnum[element.name].addition}})
                      </span>
                      <span v-if="colsEnum[element.name] && colsEnum[element.name].unit" style="font-size: .8rem" class="text-grey-4">
                        , {{colsEnum[element.name].unit}}
                      </span>
                    </span>
                    <vue-draggable-resizable
                      :ref="`drag${index}`"
                      class="absolute-top-left"
                      v-if="$q.platform.is.desktop && needResizeControl"
                      :active="true" :draggable="false" :handles="['mr']" :w="element.width" :preventDeactivation="true"
                      :h="(itemHeight * itemsCount) + headerHeight" :minw="50" :z='1'
                      @resizing="() => { resizing = true }"
                      @resize-stop="(left, top, width) => {onResize(width, index), updateCols(), resizing = false}"
                    />
                  </div>
                </template>
            </draggable>
          </div>
        </div>
        <q-virtual-scroll
          v-if="activeCols.length"
          ref="scroller"
          tabindex="1"
          type="table"
          :items="items"
          virtual-scroll-slice-ratio-after="2"
          virtual-scroll-slice-ratio-before="2"
          :virtual-scroll-item-size="itemHeight"
          :style="{height: `${wrapperHeight}px`, overflow: 'auto', top: `${headerHeight}px`, zIndex: resizing ? '' : 1, right: colsAddition ? '250px' : ''}"
          class="list__content absolute-top-left absolute-bottom-right"
          :class="{'bg-grey-9': currentTheme.contentInverted, 'text-white': currentTheme.contentInverted, 'cursor-pointer': hasItemClickHandler}"
          @virtual-scroll="virtualScrollHandler"
        >
          <template #before>
            <q-scroll-observer axis="horizontal" @scroll="listScrollHorizontalHandler" />
          </template>
          <template v-slot="{ item, index }">
            <slot name="listItem"
              :item="item"
              :index="index"
              :cols="activeCols"
              :itemHeight="itemHeight"
              :rowWidth="rowTotalWidth"
            >
              <list-item
                :item="item"
                :index="index"
                :cols="activeCols"
                :itemHeight="itemHeight"
                :rowWidth="rowTotalWidth"
                :menuCellActive = "editableRow && editableCol ? { col: editableCol.index, row: editableRow.index } : null"
              />
            </slot>
          </template>
        </q-virtual-scroll>
        <div
          v-else
          :style="{height: `${wrapperHeight - 0.5}px`, overflow: 'auto', top: `${headerHeight}px`, zIndex: resizing ? '' : 1, right: colsAddition ? '250px' : ''}"
          class="list__content absolute-top-left absolute-bottom-right text-center"
          :class="{'bg-grey-9': currentTheme.contentInverted, 'text-white': currentTheme.contentInverted, 'cursor-pointer': hasItemClickHandler}"
        >
          <div :class="$q.platform.is.mobile ? ['text-h5 q-mt-sm'] : ['text-h4 q-mt-xl']" class='text-grey-5'>No columns to show.</div>
          <div :class="$q.platform.is.mobile ? ['text-h7'] : ['text-h6']" class='text-grey-6'>Configure your custom columns:<q-btn flat dense round color="white" icon="mdi-dots-vertical" @click="$refs.tableMenu.show()"/></div>
        </div>
        <cols-adding
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
import { defineComponent, ref } from 'vue'
import { uid, scroll } from 'quasar'
import { DateRangeModal } from 'datetimerangepicker'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import draggable from 'vuedraggable'
import VueDraggableResizable from 'vue-draggable-resizable'
import { Logger } from '../infrastructure/logger'
import TableSkeleton from './TableSkeleton.vue'
import ColsMenu from './ColsMenu.vue'
import ListItem from './ListItem.vue'
import ColsAdding from './ColsAdding.vue'

const { setVerticalScrollPosition } = scroll

const defaultConfig = {
  needShowFilter: false,
  filterPlaceholder:
    'position.speed<=5 || (plugin.geofence.name=="storage" && ble.sensor.temperature.1 > 10)',
  needShowDateRange: false,
  needKeysProcess: false,
}

const defaultTheme = {
  datetimepickerColor: 'grey',
  color: 'grey-9',
  bgColor: 'white',
  controlsInverted: false,
  contentInverted: false,
  headerShow: true,
}

const dragOptions = ref({
  animation: 500,
  group: 'description',
  disabled: false,
  ghostClass: 'ghost',
});

export default defineComponent({
  name: 'VirtualScrollList',
  emits: [
    'action',
    'action-to-bottom',
    'item-click',
    'update-cols'
  ],
  props: {
    actions: {
      type: Array,
      required: true
    },
    cols: {
      type: Object,
      required: true,
      default() {
        return {
          activeSchema: '_init',
          schemas: {
            _init: {
              name: '_init',
              cols: [],
            },
          },
          enum: {},
        }
      },
    },
    dateRange: {
      type: Array,
    },
    filter: {
      type: String,
      default: '',
    },
    hasNewMessages: [Object, Boolean],
    i18n: {
      type: Object,
    },
    itemHeight: {
      type: Number,
      default: 19
    },
    itemprops: {
      type: Function,
      default: () => () => {}
    },
    items: {
      type: Array,
      required: true,
      default() {
        return []
      },
    },
    loading: Boolean,
    mode: {
      type: Number,
      required: false,
      default: 0
    },
    name: {
      type: String,
      default: () => 'VirtualScrollList',
    },
    panelActions: {
      type: Array,
      default() {
        return []
      },
    },
    title: {
      type: String,
      default: '',
    },
    theme: Object,
    viewConfig: Object,
  },
  components: {
    ColsAdding,
    ColsMenu,
    draggable,
    DateRangeModal,
    ListItem,
    TableSkeleton,
    VueDraggableResizable
  },
  computed: {
    activeSchema() {
      const schemaName = this.cols.activeSchema
      if (!this.cols.schemas[schemaName]) {
        this.customSchemaApply('_default')
        return '_default'
      }
      return this.cols.activeSchema
    },
    additionCols () {
      const activeColsNames = this.activeCols.map(col => col.name)
      let cols = Object.values(this.cols.enum).reduce((res, col) => {
        if (activeColsNames.includes(col.name)) {
          res.existed[col.name] = true
        } else {
          res.notExisted[col.name] = true
        }
        return res
      }, { existed: {}, notExisted: {} })
      if (this.addingRow) {
        const params = Object.keys(this.addingRow.data)
        params.forEach((param) => {
          if (!cols.existed[param] && !cols.notExisted[param]) {
            cols.notExisted[param] = true
          }
        })
      }
      cols = Object.keys(cols.notExisted)
      return cols
    },
    colsEnum () {
      return this.cols.enum
    },
    colsSchemaEdited() {
      return this.activeSchema === '_unsaved'
    },
    currentTheme() {
      const theme = Object.assign(this.defaultTheme, this.theme)
      theme.header = `${theme.bgColor.split('-')[0]}-8`
      return theme
    },
    hasAsyncPanelActions() {
      return !!this.panelActions.filter(action => action.async).length
    },
    needShowToolbar() {
      return this.currentViewConfig.needShowFilter || this.currentViewConfig.needShowDateRange
    },
    rowTotalWidth () {
      let res = 0
      res += this.rowColsWidthsArray.reduce((acc, width) => acc + width, 0)
      return res
    },
    rowColsWidthsArray () {
      const widths = []
      this.activeCols.forEach((col) => {
        widths.push(col.width)
      })
      return widths
    },
  },
  data () {
    const localCols = cloneDeep(this.cols)
    const firstSchemaName = localCols.schemas[this.cols.activeSchema]
      ? this.cols.activeSchema
      : '_default'
    return {
      activeCols: cloneDeep(this.cols.schemas[firstSchemaName].cols),
      addingRow: undefined,
      colsAddition: false,
      colsSchemaAdd: false,
      currentFilter: this.filter,
      currentMode: this.mode === 1,
      currentViewConfig: Object.assign(defaultConfig, this.viewConfig),
      dateModel: this.dateRange,
      defaultConfig: defaultConfig,
      defaultTheme: defaultTheme,
      dragOptions,
      dynamicCSS: document.createElement('style'),
      editableCol: null,
      editableRow: null,
      hasItemClickHandler: false,
      headerHeight: this.itemHeight + 5,
      itemsCount: 0,
      localCols,
      logger: this.$logger ? this.$logger.extendName(this.name) : new Logger(this.name),
      needResizeControl: true,
      newSchemaName: 'Modified',
      prevDeleteSchemaName: undefined,
      resizing: false,
      scrollStickToBottom: false,  // automatically scroll to the bottom of the table
      showSearch: false,
      uid: 0,
      wrapperHeight: 0,
      wrapperWidth: 0,
    }
  },
  methods: {
    addCustomColumnHandler (colName) {
      const existingCol = this.localCols.enum[colName]
      const scrollEl = this.$refs.scroller && this.$refs.scroller.$el
      let scrollWidth = 0
      const lastCol = this.activeCols[this.activeCols.length - 1] || { name: '', width: 0 }
      const lastColSchema = this.localCols.enum[lastCol.name] || {}
      if (!existingCol) {
        this.localCols.enum[colName] = { name: colName, custom: true }
      }
      if (lastColSchema.__dest === 'etc') {
        this.activeCols.splice(this.activeCols.length - 2, 0, { name: colName, width: 150 })
        this.localCols.schemas[this.activeSchema].cols.splice(this.activeCols.length - 2, 0, { name: colName, width: 150 })
        if (scrollEl) { scrollWidth = scrollEl.scrollWidth - lastCol.width }
      } else {
        this.activeCols.push({ name: colName, width: 150 })
        this.localCols.schemas[this.activeSchema].cols.push({ name: colName, width: 150 })
        if (scrollEl) { scrollWidth = scrollEl.scrollWidth }
      }
      if (scrollWidth && scrollEl) {
        this.$nextTick(() => { scrollEl.scrollLeft = scrollWidth - (this.wrapperWidth / 2) })
      }
      this.updateCols()
    },
    adjustLastEtcColWidth () {
      const fullWidth = this.$refs.wrapper.offsetWidth
      if (this.activeCols && this.activeCols.length && this.rowTotalWidth < fullWidth &&
        this.activeCols[this.activeCols.length - 1].name === 'etc') {
        // if active columns do not fill full screenview width - adjust the width of the last column
        // so that is filled all the remained space to the right
        this.activeCols[this.activeCols.length - 1].width = fullWidth - (this.rowTotalWidth - 150)
      }
    },
    clickHandler ({ index, type, content }) {
      this.$emit('action', { index, type, content })
    },
    closePreventRemoveSchema() {
      setTimeout(() => {
        this.prevDeleteSchemaName = undefined
      }, 200)
    },
    colAddingHandler() {
      this.colsAddition = true
    },
    colsSchemaAddingCloseHandler () {
      this.colsSchemaAdd = false
      this.newSchemaName = 'Modified'
    },
    colsSchemaAddingDoneHandler () {
      const colSchema = {
        name: this.newSchemaName,
        cols: cloneDeep(this.activeCols)
      }
      this.localCols.schemas[colSchema.name] = colSchema
      this.localCols.activeSchema = colSchema.name
      this.colsSchemaAddingCloseHandler()
      delete this.localCols.schemas['_unsaved']
      this.updateCols()
    },
    colsSchemaAddingHandler() {
      this.newSchemaName = 'Modified'
      setTimeout(() => {
        this.colsSchemaAdd = true
      }, 100)
    },
    colsSchemaRemoveHandler (name) {
      setTimeout(() => {
        this.$delete(this.cols.schemas, name)
        this.updateCols()
        this.setPreventRemoveSchema(undefined)
      }, 200)
    },
    customSchemaApply(name) {
      this.localCols.activeSchema = name
      this.updateCols()
    },
    endDragHandler () {
      this.localCols.schemas[this.activeSchema].cols = cloneDeep(this.activeCols)
      this.updateCols()
    },
    getDynamicCSS () {
      let result = ''
      result += this.activeCols.reduce((acc, col, index) => {
        acc += `.uid${this.uid} .item_${index} { width: ${col.width}px }`
        return acc
      }, '')
      return result
    },
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
          rowWidth: this.rowTotalWidth,
          menuCellActive: active
        },
        attrs: {
          'data-index': index
        }
      }
      this.itemprops(index, props)
      return props
    },
    keysProcess (event) {
      // check if keys processing is enabled in config
      if (!this.currentViewConfig.needKeysProcess) { return }
      // process only keyUp and keyDown press
      const keyUpCode = 38
      const keyDownCode = 40
      if (event.which !== keyUpCode && event.which !== keyDownCode) { return }
      // find scrolling list element and current active element
      const scrollingEl = get(this.$refs, 'scroller.$el', undefined)
      const activeEl = document.activeElement
      if (scrollingEl && activeEl && (activeEl === scrollingEl || scrollingEl.contains(activeEl) || activeEl.contains(scrollingEl))) {
        // list element is active - process up and down keys pressed
        // prevent firing scroll events
        event.preventDefault();
        // move list on one line up or down
        const up = (event.which === keyUpCode) ? true : false
        setVerticalScrollPosition(scrollingEl, up ? scrollingEl.scrollTop - this.itemHeight : scrollingEl.scrollTop + this.itemHeight)
        // emit corresponding event
        this.$emit(up ? 'arrowup' : 'arrowdown')
      }
    },
    listScrollHorizontalHandler (scrollInfo) {
      const wrapper = this.$refs.wrapper
      if (wrapper) {
        window.requestAnimationFrame(() => {
          wrapper.querySelector('.list__header').scrollLeft = scrollInfo.position.left
        })
      }
    },
    menuHide () {
      this.editableCol = null
      this.editableRow = null
    },
    menuShow (evt) {
      const el = evt.target.closest('[class*="item_"]')
      const colIndex = el ? el.className.replace(/.*item_(\d+).*/, '$1') : ''
      this.editableCol = colIndex ? {
        index: Number(colIndex),
        data: this.activeCols[colIndex]
      } : null
      const rowEl = el ? el.closest('[class*="row_"]') : null
      const rowElIndex = rowEl ? rowEl.className.replace(/.*row_(\d+).*/, '$1') : ''
      if (rowEl && rowElIndex) {
        const rowIndex = Number(rowElIndex)
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
    onResize (width, index) {
      if (typeof index === 'number') {
        this.activeCols[index].width = width
        this.localCols.schemas[this.activeSchema].cols[index].width = width
        this.updateCols()
      }
      this.updateDynamicCSS()
    },
    removeCol () {
      delete this.localCols.enum[this.editableCol.data.name]
      this.updateCols()
    },
    scrollTo (index) {
      const scrollerElement = this.$refs.scroller.$el
      if (typeof index !== 'number' || index < 0 || !scrollerElement) { return }
      let height = index * this.itemHeight
      if (index > this.items.length - this.itemsCount) { height = scrollerElement.scrollHeight }
      setVerticalScrollPosition(scrollerElement, height)
      this.logger.info(`[scrollTo] Scroll ${JSON.stringify({scrollTop: height, offsetAll: scrollerElement.scrollHeight, index})}`)
    },
    searchBlurHandler() {
      this.searchSubmitHandler()
      this.showSearch = false
    },
    setPreventRemoveSchema(name) {
      this.prevDeleteSchemaName = name
    },
    setUnsavedSchema (cols) {
      const colSchema = {
        name: 'Modified',
        cols: cols
      }
      this.localCols.schemas._unsaved = colSchema
      this.localCols.activeSchema = '_unsaved'
      this.updateCols()
    },
    searchSubmitHandler() {
      this.$emit('change-filter', this.currentFilter)
    },
    toBottomClickHandler () {
      // scroll to the last list item
      this.$refs.scroller.scrollTo(this.items.length - 1)
      // activate auto scrollting to the bottom
      this.scrollStickToBottom = true
      // notify parent that user moved to the bottom of the list
      this.$emit('action-to-bottom')
    },
    toggleCol () {
      if (!this.editableCol) { return }
      const col = this.editableCol.data
      const colEnum = this.localCols.enum[col.name]
      if (colEnum && colEnum.custom) {
        this.removeCol()
      }
      this.activeCols.splice(this.editableCol.index, 1)
      this.localCols.schemas[this.activeSchema].cols.splice(this.editableCol.index, 1)
      this.updateCols()
    },
    updateCols() {
      this.$emit('update-cols', this.localCols)
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
    virtualScrollHandler (info) {
      if (!this.scrollStickToBottom) {
        // check if user has scroller to the bottom to start sticking
        if (info.direction === 'increase' && info.index === info.to && info.index > 0) {
          this.scrollStickToBottom = true
        }
        return
      }
      if (this.scrollStickToBottom) {
        if (info.direction === 'decrease') {
          // user has scrolled up - stop sticking to the bottom
          this.scrollStickToBottom = false
          return
        }
        if (info.index !== info.to) {
          // user wants to stick to the bottom - scroll to the last element if not yet
          this.$refs.scroller.scrollTo(info.to)
        }
      }
    },
    wrapperResizeHandler () {
      const wrapper = this.$refs.wrapper
      if (!wrapper) {
        return false
      }
      // calculate the number of items that fit into the wrapper element
      this.wrapperHeight = wrapper.offsetHeight - this.headerHeight // - header
      this.wrapperWidth = wrapper.offsetWidth
      this.itemsCount = Math.ceil(this.wrapperHeight / this.itemHeight)
    },
  },
  watch: {
    activeCols: {
      deep: true,
      handler (cols, oldCols) {
        if (cols === oldCols) {
          if (this.cols.activeSchema !== '_unsaved') {
            this.setUnsavedSchema(cloneDeep(cols))
          }
        }
        this.adjustLastEtcColWidth()
        this.updateDynamicCSS()
        this.needResizeControl = false
        this.$nextTick(() => {
          this.needResizeControl = true
        })
      }
    },
    cols (cols, oldCols) {
      if (cols !== oldCols) {
        this.activeCols = cloneDeep(cols.schemas[this.activeSchema].cols)
      }
      this.localCols = cloneDeep(cols)
    },
    'cols.activeSchema' (schema, oldSchema) {
      if (schema !== oldSchema && this.cols.schemas[schema]) {
        this.activeCols = cloneDeep(this.cols.schemas[schema].cols)
      }
    },
    filter(val) {
      if (this.currentFilter !== val) {
        this.currentFilter = val
      }
    },
    viewConfig: {
      deep: true,
      handler(config) {
        this.currentViewConfig = Object.assign(this.defaultConfig, config)
      }
    },

    currentMode () {
      this.$emit('change-mode', Number(this.currentMode))
    }

  },
  created () {
    // attach keys processing to enable iterating the table by one row with arrow keys
    document.addEventListener('keydown', this.keysProcess, false)
  },
  mounted () {
    this.adjustLastEtcColWidth()
    // cell click will be processed by parent element - cursor-pinter will be shown on the grid cells
    this.hasItemClickHandler = !!this.$attrs['onItemClick']
    this.uid = uid().split('-')[0]
    this.updateDynamicCSS()
  },
  unmounted () {
    document.removeEventListener('keydown', this.keysProcess)
    const head = document.head || document.getElementsByTagName('head')[0]
    head.removeChild(this.dynamicCSS)
  }
})
</script>

<style lang="sass">
body.mobile
  -webkit-touch-callout: none
  -webkit-user-select: none
.message-viewer
  .list-wrapper
    position: relative
    .list__header
      display: block
      overflow: hidden
      width: 100%
      position: relative
      .header__inner
        position: absolute
        white-space: nowrap
        .header__item
          display: inline-block
          white-space: nowrap
          position: relative
          border-right: 2px solid $grey-6
          .item__label
            text-overflow: ellipsis
            overflow: hidden
            display: block
            padding-left: 5px
            line-height: 24px
          .handle-mr
            position: absolute
            width: 5px
            font-size: 1px
            background: $grey-3
            right: 0px
            cursor: e-resize
            top: 0
            height: 100%
            margin-top: 0
            border: none
            border-right: 2px solid $grey-6
            background-color: inherit
          .resizing .handle-mr
            border-right: 2px solid $yellow-6
            z-index: 2
      .collapsed
        max-width: 40px
.action
  &:hover
    opacity: 1
  opacity: .8
  z-index: 1
  &__to-bottom
    right: 18px
    bottom: 18px
  &__to-new-messages
    right: calc(50% - 76px)
    bottom: 18px
.ghost
  opacity: 0.5
  color: $grey-7
  background: $grey-3
.schema-item
  min-height: 38px
.schema--active
  background-color: $grey-6
  color: white
.list__content
  outline: none
  .q-virtual-scroll__content
    & > *
      display: block
      white-space: nowrap
      &:nth-child(odd)
        background-color: rgba(0, 0, 0, .2)
</style>
