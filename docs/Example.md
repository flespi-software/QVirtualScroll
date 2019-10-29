In quasar.conf.js
```javascript
framework: {
  components: [
    'QResizeObservable',
    'QWindowResizeObservable',
    'QInput',
    'QToggle',
    'QToolbar',
    'QToolbarTitle',
    'QDatetime',
    'QBtn',
    'QIcon',
    'QSearch',
    'QTooltip',
    'QModal',
    'QModalLayout',
    'QSlider',
    'QField',
    'QCheckbox',
    'QPopover',
    'QBtnToggle'
  ]
}
```

In App.vue (You can use component without of Vuex modules):
```javascript
import {
    VirtualScrollList,
    logsModule,
    channelsMessagesPullModule,
    channelsMessagesSerialModule,
    devicesMessagesModule,
    intervalsModule
} from 'qvirtualscroll'

 components: {
   VirtualScrollList
 },
 beforeCreate () {
   this.$store.registerModule(
     moduleName, logsModule({
      Vue,
      LocalStorage: this.$q.localStorage,
      name: this.moduleName,
      errorHandler: (err) => { this.$store.commit('reqFailed', err) },
      filterHandler: (filter, messages) => {/**some filtering logic**/},
      newMessagesInterseptor: (messages) => {/**some modifiing logic**/}
    })
  )
  this.$store.registerModule(
     moduleName, channelsMessagesPullModule({
      Vue,
      LocalStorage: this.$q.localStorage,
      name: this.moduleName,
      errorHandler: (err) => { this.$store.commit('reqFailed', err) },
      filterHandler: (filter, messages) => {/**some filtering logic**/},
      newMessagesInterseptor: (messages) => {/**some modifiing logic**/}
    })
  )
  this.$store.registerModule(
     moduleName, channelsMessagesSerialModule({
      Vue,
      LocalStorage: this.$q.localStorage,
      name: this.moduleName,
      errorHandler: (err) => { this.$store.commit('reqFailed', err) },
      filterHandler: (filter, messages) => {/**some filtering logic**/},
      newMessagesInterseptor: (messages) => {/**some modifiing logic**/}
    })
  )
  this.$store.registerModule(
     moduleName, devicesMessagesModule({
      Vue,
      LocalStorage: this.$q.localStorage,
      name: this.moduleName,
      errorHandler: (err) => { this.$store.commit('reqFailed', err) },
      filterHandler: (filter, messages) => {/**some filtering logic**/},
      newMessagesInterseptor: (messages) => {/**some modifiing logic**/}
    })
  )
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
    'logs': {
       needShowFilter: true,
       needShowMode: true,
       needShowPageScroll: 'right left',
       needShowDate: true
    },
    'channelsMessagesPull': {
       needShowFilter: true,
        needShowMode: true,
        needShowPageScroll: 'right',
        needShowDate: false
    },
    'channelsMessagesSerial': {
       needShowFilter: true,
       needShowMode: true,
       needShowPageScroll: 'right left',
       needShowDate: true
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
