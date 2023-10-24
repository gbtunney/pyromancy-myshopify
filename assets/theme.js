window.theme = window.theme || {}
window.slate = window.slate || {}

/* ================ SLATE ================ */
theme.Sections = function Sections() {
    this.constructors = {}
    this.instances = []

    $(document)
        .on('shopify:section:load', this._onSectionLoad.bind(this))
        .on('shopify:section:unload', this._onSectionUnload.bind(this))
        .on('shopify:section:select', this._onSelect.bind(this))
        .on('shopify:section:deselect', this._onDeselect.bind(this))
        .on('shopify:block:select', this._onBlockSelect.bind(this))
        .on('shopify:block:deselect', this._onBlockDeselect.bind(this))
}

theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
    _createInstance: function (container, constructor) {
        var $container = $(container)
        var id = $container.attr('data-section-id')
        var type = $container.attr('data-section-type')

        constructor = constructor || this.constructors[type]

        if (_.isUndefined(constructor)) {
            return
        }

        var instance = _.assignIn(new constructor(container), {
            id: id,
            type: type,
            container: container,
        })

        this.instances.push(instance)
    },

    _onSectionLoad: function (evt) {
        var container = $('[data-section-id]', evt.target)[0]
        if (container) {
            this._createInstance(container)
        }
    },

    _onSectionUnload: function (evt) {
        this.instances = _.filter(this.instances, function (instance) {
            var isEventInstance = instance.id === evt.detail.sectionId

            if (isEventInstance) {
                if (_.isFunction(instance.onUnload)) {
                    instance.onUnload(evt)
                }
            }

            return !isEventInstance
        })
    },

    _onSelect: function (evt) {
        // eslint-disable-next-line no-shadow
        var instance = _.find(this.instances, function (instance) {
            return instance.id === evt.detail.sectionId
        })

        if (!_.isUndefined(instance) && _.isFunction(instance.onSelect)) {
            instance.onSelect(evt)
        }
    },

    _onDeselect: function (evt) {
        // eslint-disable-next-line no-shadow
        var instance = _.find(this.instances, function (instance) {
            return instance.id === evt.detail.sectionId
        })

        if (!_.isUndefined(instance) && _.isFunction(instance.onDeselect)) {
            instance.onDeselect(evt)
        }
    },

    _onBlockSelect: function (evt) {
        // eslint-disable-next-line no-shadow
        var instance = _.find(this.instances, function (instance) {
            return instance.id === evt.detail.sectionId
        })

        if (!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)) {
            instance.onBlockSelect(evt)
        }
    },

    _onBlockDeselect: function (evt) {
        // eslint-disable-next-line no-shadow
        var instance = _.find(this.instances, function (instance) {
            return instance.id === evt.detail.sectionId
        })

        if (
            !_.isUndefined(instance) &&
            _.isFunction(instance.onBlockDeselect)
        ) {
            instance.onBlockDeselect(evt)
        }
    },

    register: function (type, constructor) {
        this.constructors[type] = constructor

        $('[data-section-type=' + type + ']').each(
            function (index, container) {
                this._createInstance(container, constructor)
            }.bind(this),
        )
    },
})

window.slate = window.slate || {}

/**
 * ## IFrames
 *
 * Wrap videos in div to force responsive layout.
 *
 * @namespace Iframes
 */

slate.rte = {
    wrapTable: function () {
        $('.rte table').wrap('<div class="rte__table-wrapper"></div>')
    },

    iframeReset: function () {
        var $iframeVideo = $(
            '.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"]',
        )
        var $iframeReset = $iframeVideo.add('.rte iframe#admin_bar_iframe')

        $iframeVideo.each(function () {
            // Add wrapper to make video responsive
            $(this).wrap('<div class="video-wrapper"></div>')
        })

        $iframeReset.each(function () {
            // Re-set the src attribute on each iframe after page load
            // for Chrome's "incorrect iFrame content on 'back'" bug.
            // https://code.google.com/p/chromium/issues/detail?id=395791
            // Need to specifically target video and admin bar
            this.src = this.src
        })
    },
}

window.slate = window.slate || {}

/**
 * ## A11y Helpers
 *
 * A collection of useful functions that help make your theme more accessible to
 * users with visual impairments.
 *
 * @namespace A11y
 */

slate.a11y = {
    /**
     * For use when focus shifts to a container rather than a link eg for
     * In-page links, after scroll, focus shifts to content area so that next
     * `tab` is where user expects if focusing a link, just $link.focus();
     *
     * @param {JQuery} $element - The element to be acted upon
     */
    pageLinkFocus: function ($element) {
        var focusClass = 'js-focus-hidden'

        $element
            .first()
            .attr('tabIndex', '-1')
            .focus()
            .addClass(focusClass)
            .one('blur', callback)

        function callback() {
            $element.first().removeClass(focusClass).removeAttr('tabindex')
        }
    },

    /** If there's a hash in the url, focus the appropriate element */
    focusHash: function () {
        var hash = window.location.hash

        // is there a hash in the url? is it an element on the page?
        if (hash && document.getElementById(hash.slice(1))) {
            this.pageLinkFocus($(hash))
        }
    },

    /**
     * When an in-page (url w/hash) link is clicked, focus the appropriate
     * element
     */
    bindInPageLinks: function () {
        $('a[href*=#]').on(
            'click',
            function (evt) {
                this.pageLinkFocus($(evt.currentTarget.hash))
            }.bind(this),
        )
    },

    /**
     * Traps the focus in a particular container
     *
     * @param {object} options - Options to be used
     * @param {jQuery} options.$container - Container to trap focus within
     * @param {jQuery} options.$elementToFocus - Element to be focused when
     *   focus leaves container
     * @param {string} options.namespace - Namespace used for new focus event
     *   handler
     */
    trapFocus: function (options) {
        var eventName = options.eventNamespace
            ? 'focusin.' + options.eventNamespace
            : 'focusin'

        if (!options.$elementToFocus) {
            options.$elementToFocus = options.$container
        }

        options.$container.attr('tabindex', '-1')
        options.$elementToFocus.focus()

        $(document).on(eventName, function (evt) {
            if (
                options.$container[0] !== evt.target &&
                !options.$container.has(evt.target).length
            ) {
                options.$container.focus()
            }
        })
    },

    /**
     * Removes the trap of focus in a particular container
     *
     * @param {object} options - Options to be used
     * @param {jQuery} options.$container - Container to trap focus within
     * @param {string} options.namespace - Namespace used for new focus event
     *   handler
     */
    removeTrapFocus: function (options) {
        var eventName = options.namespace
            ? 'focusin.' + options.namespace
            : 'focusin'

        if (options.$container && options.$container.length) {
            options.$container.removeAttr('tabindex')
        }

        $(document).off(eventName)
    },
}

/**
 * ## Currency Helpers
 *
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 *
 * - FormatMoney - Takes an amount in cents and returns it as a formatted dollar
 *   value.
 *
 * Alternatives
 *
 * - Accounting.js - http://openexchangerates.github.io/accounting.js/
 */

theme.Currency = (function () {
    var moneyFormat = '${{amount}}' // eslint-disable-line camelcase

    function formatMoney(cents, format) {
        if (typeof cents === 'string') {
            cents = cents.replace('.', '')
        }
        var value = ''
        var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/
        var formatString = format || moneyFormat

        function formatWithDelimiters(number, precision, thousands, decimal) {
            precision = precision || 2
            thousands = thousands || ','
            decimal = decimal || '.'

            if (isNaN(number) || number == null) {
                return 0
            }

            number = (number / 100.0).toFixed(precision)

            var parts = number.split('.')
            var dollarsAmount = parts[0].replace(
                /(\d)(?=(\d\d\d)+(?!\d))/g,
                '$1' + thousands,
            )
            var centsAmount = parts[1] ? decimal + parts[1] : ''

            return dollarsAmount + centsAmount
        }

        switch (formatString.match(placeholderRegex)[1]) {
            case 'amount':
                value = formatWithDelimiters(cents, 2)
                break
            case 'amount_no_decimals':
                value = formatWithDelimiters(cents, 0)
                break
            case 'amount_with_comma_separator':
                value = formatWithDelimiters(cents, 2, '.', ',')
                break
            case 'amount_no_decimals_with_comma_separator':
                value = formatWithDelimiters(cents, 0, '.', ',')
                break
            case 'amount_no_decimals_with_space_separator':
                value = formatWithDelimiters(cents, 0, ' ')
                break
        }

        return formatString.replace(placeholderRegex, value)
    }

    return {
        formatMoney: formatMoney,
    }
})()

/**
 * ## Image Helper Functions
 *
 * A collection of functions that help with basic image operations.
 */

theme.Images = (function () {
    /**
     * Preloads an image in memory and uses the browsers cache to store it until
     * needed.
     *
     * @param {Array} images - A list of image urls
     * @param {String} size - A shopify image size attribute
     */

    function preload(images, size) {
        if (typeof images === 'string') {
            images = [images]
        }

        for (var i = 0; i < images.length; i++) {
            var image = images[i]
            this.loadImage(this.getSizedImageUrl(image, size))
        }
    }

    /**
     * Loads and caches an image in the browsers cache.
     *
     * @param {string} path - An image url
     */
    function loadImage(path) {
        new Image().src = path
    }

    /**
     * Swaps the src of an image for another OR returns the imageURL to the
     * callback function
     *
     * @param image
     * @param element
     * @param callback
     */
    function switchImage(image, element, callback) {
        var size = this.imageSize(element.src)
        var imageUrl = this.getSizedImageUrl(image.src, size)

        if (callback) {
            callback(imageUrl, image, element) // eslint-disable-line callback-return
        } else {
            element.src = imageUrl
        }
    }

    /**
     * +++ Useful Find the Shopify image attribute size
     *
     * @param {string} src
     * @returns {null}
     */
    function imageSize(src) {
        var match = src.match(
            /.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/,
        )

        if (match === null) {
            return null
        } else {
            return match[1]
        }
    }

    /**
     * +++ Useful Adds a Shopify size attribute to a URL
     *
     * @param src
     * @param size
     * @returns {any}
     */
    function getSizedImageUrl(src, size) {
        if (size == null) {
            return src
        }

        if (size === 'master') {
            return this.removeProtocol(src)
        }

        var match = src.match(
            /\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i,
        )

        if (match != null) {
            var prefix = src.split(match[0])
            var suffix = match[0]

            return this.removeProtocol(prefix[0] + '_' + size + suffix)
        }

        return null
    }

    function removeProtocol(path) {
        return path.replace(/http(s)?:/, '')
    }

    return {
        preload: preload,
        loadImage: loadImage,
        switchImage: switchImage,
        imageSize: imageSize,
        getSizedImageUrl: getSizedImageUrl,
        removeProtocol: removeProtocol,
    }
})()

/**
 * ## Variant Selection scripts
 *
 * Handles change events from the variant inputs in any `cart/add` forms that
 * may exist. Also updates the master select and triggers updates when the
 * variants price or image changes.
 *
 * @namespace Variants
 */

slate.Variants = (function () {
    /**
     * Variant constructor
     *
     * @param {object} options - Settings from `product.js`
     */
    function Variants(options) {
        this.$container = options.$container
        this.product = options.product
        this.singleOptionSelector = options.singleOptionSelector
        this.originalSelectorId = options.originalSelectorId
        this.enableHistoryState = options.enableHistoryState
        this.currentVariant = this._getVariantFromOptions()

        $(this.singleOptionSelector, this.$container).on(
            'change',
            this._onSelectChange.bind(this),
        )
    }

    Variants.prototype = _.assignIn({}, Variants.prototype, {
        /**
         * Get the currently selected options from add-to-cart form. Works with
         * all form input elements.
         *
         * @returns {array} Options - Values of currently selected variants
         */
        _getCurrentOptions: function () {
            var currentOptions = _.map(
                $(this.singleOptionSelector, this.$container),
                function (element) {
                    var $element = $(element)
                    var type = $element.attr('type')
                    var currentOption = {}

                    if (type === 'radio' || type === 'checkbox') {
                        if ($element[0].checked) {
                            currentOption.value = $element.val()
                            currentOption.index = $element.data('index')

                            return currentOption
                        } else {
                            return false
                        }
                    } else {
                        currentOption.value = $element.val()
                        currentOption.index = $element.data('index')

                        return currentOption
                    }
                },
            )

            // remove any unchecked input values if using radio buttons or checkboxes
            currentOptions = _.compact(currentOptions)

            return currentOptions
        },

        /**
         * Find variant based on selected values.
         *
         * @param {array} selectedValues - Values of variant inputs
         * @returns {object || undefined} Found - Variant object from
         *   product.variants
         */
        _getVariantFromOptions: function () {
            var selectedValues = this._getCurrentOptions()
            var variants = this.product.variants

            var found = _.find(variants, function (variant) {
                return selectedValues.every(function (values) {
                    return _.isEqual(variant[values.index], values.value)
                })
            })

            return found
        },

        /** Event handler for when a variant input changes. */
        _onSelectChange: function () {
            var variant = this._getVariantFromOptions()

            this.$container.trigger({
                type: 'variantChange',
                variant: variant,
            })

            if (!variant) {
                return
            }

            this._updateMasterSelect(variant)
            this._updateImages(variant)
            this._updatePrice(variant)
            this._updateSKU(variant)
            this.currentVariant = variant

            if (this.enableHistoryState) {
                this._updateHistoryState(variant)
            }
        },

        /**
         * Trigger event when variant image changes
         *
         * @param {object} variant - Currently selected variant
         * @returns {event} VariantImageChange
         */
        _updateImages: function (variant) {
            var variantImage = variant.featured_image || {}
            var currentVariantImage = this.currentVariant.featured_image || {}

            if (
                !variant.featured_image ||
                variantImage.src === currentVariantImage.src
            ) {
                return
            }

            this.$container.trigger({
                type: 'variantImageChange',
                variant: variant,
            })
        },

        /**
         * Trigger event when variant price changes.
         *
         * @param {object} variant - Currently selected variant
         * @returns {event} VariantPriceChange
         */
        _updatePrice: function (variant) {
            if (
                variant.price === this.currentVariant.price &&
                variant.compare_at_price ===
                    this.currentVariant.compare_at_price
            ) {
                return
            }

            this.$container.trigger({
                type: 'variantPriceChange',
                variant: variant,
            })
        },

        /**
         * Trigger event when variant sku changes.
         *
         * @param {object} variant - Currently selected variant
         * @returns {event} VariantSKUChange
         */
        _updateSKU: function (variant) {
            if (variant.sku === this.currentVariant.sku) {
                return
            }

            this.$container.trigger({
                type: 'variantSKUChange',
                variant: variant,
            })
        },

        /**
         * Update history state for product deeplinking
         *
         * @param {variant} variant - Currently selected variant
         * @returns {k | undefined} Description
         */
        _updateHistoryState: function (variant) {
            if (!history.replaceState || !variant) {
                return
            }

            var newurl =
                window.location.protocol +
                '//' +
                window.location.host +
                window.location.pathname +
                '?variant=' +
                variant.id
            window.history.replaceState({ path: newurl }, '', newurl)
        },

        /**
         * Update hidden master select of variant change
         *
         * @param {variant} variant - Currently selected variant
         */
        _updateMasterSelect: function (variant) {
            $(this.originalSelectorId, this.$container).val(variant.id)
        },
    })

    return Variants
})()

/*================ MODULES ================*/
window.Drawers = (function () {
    var Drawer = function (id, position, options) {
        var defaults = {
            close: '.js-drawer-close',
            open: '.js-drawer-open-' + position,
            openClass: 'js-drawer-open',
            dirOpenClass: 'js-drawer-open-' + position,
        }

        this.$nodes = {
            parent: $('body, html'),
            page: $('.page-element'),
            moved: $('.is-moved-by-drawer'),
        }

        this.config = $.extend(defaults, options)
        this.position = position

        this.$drawer = $('#' + id)
        this.$open = $(this.config.open)

        if (!this.$drawer.length) {
            return false
        }

        this.drawerIsOpen = false
        this.init()
    }

    Drawer.prototype.init = function () {
        this.$open.attr('aria-expanded', 'false')
        this.$open.on('click', $.proxy(this.open, this))
        this.$drawer
            .find(this.config.close)
            .on('click', $.proxy(this.close, this))
    }

    Drawer.prototype.open = function (evt) {
        // Keep track if drawer was opened from a click, or called by another function
        var externalCall = false

        // don't open an opened drawer
        if (this.drawerIsOpen) {
            return
        }

        this.$open.addClass(this.config.openClass)

        // Prevent following href if link is clicked
        if (evt) {
            evt.preventDefault()
        } else {
            externalCall = true
        }

        // Without this, the drawer opens, the click event bubbles up to $nodes.page
        // which closes the drawer.
        if (evt && evt.stopPropagation) {
            evt.stopPropagation()
            // save the source of the click, we'll focus to this on close
            this.$activeSource = $(evt.currentTarget)
        }

        if (this.drawerIsOpen && !externalCall) {
            return this.close()
        }

        // Add is-transitioning class to moved elements on open so drawer can have
        // transition for close animation
        this.$nodes.moved.addClass('is-transitioning')
        this.$drawer.prepareTransition()

        this.$nodes.parent.addClass(
            this.config.openClass + ' ' + this.config.dirOpenClass,
        )
        this.drawerIsOpen = true

        // Set focus on drawer
        slate.a11y.trapFocus({
            $container: this.$drawer,
            namespace: 'drawer_focus',
        })

        // Run function when draw opens if set
        if (
            this.config.onDrawerOpen &&
            typeof this.config.onDrawerOpen === 'function'
        ) {
            if (!externalCall) {
                this.config.onDrawerOpen()
            }
        }

        if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
            this.$activeSource.attr('aria-expanded', 'true')
        }

        this.bindEvents()
    }

    Drawer.prototype.close = function () {
        // don't close a closed drawer
        if (!this.drawerIsOpen) {
            return
        }

        this.$open.removeClass(this.config.openClass)

        // deselect any focused form elements
        $(document.activeElement).trigger('blur')

        // Ensure closing transition is applied to moved elements, like the nav
        this.$nodes.moved.prepareTransition({ disableExisting: true })
        this.$drawer.prepareTransition({ disableExisting: true })

        this.$nodes.parent.removeClass(
            this.config.dirOpenClass + ' ' + this.config.openClass,
        )

        this.drawerIsOpen = false

        // Remove focus on drawer
        slate.a11y.removeTrapFocus({
            $container: this.$drawer,
            namespace: 'drawer_focus',
        })

        if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
            this.$activeSource.attr('aria-expanded', 'false')
        }

        this.unbindEvents()
    }

    Drawer.prototype.bindEvents = function () {
        // Lock scrolling on mobile
        this.$nodes.page.on('touchmove.drawer', function () {
            return false
        })

        // Clicking out of drawer closes it
        this.$nodes.page.on(
            'click.drawer',
            $.proxy(function () {
                this.close()
                return false
            }, this),
        )

        // Pressing escape closes drawer
        this.$nodes.parent.on(
            'keyup.drawer',
            $.proxy(function (evt) {
                if (evt.keyCode === 27) {
                    this.close()
                }
            }, this),
        )
    }

    Drawer.prototype.unbindEvents = function () {
        this.$nodes.page.off('.drawer')
        this.$nodes.parent.off('.drawer')
    }

    return Drawer
})()

theme.Hero = (function () {
    var selectors = {
        hero: '.hero',
        heroWrapper: '.hero-wrapper',
        heroArrows: '.hero__arrow',
        heroImage: '.hero__image',
        heroPause: '.hero__pause',
    }

    function Hero() {
        this.namespace = '.hero'
        this.$hero = $(selectors.hero)
        this.$hero.on('init' + this.namespace, this._a11y.bind(this))
        this.$hero.on('init' + this.namespace, this._arrowsInit.bind(this))

        this.$hero.slick({
            accessibility: true,
            arrows: false, // this theme has custom arrows
            draggable: false,
            autoplay: this.$hero.data('autoplay'),
            autoplaySpeed: this.$hero.data('speed'),
        })

        $(selectors.heroImage).on(
            'click' + this.namespace,
            function () {
                this.$hero.slick('slickNext')
            }.bind(this),
        )

        $(selectors.heroPause).on(
            'click' + this.namespace,
            function () {
                if ($(selectors.heroPause).hasClass('is-paused')) {
                    this._play()
                } else {
                    this._pause()
                }
            }.bind(this),
        )
    }

    Hero.prototype = _.assignIn({}, Hero.prototype, {
        _pause: function () {
            this.$hero.slick('slickPause')
            $(selectors.heroPause).addClass('is-paused')
        },

        _play: function () {
            this.$hero.slick('slickPlay')
            $(selectors.heroPause).removeClass('is-paused')
        },

        _a11y: function (event, obj) {
            var $list = obj.$list

            // Remove default Slick aria-live attr until slider is focused
            $list.removeAttr('aria-live')

            // When an element in the slider is focused
            // pause slideshow and set aria-live
            $(selectors.heroWrapper).on(
                'focusin' + this.namespace,
                function (evt) {
                    if (!$(selectors.heroWrapper).has(evt.target).length) {
                        return
                    }

                    $list.attr('aria-live', 'polite')
                    this._pause()
                }.bind(this),
            )

            // Resume autoplay
            $(selectors.heroWrapper).on(
                'focusout' + this.namespace,
                function (evt) {
                    if (!$(selectors.heroWrapper).has(evt.target).length) {
                        return
                    }

                    $list.removeAttr('aria-live')
                    this._play()
                }.bind(this),
            )
        },

        _arrowsInit: function (event, obj) {
            // Slider is initialized. Setup custom arrows
            var count = obj.slideCount
            var $slider = obj.$slider
            var $arrows = $(selectors.heroArrows)

            if ($arrows.length && count > 1) {
                $arrows.on(
                    'click' + this.namespace,
                    function (evt) {
                        evt.preventDefault()
                        if (
                            $(evt.currentTarget).hasClass('hero__arrow--prev')
                        ) {
                            $slider.slick('slickPrev')
                        } else {
                            $slider.slick('slickNext')
                        }

                        this._scrollTop()
                    }.bind(this),
                )
            } else {
                $arrows.remove()
            }
        },

        _scrollTop: function () {
            var currentScroll = $(document).scrollTop()
            var heroOffset = this.$hero.offset().top

            if (currentScroll > heroOffset) {
                $('html').add('body').animate(
                    {
                        scrollTop: heroOffset,
                    },
                    250,
                )
            }
        },

        goToSlide: function (slideIndex) {
            this.$hero.slick('slickGoTo', slideIndex)
        },

        pause: function () {
            this.$hero.slick('slickPause')
        },

        play: function () {
            this.$hero.slick('slickPlay')
        },

        destroy: function () {
            this.$hero.off(this.namespace)
            $(selectors.heroImage).off(this.namespace)
            $(selectors.heroPause).off(this.namespace)
            $(selectors.heroWrapper).off(this.namespace)
            $(selectors.heroArrows).off(this.namespace)

            this.$hero.slick('unslick')
        },
    })

    return Hero
})()

window.Modals = (function () {
    var Modal = function (id, name, options) {
        var defaults = {
            close: '.js-modal-close',
            open: '.js-modal-open-' + name,
            openClass: 'modal--is-active',
        }

        this.$modal = $('#' + id)

        if (!this.$modal.length) {
            return false
        }

        this.$nodes = {
            body: $('body'),
        }

        this.config = $.extend(defaults, options)

        this.modalIsOpen = false
        this.focusOnOpen = this.config.focusOnOpen
            ? $(this.config.focusOnOpen)
            : this.$modal
        this.init()
    }

    Modal.prototype.init = function () {
        var $openBtn = $(this.config.open)

        // Add aria controls
        $openBtn.attr('aria-expanded', 'false')

        $(this.config.open).on('click', $.proxy(this.open, this))
        this.$modal
            .find(this.config.close)
            .on('click', $.proxy(this.close, this))
    }

    Modal.prototype.open = function (evt) {
        // Keep track if modal was opened from a click, or called by another function
        var externalCall = false

        // don't open an opened modal
        if (this.modalIsOpen) {
            return
        }

        // Prevent following href if link is clicked
        if (evt) {
            evt.preventDefault()
        } else {
            externalCall = true
        }

        // Without this, the modal opens, the click event bubbles up to $nodes.page
        // which closes the modal.
        if (evt && evt.stopPropagation) {
            evt.stopPropagation()
            // save the source of the click, we'll focus to this on close
            this.$activeSource = $(evt.currentTarget)
        }

        if (this.modalIsOpen && !externalCall) {
            return this.close()
        }

        this.$modal.prepareTransition().addClass(this.config.openClass)
        this.$nodes.body.addClass(this.config.openClass)

        this.modalIsOpen = true

        // Set focus on modal
        slate.a11y.trapFocus({
            $container: this.$modal,
            namespace: 'modal_focus',
            $elementToFocus: this.focusOnOpen,
        })

        if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
            this.$activeSource.attr('aria-expanded', 'true')
        }

        this.bindEvents()
    }

    Modal.prototype.close = function () {
        // don't close a closed modal
        if (!this.modalIsOpen) {
            return
        }

        // deselect any focused form elements
        $(document.activeElement).trigger('blur')

        this.$modal.prepareTransition().removeClass(this.config.openClass)
        this.$nodes.body.removeClass(this.config.openClass)

        this.modalIsOpen = false

        // Remove focus on modal
        slate.a11y.removeTrapFocus({
            $container: this.$modal,
            namespace: 'modal_focus',
        })

        if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
            this.$activeSource.attr('aria-expanded', 'false').focus()
        }

        this.unbindEvents()
    }

    Modal.prototype.bindEvents = function () {
        // Pressing escape closes modal
        this.$nodes.body.on(
            'keyup.modal',
            $.proxy(function (evt) {
                if (evt.keyCode === 27) {
                    this.close()
                }
            }, this),
        )
    }

    Modal.prototype.unbindEvents = function () {
        this.$nodes.body.off('.modal')
    }

    return Modal
})()

window.Meganav = (function () {
    var Meganav = function (options) {
        this.cache = {
            $document: $(document),
            $page: $('.page-element'),
        }

        var defaults = {
            $meganavs: $('.meganav'),
            $meganavToggle: $('.meganav-toggle'),
            isOpen: false,
            preventDuplicates: false,
            closeOnPageClick: false,
            activeClass: 'meganav--active',
            noAnimationClass: 'meganav--no-animation',
        }

        this.config = $.extend(defaults, options)
        this.init()
    }

    Meganav.prototype.init = function () {
        var $openBtn = this.config.$meganavToggle

        // Add aria controls
        $openBtn.attr('aria-expanded', 'false')
        $openBtn.each(function (i, el) {
            var $el = $(el)
            $el.attr('aria-controls', $el.attr('data-aria-controls'))
        })

        $openBtn.on('click', $.proxy(this.requestMeganav, this))
    }

    Meganav.prototype.requestMeganav = function (evt) {
        // Prevent following href if link is clicked
        if (evt) {
            evt.preventDefault()
        }

        // Without this, the meganav opens, the click event bubbles up to
        // theme.cache.$page which closes the drawer.
        if (evt && evt.stopPropagation) {
            evt.stopPropagation()
        }

        var $el = $(evt.currentTarget)
        var $targetedMeganav = $('#' + $el.attr('aria-controls'))
        var anotherNavIsOpen = this.config.isOpen

        // Navigate to link href or close menu if already active
        if ($el.hasClass(this.config.activeClass)) {
            if ($el.is('a')) {
                window.location = $el.attr('href')
                return
            } else {
                // It is active but has no link. Close just that meganav
                return this.close(evt, $el)
            }
        }

        // If true, don't let multiple meganavs be open simultaneously
        if (this.config.preventDuplicates) {
            this.close()
        }

        // Set active class on toggle button/link
        $el.addClass(this.config.activeClass).attr('aria-expanded', 'true')

        // Show targeted nav, letting it know whether another meganav is already open
        this.open($targetedMeganav, anotherNavIsOpen)

        // Setup event handlers when meganav is open
        this.bindEvents()
        this.config.isOpen = true
    }

    Meganav.prototype.open = function ($target, noAnimation) {
        $target.addClass(this.config.activeClass)

        // Add class to override animation - CSS determined
        if (noAnimation) {
            $target.addClass(this.config.noAnimationClass)
        }
    }

    Meganav.prototype.close = function (evt, $target) {
        if (this.config.preventDuplicates) {
            // Close all meganavs
            this.config.$meganavs.removeClass(
                [this.config.activeClass, this.config.noAnimationClass].join(
                    ' ',
                ),
            )
            this.config.$meganavToggle
                .removeClass(this.config.activeClass)
                .attr('aria-expanded', 'false')
        } else {
            // Close targeted nav
            var $targetedMeganav = $('#' + $target.attr('aria-controls'))
            $targetedMeganav.removeClass(
                [this.config.activeClass, this.config.noAnimationClass].join(
                    ' ',
                ),
            )
            $target
                .removeClass(this.config.activeClass)
                .attr('aria-expanded', 'false')
        }

        // Remove event listeners
        this.unbindEvents()
        this.config.isOpen = false
    }

    Meganav.prototype.bindEvents = function () {
        if (!this.config.closeOnPageClick) {
            return
        }

        // Clicking away from the meganav will close it
        this.cache.$page.on('click.meganav', $.proxy(this.close, this))

        // Exception to above: clicking anywhere on the meganav will NOT close it
        this.config.$meganavs.on('click.meganav', function (evt) {
            evt.stopImmediatePropagation()
        })

        // Pressing escape closes meganav and focuses the target parent link
        this.cache.$document.on(
            'keyup.meganav',
            $.proxy(function (evt) {
                if (evt.keyCode === 27) {
                    this.config.$meganavToggle
                        .filter('.' + this.config.activeClass)
                        .focus()
                    this.close()
                }
            }, this),
        )
    }

    Meganav.prototype.unbindEvents = function () {
        if (!this.config.closeOnPageClick) {
            return
        }

        this.cache.$page.off('.meganav')
        this.config.$meganavs.off('.meganav')
        this.cache.$document.off('.meganav')
    }

    return Meganav
})()

window.QtySelector = (function () {
    var QtySelector = function ($el) {
        this.cache = {
            $body: $('body'),
            $subtotal: $('#CartSubtotal'),
            $discountTotal: $('#cartDiscountTotal'),
            $cartTable: $('.cart-table'),
            $cartTemplate: $('#CartProducts'),
        }

        this.settings = {
            loadingClass: 'js-qty--is-loading',
            isCartTemplate: this.cache.$body.hasClass('template-cart'),
            // On the cart template, minimum is 0. Elsewhere min is 1
            minQty: this.cache.$body.hasClass('template-cart') ? 0 : 1,
        }

        this.$el = $el
        this.qtyUpdateTimeout
        this.createInputs()
        this.bindEvents()
    }

    QtySelector.prototype.createInputs = function () {
        var $el = this.$el

        var data = {
            value: $el.val(),
            key: $el.attr('id'),
            name: $el.attr('name'),
            line: $el.attr('data-line'),
        }
        var source = $('#QuantityTemplate').html()
        var template = Handlebars.compile(source)

        this.$wrapper = $(template(data)).insertBefore($el)

        // Remove original number input
        $el.remove()
    }

    QtySelector.prototype.validateAvailability = function (line, quantity) {
        var product = theme.cartObject.items[line - 1] // 0-based index in API
        var handle = product.handle // needed for the ajax request
        var id = product.id // needed to find right variant from ajax results

        var params = {
            type: 'GET',
            url: '/products/' + handle + '.js',
            dataType: 'json',
            success: $.proxy(function (cartProduct) {
                this.validateAvailabilityCallback(
                    line,
                    quantity,
                    id,
                    cartProduct,
                )
            }, this),
        }

        $.ajax(params)
    }

    QtySelector.prototype.validateAvailabilityCallback = function (
        line,
        quantity,
        id,
        product,
    ) {
        var quantityIsAvailable = true

        // This returns all variants of a product.
        // Loop through them to get our desired one.
        for (var i = 0; i < product.variants.length; i++) {
            var variant = product.variants[i]
            if (variant.id === id) {
                break
            }
        }

        // If the variant tracks inventory and does not sell when sold out
        // we can compare the requested with available quantity
        if (
            variant.inventory_management !== null &&
            variant.inventory_policy === 'deny'
        ) {
            if (variant.inventory_quantity < quantity) {
                // Show notification with error message
                theme.Notify.open('error', theme.strings.noStockAvailable, true)

                // Set quantity to max amount available
                this.$wrapper
                    .find('.js-qty__input')
                    .val(variant.inventory_quantity)

                quantityIsAvailable = false
                this.$wrapper.removeClass(this.settings.loadingClass)
            }
        }

        if (quantityIsAvailable) {
            this.updateItemQuantity(line, quantity)
        }
    }

    QtySelector.prototype.validateQty = function (qty) {
        if (parseFloat(qty) === parseInt(qty, 10) && !isNaN(qty)) {
            // We have a valid number!
        } else {
            // Not a number. Default to 1.
            qty = 1
        }
        return parseInt(qty, 10)
    }

    QtySelector.prototype.adjustQty = function (evt) {
        var $el = $(evt.currentTarget)
        var $input = $el.siblings('.js-qty__input')
        var qty = this.validateQty($input.val())
        var line = $input.attr('data-line')

        if ($el.hasClass('js-qty__adjust--minus')) {
            qty -= 1
            if (qty <= this.settings.minQty) {
                qty = this.settings.minQty
            }
        } else {
            qty += 1
        }

        if (this.settings.isCartTemplate) {
            $el.parent().addClass(this.settings.loadingClass)
            this.updateCartItemPrice(line, qty)
        } else {
            $input.val(qty)
        }
    }

    QtySelector.prototype.bindEvents = function () {
        this.$wrapper
            .find('.js-qty__adjust')
            .on('click', $.proxy(this.adjustQty, this))

        // Select input text on click
        this.$wrapper.on('click', '.js-qty__input', function () {
            this.setSelectionRange(0, this.value.length)
        })

        // If the quantity changes on the cart template, update the price
        if (this.settings.isCartTemplate) {
            this.$wrapper.on(
                'change',
                '.js-qty__input',
                $.proxy(function (evt) {
                    var $input = $(evt.currentTarget)
                    var line = $input.attr('data-line')
                    var qty = this.validateQty($input.val())
                    $input.parent().addClass(this.settings.loadingClass)
                    this.updateCartItemPrice(line, qty)
                }, this),
            )
        }
    }

    QtySelector.prototype.updateCartItemPrice = function (line, qty) {
        // Update cart after short timeout so user doesn't create simultaneous ajax calls
        clearTimeout(this.qtyUpdateTimeout)
        this.qtyUpdateTimeout = setTimeout(
            $.proxy(function () {
                this.validateAvailability(line, qty)
            }, this),
            200,
        )
    }

    QtySelector.prototype.updateItemQuantity = function (line, quantity) {
        var params = {
            type: 'POST',
            url: '/cart/change.js',
            data: 'quantity=' + quantity + '&line=' + line,
            dataType: 'json',
            success: $.proxy(function (cart) {
                this.updateCartItemCallback(cart)
            }, this),
        }

        $.ajax(params)
    }

    QtySelector.prototype.updateCartItemCallback = function (cart) {
        // Reload the page to show the empty cart if no items
        if (cart.item_count === 0) {
            location.reload()
            return
        }

        // Update cart object
        theme.cartObject = cart

        // Handlebars.js cart layout
        var data = {}
        var items = []
        var item = {}
        var source = $('#CartProductTemplate').html()
        var template = Handlebars.compile(source)
        var prodImg

        // Add each item to our handlebars.js data
        $.each(cart.items, function (index, cartItem) {
            /* Hack to get product image thumbnail
             *   - If image is not null
             *     - Remove file extension, add 240x240, and re-add extension
             *     - Create server relative link
             *   - A hard-coded url of no-image
             */

            if (cartItem.image === null) {
                prodImg =
                    '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif'
            } else {
                prodImg = cartItem.image
                    .replace(/(\.[^.]*)$/, '_240x240$1')
                    .replace('http:', '')
            }

            if (cartItem.properties !== null) {
                $.each(cartItem.properties, function (key, value) {
                    if (key.charAt(0) === '_' || !value) {
                        delete cartItem.properties[key]
                    }
                })
            }

            // Create item's data object and add to 'items' array
            item = {
                key: cartItem.key,
                line: index + 1, // Shopify uses a 1+ index in the API
                url: cartItem.url,
                img: prodImg,
                name: cartItem.product_title,
                variation: cartItem.variant_title,
                properties: cartItem.properties,
                itemQty: cartItem.quantity,
                price: theme.Currency.formatMoney(
                    cartItem.price,
                    theme.moneyFormat,
                ),
                vendor: cartItem.vendor,
                linePrice: theme.Currency.formatMoney(
                    cartItem.line_price,
                    theme.moneyFormat,
                ),
                originalLinePrice: theme.Currency.formatMoney(
                    cartItem.original_line_price,
                    theme.moneyFormat,
                ),
                discounts: cartItem.discounts,
                discountsApplied:
                    cartItem.line_price === cartItem.original_line_price
                        ? false
                        : true,
            }

            items.push(item)
        })

        // Gather all cart data and add to DOM
        data = {
            items: items,
        }
        this.cache.$cartTemplate.empty().append(template(data))

        // Create new quantity selectors
        this.cache.$cartTable
            .find('input[type="number"]')
            .each(function (i, el) {
                new QtySelector($(el))
            })

        // Update the cart subtotal
        this.cache.$subtotal.html(
            theme.Currency.formatMoney(cart.total_price, theme.moneyFormat),
        )

        // Update the cart total discounts
        if (cart.total_discount > 0) {
            this.cache.$discountTotal.html(
                theme.strings.totalCartDiscount.replace(
                    '[savings]',
                    theme.Currency.formatMoney(
                        cart.total_discount,
                        theme.moneyFormat,
                    ),
                ),
            )
        } else {
            this.cache.$discountTotal.empty()
        }

        // Set focus on cart table
        slate.a11y.pageLinkFocus(this.cache.$cartTable)
    }

    return QtySelector
})()

/*
  Allow product to be added to cart via ajax with
  custom success and error responses.
*/
window.AjaxCart = (function () {
    var cart = function ($form) {
        this.cache = {
            $cartIconIndicator: $('.site-header__cart-indicator'),
        }

        this.$form = $form
        this.eventListeners()
    }

    cart.prototype.eventListeners = function () {
        if (this.$form.length) {
            this.$form.on('submit', $.proxy(this.addItemFromForm, this))
        }
    }

    cart.prototype.addItemFromForm = function (evt) {
        evt.preventDefault()

        var params = {
            type: 'POST',
            url: '/cart/add.js',
            data: this.$form.serialize(),
            dataType: 'json',
            success: $.proxy(function (lineItem) {
                this.success(lineItem)
            }, this),
            error: $.proxy(function (XMLHttpRequest, textStatus) {
                this.error(XMLHttpRequest, textStatus)
            }, this),
        }

        $.ajax(params)
    }

    cart.prototype.success = function () {
        theme.Notify.open('success', false, true)

        // Update cart notification bubble's state
        this.cache.$cartIconIndicator.removeClass('hide')
    }

    // Error handling reference from Shopify.onError in api.jquery.js
    cart.prototype.error = function (XMLHttpRequest) {
        var data = JSON.parse(XMLHttpRequest.responseText)
        var message
        if (data.message) {
            message = this.parseErrors(data).join('; ') + '.'
        } else {
            message = data.description
        }
        theme.Notify.open('error', message, true)
    }

    // Error parsing from Shopify.fullMessagesFromErrors in api.jquery.js
    cart.prototype.parseErrors = function (errors) {
        var fullMessages = []
        $.each(errors, function (attribute, messages) {
            $.each(messages, function (index, message) {
                fullMessages.push(attribute + ' ' + message)
            })
        })
        return fullMessages
    }

    return cart
})()

window.Notify = (function () {
    var notify = function () {
        this.cache = {
            $scrollParent: $('html').add('body'),
            $notificationSuccess: $('#NotificationSuccess'),
            $notificationSuccessLink: $('#NotificationSuccess').find('a'),
            $notificationError: $('#NotificationError'),
            $notificationPromo: $('#NotificationPromo'),
            $notificationClose: $('.notification__close'),
            $notificationErrorMessage: $('.notification__message--error'),
        }

        this.settings = {
            notifyActiveClass: 'notification--active',
            closeTimer: 5000,
            promoKeyName: 'promo-' + this.cache.$notificationPromo.data('text'),
        }

        this.notifyTimer
        this.$lastFocusedElement = null

        this.isLocalStorageSupported = isLocalStorageSupported()

        this.cache.$notificationClose.on('click', this.close.bind(this))
        this.showPromo()
    }

    function isLocalStorageSupported() {
        // Return false if we are in an iframe without access to sessionStorage
        if (window.self !== window.top) {
            return false
        }

        var testKey = 'test'
        var storage = window.sessionStorage
        try {
            storage.setItem(testKey, '1')
            storage.removeItem(testKey)
            return true
        } catch (error) {
            return false
        }
    }

    notify.prototype.open = function (state, message, autoclose) {
        this.close()

        if (state === 'success') {
            this.cache.$notificationSuccess
                .attr('aria-hidden', false)
                .addClass(this.settings.notifyActiveClass)

            // Set last focused element to return to once success
            // notification is dismissed (by timeout)
            this.$lastFocusedElement = $(document.activeElement)

            // Set focus on link to cart after transition
            this.cache.$notificationSuccess.one(
                'TransitionEnd webkitTransitionEnd transitionend oTransitionEnd',
                $.proxy(function () {
                    slate.a11y.pageLinkFocus(
                        this.cache.$notificationSuccessLink,
                    )
                }, this),
            )

            // Fallback for no transitions
            if (this.cache.$scrollParent.hasClass('no-csstransitions')) {
                slate.a11y.pageLinkFocus(this.cache.$notificationSuccessLink)
            }
        } else {
            this.cache.$notificationErrorMessage.html(message)
            this.cache.$notificationError
                .attr('aria-hidden', false)
                .addClass(this.settings.notifyActiveClass)
        }

        // Timeout to close the notification
        if (autoclose) {
            clearTimeout(this.notifyTimer)
            this.notifyTimer = setTimeout(
                this.close.bind(this),
                this.settings.closeTimer,
            )
        }
    }

    notify.prototype.close = function (evt) {
        if (
            evt &&
            $(evt.currentTarget).attr('id') === 'NotificationPromoClose'
        ) {
            if (this.isLocalStorageSupported) {
                localStorage.setItem(this.settings.promoKeyName, 'hidden')
            }
        }

        // Return focus to previous element if one is defined
        // and the user has not strayed from the success notification link
        if (
            this.$lastFocusedElement &&
            this.cache.$notificationSuccessLink.is(':focus')
        ) {
            slate.a11y.pageLinkFocus(this.$lastFocusedElement)
        }

        // Close all notification bars
        this.cache.$notificationSuccess
            .attr('aria-hidden', true)
            .removeClass(this.settings.notifyActiveClass)
        this.cache.$notificationError
            .attr('aria-hidden', true)
            .removeClass(this.settings.notifyActiveClass)
        this.cache.$notificationPromo
            .attr('aria-hidden', true)
            .removeClass(this.settings.notifyActiveClass)

        // Reset last focused element
        this.$lastFocusedElement = null
    }

    notify.prototype.showPromo = function (SFEevent) {
        // If reloaded in the storefront editor, update selectors/settings
        if (SFEevent) {
            this.initCache()
        }

        if (
            this.isLocalStorageSupported &&
            localStorage[this.settings.promoKeyName] === 'hidden'
        ) {
            return
        }

        this.cache.$notificationPromo
            .attr('aria-hidden', false)
            .addClass(this.settings.notifyActiveClass)
    }

    return notify
})()

theme.Maps = (function () {
    var config = {
        zoom: 14,
        styles: [
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#cacaca' }, { lightness: 17 }],
            },
            {
                featureType: 'landscape',
                elementType: 'geometry',
                stylers: [{ color: '#e1e1e1' }, { lightness: 20 }],
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.fill',
                stylers: [{ color: '#ffffff' }, { lightness: 17 }],
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [
                    { color: '#ffffff' },
                    { lightness: 29 },
                    { weight: 0.2 },
                ],
            },
            {
                featureType: 'road.arterial',
                elementType: 'geometry',
                stylers: [{ color: '#ffffff' }, { lightness: 18 }],
            },
            {
                featureType: 'road.local',
                elementType: 'geometry',
                stylers: [{ color: '#ffffff' }, { lightness: 16 }],
            },
            {
                featureType: 'poi',
                elementType: 'geometry',
                stylers: [{ color: '#e1e1e1' }, { lightness: 21 }],
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#bbbbbb' }, { lightness: 21 }],
            },
            {
                elementType: 'labels.text.stroke',
                stylers: [
                    { visibility: 'on' },
                    { color: '#ffffff' },
                    { lightness: 16 },
                ],
            },
            {
                elementType: 'labels.text.fill',
                stylers: [
                    { saturation: 36 },
                    { color: '#333333' },
                    { lightness: 40 },
                ],
            },
            { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [{ color: '#f2f2f2' }, { lightness: 19 }],
            },
            {
                featureType: 'administrative',
                elementType: 'geometry.fill',
                stylers: [{ color: '#fefefe' }, { lightness: 20 }],
            },
            {
                featureType: 'administrative',
                elementType: 'geometry.stroke',
                stylers: [
                    { color: '#fefefe' },
                    { lightness: 17 },
                    { weight: 1.2 },
                ],
            },
        ], // eslint-disable-line key-spacing, comma-spacing
    }
    var apiStatus = null
    var mapsToLoad = []
    var key = theme.mapKey ? theme.mapKey : ''

    function Map(container) {
        this.$container = $(container)

        if (apiStatus === 'loaded') {
            this.createMap()
        } else {
            mapsToLoad.push(this)

            if (apiStatus !== 'loading') {
                apiStatus = 'loading'
                if (typeof window.google === 'undefined') {
                    $.getScript(
                        'https://maps.googleapis.com/maps/api/js?key=' + key,
                    ).then(function () {
                        apiStatus = 'loaded'
                        initAllMaps()
                    })
                }
            }
        }
    }

    function initAllMaps() {
        // API has loaded, load all Map instances in queue
        $.each(mapsToLoad, function (index, instance) {
            instance.createMap()
        })
    }

    function geolocate($map) {
        var deferred = $.Deferred()
        var geocoder = new google.maps.Geocoder()
        var address = $map.data('address-setting')

        geocoder.geocode({ address: address }, function (results, status) {
            if (status !== google.maps.GeocoderStatus.OK) {
                deferred.reject(status)
            }

            deferred.resolve(results)
        })

        return deferred
    }

    Map.prototype = _.assignIn({}, Map.prototype, {
        createMap: function () {
            var $map = this.$container.find('.map-section__container')

            return geolocate($map)
                .then(
                    function (results) {
                        var mapOptions = {
                            zoom: config.zoom,
                            styles: config.styles,
                            center: results[0].geometry.location,
                            disableDefaultUI: true,
                        }

                        var map = (this.map = new google.maps.Map(
                            $map[0],
                            mapOptions,
                        ))
                        var center = (this.center = map.getCenter())
                        var markerColor = $map.data('marker-color')

                        var markerIcon = {
                            path: 'M57.7,0C25.8,0,0,25.8,0,57.7C0,89.5,50,170,57.7,170s57.7-80.5,57.7-112.3C115.3,25.8,89.5,0,57.7,0z M57.7,85 c-14.9,0-27-12.1-27-27c0-14.9,12.1-27,27-27c14.9,0,27,12.1,27,27C84.7,72.9,72.6,85,57.7,85z',
                            fillColor: markerColor,
                            fillOpacity: 0.9,
                            scale: 0.2,
                            strokeWeight: 0,
                        }

                        //eslint-disable-next-line no-unused-vars
                        var marker = new google.maps.Marker({
                            map: map,
                            position: map.getCenter(),
                            icon: markerIcon,
                        })

                        google.maps.event.addDomListener(
                            window,
                            'resize',
                            $.debounce(250, function () {
                                google.maps.event.trigger(map, 'resize')
                                map.setCenter(center)
                            }),
                        )
                    }.bind(this),
                )
                .fail(function () {
                    var errorMessage

                    switch (status) {
                        case 'ZERO_RESULTS':
                            errorMessage = theme.strings.addressNoResults
                            break
                        case 'OVER_QUERY_LIMIT':
                            errorMessage = theme.strings.addressQueryLimit
                            break
                        default:
                            errorMessage = theme.strings.addressError
                            break
                    }

                    $map.parent()
                        .addClass('page-width map-section--load-error')
                        .html(
                            '<div class="errors text-center">' +
                                errorMessage +
                                '</div>',
                        )
                })
        },

        onUnload: function () {
            google.maps.event.clearListeners(this.map, 'resize')
        },
    })

    return Map
})()

// Global function called by Google on auth errors.
// Show an auto error message on all map instances.
// eslint-disable-next-line camelcase, no-unused-vars
function gm_authFailure() {
    $('.map-section').addClass('map-section--load-error')
    $('.map-section__container').remove()
    $('.map-section__link').remove()
    $('.map-section__overlay').after(
        '<div class="errors text-center">' + theme.strings.authError + '</div>',
    )
}

theme.stickyHeader = (function () {
    var selectors = {
        searchCartWrapper: '#SiteNavSearchCart',
        stickyNavSearchCart: '#StickyNavSearchCart',
        stickyNavWrapper: '#StickNavWrapper',
        stickyBar: '#StickyBar',
    }

    var config = {
        lastScroll: 0,
        navClass: 'sticky--active',
        openTransitionClass: 'sticky--open',
        closeTransitionClass: 'sticky--close',
    }

    var cache = {}

    function cacheSelectors() {
        cache = {
            $window: $(window),
            $siteNavSearchCart: $(selectors.searchCartWrapper),
            $stickyBar: $(selectors.stickyBar),
        }
    }

    function init() {
        cacheSelectors()
        config.isActive = false

        // Clone search/cart icons into fixed nav
        if (cache.$siteNavSearchCart.contents().length) {
            cache.$siteNavSearchCart
                .contents()
                .clone()
                .appendTo($(selectors.stickyNavSearchCart))
        }

        cache.$window.on(
            'scroll.stickynav',
            $.throttle(15, stickyHeaderOnScroll),
        )
    }

    function stickyHeaderOnScroll() {
        var scroll = cache.$window.scrollTop()
        var $el = $(selectors.stickyNavWrapper)
        var threshold = $el.offset().top + $el.height() + 10 // default for scrolling down

        // Check if scrolling up
        if (scroll < config.lastScroll) {
            threshold = $el.offset().top
        }

        if (scroll > threshold) {
            stickNav()
        } else {
            unstickNav()
        }

        config.lastScroll = scroll
    }

    function stickNav() {
        if (config.isActive) {
            return
        }

        config.isActive = true

        cache.$stickyBar.addClass(config.navClass)

        // Add open transition class after element is set to fixed
        // so CSS animation is applied correctly
        setTimeout(function () {
            cache.$stickyBar.addClass(config.openTransitionClass)
        }, 0)
    }

    function unstickNav() {
        if (!config.isActive) {
            return
        }

        cache.$stickyBar
            .removeClass(config.openTransitionClass)
            .removeClass(config.navClass)

        config.isActive = false
    }

    function unload() {
        $(window).off('.stickynav')
    }

    return {
        init: init,
        unload: unload,
    }
})()

theme.headerNav = (function () {
    var selectors = {
        siteNav: '#SiteNav',
        siteNavCompressed: '#SiteNavCompressed',
        siteNavParent: '#SiteNavParent',
        siteNavItem: '.site-nav__item',
        stickyNavWrapper: '#StickNavWrapper',
        stickyNav: '#StickyNav',
    }

    var config = {
        lastScroll: 0,
        isActive: false,
        navClass: 'sticky--active',
        openTransitionClass: 'sticky--open',
        closeTransitionClass: 'sticky--close',
        searchShowClass: 'site-header__search-input--visible',
        searchInputClass: 'site-header__search-input',
        searchSubmitClass: 'site-header__search-submit',
    }

    function init() {
        sizeNav()
        initMegaNavs()
        initHeaderSearch()
        $(window).on('resize.headernav', $.debounce(250, sizeNav))
    }

    function sizeNav() {
        var navWidth = 0
        var parentWidth = $(selectors.siteNavParent).width()
        var hideClass = 'hide'

        // Set height on nav-bar wrapper so when fixed, doesn't break layout
        $(selectors.stickyNavWrapper).height($(selectors.stickyNav).height())

        // Calculate the width of each nav item
        // after forcing them to be visible for the calculations
        $(selectors.siteNav).removeClass(hideClass)
        $(selectors.siteNavItem).each(function (i, el) {
            navWidth += $(el).width()
        })

        if (navWidth > parentWidth) {
            $(selectors.siteNav).addClass(hideClass)
            $(selectors.siteNavCompressed).removeClass(hideClass)
        } else {
            $(selectors.siteNav).removeClass(hideClass)
            $(selectors.siteNavCompressed).addClass(hideClass)
        }
    }

    function initMegaNavs() {
        var headerMeganavs = new window.Meganav({
            $meganavs: $('.site-nav__dropdown'),
            $meganavToggle: $('.site-nav__meganav-toggle'),
            preventDuplicates: true,
            closeOnPageClick: true,
        })

        var indexMeganavs = new window.Meganav({
            $meganavs: $('.meganav--index'),
            $meganavToggle: $('.index__meganav-toggle'),
        })

        var drawerMeganavs = new window.Meganav({
            $meganavs: $('.meganav--drawer'),
            $meganavToggle: $('.drawer__meganav-toggle'),
        })
    }

    function initHeaderSearch() {
        // This function runs after the header search element
        // is duplicated into the sticky nav, meaning there are
        // two search fields to be aware of at this point.
        var $searchForm = $('.site-header__search')

        $searchForm.each(function (i, el) {
            var $form = $(el)
            var $input = $form.find('.' + config.searchInputClass)
            var $submit = $form.find('.' + config.searchSubmitClass)

            $input.on('focus', function () {
                $input.addClass(config.searchShowClass)
            })

            $input.on('blur', function () {
                if ($input.val()) {
                    $input.addClass(config.searchShowClass)
                } else {
                    $input.removeClass(config.searchShowClass)
                }
            })

            $submit.on('click', function (evt) {
                if ($input.hasClass(config.searchShowClass)) {
                    return
                }

                evt.preventDefault()
                $input.addClass(config.searchShowClass).focus()
            })
        })
    }

    function unload() {
        $(window).off('.stickynav')
    }

    return {
        init: init,
        unload: unload,
    }
})()

/*================ TEMPLATES ================*/
theme.customerTemplates = (function () {
    function initEventListeners() {
        // Show reset password form
        $('#RecoverPassword').on('click', function (evt) {
            evt.preventDefault()
            toggleRecoverPasswordForm()
        })

        // Hide reset password form
        $('#HideRecoverPasswordLink').on('click', function (evt) {
            evt.preventDefault()
            toggleRecoverPasswordForm()
        })
    }

    /** Show/Hide recover password form */
    function toggleRecoverPasswordForm() {
        $('#RecoverPasswordForm').toggleClass('hide')
        $('#CustomerLoginForm').toggleClass('hide')
    }

    /** Show reset password success message */
    function resetPasswordSuccess() {
        // check if reset password form was successfully submited
        if (!$('.reset-password-success').length) {
            return
        }

        // show success message
        $('#ResetSuccess').removeClass('hide')
    }

    /** Show/hide customer address forms */
    function customerAddressForm() {
        var $newAddressForm = $('#AddressNewForm')

        if (!$newAddressForm.length) {
            return
        }

        // Initialize observers on address selectors, defined in shopify_common.js
        if (Shopify) {
            // eslint-disable-next-line no-new
            new Shopify.CountryProvinceSelector(
                'AddressCountryNew',
                'AddressProvinceNew',
                {
                    hideElement: 'AddressProvinceContainerNew',
                },
            )
        }

        // Initialize each edit form's country/province selector
        $('.address-country-option').each(function () {
            var formId = $(this).data('form-id')
            var countrySelector = 'AddressCountry_' + formId
            var provinceSelector = 'AddressProvince_' + formId
            var containerSelector = 'AddressProvinceContainer_' + formId

            // eslint-disable-next-line no-new
            new Shopify.CountryProvinceSelector(
                countrySelector,
                provinceSelector,
                {
                    hideElement: containerSelector,
                },
            )
        })

        // Toggle new/edit address forms
        $('.address-new-toggle').on('click', function () {
            $newAddressForm.toggleClass('hide')
        })

        $('.address-edit-toggle').on('click', function () {
            var formId = $(this).data('form-id')
            $('#EditAddress_' + formId).toggleClass('hide')
        })

        $('.address-delete').on('click', function () {
            var $el = $(this)
            var formId = $el.data('form-id')
            var confirmMessage = $el.data('confirm-message')

            // eslint-disable-next-line no-alert
            if (
                confirm(
                    confirmMessage ||
                        'Are you sure you wish to delete this address?',
                )
            ) {
                Shopify.postLink('/account/addresses/' + formId, {
                    parameters: { _method: 'delete' },
                })
            }
        })
    }

    /** Check URL for reset password hash */
    function checkUrlHash() {
        var hash = window.location.hash

        // Allow deep linking to recover password form
        if (hash === '#recover') {
            toggleRecoverPasswordForm()
        }
    }

    return {
        init: function () {
            checkUrlHash()
            initEventListeners()
            resetPasswordSuccess()
            customerAddressForm()
        },
    }
})()

/*================ SECTIONS ================*/
theme.HeaderSection = (function () {
    function Header() {
        theme.stickyHeader.init()
        theme.headerNav.init()
        theme.Notify = new window.Notify()
        theme.NavDrawer = new window.Drawers('NavDrawer', 'left')
        drawerSearch()
    }

    function drawerSearch() {
        var $drawerSearch = $('.drawer__search-input')
        var $drawerSearchSubmit = $('.drawer__search-submit')

        $drawerSearchSubmit.on('click', function (evt) {
            if ($drawerSearch.val().length !== 0) {
                return
            }

            evt.preventDefault()
            $drawerSearch.focus()
        })
    }

    Header.prototype = _.assignIn({}, Header.prototype, {
        onUnload: function () {
            theme.stickyHeader.unload()
            theme.headerNav.unload()
        },
    })

    return Header
})()

theme.Filters = (function () {
    var selectors = {
        filterSelection: '#SortTags',
        sortSelection: '#SortBy',
    }

    function Filters() {
        this.$filterSelect = $(selectors.filterSelection)
        this.$sortSelect = $(selectors.sortSelection)

        this.default = this._getDefaultSortValue()
        this.$sortSelect.val(this.default)

        this.$filterSelect.on('change', this._onFilterChange.bind(this))
        this.$sortSelect.on('change', this._onSortChange.bind(this))
    }

    Filters.prototype = _.assignIn({}, Filters.prototype, {
        _getDefaultSortValue: function () {
            return Shopify.queryParams.sort_by
                ? Shopify.queryParams.sort_by
                : this.$sortSelect.data('default-sort')
        },

        _onFilterChange: function () {
            delete Shopify.queryParams.page
            if ($.isEmptyObject(Shopify.queryParams)) {
                location.href = this.$filterSelect.val()
            } else {
                location.href =
                    this.$filterSelect.val() +
                    '?' +
                    $.param(Shopify.queryParams)
            }
        },

        _onSortChange: function () {
            Shopify.queryParams.sort_by = this.$sortSelect.val()
            location.search = $.param(Shopify.queryParams)
        },

        onUnload: function () {
            this.$filterSelect.off('change', this._onFilterChange)
            this.$sortSelect.off('change', this._onSortChange)
        },
    })

    return Filters
})()

theme.Product = (function () {
    var defaults = {
        smallBreakpoint: 750, // copied from variables.scss
        productThumbIndex: 0,
        productThumbMax: 0,
        ajaxCart: false,
        stockSetting: false,
    }

    function Product(container) {
        var $container = (this.$container = $(container))
        var sectionId = $container.attr('data-section-id')

        this.selectors = {
            originalSelectorId: '#ProductSelect-' + sectionId,
            modal: 'ProductModal',
            productZoomImage: '#ProductZoomImg',
            addToCart: '#AddToCart-' + sectionId,
            productPrice: '#ProductPrice-' + sectionId,
            comparePrice: '#ComparePrice-' + sectionId,
            addToCartText: '#AddToCartText-' + sectionId,
            SKU: '.variant-sku',
            productFeaturedImage: '#ProductPhotoImg-' + sectionId,
            productImageWrap: '#ProductPhotoLink-' + sectionId,
            productThumbAllImages: '.product-single__thumbnail',
            productThumbImages: '.product-single__thumbnail-' + sectionId,
            productThumbs: '#ProductThumbs-' + sectionId,
            saleTag: '#ProductSaleTag-' + sectionId,
            productStock: '#ProductStock-' + sectionId,
            singleOptionSelector: '.single-option-selector-' + sectionId,
        }

        this.settings = $.extend({}, defaults, {
            sectionId: sectionId,
            ajaxCart: $container.data('ajax'),
            stockSetting: $container.data('stock'),
            enableHistoryState:
                $container.data('enable-history-state') || false,
            namespace: '.product-' + sectionId,
            imageSize: theme.Images.imageSize(
                $(this.selectors.productFeaturedImage).attr('src'),
            ),
        })

        // Stop parsing if we don't have the product json script tag
        if (!$('#ProductJson-' + sectionId).html()) {
            return
        }

        this.productSingleObject = JSON.parse(
            $('#ProductJson-' + sectionId).html(),
        )
        this.addVariantInfo()

        this.init()
    }

    Product.prototype = _.assignIn({}, Product.prototype, {
        init: function () {
            this._stringOverrides()
            this._initVariants()
            this._productZoomImage()
            this._productThumbSwitch()
            this._productThumbnailSlider()
            this._initQtySelector()

            if (this.settings.ajaxCart) {
                theme.AjaxCart = new window.AjaxCart($('#AddToCartForm'))
            }

            // Pre-loading product images to avoid a lag when a thumbnail is clicked, or
            // when a variant is selected that has a variant image.
            theme.Images.preload(
                this.productSingleObject.images,
                this.settings.imageSize,
            )
        },

        _stringOverrides: function () {
            window.productStrings = window.productStrings || {}
            $.extend(theme.strings, window.productStrings)
        },

        addVariantInfo: function () {
            if (!this.productSingleObject || !this.settings.stockSetting) {
                return
            }

            var variantInfo = JSON.parse(
                $('#VariantJson-' + this.settings.sectionId).html(),
            )

            for (var i = 0; i < variantInfo.length; i++) {
                $.extend(this.productSingleObject.variants[i], variantInfo[i])
            }
        },

        _initVariants: function () {
            var options = {
                $container: this.$container,
                enableHistoryState: this.settings.enableHistoryState,
                product: this.productSingleObject,
                singleOptionSelector: this.selectors.singleOptionSelector,
                originalSelectorId: this.selectors.originalSelectorId,
            }

            // eslint-disable-next-line no-new
            this.variants = new slate.Variants(options)

            this.$container.on(
                'variantChange' + this.settings.namespace,
                this._updateAddToCartBtn.bind(this),
            )
            this.$container.on(
                'variantPriceChange' + this.settings.namespace,
                this._updatePrice.bind(this),
            )
            this.$container.on(
                'variantSKUChange' + this.settings.namespace,
                this._updateSKU.bind(this),
            )
            this.$container.on(
                'variantImageChange' + this.settings.namespace,
                this._updateImages.bind(this),
            )
        },

        _updateAddToCartBtn: function (evt) {
            var variant = evt.variant

            var cache = {
                $stock: $(this.selectors.productStock),
                $addToCart: $(this.selectors.addToCart),
                $addToCartText: $(this.selectors.addToCartText),
            }

            if (variant) {
                // Select a valid variant if available
                if (variant.available) {
                    // We have a valid product variant, so enable the submit button
                    cache.$addToCart
                        .removeClass('btn--sold-out')
                        .prop('disabled', false)
                    cache.$addToCartText.html(theme.strings.addToCart)
                    // Show how many items are left, if below 10
                    if (this.settings.stockSetting) {
                        if (variant.inventory_management) {
                            if (
                                variant.inventory_quantity < 10 &&
                                variant.inventory_quantity > 0
                            ) {
                                cache.$stock
                                    .html(
                                        theme.strings.stockAvailable.replace(
                                            '1',
                                            variant.inventory_quantity,
                                        ),
                                    )
                                    .removeClass('hide')
                            } else if (
                                variant.inventory_quantity <= 0 &&
                                variant.incoming
                            ) {
                                cache.$stock
                                    .html(
                                        theme.strings.willNotShipUntil.replace(
                                            '[date]',
                                            variant.next_incoming_date,
                                        ),
                                    )
                                    .removeClass('hide')
                            } else {
                                cache.$stock.addClass('hide')
                            }
                        } else {
                            cache.$stock.addClass('hide')
                        }
                    }
                } else {
                    // Variant is sold out, disable the submit button
                    cache.$addToCart
                        .prop('disabled', true)
                        .addClass('btn--sold-out')
                    cache.$addToCartText.html(theme.strings.soldOut)
                    if (this.settings.stockSetting) {
                        if (variant.incoming) {
                            cache.$stock
                                .html(
                                    theme.strings.willBeInStockAfter.replace(
                                        '[date]',
                                        variant.next_incoming_date,
                                    ),
                                )
                                .removeClass('hide')
                        } else {
                            cache.$stock.addClass('hide')
                        }
                    }
                }
            } else {
                cache.$addToCart
                    .prop('disabled', true)
                    .removeClass('btn--sold-out')
                cache.$addToCartText.html(theme.strings.unavailable)
                if (this.settings.stockSetting) {
                    cache.$stock.addClass('hide')
                }
            }
        },

        _updatePrice: function (evt) {
            var variant = evt.variant

            if (variant) {
                $(this.selectors.productPrice).html(
                    theme.Currency.formatMoney(
                        variant.price,
                        theme.moneyFormat,
                    ),
                )

                // Update and show the product's compare price if necessary
                if (variant.compare_at_price > variant.price) {
                    $(this.selectors.comparePrice)
                        .html(
                            theme.Currency.formatMoney(
                                variant.compare_at_price,
                                theme.moneyFormat,
                            ),
                        )
                        .removeClass('hide')
                    $(this.selectors.saleTag).removeClass('hide')
                } else {
                    $(this.selectors.comparePrice).addClass('hide')
                    $(this.selectors.saleTag).addClass('hide')
                }
            } else {
                $(this.selectors.comparePrice).addClass('hide')
            }
        },

        _updateSKU: function (evt) {
            var variant = evt.variant

            if (variant) {
                $(this.selectors.SKU).html(variant.sku)
            }
        },

        _updateImages: function (evt) {
            var variant = evt.variant

            if (variant && variant.featured_image) {
                var sizedImgUrl = theme.Images.getSizedImageUrl(
                    variant.featured_image.src,
                    this.settings.imageSize,
                )
                var largeImgUrl = theme.Images.getSizedImageUrl(
                    variant.featured_image.src,
                    '1024x1024',
                )
                this.switchProductImage(sizedImgUrl, largeImgUrl)
                this.setActiveThumbnail()
            }
        },

        switchProductImage: function (image, largeImage) {
            $(this.selectors.productFeaturedImage).attr('src', image)
            $(this.selectors.productImageWrap).attr('href', largeImage)
        },

        setActiveThumbnail: function ($el) {
            var $thumbnails = $(this.selectors.productThumbs)

            // If there is no element passed, find it by the current product image
            if (typeof $el === 'undefined') {
                var src = $(this.selectors.productFeaturedImage).attr('src')
                $el = $('.product-single__thumbnail[href="' + src + '"]')
            }

            // Set active thumbnail class
            $thumbnails
                .find('.product-single__thumbnail-item')
                .removeClass('is-active')
            $el.parent().addClass('is-active')

            // If there is a slick carousel, get the slide index, and position it into view with animation.
            if ($thumbnails.hasClass('slick-initialized')) {
                // eslint-disable-next-line shopify/jquery-dollar-sign-reference
                var currentActiveSlideIndex =
                    $thumbnails.slick('slickCurrentSlide')
                var newActiveSlideIndex = $el.parent().attr('data-slick-index')
                if (currentActiveSlideIndex !== newActiveSlideIndex) {
                    $thumbnails.slick('slickGoTo', newActiveSlideIndex, false)
                }
            }
        },

        _productZoomImage: function () {
            if (!$(this.selectors.productFeaturedImage).length) {
                return
            }

            var self = this

            $(this.selectors.productImageWrap).on(
                'click' + this.settings.namespace,
                function (evt) {
                    evt.preventDefault()
                    // Empty src before loadig new image to avoid awkward image swap
                    $(self.selectors.productZoomImage)
                        .attr('src', '')
                        .attr('src', $(this).attr('href'))
                },
            )

            this.ProductModal = new window.Modals(
                this.selectors.modal,
                'product-modal',
            )

            // Close modal if clicked, but not if the image is clicked
            this.ProductModal.$modal.on(
                'click' + this.settings.namespace,
                function (evt) {
                    if (evt.target.nodeName !== 'IMG') {
                        self.ProductModal.close()
                    }
                },
            )
        },

        _productThumbSwitch: function () {
            if (!$(this.selectors.productThumbs).length) {
                return
            }

            var self = this

            $(this.selectors.productThumbImages).on(
                'click' + this.settings.namespace,
                function (evt) {
                    evt.preventDefault()
                    var $el = $(this)
                    var sizedImageUrl = $el.attr('href')
                    var largeImageUrl = $el.attr('data-zoom')
                    self.setActiveThumbnail($el)
                    self.switchProductImage(sizedImageUrl, largeImageUrl)
                },
            )
        },

        /*
      Thumbnail slider
     */
        _productThumbnailSlider: function () {
            var $productThumbWrapper = $(this.selectors.productThumbs)
            if (!$productThumbWrapper.length) {
                return
            }

            var thumbnailCount = $productThumbWrapper.find(
                this.selectors.productThumbAllImages,
            ).length

            if (thumbnailCount > 2) {
                $productThumbWrapper.on(
                    'init' + this.settings.namespace,
                    this._productSwipeInit.bind(this),
                )

                var nextArrow
                var prevArrow
                var sliderArrows = window.sliderArrows || false

                // sliderArrows is an object defined in product.liquid to set custom
                // SVG arrow icons.
                if (sliderArrows) {
                    nextArrow =
                        '<button type="button" class="slick-next"><span class="medium-up--hide">' +
                        sliderArrows.right +
                        '</span><span class="small--hide">' +
                        sliderArrows.down +
                        '</span></button>'
                    prevArrow =
                        '<button type="button" class="slick-prev"><span class="medium-up--hide">' +
                        sliderArrows.left +
                        '</span><span class="small--hide">' +
                        sliderArrows.up +
                        '</span></button>'
                }

                $productThumbWrapper.slick({
                    accessibility: false,
                    arrows: true,
                    dots: false,
                    infinite: false,
                    autoplay: false,
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    vertical: true,
                    verticalSwiping: true,
                    nextArrow: nextArrow,
                    prevArrow: prevArrow,
                    responsive: [
                        {
                            breakpoint: this.settings.smallBreakpoint,
                            settings: {
                                vertical: false,
                                verticalSwiping: false,
                            },
                        },
                    ],
                })

                // Show highlighted thumbnail by repositioning slider
                $productThumbWrapper.slick(
                    'slickGoTo',
                    $productThumbWrapper
                        .find('.is-active')
                        .attr('data-slick-index'),
                    true,
                )
            }
        },

        _productSwipeInit: function (evt, obj) {
            // Slider is initialized. Setup custom swipe events
            this.settings.productThumbIndex = obj.currentSlide
            this.settings.productThumbMax = obj.slideCount - 1 // we need the 0-based index

            $(this.selectors.productFeaturedImage).on(
                'swipeleft swiperight',
                function (event) {
                    if (event.type === 'swipeleft') {
                        this._goToNextThumbnail()
                    }

                    if (event.type === 'swiperight') {
                        this._goToPrevThumbnail()
                    }

                    // Trigger click on newly requested thumbnail
                    $(
                        '.product-single__thumbnail-item[data-slick-index="' +
                            this.settings.productThumbIndex +
                            '"]',
                    )
                        .find('.product-single__thumbnail')
                        .trigger('click')
                },
            )
        },

        _goToNextThumbnail: function () {
            this.settings.productThumbIndex++

            if (
                this.settings.productThumbIndex > this.settings.productThumbMax
            ) {
                this.settings.productThumbIndex = 0
            }

            $(this.selectors.productThumbs).slick(
                'slickGoTo',
                this.settings.productThumbIndex,
                true,
            )
        },

        _goToPrevThumbnail: function () {
            this.settings.productThumbIndex--

            if (this.settings.productThumbIndex < 0) {
                this.settings.productThumbIndex = this.settings.productThumbMax
            }

            $(this.selectors.productThumbs).slick(
                'slickGoTo',
                this.settings.productThumbIndex,
                true,
            )
        },

        _initQtySelector: function () {
            this.$container
                .find('.product-form__quantity')
                .each(function (i, el) {
                    // eslint-disable-next-line no-new
                    new QtySelector($(el))
                })
        },

        onUnload: function () {
            $(this.selectors.productImageWrap).off(this.settings.namespace)
            $(this.selectors.productThumbImages).off(this.settings.namespace)
            $(this.selectors.productThumbs).slick('unslick')
            this.ProductModal.$modal.off(this.settings.namespace)
        },
    })

    return Product
})()

theme.Slideshow = (function () {
    function Slideshow() {
        this.slideshow = new theme.Hero()
    }

    Slideshow.prototype = _.assignIn({}, Slideshow.prototype, {
        onUnload: function () {
            this.slideshow.destroy()
        },

        onSelect: function () {
            this.slideshow.pause()
        },

        onDeselect: function () {
            this.slideshow.play()
        },

        onBlockSelect: function (evt) {
            var $slide = $(
                '.hero__slide--' + evt.detail.blockId + ':not(.slick-cloned)',
            )
            var slideIndex = $slide.data('slick-index')

            this.slideshow.pause()
            this.slideshow.goToSlide(slideIndex)
        },

        onBlockDeselect: function () {
            this.slideshow.play()
        },
    })

    return Slideshow
})()

theme.Cart = (function () {
    var selectors = {
        cartNote: '#CartSpecialInstructions',
        cartQtyInput: '.cart__quantity',
    }

    function Cart(container) {
        var $container = (this.$container = $(container))
        var sectionId = $container.attr('data-section-id')

        theme.cartObject = JSON.parse($('#CartJson-' + sectionId).html())

        this.init()
    }

    Cart.prototype = _.assignIn({}, Cart.prototype, {
        init: function () {
            this._initQtySelector()
            this._initCartNote()
        },

        _initQtySelector: function () {
            $(selectors.cartQtyInput).each(function (i, el) {
                // eslint-disable-next-line no-new
                new QtySelector($(el))
            })
        },

        _initCartNote: function () {
            if (!$(selectors.cartNote).length) {
                return
            }

            var $el = $(selectors.cartNote)
            var noteText
            var params
            var noteOffset = $el[0].offsetHeight - $el[0].clientHeight

            // Auto grow the cart note if text fills it up
            $el.on('keyup input', function () {
                $(this)
                    .css('height', 'auto')
                    .css('height', $el[0].scrollHeight + noteOffset)
            })

            // Save the cart note via ajax. A safeguard in case
            // a user decides to leave the page before clicking 'Update Cart'
            $el.on(
                'change',
                $.proxy(function () {
                    noteText = $el.val()
                    params = {
                        type: 'POST',
                        url: '/cart/update.js',
                        data: 'note=' + this._attributeToString(noteText),
                        dataType: 'json',
                    }
                    $.ajax(params)
                }, this),
            )
        },

        _attributeToString: function (attr) {
            if (typeof attr !== 'string') {
                attr = String(attr)
                if (attr === 'undefined') {
                    attr = ''
                }
            }
            return $.trim(attr)
        },
    })

    return Cart
})()

theme.Quotes = (function () {
    function Quotes(container) {
        this.$container = $(container).on('init', this._a11y.bind(this))

        this.$container.slick({
            accessibility: true,
            arrows: false,
            dots: true,
            draggable: true,
            autoplay: false,
        })
    }

    Quotes.prototype = _.assignIn({}, Quotes.prototype, {
        _a11y: function (event, obj) {
            var $list = obj.$list
            var $wrapper = this.$container.parent()

            // Remove default Slick aria-live attr until slider is focused
            $list.removeAttr('aria-live')

            // When an element in the slider is focused set aria-live
            $wrapper.on('focusin', function (evt) {
                if ($wrapper.has(evt.target).length) {
                    $list.attr('aria-live', 'polite')
                }
            })

            // Remove aria-live
            $wrapper.on('focusout', function (evt) {
                if ($wrapper.has(evt.target).length) {
                    $list.removeAttr('aria-live')
                }
            })
        },

        _goToSlide: function (slideIndex) {
            this.$container.slick('slickGoTo', slideIndex)
        },

        onUnload: function () {
            delete this.$container
        },

        onBlockSelect: function (evt) {
            // Ignore the cloned version
            var $slide = $(
                '.quote__slide-wrapper--' +
                    evt.detail.blockId +
                    ':not(.slick-cloned)',
            )
            var slideIndex = $slide.data('slick-index')

            // Go to selected slide, pause autoplay
            this._goToSlide(slideIndex)
        },
    })

    return Quotes
})()

theme.init = function () {
    theme.customerTemplates.init()
    slate.rte.wrapTable()
    slate.rte.iframeReset()

    // Common a11y fixes
    slate.a11y.pageLinkFocus($(window.location.hash))

    $('.in-page-link').on('click', function (evt) {
        slate.a11y.pageLinkFocus($(evt.currentTarget.hash))
    })

    $('a[href="#"]').on('click', function (evt) {
        evt.preventDefault()
    })

    // Sections
    var sections = new theme.Sections()
    sections.register('header', theme.HeaderSection)
    sections.register('product', theme.Product)
    sections.register('collection-filters', theme.Filters)
    sections.register('map', theme.Maps)
    sections.register('slideshow', theme.Slideshow)
    sections.register('cart', theme.Cart)
    sections.register('quotes', theme.Quotes)

    // Standalone modules
    $(window).on('load', theme.articleImages)
    theme.passwordModalInit()
}

theme.articleImages = function () {
    var $indentedRteImages = $('.rte--indented-images')
    if (!$indentedRteImages.length) {
        return
    }

    $indentedRteImages.find('img').each(function (i, el) {
        var $el = $(el)
        var attr = $el.attr('style')

        // Check if undefined or float: none
        if (!attr || attr === 'float: none;') {
            // Add class to parent paragraph tag if image is wider than container
            if ($el.width() >= $indentedRteImages.width()) {
                $el.parent('p').addClass('rte__image-indent')
            }
        }
    })
}

theme.passwordModalInit = function () {
    var $loginModal = $('#LoginModal')
    if (!$loginModal.length) {
        return
    }

    // Initialize modal
    theme.PasswordModal = new window.Modals('LoginModal', 'login-modal', {
        focusOnOpen: '#Password',
    })

    // Open modal if errors exist
    if ($loginModal.find('.errors').length) {
        theme.PasswordModal.open()
    }
}

$(theme.init)
