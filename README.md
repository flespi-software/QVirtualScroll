# QVirtualScroll

> Simple Quasar component based on [VueVirtualScrollList](https://github.com/tangbc/vue-virtual-scroll-list) that displays any data in virtual scroll list and Vuex modules that get and process data from flespi.io

## Install
````bash
$ npm install git+https://github.com/flespi-software/QVirtualScroll.git --save
````

## Props
| Name  | Type | Description  |Default |
|---|---|---|---|
| actions  | Array  | A array of actions that displays for each of row data| [] |
|  cols | Array  | A array of cols of data  |*Required*|
|  items |  Array | A array of items of list  |*Required*|
|  i18n | Object  |  Object with fields of translate some things |{}|
|  date | Number  | The timestamp for dataset component  |0|
|  filter | String  |  Init text for filter input |''|
| mode |  Number |  Inverted mode. Color is applied to background instead. |0|
| needShowMode |  Boolean |  Flag that displays need show mode control or not. |false|
| needShowFilter |  Boolean |  Flag that displays need filter input or not. |false|
| needShowPageScroll |  String |  String that displays which controls scroll by limit is needed show. Example: 'right left' |''|
| colsConfigurator |  String |  String that displays where need show control of configurator of cols. Can be a 'header', 'toolbar' and 'none' |'none'|
| theme |  Object |  Object of params that modifies view of component |{color: 'dark', bgColor: 'white', controlsInverted: false, contentInverted: false}|

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
    display: true
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
    controlsInverted: true // flag state of invert of controls
}

````

## Events
| Name  |  Description  | Payload |
|---|---|---|
|change:filter| Handling change of filter| 'new_filter'|
|update:cols|Handling change settings of cols |[{col},{col}]|
|change:mode|Handling change mode |current mode|
|action|Handling click by icon one of action |{index, type, content}|
|change:pagination-prev|Handling click by control for scroll by limit (previous *limit* items)  |*Empty*|
|change:pagination-next|Handling click by control for scroll by limit (next *limit* items)  |*Empty*|
|change:date-prev|Handling click by control for change current date for previous day  |*Empty*|
|change:date-next|Handling click by control for change current date for next day  |*Empty*|
|change:date|Handling click by control for change current in dateset-component  |timestamp of start picked day|

## Requirements:

- [Node.js](https://nodejs.org/en/) (>=6.x)
- npm version 3+ and [Git](https://git-scm.com/).

## Example
In App.vue (You can use component without of Vuex modules):
```javascript
import {
    VirtualScrollList,
    channelsLogsModule,
    channelsMessagesModule,
    devicesMessagesModule
} from 'qvirtualscroll'
 
 components: {
   VirtualScrollList
 },
 created () {
   channelsLogsModule(this.$store, Vue)
   channelsMessagesModule(this.$store, Vue)
   devicesMessagesModule(this.$store, Vue)
 }
```
Examples of config view of component by type of module
```javascript
configByType: {
    'devicesMessages': {
       needShowFilter: true,
       needShowMode: true,
       needShowPageScroll: 'right left',
       needShowDate: true
     },
    'channelsLogs': {
       needShowFilter: true,
       needShowMode: true,
       needShowPageScroll: 'right left',
       needShowDate: true
    },
    'channelsMessages': {
       needShowFilter: true,
        needShowMode: true,
        needShowPageScroll: 'right',
        needShowDate: false
    }
}
```
Simple example of template:
````vue
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
````

You can use component with scoped slot:
````vue
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
````
## Scoped slot
Component for scoped slot need design based on ListItem.vue. You can just expand yours component. All props is required. 
````vue
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

````

## Demo
[Demo](https://flespi-software.github.io/QVirtualScroll/)

## License
[MIT](https://github.com/flespi-software/QVirtualScroll/blob/master/LICENSE) license.