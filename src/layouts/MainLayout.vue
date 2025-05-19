<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page>
        <div class="absolute-top-left absolute-bottom-right">
          <virtual-scroll-list
            :actions="actions"
            :cols="cols"
            :dateRange="dateRange"
            :filter="filter"
            :i18n="{from: 'FROM', to: 'TO'}"
            :items="filteredItems"
            :panelActions="panelActions"
            :theme="theme"
            :viewConfig="viewConfig"
            @action="actionHandler"
            @change-filter="filterChangeHandler"
            @item-click="itemClickHandler"
            @update-cols="updateColsHandler"
          >
            <template #after-datetime>
              <q-checkbox dark
                v-model="run"
                unchecked-icon="mdi-play" checked-icon="mdi-pause"/>
            </template>
        </virtual-scroll-list>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import VirtualScrollList from '../components/VirtualScrollList.vue'
import cols from '../data/cols.json'

function getCols (cols) {
  const schema = {
    activeSchema: '_default',
    schemas: {
      _default: {
        name: '_default',
        cols: [
          { name: 'param#2', width: 150 },
          { name: 'param#3', width: 150 },
          { name: 'param#4', width: 150 },
          { name: 'param#5', width: 150 },
          { name: "etc", width: 150, __dest: "etc"}
        ]
      },
      _protocol: {
        name: '_protocol',
        cols: cols.filter(col => !col.custom).map(col => ({ name: col.name, width: 150 }))
      },
      _unsaved: {
        name: 'Modified',
        cols: cols.map(col => ({ name: col.name, __dest: col.__dest, width: 150 }))
      }
    },
    enum: cols.reduce((res, col) => {
      res[col.name] = { name: col.name, __dest: col.__dest, custom: col.custom }
      return res
    }, {})
  }
  return schema
}

export default defineComponent({
  name: 'MainLayout',
  components: {
    VirtualScrollList
  },
  computed: {
    filteredItems: {
      get () {
        return this.filter ? this.filterItems(this.filter) : this.items
      }
    }
  },
  data () {
    return {
      actions: [
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
        }
      ],
      cols: getCols(cols),
      currentVal: 1000,
      dateRange: [Date.now() - (86400000 * 2), Date.now() - 86400000],
      defaultLimit: 30, //1000,
      filter: '',
      items: [],
      run: false,   // generate and append new items to immitate sending messages by device
      panelActions: [
        {
          label: 'CSV',
          icon: 'mdi-file-document-outline',
          handler: () => { console.log("CSV panel action handler called") },
          condition: true,
          tooltip: 'Save messages to CSV',
          async: true
        }
      ],
      timerId: 0,
      theme: {
        color: 'white',
        bgColor: 'grey-9',
        contentInverted: true,
        controlsInverted: true
      },
      viewConfig: {
        needShowPageScroll: 'right left',
        needShowDateRange: true,
        needShowDate: true,
        needShowFilter: true,
        needShowEtc: true,
        needKeysProcess: true
      },
    }
  },
  methods: {
    actionHandler ({ index, type, content }) {
      switch (type) {
        case 'delete': {
          this.deleteMessageHandler({ index, content })
          break
        }
        case 'edit': {
          this.editMessageHandler({ index, content })
          break
        }
      }
    },
    deleteMessageHandler ({ index, content }) {
      alert(`delete item #${index}: ${JSON.stringify(content)}`)
    },
    editMessageHandler ({ index, content }) {
      alert(`edit item#${index}: ${JSON.stringify(content)}`)
    },
    filterChangeHandler (val) {
      if (this.filter !== val) {
        this.filter = val
      }
    },
    filterItems (filter) {
      function getPartsOfFilter (filterString) {
        const filtersStringArr = filterString.split(',')

        return filtersStringArr.reduce((acc, filter) => {
          let parts = [],
            operation = ''
          if (filter.indexOf('!=') !== -1) {
            parts = filter.split('!=')
            operation = '!='
          } else if (filter.indexOf('<=') !== -1) {
            parts = filter.split('<=')
            operation = '<='
          } else if (filter.indexOf('>=') !== -1) {
            parts = filter.split('>=')
            operation = '>='
          } else if (filter.indexOf('=') !== -1) {
            parts = filter.split('=')
            operation = '='
          } else if (filter.indexOf('<') !== -1) {
            parts = filter.split('<')
            operation = '<'
          } else if (filter.indexOf('>') !== -1) {
            parts = filter.split('>')
            operation = '>'
          } else {
            parts = [filter, null]
            operation = 'exist'
          }
          if (operation) {
            acc.push({
              operation: operation,
              field: parts[0],
              value: parts[1]
            })
          }
          return acc
        }, [])
      }
      if (filter) {
        const filters = getPartsOfFilter(filter)
        return this.items.filter(message => {
          return filters.reduce((flag, filter) => {

            switch (filter.operation) {
              case '!=': {
                return flag && !!message[filter.field] && message[filter.field] != filter.value
              }
              case '<=': {
                return flag && !!message[filter.field] && message[filter.field] <= filter.value
              }
              case '>=': {
                return flag && !!message[filter.field] && message[filter.field] >= filter.value
              }
              case '=': {
                return flag && !!message[filter.field] && message[filter.field] == filter.value
              }
              case '<': {
                return flag && !!message[filter.field] && message[filter.field] < filter.value
              }
              case '>': {
                return flag && !!message[filter.field] && message[filter.field] > filter.value
              }
              default: {
                return flag && !!message[filter.field]
              }
            }

          }, true)
        })
      }
    },
    generateItems () {
      const limit = this.run === false ? this.defaultLimit : 2
      const randVal = () => {
        const types = ['String', 'Number', 'Boolean'],
          currentType = types[Math.round(Math.random() * 2)]
        switch (currentType) {
          case 'String': {
            return `String#${this.currentVal}`
          }
          case 'Number': {
            return this.currentVal
          }
          case 'Boolean': {
            return this.currentVal % 2 ? 'true' : 'false'
          }
        }
      }
      for (let i = 0; i < limit; i++) {
        const item = this.cols.schemas[this.cols.activeSchema].cols.reduce((res, col) => {
          res[col.name] = randVal()
          return res
        }, {})
        item.timestamp = this.dateRange[0] + this.currentVal
        this.items.push(item)
        this.currentVal += 1
      }
    },
    itemClickHandler (info) {
      console.log("itemClickHandler", info)
    },
    updateColsHandler () {
      // console.log("columns updated", JSON.stringify(newCols))
    }
  },
  watch: {
    run (val) {
      switch (val) {
        case false: {
          if (this.timerId) {
            clearInterval(this.timerId)
            this.timerId = 0
            break
          }
          // this.items.length = 0
          this.generateItems()
          break
        }
        case true: {
          // this.items.length = 0
          this.generateItems()
          this.timerId = setInterval(this.generateItems, 2000)
          break
        }
      }
    },
  },
  created () {
    setTimeout(() => {
      this.generateItems()
    }, 3000)
  }
})
</script>
