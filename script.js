const BASE_URL = 'https://youtube.googleapis.com/youtube/v3';
const PLAYLISTS = 'playlists';
const PLAYLIST_ITEMS = 'playlistItems';
const API_KEY = 'AIzaSyCR0UtADNN9tZur6wOs-oKJDnm3pFL1ckk';
	
var script = {
	async mounted() {
		const channelId = 'UCrKZcyOJVWnJ60zM1XWllNw';
		const playlists = await this.getPlaylists(channelId);
		this.loading = false;
		playlists.items.forEach(async pl => {
			const {
				id,
				contentDetails: { itemCount },
				snippet: {
					publishedAt,
					thumbnails: { high: { url: thumbnailURL } },
					title
				}
			} = pl;
			const created = Date.parse(publishedAt);
			const createdAgo = `${countdown(created, null, null, 2)} ago`;
			const playlistItem = {
				id,
				title,
				fullPlaylistURL: 'https://www.youtube.com/playlist?list=' + id,
				publishedAt,
				thumbnailCSS: `url(${thumbnailURL})`,
				// thumbnailURL,
				itemCount,
				createdAgo,
				firstItem: null,
				firstVideoURL: ''
			};
			this.playlists.push(playlistItem);
			const item = await this.getPlaylistItems(id);
			playlistItem.firstItem = item.items[0].contentDetails.videoId;
			const firstVideoQS = new URLSearchParams({
				v: playlistItem.firstItem,
				list: id,
				index: 0
			});
			playlistItem.firstVideoURL = `https://www.youtube.com/watch?${firstVideoQS}`;
		});
	},
	data() {
		return {
			searchTerm: '',
			playlists: [],
			loading: true
		};
	},
	computed: {
		searchedPlaylists() {
			if(!this.searchTerm) return this.playlists;
			return this.playlists.filter(n => n.title.toLowerCase().includes(this.searchTerm.toLowerCase()));
		}
	},
	methods: {
		async getPlaylists(channelId) {
			const qs = new URLSearchParams({
				part: 'snippet',
				fields: 'items(id,snippet(publishedAt,title,thumbnails/high/url),contentDetails/itemCount)',
				channelId,
				maxResults: 50,
				key: API_KEY
			});
			qs.append('part', 'contentDetails');
			const url = `${BASE_URL}/${PLAYLISTS}?${qs}`;
			const res = await fetch(url, { headers: { Accept: 'application/json' } });
			if(!res.ok) {
				console.error(await res.json());
				throw new Error('Error loading data from the Google');
			}
			return res.json();
		},
		async getPlaylistItems(playlistId) {
			const qs = new URLSearchParams({
				part: 'contentDetails',
				maxResults: 1,
				playlistId,
				fields: 'items/contentDetails/videoId',
				key: API_KEY
			});
			const url = `${BASE_URL}/${PLAYLIST_ITEMS}?${qs}`;
			const res = await fetch(url, { headers: { Accept: 'application/json' } });
			if(!res.ok) {
				console.error(await res.json());
				throw new Error('Error loading data from the Google');
			}
			return res.json();
		}
	}
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

const isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return (id, style) => addStyle(id, style);
}
let HEAD;
const styles = {};
function addStyle(id, css) {
    const group = isOldIE ? css.media || 'default' : id;
    const style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        let code = css.source;
        if (css.map) {
            // https://developer.chrome.com/devtools/docs/javascript-debugging
            // this makes source maps inside style tags work properly in Chrome
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            // http://stackoverflow.com/a/26603875
            code +=
                '\n/*# sourceMappingURL=data:application/json;base64,' +
                    btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                    ' */';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                style.element.setAttribute('media', css.media);
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            const index = style.ids.size - 1;
            const textNode = document.createTextNode(code);
            const nodes = style.element.childNodes;
            if (nodes[index])
                style.element.removeChild(nodes[index]);
            if (nodes.length)
                style.element.insertBefore(textNode, nodes[index]);
            else
                style.element.appendChild(textNode);
        }
    }
}

/* script */
const __vue_script__ = script;

/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", { attrs: { id: "app" } }, [
    _c("div", { attrs: { id: "search" } }, [
      _c("input", {
        directives: [
          {
            name: "model",
            rawName: "v-model",
            value: _vm.searchTerm,
            expression: "searchTerm"
          }
        ],
        attrs: { placeholder: "Search" },
        domProps: { value: _vm.searchTerm },
        on: {
          input: function($event) {
            if ($event.target.composing) {
              return
            }
            _vm.searchTerm = $event.target.value;
          }
        }
      }),
      _c("div", { staticClass: "button" })
    ]),
    _c(
      "div",
      { class: { loading: this.loading }, attrs: { id: "playlists" } },
      _vm._l(_vm.searchedPlaylists, function(playlist) {
        return _c("div", { key: playlist.id, staticClass: "playlist" }, [
          _c("div", [
            _c(
              "a",
              {
                staticClass: "thumbnail",
                style: { backgroundImage: playlist.thumbnailCSS },
                attrs: {
                  href: playlist.firstVideoURL,
                  target: "_blank",
                  rel: "noreferrer"
                }
              },
              [
                _c("div", { staticClass: "thumbnail-overlay-right" }, [
                  _c("div", { staticClass: "value" }, [
                    _vm._v(_vm._s(playlist.itemCount))
                  ]),
                  _c("div", { staticClass: "playlist-icon" })
                ]),
                _c("div", { staticClass: "thumbnail-overlay-total" }, [
                  _c("div", { staticClass: "value" }, [
                    _vm._v(
                      _vm._s(
                        playlist.firstItem === null
                          ? "Loading"
                          : "Play the dang thing!"
                      )
                    )
                  ])
                ])
              ]
            ),
            _c("div", { staticClass: "title" }, [
              _vm._v(_vm._s(playlist.title))
            ]),
            _c("div", { staticClass: "created" }, [
              _vm._v(_vm._s(playlist.createdAgo))
            ]),
            _c(
              "a",
              {
                staticClass: "link",
                attrs: {
                  href: playlist.fullPlaylistURL,
                  target: "_blank",
                  rel: "noreferrer"
                }
              },
              [_vm._v("View Full Playlist")]
            )
          ])
        ])
      }),
      0
    )
  ])
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  const __vue_inject_styles__ = function (inject) {
    if (!inject) return
    inject("data-v-d69833fa_0", { source: "@import url(\"https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap\");\nbody {\n  font-family: \"Roboto\", sans-serif;\n  background: #0f0f0f;\n  color: white;\n  margin: 0;\n}\na {\n  color: inherit;\n  text-decoration: none;\n}\na:hover {\n  color: #cbdeec;\n  text-decoration: underline;\n}\n#search {\n  background: #1a1a1a;\n  padding: 4px;\n  position: sticky;\n  top: 0;\n  z-index: 100;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n#search input {\n  height: 28px;\n  width: 500px;\n  padding: 0 8px;\n  background: #0f0f0f;\n  box-sizing: border-box;\n  color: inherit;\n  border: 1px solid #292929;\n  border-top-left-radius: 4px;\n  border-bottom-left-radius: 4px;\n  outline: none;\n}\n#search input:active, #search input:focus {\n  border-color: #3d3d3d;\n}\n#search .button {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #292929;\n  border-top-right-radius: 4px;\n  border-bottom-right-radius: 4px;\n  width: 50px;\n  height: 28px;\n  cursor: pointer;\n  transition: 50ms background;\n}\n#search .button:before {\n  content: \"\";\n  display: block;\n  width: 18px;\n  height: 18px;\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' focusable='false'%3E%3Cpath fill='white' d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' class='style-scope yt-icon'%3E%3C/path%3E%3C/svg%3E\");\n}\n#search .button:active {\n  background: #3d3d3d;\n}\n#playlists {\n  padding: 4px;\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(396px, 1fr));\n  gap: 4px;\n  position: relative;\n}\n#playlists:empty:before {\n  content: \"Nothing found\";\n  font-size: 36px;\n  position: absolute;\n  top: 100px;\n  left: 50%;\n  transform: translate(-50%, 0);\n}\n#playlists.loading:before {\n  content: \"Loading...\";\n}\n.playlist {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  padding: 4px;\n}\n.playlist > div {\n  padding: 8px;\n  background: #242424;\n  transition: 140ms background;\n}\n.playlist > div:hover {\n  background: #29465b;\n  transition: 80ms background;\n}\n.playlist .created,\n.playlist .title,\n.playlist .link {\n  padding: 4px;\n  display: block;\n}\n.playlist .title {\n  font-size: 24px;\n  font-weight: bold;\n}\n.playlist .created {\n  font-size: 20px;\n}\n.playlist .link {\n  text-transform: uppercase;\n}\n.playlist .thumbnail {\n  display: block;\n  width: 380px;\n  height: 213px;\n  background-position: center;\n  background-size: cover;\n  background-repeat: no-repeat;\n  position: relative;\n  cursor: pointer;\n}\n.playlist .thumbnail .thumbnail-overlay-total,\n.playlist .thumbnail .thumbnail-overlay-right {\n  background: rgba(0, 0, 0, 0.75);\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n}\n.playlist .thumbnail .thumbnail-overlay-total > div,\n.playlist .thumbnail .thumbnail-overlay-right > div {\n  text-transform: uppercase;\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n}\n.playlist .thumbnail .thumbnail-overlay-right {\n  left: 50%;\n}\n.playlist .thumbnail .thumbnail-overlay-right .value {\n  font-weight: bold;\n  font-size: 32px;\n  top: 38%;\n}\n.playlist .thumbnail .thumbnail-overlay-right .playlist-icon {\n  width: 48px;\n  height: 48px;\n  top: 62%;\n  background-position: center;\n  background-size: cover;\n  background-repeat: no-repeat;\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' focusable='false' class='style-scope yt-icon'%3E%3Cpath d='M3.67 8.67h14V11h-14V8.67zm0-4.67h14v2.33h-14V4zm0 9.33H13v2.34H3.67v-2.34zm11.66 0v7l5.84-3.5-5.84-3.5z' fill='white'%3E%3C/path%3E%3C/svg%3E\");\n}\n.playlist .thumbnail .thumbnail-overlay-total {\n  font-size: 25px;\n  font-weight: bold;\n  text-align: center;\n  left: 0;\n  opacity: 0;\n  transition: 200ms opacity;\n}\n.playlist .thumbnail:hover .thumbnail-overlay-total {\n  opacity: 1;\n  transition: 100ms opacity;\n}\n\n/*# sourceMappingURL=pen.vue.map */", map: {"version":3,"sources":["/tmp/codepen/vuejs/src/pen.vue","pen.vue"],"names":[],"mappings":"AAuIA,wFAAA;AAEA;EACA,iCAAA;EACA,mBAAA;EACA,YAAA;EACA,SAAA;ACvIA;AD0IA;EACA,cAAA;EACA,qBAAA;ACvIA;ADyIA;EACA,cAAA;EACA,0BAAA;ACvIA;AD2IA;EACA,mBAAA;EACA,YAAA;EACA,gBAAA;EACA,MAAA;EACA,YAAA;EACA,aAAA;EACA,mBAAA;EACA,uBAAA;ACxIA;AD0IA;EACA,YAAA;EACA,YAAA;EACA,cAAA;EACA,mBAAA;EACA,sBAAA;EACA,cAAA;EACA,yBAAA;EACA,2BAAA;EACA,8BAAA;EACA,aAAA;ACxIA;AD0IA;EAEA,qBAAA;ACzIA;AD4IA;EACA,aAAA;EACA,mBAAA;EACA,uBAAA;EACA,mBAAA;EACA,4BAAA;EACA,+BAAA;EACA,WAAA;EACA,YAAA;EACA,eAAA;EACA,2BAAA;AC1IA;AD4IA;EACA,WAAA;EACA,cAAA;EACA,WAAA;EACA,YAAA;EACA,ydAAA;AC1IA;AD4IA;EACA,mBAAA;AC1IA;AD+IA;EACA,YAAA;EACA,aAAA;EACA,2DAAA;EACA,QAAA;EACA,kBAAA;AC5IA;AD8IA;EACA,wBAAA;EACA,eAAA;EACA,kBAAA;EACA,UAAA;EACA,SAAA;EACA,6BAAA;AC5IA;AD8IA;EACA,qBAAA;AC5IA;ADgJA;EACA,aAAA;EACA,sBAAA;EACA,mBAAA;EACA,YAAA;AC7IA;AD+IA;EACA,YAAA;EACA,mBAAA;EACA,4BAAA;AC7IA;AD+IA;EACA,mBAAA;EACA,2BAAA;AC7IA;ADgJA;;;EAGA,YAAA;EACA,cAAA;AC9IA;ADgJA;EACA,eAAA;EACA,iBAAA;AC9IA;ADgJA;EACA,eAAA;AC9IA;ADgJA;EACA,yBAAA;AC9IA;ADgJA;EACA,cAAA;EACA,YAAA;EACA,aAAA;EACA,2BAAA;EACA,sBAAA;EACA,4BAAA;EACA,kBAAA;EACA,eAAA;AC9IA;ADgJA;;EAEA,+BAAA;EACA,kBAAA;EACA,MAAA;EACA,QAAA;EACA,SAAA;AC9IA;ADgJA;;EACA,yBAAA;EACA,kBAAA;EACA,SAAA;EACA,QAAA;EACA,gCAAA;AC7IA;ADgJA;EACA,SAAA;AC9IA;ADgJA;EACA,iBAAA;EACA,eAAA;EACA,QAAA;AC9IA;ADgJA;EACA,WAAA;EACA,YAAA;EACA,QAAA;EACA,2BAAA;EACA,sBAAA;EACA,4BAAA;EACA,uVAAA;AC9IA;ADiJA;EACA,eAAA;EACA,iBAAA;EACA,kBAAA;EACA,OAAA;EACA,UAAA;EACA,yBAAA;AC/IA;ADiJA;EACA,UAAA;EACA,yBAAA;AC/IA;;AAEA,kCAAkC","file":"pen.vue","sourcesContent":["<template lang=\"pug\">\n#app\n\t#search\n\t\tinput(\n\t\t\tv-model=\"searchTerm\"\n\t\t\tplaceholder=\"Search\"\n\t\t)\n\t\t.button\n\t#playlists(\n\t\t\t:class=\"{ loading: this.loading }\"\n\t\t)\n\t\t.playlist(\n\t\t\tv-for=\"playlist in searchedPlaylists\"\n\t\t\t:key=\"playlist.id\"\n\t\t)\n\t\t\tdiv\n\t\t\t\ta.thumbnail(\n\t\t\t\t\t:style=\"{ backgroundImage: playlist.thumbnailCSS }\"\n\t\t\t\t\t:href=\"playlist.firstVideoURL\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noreferrer\"\n\t\t\t\t)\n\t\t\t\t\t.thumbnail-overlay-right\n\t\t\t\t\t\t.value {{ playlist.itemCount }}\n\t\t\t\t\t\t.playlist-icon\n\t\t\t\t\t.thumbnail-overlay-total\n\t\t\t\t\t\t.value {{ playlist.firstItem === null ? 'Loading' : 'Play the dang thing!' }}\n\t\t\t\t.title {{ playlist.title }}\n\t\t\t\t.created {{ playlist.createdAgo }}\n\t\t\t\ta.link(\n\t\t\t\t\t:href=\"playlist.fullPlaylistURL\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noreferrer\"\n\t\t\t\t) View Full Playlist\n</template>\n\n<script>\nconst BASE_URL = 'https://youtube.googleapis.com/youtube/v3';\nconst PLAYLISTS = 'playlists';\nconst PLAYLIST_ITEMS = 'playlistItems';\nconst API_KEY = 'AIzaSyCR0UtADNN9tZur6wOs-oKJDnm3pFL1ckk';\n\t\nexport default {\n\tasync mounted() {\n\t\tconst channelId = 'UCfLFTP1uTuIizynWsZq2nkQ';\n\t\tconst playlists = await this.getPlaylists(channelId);\n\t\tthis.loading = false;\n\t\tplaylists.items.forEach(async pl => {\n\t\t\tconst {\n\t\t\t\tid,\n\t\t\t\tcontentDetails: { itemCount },\n\t\t\t\tsnippet: {\n\t\t\t\t\tpublishedAt,\n\t\t\t\t\tthumbnails: { high: { url: thumbnailURL } },\n\t\t\t\t\ttitle\n\t\t\t\t}\n\t\t\t} = pl;\n\t\t\tconst rtf = new Intl.RelativeTimeFormat('en', { style: 'long' });\n\t\t\tconst created = Date.parse(publishedAt);\n\t\t\tconst createdAgo = `${countdown(created, null, null, 2)} ago`;\n\t\t\tconst playlistItem = {\n\t\t\t\tid,\n\t\t\t\ttitle,\n\t\t\t\tfullPlaylistURL: 'https://www.youtube.com/playlist?list=' + id,\n\t\t\t\tpublishedAt,\n\t\t\t\tthumbnailCSS: `url(${thumbnailURL})`,\n\t\t\t\t// thumbnailURL,\n\t\t\t\titemCount,\n\t\t\t\tcreatedAgo,\n\t\t\t\tfirstItem: null,\n\t\t\t\tfirstVideoURL: ''\n\t\t\t};\n\t\t\tthis.playlists.push(playlistItem);\n\t\t\tconst item = await this.getPlaylistItems(id);\n\t\t\tplaylistItem.firstItem = item.items[0].contentDetails.videoId;\n\t\t\tconst firstVideoQS = new URLSearchParams({\n\t\t\t\tv: playlistItem.firstItem,\n\t\t\t\tlist: id,\n\t\t\t\tindex: 0\n\t\t\t});\n\t\t\tplaylistItem.firstVideoURL = `https://www.youtube.com/watch?${firstVideoQS}`;\n\t\t});\n\t},\n\tdata() {\n\t\treturn {\n\t\t\tsearchTerm: '',\n\t\t\tplaylists: [],\n\t\t\tloading: true\n\t\t};\n\t},\n\tcomputed: {\n\t\tsearchedPlaylists() {\n\t\t\tif(!this.searchTerm) return this.playlists;\n\t\t\treturn this.playlists.filter(n => n.title.toLowerCase().includes(this.searchTerm.toLowerCase()));\n\t\t}\n\t},\n\tmethods: {\n\t\tasync getPlaylists(channelId) {\n\t\t\tconst qs = new URLSearchParams({\n\t\t\t\tpart: 'snippet',\n\t\t\t\tfields: 'items(id,snippet(publishedAt,title,thumbnails/high/url),contentDetails/itemCount)',\n\t\t\t\tchannelId,\n\t\t\t\tmaxResults: 50,\n\t\t\t\tkey: API_KEY\n\t\t\t});\n\t\t\tqs.append('part', 'contentDetails');\n\t\t\tconst url = `${BASE_URL}/${PLAYLISTS}?${qs}`;\n\t\t\tconst res = await fetch(url, { headers: { Accept: 'application/json' } });\n\t\t\tif(!res.ok) {\n\t\t\t\tconsole.error(await res.json());\n\t\t\t\tthrow new Error('Error loading data from the Google');\n\t\t\t}\n\t\t\treturn res.json();\n\t\t},\n\t\tasync getPlaylistItems(playlistId) {\n\t\t\tconst qs = new URLSearchParams({\n\t\t\t\tpart: 'contentDetails',\n\t\t\t\tmaxResults: 1,\n\t\t\t\tplaylistId,\n\t\t\t\tfields: 'items/contentDetails/videoId',\n\t\t\t\tkey: API_KEY\n\t\t\t});\n\t\t\tconst url = `${BASE_URL}/${PLAYLIST_ITEMS}?${qs}`;\n\t\t\tconst res = await fetch(url, { headers: { Accept: 'application/json' } });\n\t\t\tif(!res.ok) {\n\t\t\t\tconsole.error(await res.json());\n\t\t\t\tthrow new Error('Error loading data from the Google');\n\t\t\t}\n\t\t\treturn res.json();\n\t\t}\n\t}\n};\n</script>\n\n<style lang=\"scss\">\n@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');\n\nbody {\n\tfont-family: 'Roboto', sans-serif;\n\tbackground: hsl(0, 0%, 6%);\n\tcolor: hsl(0, 0%, 100%);\n\tmargin: 0;\n}\n\na {\n\tcolor: inherit;\n\ttext-decoration: none;\n\t\n\t&:hover {\n\t\tcolor: hsl(205, 46%, 86%);\n\t\ttext-decoration: underline;\n\t}\n}\n\n#search {\n\tbackground: hsl(0, 0%, 10%);\n\tpadding: 4px;\n\tposition: sticky;\n\ttop: 0;\n\tz-index: 100;\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\t\n\tinput {\n\t\theight: 28px;\n\t\twidth: 500px;\n\t\tpadding: 0 8px;\n\t\tbackground: hsl(0, 0%, 6%);\n\t\tbox-sizing: border-box;\n\t\tcolor: inherit;\n\t\tborder: 1px solid hsl(0, 0, 16%);\n\t\tborder-top-left-radius: 4px;\n\t\tborder-bottom-left-radius: 4px;\n\t\toutline: none;\n\t\t\n\t\t&:active,\n\t\t&:focus {\n\t\t\tborder-color: hsl(0, 0, 24%);\n\t\t}\n\t}\n\t.button {\n\t\tdisplay: flex;\n\t\talign-items: center;\n\t\tjustify-content: center;\n\t\tbackground: hsl(0, 0, 16%);\n\t\tborder-top-right-radius: 4px;\n\t\tborder-bottom-right-radius: 4px;\n\t\twidth: 50px;\n\t\theight: 28px;\n\t\tcursor: pointer;\n\t\ttransition: 50ms background;\n\t\t\n\t\t&:before {\n\t\t\tcontent: '';\n\t\t\tdisplay: block;\n\t\t\twidth: 18px;\n\t\t\theight: 18px;\n\t\t\tbackground-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' focusable='false'%3E%3Cpath fill='white' d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' class='style-scope yt-icon'%3E%3C/path%3E%3C/svg%3E\");\n\t\t}\n\t\t&:active {\n\t\t\tbackground: hsl(0, 0, 24%);\n\t\t}\n\t}\n}\n\n#playlists {\n\tpadding: 4px;\n\tdisplay: grid;\n\tgrid-template-columns: repeat(auto-fit, minmax(396px, 1fr));\n\tgap: 4px;\n\tposition: relative;\n\t\n\t&:empty:before {\n\t\tcontent: 'Nothing found';\n\t\tfont-size: 36px;\n\t\tposition: absolute;\n\t\ttop: 100px;\n\t\tleft: 50%;\n\t\ttransform: translate(-50%, 0);\n\t}\n\t&.loading:before {\n\t\tcontent: 'Loading...';\n\t}\n}\n\n.playlist {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\tpadding: 4px;\n\t\n\t> div {\n\t\tpadding: 8px;\n\t\tbackground: hsl(0, 0%, 14%);\n\t\ttransition: 140ms background;\n\t\t\n\t\t&:hover {\n\t\t\tbackground: hsl(205, 38%, 26%);\n\t\t\ttransition: 80ms background;\n\t\t}\n\t}\n\t.created,\n\t.title,\n\t.link {\n\t\tpadding: 4px;\n\t\tdisplay: block;\n\t}\n\t.title {\n\t\tfont-size: 24px;\n\t\tfont-weight: bold;\n\t}\n\t.created {\n\t\tfont-size: 20px;\n\t}\n\t.link {\n\t\ttext-transform: uppercase;\n\t}\n\t.thumbnail {\n\t\tdisplay: block;\n\t\twidth: 380px;\n\t\theight: 213px;\n\t\tbackground-position: center;\n\t\tbackground-size: cover;\n\t\tbackground-repeat: no-repeat;\n\t\tposition: relative;\n\t\tcursor: pointer;\n\t\t\n\t\t.thumbnail-overlay-total,\n\t\t.thumbnail-overlay-right {\n\t\t\tbackground: hsla(0, 0%, 0%, 0.75);\n\t\t\tposition: absolute;\n\t\t\ttop: 0;\n\t\t\tright: 0;\n\t\t\tbottom: 0;\n\t\t\t\n\t\t\t> div {\n\t\t\t\ttext-transform: uppercase;\n\t\t\t\tposition: absolute;\n\t\t\t\tleft: 50%;\n\t\t\t\ttop: 50%;\n\t\t\t\ttransform: translate(-50%, -50%);\n\t\t\t}\n\t\t}\n\t\t.thumbnail-overlay-right {\n\t\t\tleft: 50%;\n\t\t\t\n\t\t\t.value {\n\t\t\t\tfont-weight: bold;\n\t\t\t\tfont-size: 32px;\n\t\t\t\ttop: 38%;\n\t\t\t}\n\t\t\t.playlist-icon {\n\t\t\t\twidth: 48px;\n\t\t\t\theight: 48px;\n\t\t\t\ttop: 62%;\n\t\t\t\tbackground-position: center;\n\t\t\t\tbackground-size: cover;\n\t\t\t\tbackground-repeat: no-repeat;\n\t\t\t\tbackground-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' focusable='false' class='style-scope yt-icon'%3E%3Cpath d='M3.67 8.67h14V11h-14V8.67zm0-4.67h14v2.33h-14V4zm0 9.33H13v2.34H3.67v-2.34zm11.66 0v7l5.84-3.5-5.84-3.5z' fill='white'%3E%3C/path%3E%3C/svg%3E\");\n\t\t\t}\n\t\t}\n\t\t.thumbnail-overlay-total {\n\t\t\tfont-size: 25px;\n\t\t\tfont-weight: bold;\n\t\t\ttext-align: center;\n\t\t\tleft: 0;\n\t\t\topacity: 0;\n\t\t\ttransition: 200ms opacity;\n\t\t}\n\t\t&:hover .thumbnail-overlay-total {\n\t\t\topacity: 1;\n\t\t\ttransition: 100ms opacity;\n\t\t}\n\t}\n}\n</style>","@import url(\"https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap\");\nbody {\n  font-family: \"Roboto\", sans-serif;\n  background: #0f0f0f;\n  color: white;\n  margin: 0;\n}\n\na {\n  color: inherit;\n  text-decoration: none;\n}\na:hover {\n  color: #cbdeec;\n  text-decoration: underline;\n}\n\n#search {\n  background: #1a1a1a;\n  padding: 4px;\n  position: sticky;\n  top: 0;\n  z-index: 100;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n#search input {\n  height: 28px;\n  width: 500px;\n  padding: 0 8px;\n  background: #0f0f0f;\n  box-sizing: border-box;\n  color: inherit;\n  border: 1px solid #292929;\n  border-top-left-radius: 4px;\n  border-bottom-left-radius: 4px;\n  outline: none;\n}\n#search input:active, #search input:focus {\n  border-color: #3d3d3d;\n}\n#search .button {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #292929;\n  border-top-right-radius: 4px;\n  border-bottom-right-radius: 4px;\n  width: 50px;\n  height: 28px;\n  cursor: pointer;\n  transition: 50ms background;\n}\n#search .button:before {\n  content: \"\";\n  display: block;\n  width: 18px;\n  height: 18px;\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' focusable='false'%3E%3Cpath fill='white' d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' class='style-scope yt-icon'%3E%3C/path%3E%3C/svg%3E\");\n}\n#search .button:active {\n  background: #3d3d3d;\n}\n\n#playlists {\n  padding: 4px;\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(396px, 1fr));\n  gap: 4px;\n  position: relative;\n}\n#playlists:empty:before {\n  content: \"Nothing found\";\n  font-size: 36px;\n  position: absolute;\n  top: 100px;\n  left: 50%;\n  transform: translate(-50%, 0);\n}\n#playlists.loading:before {\n  content: \"Loading...\";\n}\n\n.playlist {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  padding: 4px;\n}\n.playlist > div {\n  padding: 8px;\n  background: #242424;\n  transition: 140ms background;\n}\n.playlist > div:hover {\n  background: #29465b;\n  transition: 80ms background;\n}\n.playlist .created,\n.playlist .title,\n.playlist .link {\n  padding: 4px;\n  display: block;\n}\n.playlist .title {\n  font-size: 24px;\n  font-weight: bold;\n}\n.playlist .created {\n  font-size: 20px;\n}\n.playlist .link {\n  text-transform: uppercase;\n}\n.playlist .thumbnail {\n  display: block;\n  width: 380px;\n  height: 213px;\n  background-position: center;\n  background-size: cover;\n  background-repeat: no-repeat;\n  position: relative;\n  cursor: pointer;\n}\n.playlist .thumbnail .thumbnail-overlay-total,\n.playlist .thumbnail .thumbnail-overlay-right {\n  background: rgba(0, 0, 0, 0.75);\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n}\n.playlist .thumbnail .thumbnail-overlay-total > div,\n.playlist .thumbnail .thumbnail-overlay-right > div {\n  text-transform: uppercase;\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n}\n.playlist .thumbnail .thumbnail-overlay-right {\n  left: 50%;\n}\n.playlist .thumbnail .thumbnail-overlay-right .value {\n  font-weight: bold;\n  font-size: 32px;\n  top: 38%;\n}\n.playlist .thumbnail .thumbnail-overlay-right .playlist-icon {\n  width: 48px;\n  height: 48px;\n  top: 62%;\n  background-position: center;\n  background-size: cover;\n  background-repeat: no-repeat;\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' preserveAspectRatio='xMidYMid meet' focusable='false' class='style-scope yt-icon'%3E%3Cpath d='M3.67 8.67h14V11h-14V8.67zm0-4.67h14v2.33h-14V4zm0 9.33H13v2.34H3.67v-2.34zm11.66 0v7l5.84-3.5-5.84-3.5z' fill='white'%3E%3C/path%3E%3C/svg%3E\");\n}\n.playlist .thumbnail .thumbnail-overlay-total {\n  font-size: 25px;\n  font-weight: bold;\n  text-align: center;\n  left: 0;\n  opacity: 0;\n  transition: 200ms opacity;\n}\n.playlist .thumbnail:hover .thumbnail-overlay-total {\n  opacity: 1;\n  transition: 100ms opacity;\n}\n\n/*# sourceMappingURL=pen.vue.map */"]}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__ = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    createInjector,
    undefined,
    undefined
  );

export default __vue_component__;