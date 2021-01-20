import get from 'lodash/get'
import set from 'lodash/set'

function splitSchemas (cols) {
  const customColsSchema = {
    ...cols.schemas,
    _default: undefined,
    _protocol: undefined,
    _unsaved: undefined
  }
  const defaultColsSchema = {
    activeSchema: cols.activeSchema,
    schemas: {
      _default: cols.schemas._default,
      _protocol: cols.schemas._protocol,
      _unsaved: cols.schemas._unsaved
    },
    enum: cols.enum
  }
  return { customColsSchema, defaultColsSchema }
}
function getColsLS (LocalStorage, lsNamespace, name) {
  let colsFromStorage = {}
  if (lsNamespace) {
    const lsPath = lsNamespace.split('.'),
      lsItemName = lsPath.shift(),
      lsRouteToItem = `${lsPath.join('.')}.${name}`,
      appStorage = LocalStorage.getItem(lsItemName)
    colsFromStorage = get(appStorage, lsRouteToItem, colsFromStorage)
  } else {
    colsFromStorage = LocalStorage.getItem(name) || colsFromStorage
  }
  return colsFromStorage
}

function setColsLS (LocalStorage, lsNamespace, name, active, cols) {
  const colsFromStorage = getColsLS(LocalStorage, lsNamespace, name) || {}
  const { customColsSchema, defaultColsSchema } = splitSchemas(cols)
  colsFromStorage[active] = defaultColsSchema
  colsFromStorage['custom-cols-schemas'] = { ...customColsSchema }
  if (lsNamespace) {
    const lsPath = lsNamespace.split('.'),
      lsItemName = lsPath.shift(),
      lsRouteToItem = `${lsPath.join('.')}.${name}`,
      appStorage = LocalStorage.getItem(lsItemName) || {}
    set(appStorage, lsRouteToItem, colsFromStorage)
    LocalStorage.set(lsItemName, appStorage)
  } else {
    LocalStorage.set(name, colsFromStorage)
  }
}

export {
  getColsLS,
  setColsLS
}
