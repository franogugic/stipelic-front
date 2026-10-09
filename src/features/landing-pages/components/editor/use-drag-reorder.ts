import { useState } from 'react'
import type { DragEvent } from 'react'

/**
 * Mouse reordering of a list with native drag and drop, started only from an item's handle. `dropIndex` is where
 * the dragged item would land (the gap before that index), for the drop marker. Keyboard users reorder with the
 * list's own buttons or keys.
 */
export function useDragReorder(onMove: (from: number, to: number) => void, axis: 'x' | 'y' = 'y') {
  const [armed, setArmed] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const reset = () => {
    setArmed(null)
    setDragIndex(null)
    setDropIndex(null)
  }

  const itemProps = (index: number) => ({
    draggable: armed === index,
    onDragStart: (event: DragEvent) => {
      setDragIndex(index)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(index))
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (dragIndex === null) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      const box = event.currentTarget.getBoundingClientRect()
      const after = axis === 'y' ? event.clientY > box.top + box.height / 2 : event.clientX > box.left + box.width / 2
      setDropIndex(after ? index + 1 : index)
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault()
      if (dragIndex !== null && dropIndex !== null) {
        // Removing the item first shifts the gaps after it by one.
        const to = dropIndex > dragIndex ? dropIndex - 1 : dropIndex
        if (to !== dragIndex) onMove(dragIndex, to)
      }
      reset()
    },
    onDragEnd: reset,
  })

  const handleProps = (index: number) => ({
    onPointerDown: () => setArmed(index),
    onPointerUp: () => setArmed(null),
  })

  return { dragIndex, dropIndex, itemProps, handleProps }
}
