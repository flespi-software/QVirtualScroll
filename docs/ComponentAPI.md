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
| viewConfig |  Object |  Config for view of component |{ needShowFilter: false }|
| colsConfigurator |  String |  String that displays where need show control of configurator of cols. Can be a 'header', 'toolbar' and 'none' |'none'|
| theme |  Object |  Object of params that modifies view of component |{color: 'dark', bgColor: 'white', controlsInverted: false, contentInverted: false}|
| itemHeight |  Number |  Height of list item |19|
| autoscroll |  Boolean |  Need autoscroll flag |false|
| hasNewMessages |  Boolean or null |  Need show new messages indicator |undefined|

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
    __dest: 'action', // sys destination fields. May be action or etc
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
    needShowFilter: false, // Flag that displays need filter input or not
    needShowDateRange: false, // Flag that displays need show dateRange-set or not.
}

````

## Events
| Name  |  Description  | Payload |
|:---|:---:|:---|
|change:filter| Handling change of filter| 'new_filter'|
|edit:cols| Emiting on click by edit cols button | *Empty* |
|action|Handling click by icon one of action |{index, type, content}|
|item-click|Handling click by item |{index, content}|
|change:pagination-prev|Handling click by control for scroll by limit (previous *limit* items)  |*Empty*|
|change:pagination-next|Handling click by control for scroll by limit (next *limit* items)  |*Empty*|
|change:date-range|Handling click by control for change current in datesetRange-component  |timestamps array|
|scroll| Scroll event  |{ event, data: { offset, offsetAll, start, end } }|
|scroll:top| Scroll event to top |*Empty*|
|scroll:bottom| Scroll event to bottom |*Empty*|
|action:to-bottom| Action event on to-bottom button |*Empty*|
|action:to-new-messages| Action event on to-new-messages indicator |*Empty*|
|action:to-new-messages-hide| Action event on to-new-messages hide button |*Empty*|

## Methods
| Name  |  Description  | Params |
|:---|:---:|:---|
|enableAutoscroll| Enable autoscroll of wrapper | *Empty* |
|disableAutoscroll| Enable autoscroll of wrapper | *Empty* |

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
      :date-range="[old, now]"
      :colsConfigurator="'toolbar'"
      :i18n="i18n"
      :filter="filter"
      :theme="theme"
      @change:filter="filterChangeHandler"
      @change:pagination-prev="paginationPrevChangeHandler"
      @change:pagination-next="paginationNextChangeHandler"
      @change:date-range="dateChangeHandler"
      @change:date-range-prev="datePrevChangeHandler"
      @change:date-range-next="dateNextChangeHandler"
      @action="actionsHandler"
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
      :date-range="[old, now]"
      :colsConfigurator="'toolbar'"
      :i18n="i18n"
      :filter="filter"
      :theme="theme"
      @change:filter="filterChangeHandler"
      @change:pagination-prev="paginationPrevChangeHandler"
      @change:pagination-next="paginationNextChangeHandler"
      @change:date-range="dateChangeHandler"
      @change:date-range-prev="datePrevChangeHandler"
      @change:date-range-next="dateNextChangeHandler"
      @action="actionsHandler"
      @update:cols="updateColsHandler"
    >
      <list-item-custom slot="items" slot-scope="{item, index, actions, cols, itemHeight, rowWidth}"
         :item="item"
         :index="index"
         :actions="actions"
         :cols="cols"
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
   slot-scope="{item, index, actions, cols, etcVisible, rowWidth}"
   :item="item"
   :index="index"
   :actions="actions"
   :cols="cols"
   @action="actionsHandler"
 />

```

# Columns Editor Component API

## Props
| Name  | Type | Description  | Default |
|---|---|---|---|
| cols  | Array  | A array of columns. Structure written upster. | *required* |

## Events
| Name  |  Description  | Payload |
|:---|:---:|:---|
|cols:close| Close button clicked | *empty* |
|cols:update| Columns updated | cols |
|cols:default| Default button clicked | *empty* |

## Example

In quasar.conf.js
```javascript
framework: {
  components: [
    'QInput',
    'QBtn',
    'QIcon',
    'QTooltip',
    'QDialog',
    'QSlider',
    'QList',
    'QItem',
    'QItemSection',
    'QItemLabel',
    'QScrollArea'
  ]
}
```
In App.vue (You can use component without of Vuex modules):
```javascript
import { ColsEditor } from 'qvirtualscroll'

 components: {
   ColsEditor
 }
```
Simple example of template:
```html
<cols-editor
  :cols="colsForEditing"
  @cols:close="hideHandler"
  @cols:update="updateColsHandler"
  @cols:default="setDefaultColsHandler"
/>
```
