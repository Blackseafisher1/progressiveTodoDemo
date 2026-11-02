import { initDragSort } from './components/dragSort'
import { initShortcuts } from './components/shortcuts'
import { initTheme } from './components/theme'
import { initToasts } from './components/toasts'

document.documentElement.classList.add('js')

initTheme()
initToasts()
initShortcuts()
initDragSort()
