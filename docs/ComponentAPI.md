# Virtual scroll component API
## Props
| Name  | Type | Description  | Default |
|---|---|---|---|
| cols | Object | Schemas of the columns of the grid  | *Required* |
| items |  Array | Items to be displayed in the grid  | *Required* |
| actions | Array | Additional actions available for each cell of the grid, displayed in right-click menu | [] |
| dateRange | [Number, Number] | Timestamps range for the dataset in millisecond | `[Date.now() - 86399000, Date.now()]` |
| filter | String | Initialization text for the filter input | '' |
| hasNewMessages | Boolean | Need show new messages indicator | false |
| i18n | Object | Object with fields of translate some things | {} |
| itemHeight | Number | Height of the row in the grid, in pixels | 19 |
| name | String | Module name for logger | VirtualScrollList |
| panelActions  | Array | Additional actions applicable to the whole table, displayed in the the table menu | [] |
| title | String | Dataset title  | '' |
| theme | Object | Visual view of component | `{datetimepickerColor: 'grey', color: 'grey-9', bgColor: 'white', controlsInverted: false, contentInverted: false,  headerShow: true}` |
| viewConfig |  Object | Functional view of component | `{needShowFilter: false, filterPlaceholder: 'position.speed<=5', needShowDateRange: false, needKeysProcess: false }` |

## Cols
````javascript
cols = {
  activeSchema: '_default',
  schemas: {
    _default: {
      name: '_default',
      cols: [
        { name: 'param#1', width: 150 },
        { name: 'param#2', width: 150 },
        { name: 'param#3', width: 150 },
        { name: 'param#4', width: 150 },
        { name: "timestamp", width: 150 },
        { name: "etc", width: 150, __dest: "etc"}
      ]
    }
  },
  enum: {
    'param#1': {
      name: 'param#1',
      addition: '',   // some addition data for col name
      unit: 'Km/h',   // some addition data for col name
    },
    "param#2": {
      name: "param#2",
      custom: true    // user defined column, will not persist in the list of available columns
    },
    "param#3": {
      name: "param#3"
    },
    "param#4": {
      name: "param#4"
    },
    "timestamp": {
      name: "timestamp"
    },
    "etc": {
      name: "etc",
      __dest: "etc"  // sys destination field. May be only etc
    }
  }
}
````
## Items
````javascript
item = [
  {
    param#1: "String#1000",
    param#2: "String#1000",
    param#3: 1000,
    param#4: "false",
    timestamp": 1747653305429,
    etc: "String#1000"
  },
  {
    param#1: 1001,
    param#2: "String#1001",
    param#3: 1001,
    param#4: "String#1001",
    timestamp: 1747653305430,
    etc: "String#1001"
  },
  {
    param#1: 1002,
    param#2: "String#1002",
    param#3: 1002,
    param#4: "String#1002",
    timestamp: 1747653305431,
    etc: "String#1002"
  }
]
````
## Actions
````javascript
actions = [
  {
    icon: 'mdi-delete',
    label: 'Delete',
    classes: 'text-grey-3',
    type: 'delete'
  },
  {
    icon: 'mdi-pencil',
    label: 'Edit',
    classes: '',
    type: 'edit'
  },
  {
    icon: 'mdi-eye',
    label: 'Show message',
    classes: '',
    type: 'view'
  }
]
````
## i18n
````javascript
i18n = {
  'Columns by schema': 'Columns by schema',
  'Default columns': 'Default columns',
  'Messages not found': 'Messages not found'
}
````
## Panel action
````javascript
panelActions = [
  {
    label: 'CSV',
    icon: 'mdi-file-document-outline',
    handler: () => { console.log("CSV panel action handler called") },
    condition: true,  // will be shown in menu?
    tooltip: 'Save messages to CSV',
    async: true       // flag async spinner
  }
]
````
## Theme
````javascript
theme = {
    color: 'white',              // color of controls
    bgColor: 'dark',             // background of controls
    contentInverted: true,       // flag state of invert of content
    controlsInverted: true,      // flag state of invert of controls
    datetimepickerColor: 'grey', // color for DateRangeModal component
    headerShow: true             // flag need show header
}
````
## viewConfig
````javascript
config = {
    filterPlaceholder: 'position.speed<=5', // placeholder string for filter input
    needShowFilter: false,        // Show filter input
    needShowDateRange: false,     // Set date time components
    needKeysProcess: false,       // Enable rows interation with up/down arrows keys.
}
````

## Events
| Name  |  Description  | Payload |
|:---|:---:|:---|
| action | Clicked action in right-click menu | {index, type, content} |
| arrowup | Arrow up pressed | *Empty* |
| arrowdown | Arrow down pressed | *Empty* |
| change-filter | New filter value is submitted | 'new_filter'|
| action-to-bottom | To-bottom button clicked | *Empty* |
| action-to-new-messages | New messages chip clicked |*Empty* |
| action-to-new-messages-hide | New messages chip's hide button clicked |*Empty* |
| item-click | Grid cell is clicked | {index, content} |
| update-cols | Clumns are updated event | New columns schema |

## Example
In App.vue (You can use component without of Pinia modules):
```javascript
import { VirtualScrollList } from 'qvirtualscroll'

components: {
   VirtualScrollList
}
```

Simple example of template:
```html
  <virtual-scroll-list
    :actions="actions"
    :cols="cols"
    :dateRange="dateRange"
    :filter="filter"
    :items="filteredItems"
    :panelActions="panelActions"
    :theme="theme"
    :viewConfig="viewConfig"
    @action="actionHandler"
    @item-click="itemClickHandler"
    @update-cols="updateColsHandler"
  />
```

## Slots

### list-item
Component for list-item slot has to be designed based on ListItem.vue. All props are required.
```html
  <virtual-scroll-list
    :actions="actions"
    :cols="messagesStore.cols"
    :items="messagesStore.messages"
    :theme="theme"
    :viewConfig="viewConfig"
    @action-to-bottom="toBottomClickHandler"
    @action="actionHandler"
  >
    <template #list-item="{ item, index, cols, itemHeight, rowWidth }">
      <messages-list-item
        :item="item"
        :index="index"
        :cols="cols"
        :itemHeight="itemHeight"
        :rowWidth="rowWidth"
        :menuCellActive="true"
        @item-click="messageListItemClickHandler"
      />
    </template>
  </virtual-scroll-list>
```
### empty
Shown when there are no items to be displayed in the grid, probably because there are no items matching to the filter
```html
  <virtual-scroll-list
    :cols="cols"
    :items="filteredItems"
  >
    <template #empty>
      <div class="text-center" style="background-color: pink; padding: 60px 0 60px;">
        My empty slot template
      </div>
    </template>
  </virtual-scroll-list>
```
### context-menu
Shown upon right-click on the grid
```html
  <virtual-scroll-list
    :cols="cols"
    :items="filteredItems"
  >
    <template #context-menu>
      <div class="text-center" style="background-color: pink; padding: 60px 0 60px;">
        My context menu
      </div>
    </template>
  </virtual-scroll-list>
```
### filter-append
Template goes to append slot of filter input
```html
  <virtual-scroll-list
    :cols="cols"
    :items="filteredItems"
  >
    <template #filter-append>
      <q-btn flat round dense
        icon="mdi-airplane"
        color="pink"
        @click="console.log('Airplane button clicked')"
      />
    </template>
  </virtual-scroll-list>
```

### after-datetime
Template content is displayed after the datetimepicker elements
```html
  <virtual-scroll-list
    :cols="cols"
    :items="filteredItems"
  >
    <template #after-datetime>
      <q-btn flat round dense
        icon="mdi-airplane"
        color="pink"
        @click="console.log('Airplane button clicked')"
      />
    </template>
  </virtual-scroll-list>
```
