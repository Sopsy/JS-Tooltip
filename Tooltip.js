export default class Tooltip
{
    #options;
    #x = 0;
    #y = 0;
    #spaceAvailable = {top: 0, right: 0, bottom: 0, left: 0};
    #target;
    #id = 1;
    #observer;
    #elm;

    constructor(target, options = {})
    {
        this.#options = Object.assign({}, {
            offset: 0,
            content: '',
            onOpen: null,
            onClose: null,
            closeEvent: 'mouseout',
            tooltipClasses: ['tooltip'],
        }, options);

        this.#target = target;

        this.open();

        // Close the tooltip if the target element is removed
        this.#observer = new MutationObserver((list) => {
            for (const mutation of list) {
                if (mutation.type !== 'childList' || mutation.removedNodes.length === 0) {
                    continue;
                }

                for (const elm of mutation.removedNodes) {
                    if (elm !== target) {
                        continue;
                    }

                    this.close();
                    return;
                }
            }
        });
        this.#observer.observe(target.parentElement, {childList: true});
    }

    open()
    {
        this.#elm = document.createElement('div');
        if (typeof this.#options.tooltipClass !== 'object') {
            let array = [];
            array.push(this.#options.tooltipClass);
            this.#options.tooltipClass = array;
        }

        // This class does not keep track of tooltips, it's offloaded to DOM.
        this.#elm.setAttribute('data-tooltip', '');
        for (let className of this.#options.tooltipClass) {
            this.#elm.classList.add(className);
        }

        let lastTip = document.querySelector('[data-tooltip]:last-of-type');
        if (lastTip !== null) {
            this.#id = parseInt(document.querySelector('[data-tooltip]:last-of-type').dataset.tooltipId) + 1;
        }
        this.#elm.dataset.tooltipId = this.#id.toString();

        this.setContent(this.#options.content, false);

        let closeEventFn = () => {
            this.#target.removeEventListener(this.#options.closeEvent, closeEventFn);
            this.close();
        };

        this.#target.addEventListener(this.#options.closeEvent, closeEventFn);
        this.#target.tooltip = this;

        this.#appendTip();
    }

    #appendTip()
    {
        document.body.append(this.#elm);

        if (typeof this.#options.onOpen === 'function') {
            this.#options.onOpen(this);
        }

        this.#position();
    }

    element()
    {
        return this.#elm;
    }

    setContent(content, position = true)
    {
        if (this.#elm === null) {
            return;
        }

        if (content instanceof HTMLElement) {
            if ('content' in content) {
                this.#elm.replaceChildren(content.content);
            } else {
                this.#elm.replaceChildren(content);
            }
        } else {
            this.#elm.innerHTML = content;
        }

        if (position) {
            this.#position();
        }
    }

    close()
    {
        if (typeof this.#options.onClose === 'function') {
            this.#options.onClose(this);
        }

        this.#elm = null;

        let tip = document.querySelector('[data-tooltip][data-tooltip-id="' + this.#id + '"]');

        if (tip !== null) {
            tip.remove();
        }

        this.#observer.disconnect();
    }

    static closeAll()
    {
        for (const tip of document.querySelectorAll('[data-tooltip]')) {
            tip.remove();
        }
    }

    #position()
    {
        if (this.#elm === null) {
            return;
        }

        this.#elm.style.maxHeight = '';
        this.#elm.style.left = '';
        this.#elm.style.top = '';

        let targetRect = this.#target.getBoundingClientRect();

        this.#spaceAvailable = {
            'top': targetRect.top - this.#options.offset,
            'right': document.documentElement.clientWidth - targetRect.right - this.#options.offset,
            'bottom': document.documentElement.clientHeight - targetRect.bottom - this.#options.offset,
            'left': targetRect.left - this.#options.offset,
        };

        this.#calculatePosition(targetRect);
        this.#setPosition(this.#x, this.#y);
    }

    #calculatePosition(targetRect)
    {
        let tipRect = this.#elm.getBoundingClientRect();
        let style = getComputedStyle(this.#elm);
        let verticalMargins = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        let horizontalMargins = parseFloat(style.marginLeft) + parseFloat(style.marginRight);

        // Calculate X
        this.#x = targetRect.right - targetRect.width / 2 - tipRect.width / 2;

        if (this.#x + tipRect.width + horizontalMargins > document.documentElement.clientWidth) {
            // If tip is wider than space
            this.#x = document.documentElement.clientWidth - tipRect.width - horizontalMargins;
        }

        if (this.#x < 0) {
            this.#x = 0;
        }

        // Calculate Y
        if (tipRect.height < this.#spaceAvailable.bottom || this.#spaceAvailable.top < this.#spaceAvailable.bottom) {
            // Place on bottom of target
            this.#elm.style.maxHeight = this.#spaceAvailable.bottom - verticalMargins + 'px';
            this.#y = targetRect.bottom + this.#options.offset;
        } else {
            // Place on top of target
            this.#elm.style.maxHeight = Math.min(this.#spaceAvailable.top - verticalMargins, tipRect.height) + 'px';
            tipRect = this.#elm.getBoundingClientRect();
            this.#y = targetRect.top - tipRect.height - verticalMargins - this.#options.offset;
        }
    }

    #setPosition(x, y)
    {
        this.#elm.style.left = window.scrollX + x + 'px';
        this.#elm.style.top = window.scrollY + y + 'px';
    }
}

Object.freeze(Tooltip.prototype);