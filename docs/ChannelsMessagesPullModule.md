# Channels messages vuex module with pull mode
Module for processing and storing messages poll from the channel
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
|active| ID of active channel| 0|
|messages| Array of messages by channel| []|
|filter| Filter string| ''|
|mode| Mode of module(Real-Time or History)| null|
|from| 'from' time limit| 0|
|limit| Limit count of messages| 1000|
|cols| Array of fields by settings of logs| []|
|selected| Selected messages array | [] |
|offline| Socket status flag | false |
#### Actions
| Name  |  Description  | Payload |
|---|---|---|
|getCols| Retrieving and saving a list of all message fields| *Empty*|
|get| Retrieving and saving a list of all message| preaction: { name: preactionName, payload: preactionPayload }|
|pollingGet| Retrieving and saving a list of all messages by long-polling| *Empty*|
|unsubscribePooling| Remove polling | *Empty* |
#### Mutations
| Name  |  Description  | Payload |
|---|---|---|
|setMessages| Saving a list of message| array_of_messages|
|clearMessages| Clearing a list of all message| *Empty*|
|setLimit| Setting a limit count of messages| limit|
|setFilter| Setting a filter string| filter_string|
|setMode| Setting a mode of module(Real-Time or History)| mode(0-History, 1- Real-Time)|
|setFrom| Setting a 'from' time limit| timestamp|
|clear| Clearing state of module| *Empty*|
|setActive| Setting a active channel id | id|
|setCols| Setting a array of fields by settings of logs | cols: [{name: 'field_name',width: 85,display: true,description: 'Description current field'}...]|
|setSelected| Set selected indexes messages | [1,2,3] |
|clearSelected| Clear selected indexes messages| *Empty* |

## Example
```javascript
import {
    channelsMessagesModulePull
} from 'qvirtualscroll'

 beforeCreate () {
   this.$store.registerModule(
     moduleName, channelsMessagesModulePull({
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
