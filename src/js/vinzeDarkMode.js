/* vinzeDarkMode */
/* created by Patryk Surmacz */
/* github.com/vinze-ps */

(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
      ? (module.exports = factory(require("vinzeutilities")))
      : typeof define === "function" && define.amd
      ? define(["vinzeutilities"], factory)
      : ((global = typeof globalThis !== "undefined" ? globalThis : global || self), (global.VinzeDarkMode = factory(global.Vinze)));
  })(this, function (Vinze) {
    ("use strict");

    var utils;
    
    (function() {
        try {
            utils = new Vinze();
        } catch {
            console.warn("%c Error: Cannot find Vinze Utilities, go to https://github.com/vinze-ps/vinzeUtilities and attach it before Vinze Dark Mode. ", 'background: #111; color: #9bd4fa');
        }
    })();

    const initialProperties = {
        easing: "easeInOutQuart",
        transitionDuration: 200,
        dimmingValue: 1,
        autoSwitch: { from: "20:00", to: "8:00" },
        saveToCookies: true,
    };

    const initialTargetProperties = {
        id: null,
        element: null,
        customColors: false,
        darkMode: null,
        lightMode: null,
        darkModeHover: null,
    };

    const VDM = (function () {
        class VDM {
            constructor(properties = initialProperties) {
                // Event functions.
                this.onInit = null;
                this.onToggle = null;
                this.onEnable = null;
                this.onDisable = null;
                this.targets = [];
                this.properties = utils.objectAssign(Object.create({}), JSON.parse(JSON.stringify(initialProperties)), properties);
                this.state = {
                    darkMode: false,
                    changing: false,
                };
            }
            /**
             * Initialization.
             */
            init() {
                // Clear the cookies if saveToCookies is false.
                if (!this.properties.saveToCookies)
                    utils.cookies().clear("vinze-dark-mode");
                // Set the state from cookies.
                else
                    this.state.darkMode = utils.cookies().get("vinze-dark-mode") === "true";
                // On/off/prepare dark mode.
                if (this.properties.autoSwitch &&
                    utils.cookies().get("vinze-dark-mode") === null)
                    utils.doInSomeTime(this.properties.autoSwitch.from, this.properties.autoSwitch.to, this._changeMode(true, false), this._changeMode(false, false));
                else
                    this.update(null, true, false);
                // On init event.
                if (typeof this.onInit === "function")
                    this.onInit(this.state);
            }
            /**
             * Adds new target(s) to instance targets array.
             * @param target The target or null - all elements starts from html element.
             * @param includeChildren Indicates whether also add children of the target element (when is true, target parameter must be a null).
             */
            _add(target, includeChildren = true) {
                let elements = [];
                let rootElement = target !== null && target.element !== null
                    ? target.element
                    : utils.select(`html`).elements[0];
                // Get elements to add.
                if (includeChildren)
                    elements = this._getChildren(rootElement, true);
                else
                    elements = [rootElement];
                // Add all elements.
                for (let i = 0; i < elements.length; i++) {
                    let alreadyExists = false;
                    // Ckech whether such element already has been added.
                    for (let j = 0; j < this.targets.length; j++)
                        if (this.targets[j].element === elements[i]) {
                            alreadyExists = true;
                            break;
                        }
                    if (alreadyExists)
                        continue;
                    // Prepare new target id.
                    let _id = target ? target.id : this._getNewId();
                    //* Add target
                    let customColors = target && target.darkMode;
                    this.targets.push(utils.objectAssign(Object.create({}), JSON.parse(JSON.stringify(initialTargetProperties)), {
                        id: _id,
                        element: elements[i],
                        customColors,
                        darkMode: {
                            backgroundColor: customColors && target.darkMode.backgroundColor,
                            color: customColors && target.darkMode.color,
                            borderColor: customColors && target.darkMode.borderColor,
                            outlineColor: customColors && target.darkMode.outlineColor,
                        },
                        lightMode: {
                            backgroundColor: null,
                            color: null,
                            borderColor: null,
                            outlineColor: null,
                        },
                        darkModeHover: {
                            backgroundColor: null,
                            color: null,
                            borderColor: null,
                            outlineColor: null,
                        },
                    }));
                    // Add hover events.
                    this._addHover(_id);
                }
            }
            _addHover(targetId) {
                let self = this;
                utils.select(self._getTargetById(targetId).target.element).on("mouseover", function (event) {
                    if (self.state.darkMode) {
                        // Remove dark mode class for specific target, for check hover colors.
                        utils.select(this)
                            .addClass("vinze-dark-mode-hover-" + targetId)
                            .addClass("vinze-dark-mode-hover")
                            .removeClass("vinze-dark-mode-" + targetId);
                        let color = self._getColor(this);
                        let savedLightModeColor = self._getTargetById(targetId).target.lightMode;
                        let savedDarkModeColor = self._getTargetById(targetId).target.darkMode;
                        let cancelEvent = [];
                        // If target hasn't hover colors, add dark mode class again.
                        if (color.background !== null && savedLightModeColor.backgroundColor !== null)
                            if (color.background[0] == savedLightModeColor.backgroundColor[0] &&
                                color.background[1] == savedLightModeColor.backgroundColor[1] &&
                                color.background[2] == savedLightModeColor.backgroundColor[2])
                                cancelEvent.push(true);
                            else
                                cancelEvent.push(false);
                        else if (color.background === null)
                            cancelEvent.push(true);
                        else
                            cancelEvent.push(false);
                        if (color.font !== null && savedLightModeColor.color !== null)
                            if (color.font[0] == savedLightModeColor.color[0] &&
                                color.font[1] == savedLightModeColor.color[1] &&
                                color.font[2] == savedLightModeColor.color[2])
                                cancelEvent.push(true);
                            else
                                cancelEvent.push(false);
                        else if (color.font === null)
                            cancelEvent.push(true);
                        else
                            cancelEvent.push(false);
                        if (color.border !== null && savedLightModeColor.borderColor !== null)
                            if (color.border[0] == savedLightModeColor.borderColor[0] &&
                                color.border[1] == savedLightModeColor.borderColor[1] &&
                                color.border[2] == savedLightModeColor.borderColor[2])
                                cancelEvent.push(true);
                            else
                                cancelEvent.push(false);
                        else if (color.border === null)
                            cancelEvent.push(true);
                        else
                            cancelEvent.push(false);
                        if (color.outline !== null && savedLightModeColor.outlineColor !== null)
                            if (color.outline[0] == savedLightModeColor.outlineColor[0] &&
                                color.outline[1] == savedLightModeColor.outlineColor[1] &&
                                color.outline[2] == savedLightModeColor.outlineColor[2])
                                cancelEvent.push(true);
                            else
                                cancelEvent.push(false);
                        else if (color.outline === null)
                            cancelEvent.push(true);
                        else
                            cancelEvent.push(false);
                        if (!cancelEvent.includes(false)) {
                            utils.select(this)
                                .removeClass("vinze-dark-mode-hover-" + targetId)
                                .removeClass("vinze-dark-mode-hover")
                                .addClass("vinze-dark-mode-" + targetId);
                            return;
                        }
                        // Update hover colors.
                        let savedDarkModeColorHover = self._getTargetById(targetId).target.darkModeHover;
                        if (color.background !== null && savedDarkModeColorHover.backgroundColor === null)
                            self._updateTarget(self._getTargetById(targetId).target).darkModeHover().backgroundColor();
                        if (color.font !== null && savedDarkModeColorHover.color === null)
                            self._updateTarget(self._getTargetById(targetId).target).darkModeHover().color();
                        savedDarkModeColorHover = self._getTargetById(targetId).target.darkModeHover;
                        // Prepare style for hover.
                        let css = `.vinze-dark-mode-hover-${targetId} {`;
                        let newBackgroundColor = savedDarkModeColorHover.backgroundColor || savedDarkModeColor.backgroundColor;
                        let newColor = savedDarkModeColorHover.color || savedDarkModeColor.color;
                        let newBorderColor = savedDarkModeColorHover.borderColor || savedDarkModeColor.borderColor;
                        let newOutlineColor = savedDarkModeColorHover.outlineColor || savedDarkModeColor.outlineColor;
                        // Background color.
                        if (newBackgroundColor)
                            css += `background-color: 
                          rgba(${newBackgroundColor[0]}, 
                            ${newBackgroundColor[1]}, 
                            ${newBackgroundColor[2]}, 
                            ${newBackgroundColor[3] ? newBackgroundColor[3] : "1"}) !important;`;
                        // Color.
                        if (newColor)
                            css += `color: 
                          rgba(${newColor[0]}, 
                            ${newColor[1]}, 
                            ${newColor[2]}, 
                            ${newColor[3] ? newColor[3] : "1"}) !important;`;
                        // Border color.
                        if (newBorderColor)
                            css += `border-color: 
                          rgba(${newBorderColor[0]}, 
                            ${newBorderColor[1]}, 
                            ${newBorderColor[2]}, 
                            ${newBorderColor[3] ? newBorderColor[3] : "1"}) !important;`;
                        // Outline color.
                        if (newOutlineColor)
                            css += `outline-color: 
                          rgba(${newOutlineColor[0]}, 
                            ${newOutlineColor[1]}, 
                            ${newOutlineColor[2]}, 
                            ${newOutlineColor[3] ? newOutlineColor[3] : "1"}) !important;`;
                        css += `}`;
                        // Create style element.
                        var head = document.head || document.getElementsByTagName("head")[0], style = document.createElement("style");
                        head.appendChild(style);
                        style.type = "text/css";
                        style.id = "vinze-dark-mode-style-hover";
                        //   if (style.styleSheet) {
                        //     // This is required for IE8 and below.
                        //     style.styleSheet.cssText = css;
                        //   } else {
                        style.appendChild(document.createTextNode(css));
                        //   }
                    }
                }, false);
                utils.select(self._getTargetById(targetId).target.element).on("mouseout", function (event) {
                    utils.select("#vinze-dark-mode-style-hover").remove();
                    if (self.state.darkMode) {
                        utils.select(this)
                            .removeClass("vinze-dark-mode-hover-" + targetId)
                            .removeClass("vinze-dark-mode-hover")
                            .addClass("vinze-dark-mode-" + targetId);
                    }
                    else {
                        utils.select(this)
                            .removeClass("vinze-dark-mode-hover-" + targetId)
                            .removeClass("vinze-dark-mode-hover")
                            .removeClass("vinze-dark-mode-" + targetId);
                    }
                }, true);
            }
            /**
             * Changes dark mode.
             * @param darkMode
             * @param manualChange Determinates whether change of dark mode
             */
            _changeMode(darkMode = null, manualChange = false) {
                // Cancel change if the changing state is true.
                if (this.state.changing)
                    return;
                this.state.changing = true;
                this.state.darkMode = darkMode || !this.state.darkMode;
                // Updates the dark mode cookies state.
                if (this.properties.saveToCookies)
                    utils.cookies().set("vinze-dark-mode", this.state.darkMode);
                if (this.state.darkMode) {
                    utils.select("html")
                        .addClass("vinze-dark-mode")
                        .removeClass("vinze-light-mode");
                }
                else {
                    utils.select("html")
                        .addClass("vinze-light-mode")
                        .removeClass("vinze-dark-mode");
                    // Remove dark mode hover style element.
                    utils.select("#vinze-dark-mode-style-hover").remove();
                }
                this.update(null, true, manualChange);
            }
            _updateTarget(target) {
                let self = this;
                return {
                    darkMode: () => {
                        return {
                            backgroundColor: () => {
                                if ((!self.state.darkMode ||
                                    !target.darkMode.backgroundColor) &&
                                    !target.customColors &&
                                    !utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.darkMode.backgroundColor = self._elementColorToDark(target.element).background();
                            },
                            color: () => {
                                if ((!self.state.darkMode ||
                                    !target.darkMode.color) &&
                                    !target.customColors &&
                                    !utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.darkMode.color = self._elementColorToDark(target.element).font();
                            },
                            borderColor: () => {
                                if ((!self.state.darkMode ||
                                    !target.darkMode.borderColor) &&
                                    !target.customColors &&
                                    !utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.darkMode.borderColor = self._elementColorToDark(target.element).border();
                            },
                            outlineColor: () => {
                                if ((!self.state.darkMode ||
                                    !target.darkMode.outlineColor) &&
                                    !target.customColors &&
                                    !utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.darkMode.outlineColor = self._elementColorToDark(target.element).outline();
                            },
                        };
                    },
                    darkModeHover: () => {
                        return {
                            backgroundColor: () => {
                                if (utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.darkModeHover.backgroundColor = self._elementColorToDark(target.element).background();
                            },
                            color: () => {
                                if (utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.darkModeHover.color = self._elementColorToDark(target.element).font();
                            },
                            borderColor: () => {
                                if (utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.darkModeHover.borderColor = self._elementColorToDark(target.element).border();
                            },
                            outlineColor: () => {
                                if (utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.darkModeHover.outlineColor = self._elementColorToDark(target.element).outline();
                            },
                        };
                    },
                    lightMode: () => {
                        return {
                            backgroundColor: () => {
                                if ((!self.state.darkMode ||
                                    !target.lightMode.backgroundColor) &&
                                    !utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.lightMode.backgroundColor = self._getColor(target.element).background;
                            },
                            color: () => {
                                if ((!self.state.darkMode ||
                                    !target.lightMode.color) &&
                                    !utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.lightMode.color = self._getColor(target.element).font;
                            },
                            borderColor: () => {
                                if ((!self.state.darkMode ||
                                    !target.lightMode.borderColor) &&
                                    !utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.lightMode.borderColor = self._getColor(target.element).border;
                            },
                            outlineColor: () => {
                                if ((!self.state.darkMode ||
                                    !target.lightMode.outlineColor) &&
                                    !utils.select(target.element).hasClass("vinze-dark-mode-hover"))
                                    target.lightMode.outlineColor = self._getColor(target.element).outline;
                            },
                        };
                    },
                };
            }
            _setStyle(manualChange = true) {
                var css = "";
                let self = this;
                utils.select("#vinze-dark-mode-style").remove();
                this.targets.forEach(function (target) {
                    css += `.vinze-dark-mode-${target.id} {`;
                    for (let property in target.darkMode) {
                        let rgba = target.darkMode[property];
                        if (!rgba)
                            continue;
                        property = property.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
                        css += `${property}: rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3] ? rgba[3] : "1"}) !important;`;
                    }
                    css += `}`;
                    // Prepare and toggle easing class.
                    if (self.properties.easing) {
                        if (manualChange) {
                            css += `
                      .vinze-dark-mode-easing {
                        transition-timing-function: ${utils.easings[self.properties.easing]} !important;
                        transition-duration: ${self.properties.transitionDuration}ms !important;
                        transition-property: background, color, border, outline !important;
                      }
                      `;
                        }
                        utils.select(target.element).addClass(`vinze-dark-mode-easing`);
                        utils.timeout("set", "vinze-dark-mode-easing", self.properties.transitionDuration, () => {
                            utils.select(target.element).removeClass(`vinze-dark-mode-easing`);
                            self.state.changing = false;
                        });
                    }
                    else {
                        self.state.changing = false;
                    }
                    //* Toggle style class.
                    if (self.state.darkMode)
                        utils.select(target.element).addClass(`vinze-dark-mode-${target.id}`);
                    else
                        utils.select(target.element).removeClass(`vinze-dark-mode-${target.id}`);
                });
                //* Create style.
                var head = document.head || document.getElementsByTagName("head")[0], style = document.createElement("style");
                head.appendChild(style);
                style.type = "text/css";
                style.id = "vinze-dark-mode-style";
                // if (style.styleSheet) {
                //   // This is required for IE8 and below.
                //   style.styleSheet.cssText = css;
                // } else {
                style.appendChild(document.createTextNode(css));
                // }
            }
            _setImage(target) {
                let uElement = utils.select(target.element);
                if (uElement.attr("data-vinze-dark-mode-src") !== null) {
                    // Save original src.
                    if (uElement.attr("data-vinze-dark-mode-src-original") === null)
                        uElement.attr("data-vinze-dark-mode-src-original", uElement.attr("src"));
                    if (this.state.darkMode)
                        uElement.attr("src", uElement.attr("data-vinze-dark-mode-src"));
                    else
                        uElement.attr("src", uElement.attr("data-vinze-dark-mode-src-original"));
                }
            }
            /**
             * Converts (Rounds) any number value to RGB value in range 0 - 255.
             * @param value The value.
             * @returns Converted new value.
             */
            _toRGBValue(value) {
                if (value < 0)
                    value = 0;
                if (value > 255)
                    value = 255;
                return Math.round(value);
            }
            /**
             * Calculates and returns luminance from passed RGB value.
             * @param r Red in RGB value.
             * @param g Green in RGB value.
             * @param b Blue in RGB value.
             * @returns {The luminance.}
             */
            _calculateLuminance(r, g, b) {
                var a = [r, g, b].map(function (v) {
                    v /= 255;
                    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                });
                return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
            }
            /**
             * Calculates contrast between two RGB values.
             * @param rgb1 The first RGB value.
             * @param rgb2 The second RGB value.
             * @returns {Contrast ratio from 2 rgb values.}
             */
            _calculateContrast(rgb1, rgb2) {
                var lum1 = this._calculateLuminance(rgb1[0], rgb1[1], rgb1[2]);
                var lum2 = this._calculateLuminance(rgb2[0], rgb2[1], rgb2[2]);
                var brightest = Math.max(lum1, lum2);
                var darkest = Math.min(lum1, lum2);
                return (brightest + 0.05) / (darkest + 0.05);
            }
            /**
             * Gets the all children (exclude specific node names) of the passed root element and returns them (with "withRoot" parameter on true additionally with the root element).
             * @param rootElement The root element.
             * @param withRoot Determinates whether root has to be included in the retured array.
             * @returns Array with all children of the root element (with "withRoot" parameter on true additionally with the root element).
             */
            _getChildren(rootElement, withRoot = false) {
                let currentElements = [rootElement];
                let currentChildren = [];
                let allChildren = [];
                do {
                    // The number of all current elements.
                    let currentElementsLength = currentElements.length;
                    // Clear the children array.
                    currentChildren = [];
                    // Loop for each all current elements.
                    for (let i = 0; i < currentElementsLength; i++) {
                        // Add children to the array.
                        currentChildren = currentChildren.concat(utils.select(currentElements[i])
                            .children()
                            .elements
                            .filter((el) => {
                            return (el.nodeName != "SCRIPT" &&
                                el.nodeName != "META" &&
                                el.nodeName != "LINK" &&
                                el.nodeName != "STYLE" &&
                                el.nodeName != "TITLE" &&
                                el.nodeName != "HEAD" &&
                                el.nodeName != "svg");
                        }));
                        // At the end of the loop, change added children to the current elements.
                        if (i == currentElementsLength - 1) {
                            currentElements = currentChildren;
                            currentChildren.forEach(function (child) { allChildren.push(child); });
                        }
                    }
                } while (currentChildren.length > 0);
                if (withRoot)
                    allChildren.unshift(rootElement);
                return allChildren;
            }
            /**
             * Generates a new ID number for a target until it's unique.
             * @returns {New unique ID number.}
             */
            _getNewId() {
                let newId;
                let exists = false;
                do {
                    newId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                    this.targets.forEach((element, index) => {
                        if (newId == element.id) {
                            exists = true;
                            return;
                        }
                        // End of the loop if ID doesn't already exists.
                        if (index + 1 == this.targets.length)
                            exists = false;
                    });
                } while (exists);
                return newId;
            }
            _getTargetById(id = null) {
                if (id) {
                    for (let i = 0; i <= this.targets.length - 1; i++) {
                        if (this.targets[i].id === id)
                            return { index: i, target: this.targets[i] };
                    }
                    return { index: -1, target: null };
                }
                else
                    return { index: -1, target: null };
                ;
            }
            /**
             * @param element HTML element.
             * @returns Object with colors of the HTML element.
             */
            _getColor(element) {
                let _backgroundColor = this._getRGBArray(utils.select(element).css("background-color"));
                let _color = this._getRGBArray(utils.select(element).css("color"));
                let _borderColor = this._getRGBArray(utils.select(element).css("border-color"));
                let _outlineColor = this._getRGBArray(utils.select(element).css("outline-color"));
                return {
                    font: _color[3] != 0 ? _color : null,
                    background: _backgroundColor[3] != 0 ? _backgroundColor : null,
                    border: _borderColor[3] != 0 ? _borderColor : null,
                    outline: _outlineColor[3] != 0 ? _outlineColor : null,
                };
            }
            /**
             * Converts string RGB (For ex. from style.color css property) to array.
             * @param rgb RGB in format rrr,ggg,bbb or rrr,ggg,bbb,a.
             * @returns Array with RGB values.
             */
            _getRGBArray(rgb) {
                if (rgb === null || rgb === "")
                    return [0, 0, 0, 0];
                rgb = rgb.trim();
                // Substring to only digits and commas.
                rgb =
                    rgb.search("rgba") !== -1
                        ? rgb.substring(5, rgb.length - 1)
                        : rgb.substring(4, rgb.length - 1);
                // Turn string to array, split by comma.
                let rgbArray = rgb.split(",");
                if (rgbArray.length === 3)
                    rgbArray.push("1");
                if (rgbArray.length > 4)
                    rgbArray = rgbArray.splice(0, 3);
                // Return the array with converted string values to int.
                return rgbArray.map((number) => parseFloat(number));
            }
            /**
             * Is looking for an element under passed element with non-trasparency background color nad returns an object contains current element and it's background color.
             * @param element The root element.
             * @param includeSelf Indicates whether includes own background color.
             * @returns An object contains current element and it's background color.
             */
            _getBackgroundColorUnderneath(element, includeSelf = true) {
                // Select first parent of element.
                let backgroundColor = [0, 0, 0, 0];
                let uCurrentElement = utils.select(element);
                if (uCurrentElement.length > 0) {
                    // Get the background color of the first parent.
                    let parentNumber = 1;
                    if (includeSelf)
                        backgroundColor = this._getRGBArray(uCurrentElement.elements[0].style.backgroundColor);
                    while (backgroundColor[3] == 0) {
                        uCurrentElement = utils.select(element).parent(parentNumber);
                        if (uCurrentElement.length === 0)
                            break;
                        backgroundColor = this._getRGBArray(uCurrentElement.elements[0].style.backgroundColor);
                        parentNumber++;
                    }
                }
                return {
                    element: uCurrentElement.elements[0],
                    backgroundColor
                };
            }
            /**
             * Converts given color to the dark eqiuvalent.
             * @param element The HTML elements of the color.
             */
            _elementColorToDark(element) {
                let self = this;
                return {
                    background: function (includeSmallElements = true) {
                        if (!element)
                            return null;
                        let uElement = utils.select(element);
                        let rgba = self._getColor(element).background;
                        if (!rgba)
                            return null;
                        // Ignore elements.
                        includeSmallElements = false;
                        if (
                        // Element cannot be ignored.
                        uElement.attr("data-vinze-dark-mode") !== "true" &&
                            // Include small elements.
                            includeSmallElements &&
                            // Node name.
                            (uElement.elements[0].nodeName === "DIV" ||
                                uElement.elements[0].nodeName === "SPAN" ||
                                uElement.elements[0].nodeName === "A" ||
                                uElement.elements[0].nodeName === "ARTICLE" ||
                                uElement.elements[0].nodeName === "ASIDE" ||
                                uElement.elements[0].nodeName === "BLOCKQUOTE" ||
                                uElement.elements[0].nodeName === "FORM" ||
                                uElement.elements[0].nodeName === "HEADER" ||
                                uElement.elements[0].nodeName === "UL" ||
                                uElement.elements[0].nodeName === "LI" ||
                                uElement.elements[0].nodeName === "OL" ||
                                uElement.elements[0].nodeName === "MAIN" ||
                                uElement.elements[0].nodeName === "NAV" ||
                                uElement.elements[0].nodeName === "P" ||
                                uElement.elements[0].nodeName === "SECTION" ||
                                uElement.elements[0].nodeName === "BUTTON")
                        //    &&
                        //   // Small elements enabled.
                        //   ((self.properties.smallElements === false &&
                        //     // Size of element.
                        //     uElement.outerWidth() <= self.properties.smallElementsSize.width &&
                        //     uElement.outerHeight() <= self.properties.smallElementsSize.height) ||
                        //     uElement.attr("data-vinze-dark-mode") === "false")
                        )
                            return rgba;
                        // Calculate the luminance.
                        let elementBackgroundColorLuminance = self._calculateLuminance(rgba[0], rgba[1], rgba[2]);
                        // The color is too light.
                        if (elementBackgroundColorLuminance > 0.18) {
                            //TODO-- temporary
                            // let multiplayer =
                            //   self.instance.dimmingValue != 0
                            //     ? (1.1 - Math.sqrt(elementBackgroundColorLuminance)) *
                            //       (2 - self.instance.dimmingValue)
                            //     : 1;
                            let multiplayer = self.properties.dimmingValue != 0
                                ? (1.1 - Math.sqrt(elementBackgroundColorLuminance)) *
                                    self.properties.dimmingValue
                                : 1;
                            // console.log(1.1 - Math.sqrt(elementBackgroundColorLuminance));
                            let R_Value = self._toRGBValue(rgba[0] * multiplayer);
                            let G_Value = self._toRGBValue(rgba[1] * multiplayer);
                            let B_Value = self._toRGBValue(rgba[2] * multiplayer);
                            let A_Value = rgba[3] || 1;
                            return [R_Value, G_Value, B_Value, A_Value];
                            //* exception if element meets the requirements (is small and small mode is set to light)
                        }
                        // else if (
                        //   elementBackgroundColorLuminance < 0.1 &&
                        //   self.instance.smallElements === false &&
                        //   (u(element).outerWidth() <=
                        //     self.instance.smallElementsSize.width ||
                        //     u(element).outerHeight() <=
                        //       self.instance.smallElementsSize.height)
                        // ) {
                        //   // get behind backround color of element
                        //   let elementBehindBackgroundColorRGB =
                        //     self._getUnderneath(element, false);
                        //   // calculate luminance
                        //   let elementBehindBackgroundColorLuminance =
                        //     self._calculateLuminance(
                        //       elementBehindBackgroundColorRGB[0],
                        //       elementBehindBackgroundColorRGB[1],
                        //       elementBehindBackgroundColorRGB[2]
                        //     );
                        //   //TODO-- temporary
                        //   let multiplayer =
                        //     self.instance.dimmingValue != 0
                        //       ? (1.1 - Math.sqrt(elementBehindBackgroundColorLuminance)) *
                        //         self.instance.dimmingValue
                        //       : 1;
                        //   // convert behind background color to dark equvalent if dark mode is off
                        //   if (!self.instance.darkMode) {
                        //     elementBehindBackgroundColorRGB[0] = self._toRGBValue(
                        //       elementBehindBackgroundColorRGB[0] * multiplayer
                        //     );
                        //     elementBehindBackgroundColorRGB[1] = self._toRGBValue(
                        //       elementBehindBackgroundColorRGB[1] * multiplayer
                        //     );
                        //     elementBehindBackgroundColorRGB[2] = self._toRGBValue(
                        //       elementBehindBackgroundColorRGB[2] * multiplayer
                        //     );
                        //   }
                        //   // calculate contrast
                        //   let elementsContrast = self._calculateContrast(
                        //     elementBehindBackgroundColorRGB,
                        //     elementBackgroundColorRGB
                        //   );
                        //   // contrast is too low
                        //   if (elementsContrast < 2) {
                        //     //TODO-- temporary
                        //     let additional = (1 - elementBackgroundColorLuminance) * 255;
                        //     let R_Value = self._toRGBValue(
                        //       elementBackgroundColorRGB[0] + additional
                        //     );
                        //     let G_Value = self._toRGBValue(
                        //       elementBackgroundColorRGB[1] + additional
                        //     );
                        //     let B_Value = self._toRGBValue(
                        //       elementBackgroundColorRGB[2] + additional
                        //     );
                        //     let A_Value = elementBackgroundColorRGB[3] || 1;
                        //     return [R_Value, G_Value, B_Value, A_Value];
                        //   }
                        // }
                        // default value
                        return rgba;
                    },
                    font: function () {
                        if (!element)
                            return null;
                        let rgba = self._getColor(element).font;
                        if (!rgba)
                            return null;
                        let elementColorRGB = rgba;
                        // Get the background color from behind of the element.
                        let underneathBackgroundColor = self._getBackgroundColorUnderneath(element).backgroundColor;
                        let underneathElement = self._getBackgroundColorUnderneath(element).element;
                        if (underneathElement === null)
                            return rgba;
                        let elementBehindBackgroundColorRGB = self
                            ._elementColorToDark(underneathElement)
                            .background();
                        // Calculate contrast
                        let elementsContrast = self._calculateContrast(elementBehindBackgroundColorRGB || [255, 255, 255, 1], elementColorRGB);
                        // Calculate luminance
                        let elementColorLuminance = self._calculateLuminance(elementColorRGB[0], elementColorRGB[1], elementColorRGB[2]);
                        //TODO-- temporary
                        let additional = (1 - elementColorLuminance) * 255;
                        // contrast is too low
                        if (elementsContrast < 2) {
                            let R_Value = self._toRGBValue(elementColorRGB[0] + additional);
                            let G_Value = self._toRGBValue(elementColorRGB[1] + additional);
                            let B_Value = self._toRGBValue(elementColorRGB[2] + additional);
                            let A_Value = elementColorRGB[3] || 1;
                            return [R_Value, G_Value, B_Value, A_Value];
                        }
                        // default value
                        return rgba;
                    },
                    border: function () {
                        return this.background(false);
                    },
                    outline: function () {
                        return this.border();
                    },
                };
            }
            /**
             * Updates targets (adds missing targets for ex. after load smth async) or specific passed target.
             * @param target Specific target, if null all found targets will be added.
             * @param includeChildren Add also children of the target element.
             */
            update(target = null, includeChildren = false, manualChange = true) {
                let self = this;
                // Clear the easing timeout.
                utils.timeout("clear", "vinze-dark-mode-easing");
                // Add missing target(s).
                this._add(target, includeChildren);
                // Update targets colors.
                this.targets.forEach((_target) => {
                    self._updateTarget(_target).darkMode().backgroundColor();
                    self._updateTarget(_target).darkMode().borderColor();
                    self._updateTarget(_target).darkMode().outlineColor();
                    self._updateTarget(_target).darkMode().color();
                    self._setImage(_target);
                });
                // Set the styles.
                if (!this.state.darkMode)
                    this._setStyle(manualChange);
                // Update targets colors.
                this.targets.forEach((_target) => {
                    self._updateTarget(_target).lightMode().backgroundColor();
                    self._updateTarget(_target).lightMode().borderColor();
                    self._updateTarget(_target).lightMode().outlineColor();
                    self._updateTarget(_target).lightMode().color();
                });
                // Set the styles.
                if (this.state.darkMode)
                    this._setStyle(manualChange);
            }
            /**
             * Manually enables dark mode.
             */
            enable() {
                this._changeMode(true, true);
                // On enable event.
                if (typeof this.onEnable === "function")
                    this.onEnable(this.state);
            }
            /**
             * Manually disables dark mode.
             */
            disable() {
                this._changeMode(false, true);
                // On disable event.
                if (typeof this.onDisable === "function")
                    this.onDisable(this.state);
            }
            /**
             * Manually toggles dark mode.
             */
            toggle() {
                this._changeMode(null, true);
                // On toggle event.
                if (typeof this.onToggle === "function")
                    this.onToggle(this.state);
            }
            /**
             * Clears the dark mode state cookie.
             */
            clearCookie() {
                utils.cookies().clear("vinze-dark-mode");
            }
        }
  
      return VDM;
    })();
  
    return VDM;
  });
  