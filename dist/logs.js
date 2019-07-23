"use strict";function unwrapExports(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}function createCommonjsModule(e,t){return e(t={exports:{}},t.exports),t.exports}var ceil=Math.ceil,floor=Math.floor,_toInteger=function(e){return isNaN(e=+e)?0:(0<e?floor:ceil)(e)},_defined=function(e){if(null==e)throw TypeError("Can't call method on  "+e);return e},_stringAt=function(a){return function(e,t){var r,n,o=String(_defined(e)),i=_toInteger(t),s=o.length;return i<0||s<=i?a?"":void 0:(r=o.charCodeAt(i))<55296||56319<r||i+1===s||(n=o.charCodeAt(i+1))<56320||57343<n?a?o.charAt(i):r:a?o.slice(i,i+2):n-56320+(r-55296<<10)+65536}},_library=!0,_global=createCommonjsModule(function(e){var t=e.exports="undefined"!=typeof window&&window.Math==Math?window:"undefined"!=typeof self&&self.Math==Math?self:Function("return this")();"number"==typeof __g&&(__g=t)}),_core=createCommonjsModule(function(e){var t=e.exports={version:"2.6.9"};"number"==typeof __e&&(__e=t)}),_core_1=_core.version,_aFunction=function(e){if("function"!=typeof e)throw TypeError(e+" is not a function!");return e},_ctx=function(n,o,e){if(_aFunction(n),void 0===o)return n;switch(e){case 1:return function(e){return n.call(o,e)};case 2:return function(e,t){return n.call(o,e,t)};case 3:return function(e,t,r){return n.call(o,e,t,r)}}return function(){return n.apply(o,arguments)}},_isObject=function(e){return"object"==typeof e?null!==e:"function"==typeof e},_anObject=function(e){if(!_isObject(e))throw TypeError(e+" is not an object!");return e},_fails=function(e){try{return!!e()}catch(e){return!0}},_descriptors=!_fails(function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a}),document$1=_global.document,is=_isObject(document$1)&&_isObject(document$1.createElement),_domCreate=function(e){return is?document$1.createElement(e):{}},_ie8DomDefine=!_descriptors&&!_fails(function(){return 7!=Object.defineProperty(_domCreate("div"),"a",{get:function(){return 7}}).a}),_toPrimitive=function(e,t){if(!_isObject(e))return e;var r,n;if(t&&"function"==typeof(r=e.toString)&&!_isObject(n=r.call(e)))return n;if("function"==typeof(r=e.valueOf)&&!_isObject(n=r.call(e)))return n;if(!t&&"function"==typeof(r=e.toString)&&!_isObject(n=r.call(e)))return n;throw TypeError("Can't convert object to primitive value")},dP=Object.defineProperty,f=_descriptors?Object.defineProperty:function(e,t,r){if(_anObject(e),t=_toPrimitive(t,!0),_anObject(r),_ie8DomDefine)try{return dP(e,t,r)}catch(e){}if("get"in r||"set"in r)throw TypeError("Accessors not supported!");return"value"in r&&(e[t]=r.value),e},_objectDp={f:f},_propertyDesc=function(e,t){return{enumerable:!(1&e),configurable:!(2&e),writable:!(4&e),value:t}},_hide=_descriptors?function(e,t,r){return _objectDp.f(e,t,_propertyDesc(1,r))}:function(e,t,r){return e[t]=r,e},hasOwnProperty={}.hasOwnProperty,_has=function(e,t){return hasOwnProperty.call(e,t)},PROTOTYPE="prototype",$export=function(e,t,r){var n,o,i,s=e&$export.F,a=e&$export.G,c=e&$export.S,u=e&$export.P,l=e&$export.B,f=e&$export.W,p=a?_core:_core[t]||(_core[t]={}),_=p[PROTOTYPE],d=a?_global:c?_global[t]:(_global[t]||{})[PROTOTYPE];for(n in a&&(r=t),r)(o=!s&&d&&void 0!==d[n])&&_has(p,n)||(i=o?d[n]:r[n],p[n]=a&&"function"!=typeof d[n]?r[n]:l&&o?_ctx(i,_global):f&&d[n]==i?function(n){function e(e,t,r){if(this instanceof n){switch(arguments.length){case 0:return new n;case 1:return new n(e);case 2:return new n(e,t)}return new n(e,t,r)}return n.apply(this,arguments)}return e[PROTOTYPE]=n[PROTOTYPE],e}(i):u&&"function"==typeof i?_ctx(Function.call,i):i,u&&((p.virtual||(p.virtual={}))[n]=i,e&$export.R&&_&&!_[n]&&_hide(_,n,i)))};$export.F=1,$export.G=2,$export.S=4,$export.P=8,$export.B=16,$export.W=32,$export.U=64,$export.R=128;var _export=$export,_redefine=_hide,_iterators={},toString={}.toString,_cof=function(e){return toString.call(e).slice(8,-1)},_iobject=Object("z").propertyIsEnumerable(0)?Object:function(e){return"String"==_cof(e)?e.split(""):Object(e)},_toIobject=function(e){return _iobject(_defined(e))},min=Math.min,_toLength=function(e){return 0<e?min(_toInteger(e),9007199254740991):0},max=Math.max,min$1=Math.min,_toAbsoluteIndex=function(e,t){return(e=_toInteger(e))<0?max(e+t,0):min$1(e,t)},_arrayIncludes=function(a){return function(e,t,r){var n,o=_toIobject(e),i=_toLength(o.length),s=_toAbsoluteIndex(r,i);if(a&&t!=t){for(;s<i;)if((n=o[s++])!=n)return!0}else for(;s<i;s++)if((a||s in o)&&o[s]===t)return a||s||0;return!a&&-1}},_shared=createCommonjsModule(function(e){var t="__core-js_shared__",r=_global[t]||(_global[t]={});(e.exports=function(e,t){return r[e]||(r[e]=void 0!==t?t:{})})("versions",[]).push({version:_core.version,mode:_library?"pure":"global",copyright:"© 2019 Denis Pushkarev (zloirock.ru)"})}),id=0,px=Math.random(),_uid=function(e){return"Symbol(".concat(void 0===e?"":e,")_",(++id+px).toString(36))},shared=_shared("keys"),_sharedKey=function(e){return shared[e]||(shared[e]=_uid(e))},arrayIndexOf=_arrayIncludes(!1),IE_PROTO$1=_sharedKey("IE_PROTO"),_objectKeysInternal=function(e,t){var r,n=_toIobject(e),o=0,i=[];for(r in n)r!=IE_PROTO$1&&_has(n,r)&&i.push(r);for(;t.length>o;)_has(n,r=t[o++])&&(~arrayIndexOf(i,r)||i.push(r));return i},_enumBugKeys="constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(","),_objectKeys=Object.keys||function(e){return _objectKeysInternal(e,_enumBugKeys)},_objectDps=_descriptors?Object.defineProperties:function(e,t){_anObject(e);for(var r,n=_objectKeys(t),o=n.length,i=0;i<o;)_objectDp.f(e,r=n[i++],t[r]);return e},document$2=_global.document,_html=document$2&&document$2.documentElement,IE_PROTO=_sharedKey("IE_PROTO"),Empty=function(){},PROTOTYPE$1="prototype",createDict=function(){var e,t=_domCreate("iframe"),r=_enumBugKeys.length;for(t.style.display="none",_html.appendChild(t),t.src="javascript:",(e=t.contentWindow.document).open(),e.write("<script>document.F=Object<\/script>"),e.close(),createDict=e.F;r--;)delete createDict[PROTOTYPE$1][_enumBugKeys[r]];return createDict()},_objectCreate=Object.create||function(e,t){var r;return null!==e?(Empty[PROTOTYPE$1]=_anObject(e),r=new Empty,Empty[PROTOTYPE$1]=null,r[IE_PROTO]=e):r=createDict(),void 0===t?r:_objectDps(r,t)},_wks=createCommonjsModule(function(e){var t=_shared("wks"),r=_global.Symbol,n="function"==typeof r;(e.exports=function(e){return t[e]||(t[e]=n&&r[e]||(n?r:_uid)("Symbol."+e))}).store=t}),def=_objectDp.f,TAG=_wks("toStringTag"),_setToStringTag=function(e,t,r){e&&!_has(e=r?e:e.prototype,TAG)&&def(e,TAG,{configurable:!0,value:t})},IteratorPrototype={};_hide(IteratorPrototype,_wks("iterator"),function(){return this});var _iterCreate=function(e,t,r){e.prototype=_objectCreate(IteratorPrototype,{next:_propertyDesc(1,r)}),_setToStringTag(e,t+" Iterator")},_toObject=function(e){return Object(_defined(e))},IE_PROTO$2=_sharedKey("IE_PROTO"),ObjectProto=Object.prototype,_objectGpo=Object.getPrototypeOf||function(e){return e=_toObject(e),_has(e,IE_PROTO$2)?e[IE_PROTO$2]:"function"==typeof e.constructor&&e instanceof e.constructor?e.constructor.prototype:e instanceof Object?ObjectProto:null},ITERATOR=_wks("iterator"),BUGGY=!([].keys&&"next"in[].keys()),FF_ITERATOR="@@iterator",KEYS="keys",VALUES="values",returnThis=function(){return this},_iterDefine=function(e,t,r,n,o,i,s){_iterCreate(r,t,n);function a(e){if(!BUGGY&&e in d)return d[e];switch(e){case KEYS:case VALUES:return function(){return new r(this,e)}}return function(){return new r(this,e)}}var c,u,l,f=t+" Iterator",p=o==VALUES,_=!1,d=e.prototype,h=d[ITERATOR]||d[FF_ITERATOR]||o&&d[o],m=h||a(o),g=o?p?a("entries"):m:void 0,v="Array"==t&&d.entries||h;if(v&&(l=_objectGpo(v.call(new e)))!==Object.prototype&&l.next&&(_setToStringTag(l,f,!0),_library||"function"==typeof l[ITERATOR]||_hide(l,ITERATOR,returnThis)),p&&h&&h.name!==VALUES&&(_=!0,m=function(){return h.call(this)}),_library&&!s||!BUGGY&&!_&&d[ITERATOR]||_hide(d,ITERATOR,m),_iterators[t]=m,_iterators[f]=returnThis,o)if(c={values:p?m:a(VALUES),keys:i?m:a(KEYS),entries:g},s)for(u in c)u in d||_redefine(d,u,c[u]);else _export(_export.P+_export.F*(BUGGY||_),t,c);return c},$at=_stringAt(!0);_iterDefine(String,"String",function(e){this._t=String(e),this._i=0},function(){var e,t=this._t,r=this._i;return r>=t.length?{value:void 0,done:!0}:(e=$at(t,r),this._i+=e.length,{value:e,done:!1})});var _iterCall=function(t,e,r,n){try{return n?e(_anObject(r)[0],r[1]):e(r)}catch(e){var o=t.return;throw void 0!==o&&_anObject(o.call(t)),e}},ITERATOR$1=_wks("iterator"),ArrayProto=Array.prototype,_isArrayIter=function(e){return void 0!==e&&(_iterators.Array===e||ArrayProto[ITERATOR$1]===e)},_createProperty=function(e,t,r){t in e?_objectDp.f(e,t,_propertyDesc(0,r)):e[t]=r},TAG$1=_wks("toStringTag"),ARG="Arguments"==_cof(function(){return arguments}()),tryGet=function(e,t){try{return e[t]}catch(e){}},_classof=function(e){var t,r,n;return void 0===e?"Undefined":null===e?"Null":"string"==typeof(r=tryGet(t=Object(e),TAG$1))?r:ARG?_cof(t):"Object"==(n=_cof(t))&&"function"==typeof t.callee?"Arguments":n},ITERATOR$2=_wks("iterator"),core_getIteratorMethod=_core.getIteratorMethod=function(e){if(null!=e)return e[ITERATOR$2]||e["@@iterator"]||_iterators[_classof(e)]},ITERATOR$3=_wks("iterator"),SAFE_CLOSING=!1;try{var riter=[7][ITERATOR$3]();riter.return=function(){SAFE_CLOSING=!0}}catch(e){}var _iterDetect=function(e,t){if(!t&&!SAFE_CLOSING)return!1;var r=!1;try{var n=[7],o=n[ITERATOR$3]();o.next=function(){return{done:r=!0}},n[ITERATOR$3]=function(){return o},e(n)}catch(e){}return r};_export(_export.S+_export.F*!_iterDetect(function(e){}),"Array",{from:function(e,t,r){var n,o,i,s,a=_toObject(e),c="function"==typeof this?this:Array,u=arguments.length,l=1<u?t:void 0,f=void 0!==l,p=0,_=core_getIteratorMethod(a);if(f&&(l=_ctx(l,2<u?r:void 0,2)),null==_||c==Array&&_isArrayIter(_))for(o=new c(n=_toLength(a.length));p<n;p++)_createProperty(o,p,f?l(a[p],p):a[p]);else for(s=_.call(a),o=new c;!(i=s.next()).done;p++)_createProperty(o,p,f?_iterCall(s,l,[i.value,p],!0):i.value);return o.length=p,o}});var from$2=_core.Array.from,from=createCommonjsModule(function(e){e.exports={default:from$2,__esModule:!0}});unwrapExports(from);var toConsumableArray=createCommonjsModule(function(e,t){t.__esModule=!0;var r,n=(r=from)&&r.__esModule?r:{default:r};t.default=function(e){if(Array.isArray(e)){for(var t=0,r=Array(e.length);t<e.length;t++)r[t]=e[t];return r}return(0,n.default)(e)}}),_toConsumableArray=unwrapExports(toConsumableArray),runtime=createCommonjsModule(function($){!function(e){var c,t=Object.prototype,u=t.hasOwnProperty,r="function"==typeof Symbol?Symbol:{},o=r.iterator||"@@iterator",n=r.asyncIterator||"@@asyncIterator",i=r.toStringTag||"@@toStringTag",s=e.regeneratorRuntime;if(s)$.exports=s;else{(s=e.regeneratorRuntime=$.exports).wrap=v;var l="suspendedStart",f="suspendedYield",p="executing",_="completed",d={},a={};a[o]=function(){return this};var h=Object.getPrototypeOf,m=h&&h(h(I([])));m&&m!==t&&u.call(m,o)&&(a=m);var g=O.prototype=b.prototype=Object.create(a);w.prototype=g.constructor=O,O.constructor=w,O[i]=w.displayName="GeneratorFunction",s.isGeneratorFunction=function(e){var t="function"==typeof e&&e.constructor;return!!t&&(t===w||"GeneratorFunction"===(t.displayName||t.name))},s.mark=function(e){return Object.setPrototypeOf?Object.setPrototypeOf(e,O):(e.__proto__=O,i in e||(e[i]="GeneratorFunction")),e.prototype=Object.create(g),e},s.awrap=function(e){return{__await:e}},x(T.prototype),T.prototype[n]=function(){return this},s.AsyncIterator=T,s.async=function(e,t,r,n){var o=new T(v(e,t,r,n));return s.isGeneratorFunction(t)?o:o.next().then(function(e){return e.done?e.value:o.next()})},x(g),g[i]="Generator",g[o]=function(){return this},g.toString=function(){return"[object Generator]"},s.keys=function(r){var n=[];for(var e in r)n.push(e);return n.reverse(),function e(){for(;n.length;){var t=n.pop();if(t in r)return e.value=t,e.done=!1,e}return e.done=!0,e}},s.values=I,j.prototype={constructor:j,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=c,this.done=!1,this.delegate=null,this.method="next",this.arg=c,this.tryEntries.forEach(P),!e)for(var t in this)"t"===t.charAt(0)&&u.call(this,t)&&!isNaN(+t.slice(1))&&(this[t]=c)},stop:function(){this.done=!0;var e=this.tryEntries[0].completion;if("throw"===e.type)throw e.arg;return this.rval},dispatchException:function(r){if(this.done)throw r;var n=this;function e(e,t){return i.type="throw",i.arg=r,n.next=e,t&&(n.method="next",n.arg=c),!!t}for(var t=this.tryEntries.length-1;0<=t;--t){var o=this.tryEntries[t],i=o.completion;if("root"===o.tryLoc)return e("end");if(o.tryLoc<=this.prev){var s=u.call(o,"catchLoc"),a=u.call(o,"finallyLoc");if(s&&a){if(this.prev<o.catchLoc)return e(o.catchLoc,!0);if(this.prev<o.finallyLoc)return e(o.finallyLoc)}else if(s){if(this.prev<o.catchLoc)return e(o.catchLoc,!0)}else{if(!a)throw new Error("try statement without catch or finally");if(this.prev<o.finallyLoc)return e(o.finallyLoc)}}}},abrupt:function(e,t){for(var r=this.tryEntries.length-1;0<=r;--r){var n=this.tryEntries[r];if(n.tryLoc<=this.prev&&u.call(n,"finallyLoc")&&this.prev<n.finallyLoc){var o=n;break}}o&&("break"===e||"continue"===e)&&o.tryLoc<=t&&t<=o.finallyLoc&&(o=null);var i=o?o.completion:{};return i.type=e,i.arg=t,o?(this.method="next",this.next=o.finallyLoc,d):this.complete(i)},complete:function(e,t){if("throw"===e.type)throw e.arg;return"break"===e.type||"continue"===e.type?this.next=e.arg:"return"===e.type?(this.rval=this.arg=e.arg,this.method="return",this.next="end"):"normal"===e.type&&t&&(this.next=t),d},finish:function(e){for(var t=this.tryEntries.length-1;0<=t;--t){var r=this.tryEntries[t];if(r.finallyLoc===e)return this.complete(r.completion,r.afterLoc),P(r),d}},catch:function(e){for(var t=this.tryEntries.length-1;0<=t;--t){var r=this.tryEntries[t];if(r.tryLoc===e){var n=r.completion;if("throw"===n.type){var o=n.arg;P(r)}return o}}throw new Error("illegal catch attempt")},delegateYield:function(e,t,r){return this.delegate={iterator:I(e),resultName:t,nextLoc:r},"next"===this.method&&(this.arg=c),d}}}function v(e,t,r,n){var o=t&&t.prototype instanceof b?t:b,i=Object.create(o.prototype),s=new j(n||[]);return i._invoke=function(i,s,a){var c=l;return function(e,t){if(c===p)throw new Error("Generator is already running");if(c===_){if("throw"===e)throw t;return R()}for(a.method=e,a.arg=t;;){var r=a.delegate;if(r){var n=E(r,a);if(n){if(n===d)continue;return n}}if("next"===a.method)a.sent=a._sent=a.arg;else if("throw"===a.method){if(c===l)throw c=_,a.arg;a.dispatchException(a.arg)}else"return"===a.method&&a.abrupt("return",a.arg);c=p;var o=y(i,s,a);if("normal"===o.type){if(c=a.done?_:f,o.arg===d)continue;return{value:o.arg,done:a.done}}"throw"===o.type&&(c=_,a.method="throw",a.arg=o.arg)}}}(e,r,s),i}function y(e,t,r){try{return{type:"normal",arg:e.call(t,r)}}catch(e){return{type:"throw",arg:e}}}function b(){}function w(){}function O(){}function x(e){["next","throw","return"].forEach(function(t){e[t]=function(e){return this._invoke(t,e)}})}function T(c){var t;this._invoke=function(r,n){function e(){return new Promise(function(e,t){!function t(e,r,n,o){var i=y(c[e],c,r);if("throw"!==i.type){var s=i.arg,a=s.value;return a&&"object"==typeof a&&u.call(a,"__await")?Promise.resolve(a.__await).then(function(e){t("next",e,n,o)},function(e){t("throw",e,n,o)}):Promise.resolve(a).then(function(e){s.value=e,n(s)},o)}o(i.arg)}(r,n,e,t)})}return t=t?t.then(e,e):e()}}function E(e,t){var r=e.iterator[t.method];if(r===c){if(t.delegate=null,"throw"===t.method){if(e.iterator.return&&(t.method="return",t.arg=c,E(e,t),"throw"===t.method))return d;t.method="throw",t.arg=new TypeError("The iterator does not provide a 'throw' method")}return d}var n=y(r,e.iterator,t.arg);if("throw"===n.type)return t.method="throw",t.arg=n.arg,t.delegate=null,d;var o=n.arg;return o?o.done?(t[e.resultName]=o.value,t.next=e.nextLoc,"return"!==t.method&&(t.method="next",t.arg=c),t.delegate=null,d):o:(t.method="throw",t.arg=new TypeError("iterator result is not an object"),t.delegate=null,d)}function S(e){var t={tryLoc:e[0]};1 in e&&(t.catchLoc=e[1]),2 in e&&(t.finallyLoc=e[2],t.afterLoc=e[3]),this.tryEntries.push(t)}function P(e){var t=e.completion||{};t.type="normal",delete t.arg,e.completion=t}function j(e){this.tryEntries=[{tryLoc:"root"}],e.forEach(S,this),this.reset(!0)}function I(t){if(t){var e=t[o];if(e)return e.call(t);if("function"==typeof t.next)return t;if(!isNaN(t.length)){var r=-1,n=function e(){for(;++r<t.length;)if(u.call(t,r))return e.value=t[r],e.done=!1,e;return e.value=c,e.done=!0,e};return n.next=n}}return{next:R}}function R(){return{value:c,done:!0}}}(function(){return this}()||Function("return this")())}),g=function(){return this}()||Function("return this")(),hadRuntime=g.regeneratorRuntime&&0<=Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime"),oldRuntime=hadRuntime&&g.regeneratorRuntime;g.regeneratorRuntime=void 0;var runtimeModule=runtime;if(hadRuntime)g.regeneratorRuntime=oldRuntime;else try{delete g.regeneratorRuntime}catch(e){g.regeneratorRuntime=void 0}var regenerator=runtimeModule,_iterStep=function(e,t){return{value:t,done:!!e}},es6_array_iterator=_iterDefine(Array,"Array",function(e,t){this._t=_toIobject(e),this._i=0,this._k=t},function(){var e=this._t,t=this._k,r=this._i++;return!e||r>=e.length?(this._t=void 0,_iterStep(1)):_iterStep(0,"keys"==t?r:"values"==t?e[r]:[r,e[r]])},"values");_iterators.Arguments=_iterators.Array;for(var TO_STRING_TAG=_wks("toStringTag"),DOMIterables="CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,TextTrackList,TouchList".split(","),i=0;i<DOMIterables.length;i++){var NAME=DOMIterables[i],Collection=_global[NAME],proto=Collection&&Collection.prototype;proto&&!proto[TO_STRING_TAG]&&_hide(proto,TO_STRING_TAG,NAME),_iterators[NAME]=_iterators.Array}var defer,channel,port,_anInstance=function(e,t,r,n){if(!(e instanceof t)||void 0!==n&&n in e)throw TypeError(r+": incorrect invocation!");return e},_forOf=createCommonjsModule(function(e){var p={},_={},t=e.exports=function(e,t,r,n,o){var i,s,a,c,u=o?function(){return e}:core_getIteratorMethod(e),l=_ctx(r,n,t?2:1),f=0;if("function"!=typeof u)throw TypeError(e+" is not iterable!");if(_isArrayIter(u)){for(i=_toLength(e.length);f<i;f++)if((c=t?l(_anObject(s=e[f])[0],s[1]):l(e[f]))===p||c===_)return c}else for(a=u.call(e);!(s=a.next()).done;)if((c=_iterCall(a,l,s.value,t))===p||c===_)return c};t.BREAK=p,t.RETURN=_}),SPECIES=_wks("species"),_speciesConstructor=function(e,t){var r,n=_anObject(e).constructor;return void 0===n||null==(r=_anObject(n)[SPECIES])?t:_aFunction(r)},_invoke=function(e,t,r){var n=void 0===r;switch(t.length){case 0:return n?e():e.call(r);case 1:return n?e(t[0]):e.call(r,t[0]);case 2:return n?e(t[0],t[1]):e.call(r,t[0],t[1]);case 3:return n?e(t[0],t[1],t[2]):e.call(r,t[0],t[1],t[2]);case 4:return n?e(t[0],t[1],t[2],t[3]):e.call(r,t[0],t[1],t[2],t[3])}return e.apply(r,t)},process$1=_global.process,setTask=_global.setImmediate,clearTask=_global.clearImmediate,MessageChannel=_global.MessageChannel,Dispatch=_global.Dispatch,counter=0,queue={},ONREADYSTATECHANGE="onreadystatechange",run=function(){var e=+this;if(queue.hasOwnProperty(e)){var t=queue[e];delete queue[e],t()}},listener=function(e){run.call(e.data)};setTask&&clearTask||(setTask=function(e){for(var t=[],r=1;r<arguments.length;)t.push(arguments[r++]);return queue[++counter]=function(){_invoke("function"==typeof e?e:Function(e),t)},defer(counter),counter},clearTask=function(e){delete queue[e]},"process"==_cof(process$1)?defer=function(e){process$1.nextTick(_ctx(run,e,1))}:Dispatch&&Dispatch.now?defer=function(e){Dispatch.now(_ctx(run,e,1))}:MessageChannel?(port=(channel=new MessageChannel).port2,channel.port1.onmessage=listener,defer=_ctx(port.postMessage,port,1)):_global.addEventListener&&"function"==typeof postMessage&&!_global.importScripts?(defer=function(e){_global.postMessage(e+"","*")},_global.addEventListener("message",listener,!1)):defer=ONREADYSTATECHANGE in _domCreate("script")?function(e){_html.appendChild(_domCreate("script"))[ONREADYSTATECHANGE]=function(){_html.removeChild(this),run.call(e)}}:function(e){setTimeout(_ctx(run,e,1),0)});var _task={set:setTask,clear:clearTask},macrotask=_task.set,Observer=_global.MutationObserver||_global.WebKitMutationObserver,process$2=_global.process,Promise$1=_global.Promise,isNode$1="process"==_cof(process$2),_microtask=function(){function e(){var e,t;for(isNode$1&&(e=process$2.domain)&&e.exit();r;){t=r.fn,r=r.next;try{t()}catch(e){throw r?o():n=void 0,e}}n=void 0,e&&e.enter()}var r,n,o;if(isNode$1)o=function(){process$2.nextTick(e)};else if(!Observer||_global.navigator&&_global.navigator.standalone)if(Promise$1&&Promise$1.resolve){var t=Promise$1.resolve(void 0);o=function(){t.then(e)}}else o=function(){macrotask.call(_global,e)};else{var i=!0,s=document.createTextNode("");new Observer(e).observe(s,{characterData:!0}),o=function(){s.data=i=!i}}return function(e){var t={fn:e,next:void 0};n&&(n.next=t),r||(r=t,o()),n=t}};function PromiseCapability(e){var r,n;this.promise=new e(function(e,t){if(void 0!==r||void 0!==n)throw TypeError("Bad Promise constructor");r=e,n=t}),this.resolve=_aFunction(r),this.reject=_aFunction(n)}var Internal,newGenericPromiseCapability,OwnPromiseCapability,Wrapper,f$1=function(e){return new PromiseCapability(e)},_newPromiseCapability={f:f$1},_perform=function(e){try{return{e:!1,v:e()}}catch(e){return{e:!0,v:e}}},navigator=_global.navigator,_userAgent=navigator&&navigator.userAgent||"",_promiseResolve=function(e,t){if(_anObject(e),_isObject(t)&&t.constructor===e)return t;var r=_newPromiseCapability.f(e);return(0,r.resolve)(t),r.promise},_redefineAll=function(e,t,r){for(var n in t)r&&e[n]?e[n]=t[n]:_hide(e,n,t[n]);return e},SPECIES$1=_wks("species"),_setSpecies=function(e){var t="function"==typeof _core[e]?_core[e]:_global[e];_descriptors&&t&&!t[SPECIES$1]&&_objectDp.f(t,SPECIES$1,{configurable:!0,get:function(){return this}})},task=_task.set,microtask=_microtask(),PROMISE="Promise",TypeError$1=_global.TypeError,process=_global.process,versions=process&&process.versions,v8=versions&&versions.v8||"",$Promise=_global[PROMISE],isNode="process"==_classof(process),empty=function(){},newPromiseCapability=newGenericPromiseCapability=_newPromiseCapability.f,USE_NATIVE=!!function(){try{var e=$Promise.resolve(1),t=(e.constructor={})[_wks("species")]=function(e){e(empty,empty)};return(isNode||"function"==typeof PromiseRejectionEvent)&&e.then(empty)instanceof t&&0!==v8.indexOf("6.6")&&-1===_userAgent.indexOf("Chrome/66")}catch(e){}}(),isThenable=function(e){var t;return!(!_isObject(e)||"function"!=typeof(t=e.then))&&t},notify=function(l,r){if(!l._n){l._n=!0;var n=l._c;microtask(function(){for(var c=l._v,u=1==l._s,e=0,t=function(e){var t,r,n,o=u?e.ok:e.fail,i=e.resolve,s=e.reject,a=e.domain;try{o?(u||(2==l._h&&onHandleUnhandled(l),l._h=1),!0===o?t=c:(a&&a.enter(),t=o(c),a&&(a.exit(),n=!0)),t===e.promise?s(TypeError$1("Promise-chain cycle")):(r=isThenable(t))?r.call(t,i,s):i(t)):s(c)}catch(e){a&&!n&&a.exit(),s(e)}};n.length>e;)t(n[e++]);l._c=[],l._n=!1,r&&!l._h&&onUnhandled(l)})}},onUnhandled=function(i){task.call(_global,function(){var e,t,r,n=i._v,o=isUnhandled(i);if(o&&(e=_perform(function(){isNode?process.emit("unhandledRejection",n,i):(t=_global.onunhandledrejection)?t({promise:i,reason:n}):(r=_global.console)&&r.error&&r.error("Unhandled promise rejection",n)}),i._h=isNode||isUnhandled(i)?2:1),i._a=void 0,o&&e.e)throw e.v})},isUnhandled=function(e){return 1!==e._h&&0===(e._a||e._c).length},onHandleUnhandled=function(t){task.call(_global,function(){var e;isNode?process.emit("rejectionHandled",t):(e=_global.onrejectionhandled)&&e({promise:t,reason:t._v})})},$reject=function(e){var t=this;t._d||(t._d=!0,(t=t._w||t)._v=e,t._s=2,t._a||(t._a=t._c.slice()),notify(t,!0))},$resolve=function(e){var r,n=this;if(!n._d){n._d=!0,n=n._w||n;try{if(n===e)throw TypeError$1("Promise can't be resolved itself");(r=isThenable(e))?microtask(function(){var t={_w:n,_d:!1};try{r.call(e,_ctx($resolve,t,1),_ctx($reject,t,1))}catch(e){$reject.call(t,e)}}):(n._v=e,n._s=1,notify(n,!1))}catch(e){$reject.call({_w:n,_d:!1},e)}}};USE_NATIVE||($Promise=function(e){_anInstance(this,$Promise,PROMISE,"_h"),_aFunction(e),Internal.call(this);try{e(_ctx($resolve,this,1),_ctx($reject,this,1))}catch(e){$reject.call(this,e)}},(Internal=function(e){this._c=[],this._a=void 0,this._s=0,this._d=!1,this._v=void 0,this._h=0,this._n=!1}).prototype=_redefineAll($Promise.prototype,{then:function(e,t){var r=newPromiseCapability(_speciesConstructor(this,$Promise));return r.ok="function"!=typeof e||e,r.fail="function"==typeof t&&t,r.domain=isNode?process.domain:void 0,this._c.push(r),this._a&&this._a.push(r),this._s&&notify(this,!1),r.promise},catch:function(e){return this.then(void 0,e)}}),OwnPromiseCapability=function(){var e=new Internal;this.promise=e,this.resolve=_ctx($resolve,e,1),this.reject=_ctx($reject,e,1)},_newPromiseCapability.f=newPromiseCapability=function(e){return e===$Promise||e===Wrapper?new OwnPromiseCapability(e):newGenericPromiseCapability(e)}),_export(_export.G+_export.W+_export.F*!USE_NATIVE,{Promise:$Promise}),_setToStringTag($Promise,PROMISE),_setSpecies(PROMISE),Wrapper=_core[PROMISE],_export(_export.S+_export.F*!USE_NATIVE,PROMISE,{reject:function(e){var t=newPromiseCapability(this);return(0,t.reject)(e),t.promise}}),_export(_export.S+_export.F*(_library||!USE_NATIVE),PROMISE,{resolve:function(e){return _promiseResolve(_library&&this===Wrapper?$Promise:this,e)}}),_export(_export.S+_export.F*!(USE_NATIVE&&_iterDetect(function(e){$Promise.all(e).catch(empty)})),PROMISE,{all:function(e){var s=this,t=newPromiseCapability(s),a=t.resolve,c=t.reject,r=_perform(function(){var n=[],o=0,i=1;_forOf(e,!1,function(e){var t=o++,r=!1;n.push(void 0),i++,s.resolve(e).then(function(e){r||(r=!0,n[t]=e,--i||a(n))},c)}),--i||a(n)});return r.e&&c(r.v),t.promise},race:function(e){var t=this,r=newPromiseCapability(t),n=r.reject,o=_perform(function(){_forOf(e,!1,function(e){t.resolve(e).then(r.resolve,n)})});return o.e&&n(o.v),r.promise}}),_export(_export.P+_export.R,"Promise",{finally:function(t){var r=_speciesConstructor(this,_core.Promise||_global.Promise),e="function"==typeof t;return this.then(e?function(e){return _promiseResolve(r,t()).then(function(){return e})}:t,e?function(e){return _promiseResolve(r,t()).then(function(){throw e})}:t)}}),_export(_export.S,"Promise",{try:function(e){var t=_newPromiseCapability.f(this),r=_perform(e);return(r.e?t.reject:t.resolve)(r.v),t.promise}});var promise$2=_core.Promise,promise=createCommonjsModule(function(e){e.exports={default:promise$2,__esModule:!0}});unwrapExports(promise);var asyncToGenerator=createCommonjsModule(function(e,t){t.__esModule=!0;var r,c=(r=promise)&&r.__esModule?r:{default:r};t.default=function(e){return function(){var a=e.apply(this,arguments);return new c.default(function(i,s){return function t(e,r){try{var n=a[e](r),o=n.value}catch(e){return void s(e)}if(!n.done)return c.default.resolve(o).then(function(e){t("next",e)},function(e){t("throw",e)});i(o)}("next")})}}}),_asyncToGenerator=unwrapExports(asyncToGenerator),$JSON=_core.JSON||(_core.JSON={stringify:JSON.stringify}),stringify$1=function(e){return $JSON.stringify.apply($JSON,arguments)},stringify=createCommonjsModule(function(e){e.exports={default:stringify$1,__esModule:!0}}),_JSON$stringify=unwrapExports(stringify),getActions=function(e){var t,r,n,o,i,s,a=(t=_asyncToGenerator(regenerator.mark(function e(t){var n,o,i,s,a=t.state,c=t.commit,u=t.rootState;return regenerator.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(u.token&&a.origin)return e.prev=1,_.set(a,"isLoading",!0),n={reverse:!0,count:1,fields:"timestamp"},-1===a.origin.indexOf("platform")&&!a.isItemDeleted||(n.filter="event_origin="+a.origin),e.next=7,b(a.origin,a.isItemDeleted)(n);e.next=21;break;case 7:o=e.sent,y(i=o.data),s=Date.now(),i.result.length&&(s=Math.round(1e3*i.result[0].timestamp)),c("setDate",(void 0,t=s||Date.now(),{from:r=new Date(t).setHours(0,0,0,0),to:r+864e5}).from),_.set(a,"isLoading",!1),e.next=21;break;case 16:e.prev=16,e.t0=e.catch(1),h&&h(e.t0),DEV&&console.log(e.t0),_.set(a,"isLoading",!1);case 21:case"end":return e.stop()}var t,r},e,this,[[1,16]])})),function(e){return t.apply(this,arguments)}),f=(r=_asyncToGenerator(regenerator.mark(function e(t,r){var n,o,i,s,a,c=t.state,u=t.commit,l=t.rootState;return regenerator.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(u("reqStart"),r&&(n=r.name,o=r.payload,u("clearMessages"),u(n,o)),l.token&&c.origin)return e.prev=3,_.set(c,"isLoading",!0),i=JSON.parse(_JSON$stringify(c.mode)),e.next=8,b(c.origin,c.isItemDeleted)(v(c));e.next=45;break;case 8:if(s=e.sent,i!==c.mode)return e.abrupt("return",!1);e.next=11;break;case 11:if(y(a=s.data),!r){e.next=36;break}if(!a.result.length){e.next=19;break}u("setMessages",a.result),u("postaction"),e.next=34;break;case 19:u("postaction"),e.t0=r.name,e.next="paginationPrev"===e.t0?23:"paginationNext"===e.t0?29:32;break;case 23:return u("datePrev"),u("paginationPrev"),e.next=27,f({state:c,commit:u,rootState:l});case 27:return u("postaction"),e.abrupt("break",34);case 29:return f({state:c,commit:u,rootState:l},{name:"dateNext"}),u("postaction"),e.abrupt("break",34);case 32:u("setMessages",a.result),u("postaction");case 34:e.next=37;break;case 36:u("setMessages",a.result);case 37:_.set(c,"isLoading",!1),e.next=45;break;case 40:e.prev=40,e.t1=e.catch(3),h&&h(e.t1),DEV&&console.log(e.t1),_.set(c,"isLoading",!1);case 45:case"end":return e.stop()}},e,this,[[3,40]])})),function(e,t){return r.apply(this,arguments)}),c=(n=_asyncToGenerator(regenerator.mark(function e(t,r){var n,o,i=t.state,s=t.commit,a=t.rootState;return regenerator.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return n=i.limit,o=i.filter,s("setReverse",!0),s("setLimit",r),s("setFilter",""),e.next=6,f({state:i,commit:s,rootState:a});case 6:s("setReverse",!1),s("setLimit",n),s("setFilter",o);case 9:case"end":return e.stop()}},e,this)})),function(e,t){return n.apply(this,arguments)}),u=(o=_asyncToGenerator(regenerator.mark(function e(t){var r,n,o=t.state,i=t.commit;t.rootState;return regenerator.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return r=o.origin.split("/")[0],n=o.origin.replace(r+"/","").replace(/\*/g,"+"),O=x(i),e.next=4,_.connector.subscribeLogs(r,n,"#",function(e){1===o.mode?w.push(JSON.parse(e)):i("setNewMessagesCount",o.newMessagesCount+1)},{rh:2});case 4:case"end":return e.stop()}},e,this)})),function(e){return o.apply(this,arguments)}),l=(i=_asyncToGenerator(regenerator.mark(function e(t){var r,n,o,i,s=t.state,a=t.commit,c=t.rootState;return regenerator.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(c.token&&s.origin)return e.prev=1,_.set(s,"isLoading",!0),r=s.messages.reduceRight(function(e,t,r){return e||("offline"===t.__connectionStatus&&(e=r),e)},0),n={from:r?Math.floor(s.messages[r-1].timestamp)+1:0,to:Math.floor(s.messages[r+1].timestamp)},-1!==s.origin.indexOf("platform")&&(n.filter="event_origin="+s.origin),e.next=8,b(s.origin,s.isItemDeleted)(n);e.next=20;break;case 8:o=e.sent,y(i=o.data),a("setMissingMessages",{data:i.result,index:r}),_.set(s,"isLoading",!1),e.next=20;break;case 15:e.prev=15,e.t0=e.catch(1),h&&h(e.t0),DEV&&console.log(e.t0),_.set(s,"isLoading",!1);case 20:case"end":return e.stop()}},e,this,[[1,15]])})),function(e){return i.apply(this,arguments)}),p=(s=_asyncToGenerator(regenerator.mark(function e(t){var r,n,o=t.state;return regenerator.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return r=o.origin.split("/")[0],n=o.origin.replace(r+"/","").replace(/\*/g,"+"),O&&clearInterval(O),e.next=4,_.connector.unsubscribeLogs(r,n,"#");case 4:case"end":return e.stop()}},e,this)})),function(e){return s.apply(this,arguments)}),_=e.Vue,d=e.LocalStorage,h=e.errorHandler,m=(new Date).toString().match(/([-\+][0-9]+)\s/)[1],g=[{name:"timestamp",width:100,display:!0,description:"Log event time",addition:m.slice(0,3)+":"+m.slice(3)},{name:"event_code",title:"event",width:400,display:!0,description:"Log event code and description"},{name:"ident",width:150,display:!0,description:"Connected device's identification string"},{name:"msgs",width:85,display:!0,description:"Number of messages received"},{name:"recv",width:85,display:!0,description:"Number of bytes received"},{name:"send",width:85,display:!0,description:"Number of bytes sent"},{name:"source",width:150,display:!0,description:"Connected device's address"},{name:"host",width:150,display:!0,description:"IP address from which HTTP request was received"},{name:"duration",width:85,display:!0,description:"Connection duration in seconds"},{name:"transport",width:85,display:!0,description:"Connected device's transport: tcp, udp, http etc"}];function v(e){var t={filter:[]};return-1===e.origin.indexOf("platform")&&!e.isItemDeleted||t.filter.push("event_origin="+e.origin),e.limit&&(t.count=e.limit),e.filter&&e.sysFilter?(t.filter.push(""+e.sysFilter),1!==e.mode&&t.filter.push(""+e.filter)):e.sysFilter&&!e.filter?t.filter.push(""+e.sysFilter):!e.sysFilter&&e.filter&&0===e.mode&&t.filter.push(""+e.filter),!e.from||e.reverse&&1!==e.mode||e.reverse||(t.from=Math.floor(e.from/1e3)),e.to&&(1===e.mode&&(e.to=Date.now()),t.to=Math.floor(e.to/1e3)),e.reverse&&(t.reverse=e.reverse),t.filter.length?t.filter=t.filter.join(","):delete t.filter,t}function y(e){e.errors&&e.errors.forEach(function(e){var t=new Error(e.reason);h&&h(t)})}function b(e,t){var r=e.split("/"),n=r.pop(),o=t?_.connector.http.platform.customer:r.reduce(function(e,t){return e[t]},_.connector.http);return"*"===n||t?function(e){return o.logs.get({data:_JSON$stringify(e)})}:function(e){return o.logs.get(n,{data:_JSON$stringify(e)})}}var w=[],O=0;function x(e){return setInterval(function(){w.length&&(e("setMessages",[].concat(_toConsumableArray(w))),w=[])},500)}return{get:f,pollingGet:u,getHistory:c,initTime:a,getCols:function(e,t){var r=e.state,n=e.commit,o=(e.rootState,t||g),i=d.get.item(r.name);i&&i[r.origin]&&i[r.origin].length&&(i[r.origin].forEach(function(e){if("timestamp"===e.name){var t=(new Date).toString().match(/([-\+][0-9]+)\s/)[1];e.addition=t.slice(0,3)+":"+t.slice(3)}}),o=i[r.origin]),n("setCols",o)},unsubscribePooling:p,getMissedMessages:l}},getMutations=function(e){var t,r=(t=_asyncToGenerator(regenerator.mark(function e(t){var r,n;return regenerator.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return r=t.origin.split("/")[0],n=t.origin.replace(r+"/","").replace(/\*/g,"+"),u(t),t.filter="",t.mode=null,t.from=0,t.to=0,t.limit=1e3,t.reverse=!1,e.next=10,o.connector.unsubscribeLogs(r,n,"#");case 10:case"end":return e.stop()}},e,this)})),function(e){return t.apply(this,arguments)}),o=e.Vue,n=e.LocalStorage,i=e.filterHandler,s=e.newMessagesInterseptor;function a(e){var t=e||Date.now(),r=new Date(t).setHours(0,0,0,0);return{from:r,to:r+864e5}}function c(e,t){if(t&&t.length){e.reverse&&(t.reverse(),1===e.mode&&(t[t.length-1].delimiter=!0)),1===e.mode&&(o.set(e,"from",Math.floor(1e3*(t[t.length-1].timestamp+1))),e.filter&&i&&(t=i(e.filter,t))),s&&s(t);var r=e.messages.concat(t);if(e.limit&&1===e.mode&&r.length>=e.limit+.1*e.limit){var n=r.length-1-(e.limit-1);r=r.slice(n),o.set(e,"selected",e.selected.map(function(e){return e-n}))}o.set(e,"messages",r)}else 1===e.mode&&o.set(e,"from",e.to+1e3),o.set(e,"messages",[])}function u(e){s&&s([]),o.set(e,"messages",[]),h(e)}function l(e,t){o.set(e,"from",t)}function f(e,t){o.set(e,"to",t)}function p(e,t){o.set(e,"reverse",t)}function _(e,t){e.sysFilter?e.sysFilter+=","+t:e.sysFilter=t}function d(e,t){var r=n.get.item(e.name);(r=r||{})[e.origin]=t,n.set(e.name,r),o.set(e,"cols",t)}function h(e){o.set(e,"selected",[])}return{setOffline:function(e,t){t&&c(e,[{__connectionStatus:"offline",timestamp:Date.now()/1e3}]),e.offline=!0},setReconnected:function(e,t){t&&c(e,[{__connectionStatus:"reconnected",timestamp:Date.now()/1e3}]),e.offline=!1},setMessages:c,clearMessages:u,setLimit:function(e,t){o.set(e,"limit",t)},setFilter:function(e,t){e.filter!==t&&(1===e.mode&&(e.filter&&e.messages.push({"x-flespi-filter-prev":e.filter}),t&&e.messages.push({"x-flespi-filter-next":t})),o.set(e,"filter",t))},setMode:function(e,t){switch(t){case 0:var r=e.from?a(e.from):a();e.from=r.from,e.to=r.to,u(e);break;case 1:var n=Date.now()-6e3;e.from=n-1e3,e.to=n,e.newMessagesCount=0}o.set(e,"mode",t)},setFrom:l,setTo:f,reqStart:function(){DEV&&console.log("Start Request Logs")},setReverse:p,dateNext:function(e){var t=a(e.from+864e5);e.from=t.from,e.to=t.to},datePrev:function(e){var t=a(e.from-864e5);e.from=t.from,e.to=t.to},paginationPrev:function(e,t){e.reverse=!0,_(e,"timestamp>="+a(e.from).from/1e3),t&&(e.from=a(t).from,e.to=t-1e3)},paginationNext:function(e,t){_(e,"timestamp<="+e.to/1e3),t&&(e.to=a(t).to,e.from=t+1e3)},setDate:function(e,t){var r=a(t);e.from=r.from,e.to=r.to},postaction:function(e){var t=a(e.from);function r(t,r){return function(e){return""+(t?e.slice(0,t):"")+(r?e.slice(r):"")}}l(e,e.from||t.from),f(e,t.to),e.reverse&&p(e,!1);var n=e.sysFilter.indexOf("timestamp");if(0===n){var o=e.sysFilter.indexOf(",",n);e.sysFilter=-1!==o?r(0,o+1)(e.sysFilter):""}else if(0<n){var i=e.sysFilter.indexOf(",",n);e.sysFilter=-1!==i?r(n,i+1)(e.sysFilter):r(n-1)(e.sysFilter)}},clear:r,setOrigin:function(e,t){e.newMessagesCount=0,o.set(e,"origin",t)},setSysFilter:_,setCols:d,updateCols:d,setNewMessagesCount:function(e,t){o.set(e,"newMessagesCount",t)},setMissingMessages:function(e,t){var r,n=t.data,o=t.index;n.forEach(function(e){e.__status="missed"}),(r=e.messages).splice.apply(r,[o+1,0].concat(_toConsumableArray(n)))},setSelected:function(e,t){o.set(e,"selected",t)},clearSelected:h,setItemDeletedStatus:function(e,t){o.set(e,"isItemDeleted",t)}}},index=function(e){var t=e.Vue,r=e.LocalStorage,n=e.name,o=e.errorHandler,i=e.filterHandler,s=e.newMessagesInterseptor;return{namespaced:!0,state:{name:n,isLoading:!1,origin:"",messages:[],filter:"",sysFilter:"",mode:null,from:0,to:0,limit:1e3,reverse:!1,cols:[],newMessagesCount:0,offline:!1,selected:[],isItemDeleted:!1},actions:getActions({Vue:t,LocalStorage:r,errorHandler:o}),mutations:getMutations({Vue:t,LocalStorage:r,filterHandler:i,newMessagesInterseptor:s})}};module.exports=index;
