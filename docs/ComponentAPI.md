# Virtual scroll component API
## Props
| Name  | Type | Description  | Default |
|---|---|---|---|
| actions  | Array  | A array of actions that displays for each of row data| [] |
|  cols | Array  | A array of cols of data  |*Required*|
|  items |  Array | A array of items of list  |*Required*|
|  i18n | Object  |  Object with fields of translate some things |{}|
|  dateRange | Number  | The timestamps range for dataset component  |0|
|  filter | String  |  Init text for filter input |''|
|  title | String  |  Title dataset section  |''|
| mode |  Number |  Inverted mode. Color is applied to background instead. |0|
| viewConfig |  Object |  Config for view of component |{ needShowFilter: false,needShowMode: false,needShowPageScroll: '',needShowEtc: false}|
| colsConfigurator |  String |  String that displays where need show control of configurator of cols. Can be a 'header', 'toolbar' and 'none' |'none'|
| theme |  Object |  Object of params that modifies view of component |{color: 'dark', bgColor: 'white', controlsInverted: false, contentInverted: false}|
| itemHeight |  Number |  Height of list item |19|

## Action
````javascript
action = {
    icon: 'add',
    label: 'add',
    classes: 'text-grey-3',
    type: 'add'
}

````
## Col
````javascript
col = {
    name: 'param#1',
    width: 150,
    display: true,
    addition: '' // some addition data for col name
}

````
## Item
````javascript
item = {
    'param#1': 'param#1',
    'param#2': 'param#2',
    'param#3': 'param#2',
    timestamp: 1509494400000
}

````

## Theme
````javascript
theme = {
    color: 'white', // color of controls
    bgColor: 'dark', // background of controls
    contentInverted: true, // flag state of invert of content
    controlsInverted: true, // flag state of invert of controls
    headerShow: true // flag need show header
}

````

## viewConfig
````javascript
config = {
    needShowMode: false, // Flag that displays need show mode control or not
    needShowFilter: false, // Flag that displays need filter input or not
    needShowPageScroll: '', // String that displays which controls scroll by limit is needed show. Example: 'right left'
    needShowEtc: false, // Flag that displays need show field etc in list items or not
    needShowDateRange: false, // Flag that displays need show dateRange-set or not.
}

````

## Events
| Name  |  Description  | Payload |
|:---|:---:|:---|
|change:filter| Handling change of filter| 'new_filter'|
|update:cols|Handling change settings of cols |[{col},{col}]|
|change:mode|Handling change mode |current mode|
|action|Handling click by icon one of action |{index, type, content}|
|item-click|Handling click by item |{index, content}|
|change:pagination-prev|Handling click by control for scroll by limit (previous *limit* items)  |*Empty*|
|change:pagination-next|Handling click by control for scroll by limit (next *limit* items)  |*Empty*|
|change:date-range|Handling click by control for change current in datesetRange-component  |timestamps array|
|change:date-range-prev|Handling click by control for change current date range for previous day  |*Empty*|
|change:date-range-next|Handling click by control for change current date range for next day  |*Empty*|
|scroll| Scroll event  |{ event, data: { offset, offsetAll, start, end } }|
|scroll:top| Scroll event to top  |*Empty*|
|scroll:bottom| Scroll event to bottom  |*Empty*|

## Example
In quasar.conf.js
```javascript
framework: {
  components: [
    'QResizeObserver',
    'QInput',
    'QToolbar',
    'QToolbarTitle',
    'QBtn',
    'QCard',
    'QCardSection',
    'QCardActions',
    'QSeparator',
    'QIcon',
    'QTooltip',
    'QDialog',
    'QSlider',
    'QBtnToggle'
  ]
}
```
In App.vue (You can use component without of Vuex modules):
```javascript
import { VirtualScrollList } from 'qvirtualscroll'

 components: {
   VirtualScrollList
 }
```
Simple example of template:
```html
<virtual-scroll-list
      v-if="type && active"
      :cols="cols"
      :items="messages"
      :actions="actions"
      :date="from"
      :mode="mode"
      :needShowMode="true"
      :needShowPageScroll="true"
      :needShowDate="true"
      :needShowFilter="true"
      :colsConfigurator="'toolbar'"
      :i18n="i18n"
      :filter="filter"
      :theme="theme"
      @change:filter="filterChangeHandler"
      @change:pagination-prev="paginationPrevChangeHandler"
      @change:pagination-next="paginationNextChangeHandler"
      @change:date="dateChangeHandler"
      @change:date-prev="datePrevChangeHandler"
      @change:date-next="dateNextChangeHandler"
      @action="actionsHandler"
      @change:mode="modeChange"
      @update:cols="updateColsHandler"
    >
</virtual-scroll-list>
```

You can use component with scoped slot:
```html
<virtual-scroll-list
      v-if="type && active"
      :cols="cols"
      :items="messages"
      :actions="actions"
      :date="from"
      :mode="mode"
      :needShowMode="true"
      :needShowPageScroll="true"
      :needShowDate="true"
      :needShowFilter="true"
      :colsConfigurator="'toolbar'"
      :i18n="i18n"
      :filter="filter"
      :theme="theme"
      @change:filter="filterChangeHandler"
      @change:pagination-prev="paginationPrevChangeHandler"
      @change:pagination-next="paginationNextChangeHandler"
      @change:date="dateChangeHandler"
      @change:date-prev="datePrevChangeHandler"
      @change:date-next="dateNextChangeHandler"
      @action="actionsHandler"
      @change:mode="modeChange"
      @update:cols="updateColsHandler"
    >
      <list-item-custom slot="items" slot-scope="{item, index, actions, cols, etcVisible, actionsVisible, itemHeight, rowWidth}"
         :item="item"
         :index="index"
         :actions="actions"
         :cols="cols"
         :etcVisible="etcVisible"
         :actionsVisible="actionsVisible"
         @action="actionsHandler"
      />
    </virtual-scroll-list>
```
## Slots
### Empty state
```html
<div slot="empty" class="no-messages text-center" style="font-size: 3rem; padding-top: 40px;">
  Messages not found
</div>
```
## Scoped slot
Component for scoped slot need design based on ListItem.vue. You can just expand yours component. All props is required.
```html
 <list-item-custom
   slot="items"
   slot-scope="{item, index, actions, cols, etcVisible, actionsVisible, itemHeight, rowWidth}"
   :item="item"
   :index="index"
   :actions="actions"
   :cols="cols"
   :etcVisible="etcVisible"
   :actionsVisible="actionsVisible"
   @action="actionsHandler"
 />

```
