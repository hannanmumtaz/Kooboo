(function() {
    var template = Kooboo.getTemplate("/_Admin/Scripts/pageEditor/components/htmlmeta.html");

    var ATTR_RES_TAG_ID = 'kb-res-tag-id';

    var defaultLang;

    ko.components.register("kb-page-html-meta", {
        viewModel: function(params) {
            var self = this;

            this.metas = ko.observableArray(params && params.metas);

            this.metaList = ko.observableArray([]);

            this.editingMeta = ko.observable();

            defaultLang = params.defaultLang;

            this.createMeta = function() {
                Kooboo.EventBus.publish("kb/html/meta/dialog/show", {
                    "name": "",
                    "httpequiv": "",
                    "content": { "": "" },
                    "charset": ""
                })
            }

            this.edit = function(meta) {
                self.editingMeta(meta);
                Kooboo.EventBus.publish("kb/html/meta/dialog/show", meta);
            }

            this.remove = function(meta) {
                self.metaList.remove(meta);
                meta.elem && $(meta.elem).remove();
                Kooboo.EventBus.publish("kb/frame/resource/remove", {
                    type: "meta",
                    tag: meta.elem
                })
            }

            if (params.settings()) {
                var fdoc = window.__pageEditor.kbFrame.getDocumentElement(),
                    metaElements = $("meta", fdoc);

                if (params.settings().type.toLowerCase() !== "layout") {
                    Kooboo.EventBus.subscribe("kb/frame/loaded", function() {
                        self.metaList([]);

                        var metas = $("meta", window.__pageEditor.kbFrame.getDocumentElement());
                        $.each(metas, function(idx, el) {
                            var meta = {
                                charset: null,
                                content: {},
                                displayText: ko.observable(),
                                elem: el,
                                httpequiv: null,
                                name: null
                            }

                            var find = _.find(params.settings().metas, function(meta) {
                                return $(meta.elem).attr(ATTR_RES_TAG_ID) == $(el).attr(ATTR_RES_TAG_ID);
                            })

                            if (find) {
                                meta.content = find.content;
                            } else {
                                meta.content[defaultLang] = $(el).attr('content');
                            }

                            if (el.hasAttribute("http_equiv")) {
                                var el = $(el).clone()[0];
                                var val = el.getAttribute("http_equiv");
                                el.removeAttribute("http_equiv");
                                el.setAttribute("http_equiv", val);
                            }

                            if ($(el).attr("name")) {
                                meta.name = $(el).attr("name");
                            } else if ($(el).attr("http_equiv")) {
                                meta.httpequiv = $(el).attr("http_equiv");
                            } else if ($(el).attr("charset")) {
                                meta.charset = $(el).attr("charset");
                            }

                            var displayText;
                            if ($(el).attr("http_equiv")) {
                                displayText = '<meta http-equiv="' + $(el).attr('http_equiv') + '" content="' + meta.content[params.defaultLang] + '">';
                            } else {
                                displayText = el.outerHTML.split(new RegExp(ATTR_RES_TAG_ID + '="\\S*"')).join('');
                            }

                            meta.displayText(displayText);
                            meta.displayText.subscribe(function() {
                                Kooboo.EventBus.publish("kb/page/field/change", {
                                    type: "meta"
                                })
                            });

                            self.metaList.push(meta);
                        })
                    })
                }

                _.forEach(params.settings().metas, function(meta) {
                    var element = $("<meta>"),
                        defaultContentValue = meta.content[params.defaultLang] || meta.content[""];

                    if (meta.name) {
                        $(element).attr("name", meta.name)
                            .attr("content", defaultContentValue);
                    } else if (meta.httpequiv) {
                        $(element).attr("http_equiv", meta.httpequiv)
                            .attr("content", defaultContentValue);
                    } else if (meta.charset) {
                        $(element).attr("charset", meta.charset);
                    }

                    var _pageMeta = null;
                    if (metaElements.length) {
                        $.each(metaElements, function(idx, el) {
                            if (meta.name) {
                                if ($(el).attr("name") == meta.name && $(el).attr("content") == defaultContentValue) {
                                    _pageMeta = el;
                                }
                            } else if (meta.httpequiv) {
                                if ($(el).attr("http_equiv") == meta.httpequiv && $(el).attr("content") == defaultContentValue) {
                                    _pageMeta = el;
                                }
                            } else if (meta.charset) {
                                if ($(el).attr("charset") == meta.charset) {
                                    _pageMeta = el;
                                }
                            }
                        })
                    } else {
                        $("head", fdoc).append(element);
                        _pageMeta = element[0];
                    }

                    meta.displayText = ko.observable(element[0].outerHTML);
                    meta.displayText.subscribe(function() {
                        Kooboo.EventBus.publish("kb/page/field/change", {
                            type: "meta"
                        })
                    })
                    meta.elem = _pageMeta;

                    self.metaList.push(meta);
                })

                Kooboo.EventBus.subscribe("kb/pageEditor/metaList/get", function(list) {
                    self.metaList(list);
                })

                Kooboo.EventBus.subscribe("kb/page/meta/save", function(meta) {
                    var _find = _.findLast(self.metaList(), function(m) {
                            return $(m.elem).is(meta.elem);
                        }),
                        _idx = _.findIndex(self.metaList(), function(m) {
                            return m == _find;
                        });

                    if (_find) {
                        _find = _.assignIn(_find, meta);

                        var selectedData = {};

                        if (meta.name) {
                            selectedData.key = 'name';
                            selectedData.value = meta.name;
                            $(_find.elem).attr("name", meta.name)
                                .attr("content", meta.content[params.defaultLang])
                                .removeAttr("charset")
                                .removeAttr("http_equiv");
                        } else if (meta.httpequiv) {
                            selectedData.key = "http_equiv";
                            selectedData.value = meta.httpequiv
                            $(_find.elem).attr("http_equiv", meta.httpequiv)
                                .attr("content", meta.content[params.defaultLang])
                                .removeAttr("charset")
                                .removeAttr("name");
                        } else if (meta.charset) {
                            selectedData.key = "charset";
                            selectedData.value = meta.charset;
                            $(_find.elem).attr("charset", meta.charset)
                                .removeAttr("name")
                                .removeAttr("http_equiv")
                                .removeAttr("content");
                        }

                        if ($(_find.elem).attr("http_equiv")) {
                            _find.displayText('<meta http-equiv="' + $(_find.elem).attr('http_equiv') + '" content="' + meta.content[params.defaultLang] + '">')
                        } else {
                            var displayText = _find.elem.outerHTML.split(new RegExp(ATTR_RES_TAG_ID + '="\\S*"')).join('');
                            _find.displayText(displayText);
                        }

                        Kooboo.EventBus.publish('kb/frame/resource/update', {
                            type: 'meta',
                            resTagId: $(_find.elem).attr(ATTR_RES_TAG_ID),
                            content: {
                                attr: selectedData,
                                content: meta.content[params.defaultLang]
                            }
                        })
                    } else {
                        var el = $("<meta>");

                        if (meta.name) {
                            $(el).attr("name", meta.name)
                                .attr("content", meta.content[params.defaultLang]);
                        } else if (meta.httpequiv) {
                            $(el).attr("http_equiv", meta.httpequiv)
                                .attr("content", meta.content[params.defaultLang]);
                        } else if (meta.charset) {
                            $(el).attr("charset", meta.charset);
                        } else {
                            $(el).attr("content", meta.content[params.defaultLang]);
                        }
                        $(el).attr(ATTR_RES_TAG_ID, Kooboo.getResourceTagId('meta'));

                        meta.elem = el[0];
                        var displayText = el[0].outerHTML.split(new RegExp(ATTR_RES_TAG_ID + '="\\S*"')).join('');
                        meta.displayText = ko.observable(displayText);
                        meta.displayText.subscribe(function() {
                            Kooboo.EventBus.publish("kb/page/field/change", {
                                type: "meta"
                            })
                        })

                        if (meta.httpequiv == "refresh") {
                            meta.elem.removeAttribute("http_equiv");
                            meta.elem.setAttribute("http_equiv", "refresh");
                        }

                        $($("#page_iframe")[0].contentWindow.document.head).append(meta.elem);
                        self.metaList.push(meta);

                        Kooboo.EventBus.publish('kb/frame/resource/add', {
                            type: 'meta',
                            tag: $(meta.elem).clone()[0]
                        })
                    }
                })

                Kooboo.EventBus.subscribe("kb/page/save", function(res) {
                    var metaList = _.cloneDeep(self.metaList());
                    _.forEach(metaList, function(meta) {
                        delete meta.displayText;
                        delete meta.elem;
                    })
                    res["metas"] = metaList;
                })
            }
        },
        template: template
    })
})()