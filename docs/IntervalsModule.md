# Intervals module
Module for processing and storing messages from the device
## Vuex plugin generator params
|Name| Description | Value |
| :-- | :---: | :-- |
|Vue| Vue instance | *required* |
|LocalStorage| Quasar LocalStorage instance | *required* |
|name| Vuex module name or { name: module_name, lsNamespace: 'path.to.root' } | *required* |
|errorHandler| Custom error handler | function |
|filterHandler| Custom filter handler | function |
|newMessagesInterseptor| Custom modifiing messages handler | function |
#### Fields
| Name  |  Description  | Init Value |
|---|---|---|
|name| module name | '' |
|isLoading| module async processing flag | false |
|active| ID of active calc| 0|
|activeDevice| ID of active device| 0|
|messages| Array of intervals| []|
|filter| Filter string| ''|
|mode| Mode of module(Real-Time or History)| null|
|begin| 'from' time limit| 0|
|end| 'to' time limit| 0|
|limit| Limit count of messages| 1000|
|cols| Array of fields by settings of logs| []|
|selected| Selected messages array | [] |
|offline| Socket status flag | false |
|sortBy| Message field name filtering by | '' |
#### Actions
| Name  |  Description  | Payload |
|---|---|---|
|getCols| Retrieving and saving a list of all message fields| *Empty*|
|get| Retrieving and saving a list of all message| preaction: { name: preactionName, payload: preactionPayload }|
|pollingGet| Retrieving and saving a list of all messages | *Empty*|
|unsubscribePooling| Remove polling | *Empty* |
|initTime| Initing from/to by last message | *Empty* |
#### Mutations
| Name  |  Description  | Payload |
|---|---|---|
|setMessages| Saving a list of message| array_of_messages|
|clearMessages| Clearing a list of all message| *Empty*|
|setLimit| Setting a limit count of messages| limit|
|setFilter| Setting a filter string| filter_string|
|setMode| Setting a mode of module(Real-Time or History)| mode(0-History, 1- Real-Time)|
|setDate| Setting a 'from' and 'to' time limit of time| timestamp|
|dateNext| Setting a 'from' and 'to' time limit of next day| *Empty*|
|datePrev| Setting a 'from' and 'to' time limit of previous day| *Empty*|
|paginationPrev| Setting a 'from' and 'to' time limit of previous page of messages by limit| timestamp_of_first_message|
|paginationNext| Setting a 'from' and 'to' time limit of next page of messages by limit| timestamp_of_last_message|
|setBegin| Setting a 'from' time limit| timestamp|
|setEnd| Setting a 'to' time limit| timestamp|
|clearTimer| Killing interval of pollingGet action| *Empty*|
|setReverse| Setting a flag 'reverse'| reverse_flag|
|clear| Clearing state of module| *Empty*|
|setActive| Setting a active calc id | id|
|setActiveDevice| Setting a active device id | id|
|setCols| Setting a array of fields by settings of logs | cols: [{name: 'field_name',width: 85,display: true,description: 'Description current field'}...]|
|setSelected| Set selected indexes messages | [1,2,3] |
|clearSelected| Clear selected indexes messages| *Empty* |
|setOffline| Set module offline flag | Need add meesage offline to pull {Boolean} |
|setReconnected| Set reconnect module flag | Need add meesage offline to pull {Boolean} |
|setSortBy| Set sort by field | Field name |
|clearSortBy| Clear sort by field | *Empty* |

## Example
```javascript
import {
    intervalsModule
} from 'qvirtualscroll'


 beforeCreate () {
   this.$store.registerModule(
     moduleName, intervalsModule({
       Vue,
       LocalStorage: this.$q.localStorage,
       name: this.moduleName,
       errorHandler: (err) => { this.$store.commit('reqFailed', err) },
       filterHandler: (filter, messages) => {/**some filtering logic**/},
       newMessagesInterseptor: (messages) => {/**some modifiing logic**/}
      })
    )
 }
