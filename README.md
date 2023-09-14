# Tooltips

## Usage
```
const tooltip = new Tooltip(<element>, {
    content: <content>,
    onOpen: () => { console.log('Tooltip opened') },
    onClose: () => { console.log('Tooltip closed') },
    closeEvent: 'mouseout',
});
```

`element` tells where to position the tooltip.  
Any valid event for `addEventListener` is supported in `closeEvent`, like `click`.  
`onOpen` and `onClose` takes either a `null` or a closure.  
`content` wants either a HTML string or `HTMLElement` (for example a template).